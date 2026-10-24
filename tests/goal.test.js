// Tests del objetivo semanal (lunes - domingo).
// Se ejecutan con: node --test

const test = require("node:test");
const assert = require("node:assert/strict");
const L = require("../logic.js");

test("startOfWeekMonday devuelve el lunes de la semana", () => {
  assert.equal(L.startOfWeekMonday("2026-10-26"), "2026-10-26"); // lunes
  assert.equal(L.startOfWeekMonday("2026-10-25"), "2026-10-19"); // domingo
  assert.equal(L.startOfWeekMonday("2026-10-22"), "2026-10-19"); // jueves
});

test("endOfWeekSunday devuelve el domingo de la semana", () => {
  assert.equal(L.endOfWeekSunday("2026-10-26"), "2026-11-01");
  assert.equal(L.endOfWeekSunday("2026-10-25"), "2026-10-25");
});

test("weekBounds cruza año correctamente", () => {
  const b = L.weekBounds("2026-01-01");
  assert.equal(b.start, "2025-12-29"); // jueves 1 ene 2026 -> lunes 29 dic 2025
  assert.equal(b.end, "2026-01-04");
});

test("minutesInWeek suma solo la semana lunes-domingo", () => {
  const today = "2026-10-22"; // jueves
  const sesiones = [
    { fecha: "2026-10-19", minutos: 30 }, // lunes (dentro)
    { fecha: "2026-10-22", minutos: 45 }, // jueves (dentro)
    { fecha: "2026-10-25", minutos: 60 }, // domingo (dentro)
    { fecha: "2026-10-18", minutos: 90 }, // domingo anterior (fuera)
    { fecha: "2026-10-26", minutos: 90 }  // lunes siguiente (fuera)
  ];
  assert.equal(L.minutesInWeek(sesiones, today), 135);
});

test("minutesInWeek suma varias sesiones del mismo día e ignora inválidas", () => {
  const today = "2026-10-22";
  const sesiones = [
    { fecha: "2026-10-20", minutos: 20 },
    { fecha: "2026-10-20", minutos: 25 },
    { fecha: "2026-10-20", minutos: 0 },      // ignorado
    { fecha: "2026-02-30", minutos: 30 },      // inválida
    { fecha: "ayer", minutos: 10 },            // inválida
    null
  ];
  assert.equal(L.minutesInWeek(sesiones, today), 45);
});

test("weeklyProgress sin objetivo devuelve goal null", () => {
  const today = "2026-10-22";
  const sesiones = [{ fecha: "2026-10-22", minutos: 30 }];

  assert.equal(L.weeklyProgress(sesiones, today, null).goal, null);
  assert.equal(L.weeklyProgress(sesiones, today, 0).goal, null);
  assert.equal(L.weeklyProgress(sesiones, today, -10).goal, null);
  assert.equal(L.weeklyProgress(sesiones, today, 300).goal, 300); // número entero > 0 sí es válido
  assert.equal(L.weeklyProgress(sesiones, today, 150.5).goal, null);
});

test("weeklyProgress calcula done y percent", () => {
  const today = "2026-10-22";
  const sesiones = [
    { fecha: "2026-10-19", minutos: 100 },
    { fecha: "2026-10-22", minutos: 50 }
  ];

  const p1 = L.weeklyProgress(sesiones, today, 300);
  assert.equal(p1.current, 150);
  assert.equal(p1.goal, 300);
  assert.equal(p1.percent, 50);
  assert.equal(p1.done, false);

  const p2 = L.weeklyProgress(sesiones, today, 150);
  assert.equal(p2.percent, 100);
  assert.equal(p2.done, true);

  const p3 = L.weeklyProgress(sesiones, today, 100);
  assert.equal(p3.percent, 100);
  assert.equal(p3.done, true);
});

test("weeklyProgress usa today inyectado", () => {
  const sesiones = [{ fecha: "2026-10-18", minutos: 60 }]; // domingo anterior
  const p = L.weeklyProgress(sesiones, "2026-10-19", 60); // lunes: nueva semana
  assert.equal(p.current, 0);
  assert.equal(p.done, false);
});
