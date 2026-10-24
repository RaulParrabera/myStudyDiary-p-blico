// Tests del algoritmo del mapa de constancia (RF-1 a RF-5, RF-7, RF-10).
// Se ejecutan con: node --test

const test = require("node:test");
const assert = require("node:assert/strict");
const L = require("../logic.js");

// "today" siempre entra como parámetro: los tests no dependen del reloj real.

test("dailyMinutes suma los minutos del día e ignora datos inválidos", () => {
  const totals = L.dailyMinutes([
    { fecha: "2026-10-18", minutos: 30 },
    { fecha: "2026-10-18", minutos: 15 },
    { fecha: "2026-10-17", minutos: 60 },
    { fecha: "2026-02-30", minutos: 90 }, // día que no existe (RF-10)
    { fecha: "18/10/2026", minutos: 45 }, // formato raro (RF-10)
    { fecha: "2026-10-16", minutos: 0 },
    { fecha: "2026-10-16", minutos: -20 },
    { fecha: "2026-10-15" }, // sin minutos
    null
  ]);

  assert.deepEqual(totals, { "2026-10-18": 45, "2026-10-17": 60 });
});

test("dailyMinutes no pierde las sesiones válidas junto a las inválidas", () => {
  const totals = L.dailyMinutes([
    { fecha: "no-es-fecha", minutos: 30 },
    { fecha: "2026-10-14", minutos: 25 }
  ]);

  assert.deepEqual(totals, { "2026-10-14": 25 });
});

test("intensityLevel reparte en quintiles relativos al día más intenso", () => {
  const casos = [
    [0, 120, 0], // sin sesiones
    [0, 0, 0], // periodo sin ninguna sesión: nada de dividir entre cero
    [10, 0, 0],
    [1, 300, 1], // cualquier día con sesiones llega al menos a 1
    [30, 120, 1],
    [60, 120, 2],
    [90, 120, 3],
    [119, 120, 4],
    [120, 120, 4], // el día más intenso, siempre 4
    [200, 120, 4] // por encima del máximo, se recorta a 4
  ];

  for (const [minutes, maxMinutes, expected] of casos) {
    assert.equal(
      L.intensityLevel(minutes, maxMinutes),
      expected,
      `${minutes} min sobre un máximo de ${maxMinutes}`
    );
  }
});

test("buildHeatmap cubre 12 meses en semanas de lunes a domingo", () => {
  const today = "2026-10-19"; // lunes
  const mapa = L.buildHeatmap([], today);
  const primera = mapa.weeks[0];
  const ultima = mapa.weeks[mapa.weeks.length - 1];

  assert.equal(primera.start, "2025-10-13"); // lunes de la semana de hace 12 meses
  assert.equal(primera.days[0].date, "2025-10-13");
  assert.equal(primera.days[6].date, "2025-10-19");
  assert.equal(ultima.days[6].date, "2026-10-25"); // domingo de la semana de hoy
  assert.equal(mapa.weeks.length, 54);
  assert.ok(mapa.weeks.every((semana) => semana.days.length === 7));
  assert.equal(mapa.maxMinutes, 0);
});

test("el número de semanas varía entre 53 y 54 según el día de hoy", () => {
  assert.equal(L.buildHeatmap([], "2026-10-18").weeks.length, 53); // domingo
  assert.equal(L.buildHeatmap([], "2026-10-19").weeks.length, 54); // lunes
});

test("los días posteriores a hoy quedan fuera del calendario", () => {
  const today = "2026-10-14"; // miércoles
  const mapa = L.buildHeatmap([{ fecha: "2026-10-14", minutos: 60 }], today);
  const ultima = mapa.weeks[mapa.weeks.length - 1];
  const futuros = ultima.days.filter((dia) => dia.isFuture);

  assert.deepEqual(futuros.map((dia) => dia.date), [
    "2026-10-15",
    "2026-10-16",
    "2026-10-17",
    "2026-10-18"
  ]);
  assert.ok(futuros.every((dia) => dia.level === 0));
  assert.equal(ultima.days[2].date, "2026-10-14"); // el miércoles es el índice 2
  assert.equal(ultima.days[2].level, 4); // único día con sesión: es el más intenso
});

test("los niveles son relativos al día más intenso del periodo", () => {
  const today = "2026-10-14";
  const mapa = L.buildHeatmap(
    [
      { fecha: "2026-10-14", minutos: 120 },
      { fecha: "2026-10-13", minutos: 90 },
      { fecha: "2026-10-12", minutos: 60 },
      { fecha: "2026-10-11", minutos: 30 },
      { fecha: "2026-10-10", minutos: 10 }
    ],
    today
  );

  const porFecha = {};
  mapa.weeks.forEach((semana) => {
    semana.days.forEach((dia) => {
      porFecha[dia.date] = dia.level;
    });
  });

  assert.equal(mapa.maxMinutes, 120);
  assert.equal(porFecha["2026-10-14"], 4);
  assert.equal(porFecha["2026-10-13"], 3);
  assert.equal(porFecha["2026-10-12"], 2);
  assert.equal(porFecha["2026-10-11"], 1);
  assert.equal(porFecha["2026-10-10"], 1);
  assert.equal(porFecha["2026-10-09"], 0);
});

test("varias sesiones del mismo día se suman en una sola celda", () => {
  const today = "2026-10-19";
  const mapa = L.buildHeatmap(
    [
      { fecha: "2026-07-04", minutos: 20 },
      { fecha: "2026-07-04", minutos: 25 },
      { fecha: "2026-07-04", minutos: 15 }
    ],
    today
  );

  let celda = null;
  mapa.weeks.forEach((semana) => {
    semana.days.forEach((dia) => {
      if (dia.date === "2026-07-04") celda = dia;
    });
  });

  assert.equal(celda.minutes, 60);
  assert.equal(mapa.maxMinutes, 60);
  assert.equal(celda.level, 4);
});

test("monthLabels etiqueta la primera semana visible de cada mes", () => {
  const today = "2026-10-19";
  const mapa = L.buildHeatmap([], today);

  assert.deepEqual(mapa.monthLabels.map((e) => e.label), [
    "oct", "nov", "dic", "ene", "feb", "mar", "abr", "may", "jun", "jul",
    "ago", "sep", "oct"
  ]);

  // Cada etiqueta apunta a una semana que empieza dentro de ese mes.
  mapa.monthLabels.forEach((etiqueta) => {
    const mesDeLaSemana = Number(mapa.weeks[etiqueta.weekIndex].start.slice(5, 7));
    assert.equal(L.MONTHS_ES[mesDeLaSemana - 1], etiqueta.label);
  });
});
