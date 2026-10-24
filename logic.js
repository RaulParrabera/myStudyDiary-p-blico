// ====== Diario de Estudio: lógica pura ======
// Cálculos de fechas, estadísticas y mapa de constancia.
//
// Reglas de la casa (docs/constitution.md):
// - Nada de DOM ni de localStorage.
// - Nada de leer el reloj: la fecha de referencia entra como parámetro `today`.
// - Las fechas son texto ISO local "YYYY-MM-DD"; nunca se re-parsean con
//   new Date("..."), porque eso las interpreta como UTC.
//
// Este archivo se carga como script en el navegador y con require() en los tests.

// Nombres cortos de los meses, para mostrar fechas y etiquetas.
var MONTHS_ES = ["ene", "feb", "mar", "abr", "may", "jun",
                 "jul", "ago", "sep", "oct", "nov", "dic"];

// Meses que cubre el mapa de constancia (RF-1).
var HEATMAP_MONTHS = 12;


// ============================================================
// Fechas
// ============================================================

// Convierte un objeto Date en texto "YYYY-MM-DD" usando la hora LOCAL.
// Importante: NO usamos toISOString(), porque esa usa UTC y podría
// devolver el día equivocado (por ejemplo, de noche en España).
function toISO(date) {
  var year = date.getFullYear();
  var month = String(date.getMonth() + 1).padStart(2, "0");
  var day = String(date.getDate()).padStart(2, "0");
  return year + "-" + month + "-" + day;
}

// Días que tiene un mes (month de 1 a 12).
function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

// ¿Es "YYYY-MM-DD" y además existe en el calendario?
// Rechaza formatos raros y días como el 30 de febrero (RF-10).
function isValidISODate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  var parts = value.split("-");
  var year = Number(parts[0]);
  var month = Number(parts[1]);
  var day = Number(parts[2]);
  if (month < 1 || month > 12 || day < 1) {
    return false;
  }
  return day <= daysInMonth(year, month);
}

// Convierte "YYYY-MM-DD" en un Date local, sin pasar por UTC.
function dateFromISO(iso) {
  var parts = iso.split("-");
  return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
}

// Suma días usando componentes locales: a prueba de cambios de hora.
function addDays(iso, days) {
  var date = dateFromISO(iso);
  date.setDate(date.getDate() + days);
  return toISO(date);
}

// Lunes de la semana de esa fecha (la semana empieza en lunes).
function startOfWeek(iso) {
  var date = dateFromISO(iso);
  var weekday = (date.getDay() + 6) % 7; // 0 = lunes ... 6 = domingo
  date.setDate(date.getDate() - weekday);
  return toISO(date);
}

// Domingo de la semana de esa fecha.
function endOfWeek(iso) {
  return addDays(startOfWeek(iso), 6);
}

// Retrocede meses recortando el día al último del mes destino.
// Sin el recorte, setMonth desbordaría: 31 may menos 3 meses no es el 31 feb.
function subtractMonths(iso, months) {
  var parts = iso.split("-");
  var year = Number(parts[0]);
  var month = Number(parts[1]);
  var day = Number(parts[2]);

  // Empezamos por el día 1 para que ningún desbordamiento nos desplace de mes.
  var target = new Date(year, month - 1 - months, 1);
  var targetYear = target.getFullYear();
  var targetMonth = target.getMonth() + 1;
  var targetDay = Math.min(day, daysInMonth(targetYear, targetMonth));

  return toISO(new Date(targetYear, targetMonth - 1, targetDay));
}

// Convierte "2026-10-13" en "13 oct 2026".
function formatDate(iso) {
  var parts = iso.split("-");
  var day = Number(parts[2]);
  var month = MONTHS_ES[Number(parts[1]) - 1];
  return day + " " + month + " " + parts[0];
}


// ============================================================
// Mapa de constancia
// ============================================================

// Minutos totales de cada día: { "YYYY-MM-DD": minutos }.
// Ignora fechas inválidas y minutos no positivos (RF-10), sin tocar los datos.
function dailyMinutes(sessions) {
  var totals = {};
  for (var i = 0; i < sessions.length; i++) {
    var session = sessions[i];
    if (!session || !isValidISODate(session.fecha)) {
      continue;
    }
    var minutes = Number(session.minutos);
    if (!isFinite(minutes) || minutes <= 0) {
      continue;
    }
    totals[session.fecha] = (totals[session.fecha] || 0) + minutes;
  }
  return totals;
}

// Nivel de intensidad 0..4, en quintiles relativos al día más intenso (RF-3).
// Cualquier día con sesiones queda al menos en 1; el máximo, en 4.
function intensityLevel(minutes, maxMinutes) {
  if (!(minutes > 0) || !(maxMinutes > 0)) {
    return 0;
  }
  var level = Math.ceil((4 * minutes) / maxMinutes);
  return Math.min(4, Math.max(1, level));
}

// Etiqueta el mes de la primera semana visible de cada mes (RF-7).
function monthLabels(weeks) {
  var labels = [];
  var previousMonth = null;
  for (var i = 0; i < weeks.length; i++) {
    var month = Number(weeks[i].start.split("-")[1]);
    if (month !== previousMonth) {
      labels.push({ weekIndex: i, label: MONTHS_ES[month - 1] });
      previousMonth = month;
    }
  }
  return labels;
}

