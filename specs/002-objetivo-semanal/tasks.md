# Tasks 002 — Objetivo semanal de estudio

Basado en `specs/002-objetivo-semanal/plan.md` y `specs/002-objetivo-semanal/spec.md`. Seguir `docs/constitution.md`.

## Tareas

### T1. Lógica pura en `logic.js`
- [ ] Añadir `startOfWeekMonday(iso)`, `endOfWeekSunday(iso)`, `weekBounds(iso)`.
- [ ] Añadir `minutesInWeek(sessions, today)` usando validación similar a `dailyMinutes` (fechas válidas, minutos > 0).
- [ ] Añadir `weeklyProgress(sessions, today, goalMinutes)` con validación de objetivo (entero > 0).
- [ ] Exportar todas en `StudyLogic`.
- [ ] Comprobar que no hay DOM/localStorage/reloj.

### T2. Tests
- [ ] Crear `tests/goal.test.js` con los tests del plan.
- [ ] Ejecutar `node --test` y asegurar que todos los tests (23 existentes + nuevos) pasan.

### T3. Interfaz HTML
- [ ] Modificar `index.html`: añadir bloque objetivo semanal en `.cabecera`.
- [ ] Añadir formulario `#form-objetivo` con input numérico.

### T4. Lógica de interfaz `app.js`
- [ ] Añadir referencias a nuevos elementos.
- [ ] Implementar `cargarObjetivo()` / `guardarObjetivo()` con clave `diarioDeEstudio.objetivoSemanal` y validación.
- [ ] Implementar `pintarObjetivo(today)`.
- [ ] Llamar `pintarObjetivo` en `pintarTodo()`.
- [ ] Gestionar envío del formulario de objetivo.
- [ ] Actualizar al guardar sesión (ya cubierto por `pintarTodo()`).

### T5. Estilos `styles.css`
- [ ] Añadir estilos para el bloque objetivo.
- [ ] Estilo para "cumplido".
- [ ] Responsive y `prefers-reduced-motion`.

### T6. Verificación
- [ ] `node --test` en verde.
- [ ] Comprobación manual: fijar objetivo, guardar sesión, recarga persiste, semana lunes-domingo, móvil 360px, consola sin errores.
- [ ] No se rompe mapa/racha/lista/localStorage de sesiones.

## Orden de ejecución
T1 → T2 → T3 → T4 → T5 → T6
