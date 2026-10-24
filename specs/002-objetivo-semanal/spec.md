# Spec 002 — Objetivo semanal de estudio

## Contexto y objetivo
El diario ya muestra la racha, los días estudiados del mes y el mapa de constancia, pero no ayuda a marcar un compromiso semanal ni a ver si se está cumpliendo. Añadir un objetivo semanal (minutos) permite fijar una meta y ver cuánto se lleva acumulado esa semana, para motivarse a cumplirlo sin añadir complejidad.

## Usuarios / actores
La propia persona que estudia y registra sesiones. Uso personal, sin cuentas ni servidor, abriendo `index.html` con doble clic, tanto en escritorio como en móvil.

## Historias de usuario
- H1: Como estudiante quiero fijar un objetivo semanal en minutos para tener un compromiso claro.
- H2: Como estudiante quiero ver cuánto llevo estudiado esta semana respecto a mi objetivo para saber si voy por buen camino.
- H3: Como estudiante quiero que el objetivo se guarde para no tener que volver a ponerlo cada vez.

## Requisitos funcionales (criterios de aceptación en EARS)
- RF-1: EL SISTEMA permite fijar un objetivo semanal en minutos. Debe ser un número entero mayor que 0. Si se deja vacío o es inválido, NO se guarda y se mantiene el objetivo anterior (o sin objetivo si no había ninguno).
- RF-2: EL SISTEMA guarda el objetivo semanal en `localStorage` con clave `diarioDeEstudio.objetivoSemanal` (número). Debe ser compatible hacia atrás: si no existe, no hay objetivo.
- RF-3: LA SEMANA para el cálculo del progreso empieza en **lunes** y acaba en **domingo**, igual que el mapa de constancia (coherente con `startOfWeek`).
- RF-4: EL SISTEMA suma los minutos totales de todas las sesiones válidas (mismas reglas que `dailyMinutes`: fechas válidas `YYYY-MM-DD`, minutos numéricos > 0) cuya fecha esté dentro de la semana en curso (lunes a domingo que incluye `today`).
- RF-5: EL SISTEMA muestra en la cabecera el progreso de la semana: "X / Y min" donde X = minutos acumulados esta semana e Y = objetivo fijado. Si **no hay objetivo fijado**, NO se muestra ese bloque de progreso (o se muestra de forma neutra sin romper el diseño).
- RF-6: EL SISTEMA permite cambiar el objetivo en cualquier momento desde la interfaz. Al guardarlo, el progreso se actualiza sin recargar la página.
- RF-7: EL SISTEMA calcula el progreso usando `today` como parámetro (lógica pura en `logic.js`), sin leer el reloj dentro de las funciones puras.
- RF-8: SI hay objetivo fijado y los minutos acumulados >= objetivo, EL SISTEMA lo indica visualmente (por ejemplo, color distinto o texto "¡Objetivo cumplido!"). Debe seguir el estilo "hoja de cuaderno" sin añadir gradientes llamativos.

## Requisitos no funcionales
- RNF-1: Sin dependencias ni build. Sigue funcionando abriendo `index.html` con doble clic (constitución, principio 1).
- RNF-2: Cálculo puro en `logic.js`, sin DOM ni `localStorage`, con `today` inyectado (constitución, principio 3).
- RNF-3: Fechas siempre en hora local; nunca `toISOString()` (constitución, principio 5).
- RNF-4: Datos del usuario sagrados: compatible con `localStorage` existente. No se borra ni modifica el formato de `diarioDeEstudio.sesiones`.
- RNF-5: Interfaz en español, código e identificadores en inglés (constitución, principio 6).
- RNF-6: Tests con `node --test` en verde antes de dar por terminado. Añadir tests para la nueva lógica.
- RNF-7: Diseño coherente con el cuaderno (Newsreader/Instrument Sans). Responsive a 360px, sin scroll horizontal de página.

## Casos límite
- Sin objetivo fijado: no se muestra progreso o se oculta el bloque.
- Objetivo 0 o negativo o no numérico: se rechaza y se mantiene el anterior.
- Semana sin sesiones: progreso 0 / objetivo.
- Varias sesiones el mismo día: se suman (igual que en el mapa).
- Sesiones con fecha inválida o minutos <= 0: se ignoran (igual que `dailyMinutes`).
- Cruce de año: la semana lunes-domingo debe calcularse correctamente.
- Cambio de hora (DST): usar componentes locales / `addDays`.
- `localStorage` con valor corrupto para el objetivo: tratar como "sin objetivo".
- Hoy es lunes/domingo: cálculo correcto con semana lunes-domingo.

## Fuera de alcance
- Objetivo diario
- Objetivo mensual
- Historial de objetivos cumplidos
- Notificaciones
- Sincronización
- Editar/borrar sesiones

## Criterios de finalización
- Tests nuevos y existentes en verde con `node --test`.
- Poder fijar objetivo, verlo guardado tras recargar, ver progreso actualizado al guardar una sesión sin recargar.
- Funciona en escritorio y móvil 360px, sin errores en consola.
- No se rompe el mapa, racha, lista ni datos existentes.

## Dudas abiertas
- **Ubicación de la UI**: ¿Dónde fijar el objetivo? Opciones: (a) dentro de la cabecera junto a racha/días del mes, (b) en una pequeña tarjeta nueva entre cabecera y mapa. Prefiero (a) para que se vea siempre, pero necesito confirmar.
- **Formato del input**: ¿Solo minutos (entero)? ¿Permitir decimales? Sugiero entero >=1.
- **Feedback al cumplir**: ¿Texto "¡Objetivo cumplido!" o solo cambio de color? Sugiero cambio sutil para mantener el estilo.
- **Clave localStorage**: propuesta `diarioDeEstudio.objetivoSemanal` (JSON: `{ minutos: 150 }` o solo número). Sugiero objeto para futura extensibilidad, pero mantener simple.

**Decisión propuesta para avanzar (si no hay objeción):** semana lunes-domingo, objetivo en minutos entero > 0, guardar en `diarioDeEstudio.objetivoSemanal` como `{ minutos: number }`, mostrar en cabecera "X / Y min" y ocultar si no hay objetivo. Lógica pura en `logic.js` con `today`, tests en `tests/goal.test.js`.
