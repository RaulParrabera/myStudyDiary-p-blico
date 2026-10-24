# Plan 002 — Objetivo semanal de estudio

Plan de implementación de `specs/002-objetivo-semanal/spec.md`. Respeta `docs/constitution.md`: sin dependencias ni build, lógica pura separada de la interfaz, `today` inyectado, tests con `node --test` como puerta, hora local y datos intactos.

Código e identificadores en inglés; interfaz y documentación en español.

## 1. Resumen

Se añade la posibilidad de fijar un **objetivo semanal en minutos** y ver el **progreso de la semana en curso** (lunes a domingo) en la cabecera. 

Todo el cálculo irá en `logic.js` como funciones puras. La UI leerá/escribirá el objetivo en `localStorage` con clave `diarioDeEstudio.objetivoSemanal`, sin tocar el formato de `diarioDeEstudio.sesiones`.

## 2. Archivos: qué se crea, qué se modifica

| Archivo | Acción | Responsabilidad | RF que cubre |
| --- | --- | --- | --- |
| `logic.js` | Modificar | Añadir funciones puras para calcular los límites de semana (lunes-domingo), sumar minutos de esa semana y obtener progreso. Mantener doble exportación. | RF-3, RF-4, RF-7, RNF-2, RNF-3 |
| `app.js` | Modificar | Cargar/guardar objetivo desde `localStorage`, pintar el bloque de progreso en cabecera, actualizarlo al guardar sesión. Sin lógica de fechas. | RF-1, RF-2, RF-5, RF-6, RF-8 |
| `index.html` | Modificar | Añadir bloque en la cabecera para mostrar "X / Y min" y un pequeño formulario/input para fijar/cambiar el objetivo. | RF-1, RF-5, RF-6 |
| `styles.css` | Modificar | Estilos para el nuevo bloque: coherentes con estilo cuaderno. Destacar "¡Objetivo cumplido!" con un color sutil (sin gradientes). Responsive. | RF-8, RNF-7 |
| `tests/goal.test.js` | Crear | Tests para las nuevas funciones puras (`weekBounds`, `minutesInWeek`, `weeklyProgress`). | RF-3, RF-4, RF-7, RNF-6 |

Fuera de este cambio: `AGENTS.md`, `MEMORY.md`, `docs/constitution.md`, `specs/001-heat-map/*`.

## 3. Lógica pura necesaria (`logic.js`)

Todas reciben `today` cuando corresponda. Sin DOM, sin `localStorage`, sin leer el reloj.

| Función | Entrada → Salida | Responsabilidad | RF |
| --- | --- | --- | --- |
| `startOfWeekMonday(iso)` | `string` → `string` | Devuelve el lunes de la semana que contiene esa fecha. Reutiliza idea de `startOfWeek` pero explícito para lunes. | RF-3 |
| `endOfWeekSunday(iso)` | `string` → `string` | Devuelve el domingo de la semana que contiene esa fecha (`startOfWeekMonday + 6`). | RF-3 |
| `weekBounds(iso)` | `string` → `{ start: "YYYY-MM-DD", end: "YYYY-MM-DD" }` | Límites lunes-domingo de la semana de `iso`. | RF-3 |
| `minutesInWeek(sessions, today)` | `(Array, string)` → `number` | Suma minutos de sesiones válidas con fecha entre `start` y `end` (ambos inclusive). Usa `dailyMinutes` como referencia para filtrar fechas válidas/minutos > 0. | RF-4 |
| `weeklyProgress(sessions, today, goalMinutes)` | `(Array, string, number|null)` → `{ current: number, goal: number|null, percent: number, done: boolean, weekStart: string, weekEnd: string }` | Calcula progreso. Si `goalMinutes` no es un entero > 0, `goal` será `null`. `done = goal != null && current >= goal`. `percent` acotado 0-100. | RF-4, RF-5, RF-7, RF-8 |

