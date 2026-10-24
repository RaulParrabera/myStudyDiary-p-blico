// Tests de las utilidades de fecha (RF-1, RF-2, RF-8, RNF-3).
// Se ejecutan con: node --test

const test = require("node:test");
const assert = require("node:assert/strict");
const L = require("../logic.js");

test("toISO usa la hora local y no UTC", () => {
  // Las 23:30 locales siguen siendo el mismo día, aunque en UTC ya sea otro.
  assert.equal(L.toISO(new Date(2026, 9, 18, 23, 30)), "2026-10-18");
  assert.equal(L.toISO(new Date(2026, 0, 1, 0, 5)), "2026-01-01");
});

test("isValidISODate rechaza formatos raros y días que no existen", () => {
  assert.equal(L.isValidISODate("2026-10-18"), true);
  assert.equal(L.isValidISODate("2028-02-29"), true); // año bisiesto
  assert.equal(L.isValidISODate("2026-02-29"), false); // 2026 no es bisiesto
  assert.equal(L.isValidISODate("2026-02-30"), false);
  assert.equal(L.isValidISODate("2026-13-01"), false);
  assert.equal(L.isValidISODate("2026-00-10"), false);
  assert.equal(L.isValidISODate("2026-10-00"), false);
  assert.equal(L.isValidISODate("2026-2-3"), false);
  assert.equal(L.isValidISODate("18/10/2026"), false);
  assert.equal(L.isValidISODate(""), false);
  assert.equal(L.isValidISODate(undefined), false);
  assert.equal(L.isValidISODate(null), false);
});

test("addDays cruza meses y años sin saltarse días", () => {
  assert.equal(L.addDays("2026-10-18", 1), "2026-10-19");
  assert.equal(L.addDays("2026-10-01", -1), "2026-09-30");
  assert.equal(L.addDays("2025-12-31", 1), "2026-01-01");
  assert.equal(L.addDays("2028-02-28", 1), "2028-02-29");
  assert.equal(L.addDays("2028-02-29", 1), "2028-03-01");
});

test("addDays atraviesa los cambios de hora de España sin perder días", () => {
  // Fin del horario de verano: 25 de octubre de 2026.
  assert.equal(L.addDays("2026-10-24", 1), "2026-10-25");
  assert.equal(L.addDays("2026-10-25", 1), "2026-10-26");
  // Inicio del horario de verano: 29 de marzo de 2026.
  assert.equal(L.addDays("2026-03-28", 1), "2026-03-29");
  assert.equal(L.addDays("2026-03-28", 2), "2026-03-30");
});

test("startOfWeek da el lunes y endOfWeek el domingo", () => {
  assert.equal(L.startOfWeek("2026-10-19"), "2026-10-19"); // lunes: él mismo
  assert.equal(L.startOfWeek("2026-10-18"), "2026-10-12"); // domingo: lunes anterior
  assert.equal(L.startOfWeek("2026-10-25"), "2026-10-19"); // domingo siguiente
  assert.equal(L.endOfWeek("2026-10-18"), "2026-10-18");
  assert.equal(L.endOfWeek("2025-12-31"), "2026-01-04"); // cruza el año
});

test("subtractMonths recorta el día al último del mes destino", () => {
  assert.equal(L.subtractMonths("2026-10-18", 12), "2025-10-18");
  assert.equal(L.subtractMonths("2026-01-15", 1), "2025-12-15");
  assert.equal(L.subtractMonths("2026-05-31", 3), "2026-02-28"); // febrero corto
  assert.equal(L.subtractMonths("2028-03-31", 1), "2028-02-29"); // bisiesto
});

test("formatDate escribe la fecha en español", () => {
  assert.equal(L.formatDate("2026-10-18"), "18 oct 2026");
  assert.equal(L.formatDate("2026-01-01"), "1 ene 2026");
  assert.equal(L.formatDate("2025-12-31"), "31 dic 2025");
});
