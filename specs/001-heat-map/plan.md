# Plan 001 — Mapa de constancia

Plan de implementación de `specs/001-heat-map/spec.md`. Respeta
`docs/constitution.md`: sin dependencias ni build, lógica pura separada de la interfaz,
`today` inyectado, tests con `node --test` como puerta, hora local y datos intactos.

Código e identificadores en inglés; interfaz, comentarios de este plan y documentación
en español (principio 6).

## 1. Resumen

Se añade un mapa de calor de los últimos 12 meses (RF-1) con celdas por día agrupadas en
semanas, niveles de intensidad en quintiles relativos al día más intenso (RF-3) y
leyenda, etiquetas de mes y texto emergente (RF-6, RF-7, RF-8). El mapa se sitúa entre
la cabecera y el formulario, y se refresca al guardar (RF-9).

Para poder probar la lógica con Node sin arrastrar el DOM, se extraen a un archivo nuevo
`logic.js` las funciones puras que hoy viven dentro de `app.js` (fechas, racha,
estadísticas) y se añaden las del mapa. Todas reciben `today` como parámetro.

## 2. Archivos: qué se crea, qué se modifica y quién responde de qué

| Archivo | Acción | Responsabilidad | RF que cubre |
| --- | --- | --- | --- |
| `logic.js` | Crear | Toda la lógica pura: fechas locales, agregación por día, niveles, construcción de la rejilla del mapa, etiquetas de mes, racha y días del mes. Sin DOM, sin localStorage, sin leer el reloj. Doble exportación (navegador y Node). | RF-1, RF-2, RF-3, RF-4, RF-5, RF-7, RF-10, RNF-2, RNF-3 |
| `app.js` | Modificar | Solo interfaz: leer el reloj una vez, leer y guardar en localStorage, pintar cabecera, lista y mapa, gestionar el formulario y el desplazamiento del mapa. Pierde las funciones puras, que pasan a `logic.js`. | RF-8, RF-9 |
| `index.html` | Modificar | Cargar `logic.js` antes de `app.js`; añadir la sección del mapa entre la cabecera y el formulario, con contenedor de desplazamiento y leyenda. | RF-1, RF-6, RF-9 |
| `styles.css` | Modificar | Estilos del mapa: rampa de niveles coherente con el diseño de cuaderno, celda, etiquetas, texto emergente, leyenda, foco visible y desplazamiento horizontal. | RF-2, RF-3, RF-4, RF-5, RF-6, RF-7, RF-8, RNF-4, RNF-5, RNF-6 |
| `tests/dates.test.js` | Crear | Tests de utilidades de fecha: conversión local, suma de días, lunes de la semana, meses hacia atrás, validación y formato. | RF-1, RF-2, RNF-3 |
| `tests/heatmap.test.js` | Crear | Tests del algoritmo del mapa: agregación por día, niveles, rejilla de 12 meses, días futuros y etiquetas de mes. | RF-1, RF-2, RF-3, RF-4, RF-5, RF-7, RF-10 |
| `tests/stats.test.js` | Crear | Tests de regresión de racha y días del mes, ahora con `today` inyectado. | RF-9, RNF-2 |

Fuera de este cambio: `AGENTS.md` y `MEMORY.md` (pendientes de confirmación aparte).

## 3. Lógica pura necesaria (`logic.js`)

Todas las firmas usan cadenas ISO locales `"YYYY-MM-DD"` y no mutan sus argumentos. Las
que dependen del tiempo reciben `today`; ninguna llama a `new Date()` sin argumentos.

