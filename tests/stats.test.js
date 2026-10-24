// Tests de regresión de las estadísticas de la cabecera (RF-9, RNF-2).
// Comprueban que, al moverlas a logic.js, siguen comportándose igual y que
// reciben `today` como parámetro en lugar de leer el reloj.

const test = require("node:test");
const assert = require("node:assert/strict");
const L = require("../logic.js");

test("calculateStreak cuenta los días consecutivos hasta hoy", () => {
  const today = "2026-10-19";
  const sesiones = [
    { fecha: "2026-10-19", minutos: 30 },
    { fecha: "2026-10-18", minutos: 45 },
    { fecha: "2026-10-17", minutos: 10 }
  ];

  assert.equal(L.calculateStreak(sesiones, today), 3);
});

test("calculateStreak no se rompe si hoy todavía no hay sesión", () => {
  const today = "2026-10-19";
  const sesiones = [
    { fecha: "2026-10-18", minutos: 45 },
    { fecha: "2026-10-17", minutos: 10 }
  ];

  assert.equal(L.calculateStreak(sesiones, today), 2);
});

test("calculateStreak es 0 si ni hoy ni ayer hay sesión", () => {
  const today = "2026-10-19";
  const sesiones = [{ fecha: "2026-10-16", minutos: 10 }];

  assert.equal(L.calculateStreak(sesiones, today), 0);
  assert.equal(L.calculateStreak([], today), 0);
});

test("calculateStreak cuenta un día una sola vez aunque tenga varias sesiones", () => {
  const today = "2026-10-19";
  const sesiones = [
    { fecha: "2026-10-19", minutos: 30 },
    { fecha: "2026-10-19", minutos: 20 },
    { fecha: "2026-10-18", minutos: 45 }
  ];

  assert.equal(L.calculateStreak(sesiones, today), 2);
});

test("calculateStreak ignora las sesiones con fecha inválida", () => {
  const today = "2026-10-19";
  const sesiones = [
    { fecha: "2026-10-19", minutos: 30 },
    { fecha: "ayer", minutos: 30 },
    { fecha: "2026-02-30", minutos: 30 }
  ];

  assert.equal(L.calculateStreak(sesiones, today), 1);
});

test("daysThisMonth cuenta días distintos y solo del mes de hoy", () => {
  const today = "2026-10-19";
  const sesiones = [
    { fecha: "2026-10-19", minutos: 30 },
    { fecha: "2026-10-01", minutos: 20 },
    { fecha: "2026-10-01", minutos: 15 }, // repetido: cuenta un día
    { fecha: "2026-09-30", minutos: 60 }, // mes anterior
    { fecha: "2026-11-01", minutos: 60 } // mes siguiente
  ];

  assert.equal(L.daysThisMonth(sesiones, today), 2);
  assert.equal(L.daysThisMonth([], today), 0);
});

test("daysThisMonth ignora las fechas inválidas", () => {
  const today = "2026-10-19";
  const sesiones = [
    { fecha: "2026-10-19", minutos: 30 },
    { fecha: "2026-10-32", minutos: 30 }
  ];

  assert.equal(L.daysThisMonth(sesiones, today), 1);
});