// Construye la rejilla completa del mapa: 12 meses en semanas de lunes a domingo.
// Devuelve { weeks, maxMinutes, monthLabels }; cada día lleva { date, minutes,
// level, isFuture } (RF-1 a RF-5).
function buildHeatmap(sessions, today) {
  var totals = dailyMinutes(sessions);

  var maxMinutes = 0;
  for (var key in totals) {
    if (totals[key] > maxMinutes) {
      maxMinutes = totals[key];
    }
  }

  var firstMonday = startOfWeek(subtractMonths(today, HEATMAP_MONTHS));
  var lastSunday = endOfWeek(today);

  var weeks = [];
  var cursor = firstMonday;
  while (cursor <= lastSunday) {
    var days = [];
    for (var i = 0; i < 7; i++) {
      var date = addDays(cursor, i);
      var minutes = totals[date] || 0;
      days.push({
        date: date,
        minutes: minutes,
        level: intensityLevel(minutes, maxMinutes),
        // Los días futuros se comparan como texto ISO: sin pasar por Date.
        isFuture: date > today
      });
    }
    weeks.push({ start: cursor, days: days });
    cursor = addDays(cursor, 7);
  }

  return {
    weeks: weeks,
    maxMinutes: maxMinutes,
    monthLabels: monthLabels(weeks)
  };
}


// ============================================================
// Estadísticas de la cabecera
// ============================================================

// Días consecutivos con al menos una sesión, contando hacia atrás desde hoy.
//
// Reglas:
// - Empezamos a contar desde hoy.
// - Si hoy todavía no hay sesión, la racha no se rompe: probamos desde ayer.
// - Si ni hoy ni ayer tienen sesión, la racha es 0.
function calculateStreak(sessions, today) {
  var daysWithSession = new Set();
  for (var i = 0; i < sessions.length; i++) {
    if (sessions[i] && isValidISODate(sessions[i].fecha)) {
      daysWithSession.add(sessions[i].fecha);
    }
  }

  var day = today;

  // Si hoy no hay sesión, miramos ayer.
  if (!daysWithSession.has(day)) {
    day = addDays(day, -1);
    // Si ayer tampoco hay sesión, la racha ya se ha roto.
    if (!daysWithSession.has(day)) {
      return 0;
    }
  }

  // Contamos hacia atrás, día a día, mientras haya sesión.
  var streak = 0;
  while (daysWithSession.has(day)) {
    streak = streak + 1;
    day = addDays(day, -1);
  }
  return streak;
}

// Días distintos con sesión en el mes de `today`.
function daysThisMonth(sessions, today) {
  var currentMonth = today.slice(0, 7);
  var days = new Set();
  for (var i = 0; i < sessions.length; i++) {
    var fecha = sessions[i] && sessions[i].fecha;
    if (isValidISODate(fecha) && fecha.indexOf(currentMonth) === 0) {
      days.add(fecha);
    }
  }
  return days.size;
}


// ============================================================
// Objetivo semanal (lunes - domingo)
// ============================================================

// Lunes de la semana que contiene esa fecha.
function startOfWeekMonday(iso) {
  var date = dateFromISO(iso);
  var weekday = (date.getDay() + 6) % 7; // 0 = lunes ... 6 = domingo
  date.setDate(date.getDate() - weekday);
  return toISO(date);
}

// Domingo de la semana que contiene esa fecha.
function endOfWeekSunday(iso) {
  return addDays(startOfWeekMonday(iso), 6);
}

// Límites lunes-domingo de la semana que contiene esa fecha.
function weekBounds(iso) {
  var start = startOfWeekMonday(iso);
  return {
    start: start,
    end: addDays(start, 6)
  };
}

// Minutos totales de sesiones válidas dentro de la semana lunes-domingo de `today`.
function minutesInWeek(sessions, today) {
  var bounds = weekBounds(today);
  var totals = dailyMinutes(sessions);
  var sum = 0;
  var cursor = bounds.start;
  while (cursor <= bounds.end) {
    sum = sum + (totals[cursor] || 0);
    cursor = addDays(cursor, 1);
  }
  return sum;
}

// Progreso semanal. goalMinutes debe ser entero > 0 para considerarlo objetivo.
function weeklyProgress(sessions, today, goalMinutes) {
  var current = minutesInWeek(sessions, today);
  var goal = null;
  var g = Number(goalMinutes);

  if (Number.isInteger(g) && isFinite(g) && g > 0) {
    goal = g;
  }

  var percent = 0;
  if (goal !== null && goal > 0) {
    percent = Math.floor((current * 100) / goal);
    if (percent > 100) {
      percent = 100;
    }
    if (percent < 0) {
      percent = 0;
    }
  }

  var bounds = weekBounds(today);
  var done = goal !== null && current >= goal;

  return {
    current: current,
    goal: goal,
    percent: percent,
    done: done,
    weekStart: bounds.start,
    weekEnd: bounds.end
  };
}


// ============================================================
// Exportación doble: navegador y Node
// ============================================================

var StudyLogic = {
  MONTHS_ES: MONTHS_ES,
  HEATMAP_MONTHS: HEATMAP_MONTHS,
  toISO: toISO,
  daysInMonth: daysInMonth,
  isValidISODate: isValidISODate,
  dateFromISO: dateFromISO,
  addDays: addDays,
  startOfWeek: startOfWeek,
  endOfWeek: endOfWeek,
  startOfWeekMonday: startOfWeekMonday,
  endOfWeekSunday: endOfWeekSunday,
  weekBounds: weekBounds,
  subtractMonths: subtractMonths,
  formatDate: formatDate,
  dailyMinutes: dailyMinutes,
  intensityLevel: intensityLevel,
  monthLabels: monthLabels,
  buildHeatmap: buildHeatmap,
  calculateStreak: calculateStreak,
  daysThisMonth: daysThisMonth,
  minutesInWeek: minutesInWeek,
  weeklyProgress: weeklyProgress
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = StudyLogic; // Node: lo usan los tests.
} else {
  window.StudyLogic = StudyLogic; // Navegador: lo usa app.js.
}