| Función | Entrada → Salida | Responsabilidad | RF / RNF |
| --- | --- | --- | --- |
| `toISO(date)` | `Date` → `"YYYY-MM-DD"` | Convertir una fecha a ISO local usando componentes locales (nunca `toISOString`). | RNF-3 |
| `isValidISODate(value)` | `string` → `boolean` | Aceptar solo `YYYY-MM-DD` que además exista en el calendario (rechaza `2026-02-30`). | RF-10 |
| `addDays(iso, days)` | `(string, number)` → `string` | Sumar o restar días con componentes locales, a prueba de cambio de hora. | RF-1, RF-2 |
| `startOfWeek(iso)` | `string` → `string` | Lunes de la semana de esa fecha (lunes = inicio, domingo = fin). | RF-1, RF-2 |
| `endOfWeek(iso)` | `string` → `string` | Domingo de la semana de esa fecha. | RF-1, RF-5 |
| `subtractMonths(iso, months)` | `(string, number)` → `string` | Retroceder meses recortando el día al último del mes destino (evita el desbordamiento de `setMonth`). | RF-1 |
| `formatDate(iso)` | `string` → `"18 oct 2026"` | Fecha legible para el texto emergente, con los meses en español. | RF-8 |
| `dailyMinutes(sessions)` | `Array` → `{ "YYYY-MM-DD": minutos }` | Sumar los minutos de cada día; ignora fechas inválidas y minutos no positivos. | RF-3, RF-10 |
| `intensityLevel(minutes, maxMinutes)` | `(number, number)` → `0..4` | Traducir minutos a nivel en quintiles relativos al máximo. | RF-3, RF-4 |
| `buildHeatmap(sessions, today)` | `(Array, string)` → `{ weeks, maxMinutes, monthLabels }` | Construir la rejilla completa de 12 meses, con minutos, nivel y marca de día futuro por celda. | RF-1, RF-2, RF-4, RF-5 |
| `monthLabels(weeks)` | `Array` → `[{ weekIndex, label }]` | Etiquetar el mes de la primera semana visible de cada mes. | RF-7 |
| `calculateStreak(sessions, today)` | `(Array, string)` → `number` | Racha actual (misma semántica que hoy, pero sin leer el reloj). | RF-9, RNF-2 |
| `daysThisMonth(sessions, today)` | `(Array, string)` → `number` | Días distintos con sesión en el mes de `today`. | RF-9, RNF-2 |

Nota: `calculateStreak` y `daysThisMonth` ya existen dentro de `app.js` y leen el reloj
por su cuenta, lo que incumple el principio 3. Al moverlas a `logic.js` se corrige ese
incumplimiento sin cambiar su comportamiento observable.

Doble exportación para funcionar con doble clic y con Node, sin build ni módulos ES:

```js
// Al final de logic.js
var api = { toISO: toISO, addDays: addDays, /* ... */ buildHeatmap: buildHeatmap };

if (typeof module !== "undefined" && module.exports) {
  module.exports = api;          // Node: lo usan los tests.
} else {
  window.StudyLogic = api;       // Navegador: lo usa app.js.
}
```

## 4. Algoritmo del mapa (pseudocódigo)

Estructura de salida:

```text
{
  weeks: [
    { start: "2025-10-13", days: [
        { date: "2025-10-13", minutes: 45, level: 2, isFuture: false },
        ... 7 días ...
    ]},
    ... 52 o 53 semanas ...
  ],
  maxMinutes: 180,
  monthLabels: [ { weekIndex: 0, label: "oct" }, { weekIndex: 4, label: "nov" }, ... ]
}
```

