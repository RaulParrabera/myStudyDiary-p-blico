# MEMORY.md — Diario de Estudio
Memoria del proyecto entre sesiones. Máximo ~50 líneas: resume o elimina lo que ya no
aporte.
## Estado actual
- v1.1: registrar sesiones (fecha, tema, minutos), racha actual, días estudiados este mes,
lista de sesiones y mapa de constancia de los últimos 12 meses (`specs/001-heat-map/`).
- Datos en localStorage (`diarioDeEstudio.sesiones`), sin backend ni dependencias.
- Lógica pura de fechas, mapa y estadísticas en `logic.js`; interfaz en `app.js`; 23 tests
en `tests/` que se ejecutan con `node --test`.
## Decisiones (y por qué)
- Sin backend ni dependencias: cualquiera debe poder abrirlo con doble clic, así que
`logic.js` se exporta a la vez para el navegador y para Node.
- Fecha editable en el formulario: permite registrar días pasados y ver la racha crecer.
- Diseño «hoja de cuaderno»: papel `#f5f6f3` con cuadrícula, tinta `#1f2233`, margen rojo
óxido `#b23a2e`, tipografías Newsreader e Instrument Sans. Sustituye al gradiente y a las
tarjetas genéricas de la v1.
- El mapa cubre 12 meses con scroll propio (la página nunca se desplaza en horizontal),
pinta por quintiles relativos al día más intenso del periodo y arranca en las semanas
recientes.
- Para no perderse en el conjunto: etiquetas de mes, etiquetas de día L/X/V, leyenda y
tooltip con fecha y minutos.
## Aprendizajes y errores a evitar
- Nada de `new Date("YYYY-MM-DD")`: se interpreta como UTC y puede devolver otro día. Las
fechas son texto ISO local y se convierten con `logic.js`.
- `setMonth` desborda de mes (hay que recortar el día) y sumar milisegundos falla en los
cambios de hora: se suma con `setDate`.
- `overflow-x: auto` recorta el tooltip: la rejilla reserva 34px arriba y 44px a los lados.
Ojo al medir: el borde de la rejilla se ajusta al contenedor y es su contenido el que
desborda.
- El texto del mes ensanchaba su columna y dejaba la rejilla desigual: `.mapa-mes` lleva
ancho fijo y el texto se derrama encima.
- Las fuentes cargan después del primer pintado y movían el arranque del mapa: se reajusta
en `document.fonts.ready`.
- El navegador del MCP de Chrome DevTools se reinicia entre llamadas: agrupa todo el
trabajo de navegador en una sola. Usa un perfil aislado, así que ahí no están tus datos
reales.
## Próximos pasos
- (vacío por ahora)