Nota: se añadirá todo al objeto `StudyLogic` para mantener doble exportación (navegador/Node).

## 4. localStorage

| Clave | Tipo | Notas |
| --- | --- | --- |
| `diarioDeEstudio.objetivoSemanal` | `JSON` | Guardar como `{"minutos": 150}`. Al leer, validar: debe ser número entero, finito y > 0. Si corrupto o inválido -> `null` (sin objetivo). Nunca tocar `diarioDeEstudio.sesiones`. |

## 5. Interfaz

### `index.html`
Modificar cabecera `.cabecera` para añadir un bloque `.objetivo-semanal`:

```html
<div class="objetivo-semanal">
  <div class="objetivo-info">
    <span class="objetivo-label">Objetivo semanal</span>
    <div class="objetivo-progreso" id="objetivo-progreso">— / — min</div>
    <div class="objetivo-estado" id="objetivo-estado"></div>
  </div>
  <form id="form-objetivo" class="form-objetivo">
    <input id="objetivo-input" type="number" min="1" step="1" inputmode="numeric" placeholder="Minutos (ej. 300)">
    <button type="submit">Fijar objetivo</button>
  </form>
</div>
```

### `app.js`
- Añadir referencias a los nuevos elementos.
- Función `cargarObjetivo()` / `guardarObjetivo()`.
- Función `pintarObjetivo(today)` usando `StudyLogic.weeklyProgress`.
- Llamar a `pintarObjetivo` desde `pintarTodo()`.
- Al enviar formulario de objetivo: validar entero > 0, guardar, repintar.
- Al guardar una sesión: ya se llama `pintarTodo()` así que se actualiza automáticamente.

### `styles.css`
- Estilos para `.objetivo-semanal`, `.objetivo-progreso`, `.objetivo-estado`.
- Estado cumplido: usar color `var(--margen)` o un tono más oscuro, sin gradiente.
- Responsive: apilar en móvil si no cabe.
- Respetar `prefers-reduced-motion`.

## 6. Tests

Crear `tests/goal.test.js` con `node:test` + `node:assert/strict`:

| Test | Descripción |
| --- | --- |
| `weekBounds devuelve lunes-domingo` | Lunes -> mismo lunes/domingo. Domingo -> lunes anterior/domingo. Cruza año. |
| `minutesInWeek suma solo la semana en curso` | Ignora semana anterior/siguiente. Suma varias sesiones mismo día. Ignora inválidas. |
| `weeklyProgress sin objetivo devuelve goal null` | `goalMinutes` 0, null, undefined, "300" (string) -> `goal: null`. |
| `weeklyProgress con objetivo calcula done y percent` | current < goal, == goal, > goal. Acota percent 100 máx visual pero `done` true. |
| `weeklyProgress usa today inyectado` | Sin leer reloj. |

## 7. Trazabilidad

| RF | Implementación |
| --- | --- |
| RF-1,RNF-4 | `app.js` + `localStorage` con validación |
| RF-2 | Clave `diarioDeEstudio.objetivoSemanal` |
| RF-3 | `weekBounds/startOfWeekMonday/endOfWeekSunday` |
| RF-4,RNF-2 | `minutesInWeek` usando `dailyMinutes`/validación |
| RF-5,RNF-7 | Bloque en cabecera con lógica de visibilidad |
| RF-6 | Formulario objetivo + repintado |
| RF-7 | `today` pasado a todas las funciones puras |
| RF-8 | Clase/estilo "cumplido" |

## 8. Riesgos y notas

- **Coherencia con mapa**: usar misma lógica de semana lunes-domingo.
- **No romper v1.1**: todos los tests existentes deben seguir pasando.
- **Fechas locales**: seguir reglas de `local-dates` skill.
- **Validación estricta**: rechazar decimales? El spec dice "número entero mayor que 0". Usar `Number.isInteger`.
- **UI minimal**: añadir lo justo para encajar con el cuaderno.

Listo para pasar a tareas.