```text
FUNCIÓN dailyMinutes(sessions):
  totals = {}
  PARA CADA s EN sessions:
    SI NO isValidISODate(s.fecha) ENTONCES continuar
    SI NO (s.minutos numero) O s.minutos <= 0 ENTONCES continuar
    totals[s.fecha] = (totals[s.fecha] O 0) + s.minutos
  DEVOLVER totals

FUNCIÓN intensityLevel(minutes, maxMinutes):
  SI minutes <= 0 O maxMinutes <= 0 ENTONCES DEVOLVER 0
  nivel = techo(4 * minutes / maxMinutes)
  DEVOLVER min(4, max(1, nivel))

FUNCIÓN buildHeatmap(sessions, today):
  totals = dailyMinutes(sessions)
  maxMinutes = max(valores de totals)  O 0 si no hay ninguno
  primerLunes = startOfWeek(subtractMonths(today, 12))
  ultimoDomingo = endOfWeek(today)

  weeks = []
  cursor = primerLunes
  MIENTRAS cursor <= ultimoDomingo:
    dias = []
    PARA i DE 0 A 6:
      fecha = addDays(cursor, i)
      minutos = totals[fecha] O 0
      dias.añadir({
        date: fecha,
        minutes: minutos,
        level: intensityLevel(minutos, maxMinutes),
        isFuture: fecha > today        // comparación de texto ISO, sin Date
      })
    weeks.añadir({ start: cursor, days: dias })
    cursor = addDays(cursor, 7)        // siempre por semana, nunca por meses

  DEVOLVER { weeks, maxMinutes, monthLabels: monthLabels(weeks) }

FUNCIÓN monthLabels(weeks):
  etiquetas = []
  mesAnterior = null
  PARA CADA week, indice EN weeks:
    mes = mesDe(week.start)            // primer día de la semana visible
    SI mes != mesAnterior ENTONCES etiquetas.añadir({ weekIndex: indice, label: MESES_ES[mes] })
    mesAnterior = mes
  DEVOLVER etiquetas

FUNCIÓN subtractMonths(iso, months):
  (anio, mes, dia) = partes de iso
  destino = new Date(anio, mes-1-months, 1)      // día 1 evita el desbordamiento
  ultimoDia = último día del mes destino
  DEVOLVER ISO(destino.anio, destino.mes, min(dia, ultimoDia))

FUNCIÓN addDays(iso, days):
  (anio, mes, dia) = partes de iso
  d = new Date(anio, mes-1, dia)                 // mediodía local implícito: seguro ante cambio de hora
  d.setDate(d.getDate() + days)
  DEVOLVER toISO(d)
```

Trazabilidad del algoritmo: RF-1 (rango de 12 meses y semanas de lunes a domingo),
RF-2 (una celda por día), RF-3 (`intensityLevel`), RF-4 (nivel 0), RF-5 (`isFuture`),
RF-7 (`monthLabels`), RF-10 (`isValidISODate` filtra).

## 5. Pintado en la interfaz

`app.js` mantiene una única lectura del reloj por render y reparte el resultado:

```text
FUNCIÓN pintarMapa():
  today = toISO(new Date())                  // única lectura del reloj
  resultado = StudyLogic.buildHeatmap(sesiones, today)
  rejilla.innerHTML = ""
  PARA CADA week EN resultado.weeks:
    añadir etiqueta de mes (vacía si esa semana no abre mes)
    PARA CADA day EN week.days:
      SI day.isFuture:
        celda = <div class="mapa-celda fuera-calendario" aria-hidden="true">
      SI NO:
        celda = <button type="button" class="mapa-celda nivel-{day.level}" data-date=...>
          aria-label = formatDate(day.date) + ", " + (day.minutes ? day.minutes + " min" : "sin sesiones")
          SI day.minutes == 0: celda.tabIndex = -1
          celda.innerHTML = <span class="mapa-tooltip" aria-hidden="true">…</span>
      rejilla.añadir(celda)
  contenedor.scrollLeft = contenedor.scrollWidth   // arrancar en las semanas recientes
```

- Sección en `index.html`, entre `</header>` y el formulario: título "Constancia",
  contenedor `#mapa-scroll` con `#mapa-rejilla` dentro, y leyenda estática.
- Rejilla: `display: grid; grid-auto-flow: column; grid-template-rows: auto repeat(7, 12px)`.
  Se insertan 8 elementos por columna en orden (etiqueta de mes + 7 días), de modo que el
  auto-flujo rellena cada semana como una columna sin posicionamiento absoluto.
- Etiquetas de día de la semana: columna fija fuera del área con desplazamiento, con
  relleno superior igual a la altura de la fila de meses para que las filas coincidan
  (`L`, `X`, `V`; los tres intermedios bastan para orientarse).
- Rampa de color en tintes del acento óxido ya existente, sin introducir un color nuevo:
  nivel 0 `#e3e4dd` (línea), nivel 1 `#edcdc7`, nivel 2 `#dda49a`, nivel 3 `#c9705f`,
  nivel 4 `#b23a2e` (margen).
- Texto emergente: `span` dentro de cada celda, visible con `:hover` y `:focus-visible`.
  El contenedor reserva espacio superior y lateral para que no se recorte.
- Foco: anillo óxido de 2px, como el resto de la interfaz. Movimiento: solo la aparición
  del texto emergente y anulada con `prefers-reduced-motion`.
- `pintarTodo()` pasa a llamar a `pintarRacha()`, `pintarDiasMes()`, `pintarMapa()` y
  `pintarLista()`, de modo que guardar una sesión (RF-9) refresca las cuatro cosas.

## 6. Decisiones técnicas

| Decisión | Por qué | Alternativa descartada |
| --- | --- | --- |
| Script clásico con doble exportación (`module.exports` o `window.StudyLogic`) | `logic.js` tiene que funcionar a la vez abierto con doble clic y requerido por los tests. | Módulos ES (`import`/`export`): `file://` bloquea `type="module"` por CORS, rompería el doble clic (principio 1). Añadir `package.json` con `"type": "module"` tampoco resuelve `file://`. |
| `logic.js` en archivo aparte | `app.js` toca `document` en su nivel superior, así que no se puede requerir desde Node; separar es lo que hace posible el test automático del principio 4. | Poner la lógica en `app.js` y probar el DOM: exigiría dependencias (jsdom) o un navegador, prohibido por el principio 1. |
| Fechas como cadenas ISO locales, sin re-parsear con `new Date(iso)` | `new Date("2026-10-18")` se interpreta como UTC y en husos negativos devuelve el día anterior; comparar cadenas ISO ordena y filtra días futuros sin objetos `Date`. | Objetos `Date` como claves del mapa: mutables, sensibles a la zona horaria y al cambio de hora. |
| `addDays` y `subtractMonths` con componentes locales y recorte del día | Evita saltarse un día en los cambios de hora y evita que `setMonth` desborde al mes siguiente (`31 may − 3 meses`). | Sumar milisegundos (`getTime() + n·86400000`): falla en los cambios de hora. Dejar que `setMonth` desborde: fechas fuera del mes pedido. |
| Niveles = `techo(4 · minutos / máximo del periodo)`, mínimo 1, máximo 4 | Es la lectura directa de "quintiles relativos al día más intenso": determinista, sin ordenar ni desempatar, y el día más intenso siempre llega a nivel 4. | Umbrales fijos (30/60/120 min): la misma sesión significaría cosas distintas según la persona; descartado por decisión de la spec. Quintiles por rango tras ordenar: empates arbitrarios y mucha más lógica para el mismo resultado visual. |
| Devuelve una estructura de datos; el DOM lo construye `app.js` | Principio 3: la lógica se prueba sin navegador. | Funciones que devuelven HTML o nodos: imposible de testear con `node --test`. |
| Media hora de rejilla con `grid-auto-flow: column` (8 elementos por columna) | Semanas como columnas y días como filas sin posicionar nada a mano; las etiquetas de mes quedan alineadas por construcción. | Posicionamiento absoluto por coordenadas: más frágil y difícil de mantener. |
| Desplazamiento horizontal solo dentro del mapa, arrancando al final | Cumple RF-1 (12 meses) sin romper RNF-4 (la página no se desplaza en móvil) y muestra de entrada lo reciente. | 12 meses comprimidos: celdas de 2px, ilegibles. Paginar por trimestres: esconde el patrón y añade controles. |
| Texto emergente en CSS dentro de la celda, con espacio reservado en el contenedor | Sin JavaScript de posicionamiento, sin recortes y visible también con teclado. | Texto emergente posicionado con JS en el `body`: puede salirse por el borde, se complica con el desplazamiento. Atributo `title` nativo: no aparece con el foco. |
| Solo las celdas con actividad son botones tabulables; las vacías usan `tabIndex = -1` | Hasta 365 paradas de tabulación serían un castigo; el detalle de un día vacío no aporta información. | Roving tabindex con navegación por flechas: patrón ARIA más correcto, pero mucho más código para una app personal. Todas las celdas tabulables: fricción de teclado. |
| Leyenda estática en el HTML, con las mismas clases de nivel | Los cuatro niveles son fijos; no hay nada que calcular. | Generar la leyenda con JS: código de más y un parpadeo en el arranque. |
| Sin empaquetador ni `package.json` | `node --test` descubre `tests/*.test.js` por sí solo (principio 1 y 4). | `npm test` con script: obligaría a crear `package.json` y sugerir `npm install`, contra el principio 1. |

## 7. Estrategia de tests con `node --test`

- Comando único, desde la raíz del proyecto: `node --test`. Sin dependencias: `node:test`
  y `node:assert/strict`.
- Nombres de archivo `*.test.js` dentro de `tests/`, que el runner descubre de forma
  recursiva sin configuración.
- Cada test fija `today` explícitamente; no se usan temporizadores ni relojes falsos, ni
  se toca el DOM ni localStorage. Se usan tablas de casos (array de entradas y salidas
  esperadas) para cubrir los límites de golpe.

| Archivo | Qué prueba | Casos clave | RF / RNF |
| --- | --- | --- | --- |
| `tests/dates.test.js` | `toISO`, `isValidISODate`, `addDays`, `startOfWeek`, `endOfWeek`, `subtractMonths`, `formatDate` | `isValidISODate("2026-02-30")` es `false`; `subtractMonths("2026-05-31", 3)` es `2026-02-28`; `subtractMonths("2028-03-31", 1)` es `2028-02-29` (año bisiesto); `addDays("2026-10-24", 1)` cruza el fin del horario de verano y `addDays("2026-03-28", 2)` el inicio; `endOfWeek("2025-12-31")` cruza el año; `startOfWeek` de un domingo devuelve el lunes anterior; `formatDate("2026-10-18")` es `"18 oct 2026"`. | RF-1, RF-2, RF-8, RNF-3 |
| `tests/heatmap.test.js` | `dailyMinutes`, `intensityLevel`, `buildHeatmap`, `monthLabels` | Suma de varias sesiones del mismo día; ignora minutos 0, negativos y fechas inválidas sin perder las válidas; `intensityLevel` en la tabla (0,0)→0, (10,0)→0, (30,120)→1, (60,120)→2, (90,120)→3, (119,120)→4, (120,120)→4, (200,120)→4 por recorte, (1,300)→1; rejilla que empieza en lunes y termina en el domingo de la semana de `today`; con `today = "2026-10-18"` (domingo) no hay días futuros y con `today = "2026-10-14"` los cuatro últimos son futuros y quedan en nivel 0; 12 meses dan 53 o 54 semanas; `monthLabels` etiqueta solo la primera semana de cada mes y cruza diciembre a enero. | RF-1, RF-2, RF-3, RF-4, RF-5, RF-7, RF-10 |
| `tests/stats.test.js` | `calculateStreak`, `daysThisMonth` con `today` inyectado | Racha con sesión hoy, ayer y anteayer → 3; sin hoy pero con ayer → 1; sin hoy ni ayer → 0; sesiones futuras no cuentan; días del mes excluyen el mes anterior y el posterior. | RF-9, RNF-2 |

Regla de puerta (principio 4): no se da por terminado el cambio con `node --test` en rojo.

Lo que los tests no pueden cubrir se verifica en el navegador con el MCP de Chrome
DevTools (ya conectado en este proyecto): consola, geometría y árbol de accesibilidad,
más el flujo de guardado. Los pasos son:

1. Abrir `index.html` con `file://` y comprobar que la consola no tiene errores.
2. Sembrar sesiones de prueba en el `localStorage` del perfil aislado del MCP y
   comparar el DOM pintado con `buildHeatmap`: clase de nivel, `aria-label` y
   `tabIndex` de las 378 celdas, sin discrepancias.
3. Guardar una sesión desde el formulario y ver que el mapa, la leyenda, la racha y
   los días del mes se actualizan sin recargar.
4. Enfocar una celda con sesión y comprobar que el texto emergente es visible y que no
   queda recortado por el desplazamiento horizontal.
5. Vista móvil emulada a 360px: la página no se desplaza en horizontal y el mapa
   arranca en las semanas más recientes.
6. Recargar: ninguna sesión previa se pierde.

Las capturas de pantalla quedan para revisión visual de la persona; el agente no
interpreta imágenes y se apoya en medidas (geometría, estilos computados, consola).

## 8. Trazabilidad RF → partes del plan

| RF | Dónde se cubre |
| --- | --- |
| RF-1 | `subtractMonths`, `startOfWeek`, `endOfWeek`, `addDays`, bucle de semanas de `buildHeatmap`; sección y contenedor del mapa en `index.html`; estilos de desplazamiento. |
| RF-2 | `buildHeatmap` (una entrada por día en `weeks[].days`), rejilla `grid-auto-flow: column` y columna de etiquetas de día. |
| RF-3 | `dailyMinutes`, `intensityLevel`, campo `level` por celda, clases `nivel-1..nivel-4` y rampa de color. |
| RF-4 | `intensityLevel` devuelve 0 sin sesión; clase `nivel-0`. |
| RF-5 | Campo `isFuture` calculado por comparación de cadenas ISO; celdas `fuera-calendario` sin botón ni texto emergente. |
| RF-6 | Leyenda estática en `index.html` con las clases de nivel y estilos de leyenda. |
| RF-7 | `monthLabels` y fila superior de etiquetas dentro de cada columna. |
| RF-8 | `formatDate`, atributo `aria-label`, `span.mapa-tooltip` con `:hover` y `:focus-visible`. |
| RF-9 | `pintarTodo()` llama a `pintarMapa()`; el manejador de envío ya guarda y repinta. |
| RF-10 | `isValidISODate` dentro de `dailyMinutes`; nunca se reescribe `localStorage`. |
| RNF-1 | Ningún archivo nuevo es una dependencia: `logic.js` es un script más. |
| RNF-2 | `logic.js` sin DOM ni localStorage y con `today` en todas las funciones afectadas. |
| RNF-3 | `toISO`, `addDays`, `subtractMonths` con componentes locales; comparaciones de cadena. |
| RNF-4 | Contenedor con desplazamiento propio; la página conserva el ancho de la columna. |
| RNF-5 | Botones reales con `aria-label`, foco visible, información no solo por color. |
| RNF-6 | Una sola transición, anulada con `prefers-reduced-motion`. |
| RNF-7 | Identificadores en inglés; textos de interfaz y este plan en español. |

## 9. Trampas conocidas

- `new Date("YYYY-MM-DD")` se interpreta como UTC: nunca re-parsear una fecha ISO así;
  usar las partes de la cadena.
- `setMonth` desborda al mes siguiente si el día no existe en el destino: recortar al
  último día del mes.
- Sumar días con milisegundos falla en los cambios de hora: usar siempre `setDate` y
  `getDate`.
- `overflow-x: auto` fuerza también el recorte vertical: el texto emergente necesita
  espacio reservado dentro del contenedor.
- Los días futuros se comparan como cadenas ISO, nunca con `Date`, para no depender del
  huso horario.
- El día `today` es domingo en los datos de prueba del 18 de octubre de 2026: la última
  semana queda completa y sin días futuros, así que los tests de día futuro deben fijar
  un miércoles o similar.
- El primer lunes del rango puede caer antes de los 12 meses exactos: es la alineación
  semanal acordada en RF-1, no un error.
