# Spec 001 — Mapa de constancia

## Contexto y objetivo
El diario ya muestra la racha y los días estudiados del mes, pero no deja ver el
patrón de constancia a lo largo del tiempo: los huecos, las semanas fuertes y las
recaídas. Un mapa de calor de días (columnas = semanas, filas = días de la semana)
hace visible ese patrón de un vistazo y da motivos para no romper la cadena.

## Usuarios / actores
La propia persona que estudia y registra sesiones. Uso personal, sin cuentas ni
servidor, abriendo `index.html` con doble clic, tanto en escritorio como en móvil.

## Historias de usuario
- H1: Como estudiante quiero ver un mapa con mis últimos meses de estudio para
  detectar mis huecos y mantener la constancia.

## Requisitos funcionales (criterios de aceptación en EARS)
- RF-1: CUANDO la persona abre o recarga la aplicación, EL SISTEMA muestra el mapa de
  constancia de los últimos 12 meses: desde el lunes de la semana de hace 12 meses
  hasta el domingo de la semana que contiene hoy, en columnas semanales de lunes a
  domingo.
- RF-2: EL SISTEMA representa cada día del rango con una celda, agrupada por semanas
  (columnas) y días de la semana (filas, el lunes arriba).
- RF-3: CUANDO un día del rango tiene al menos una sesión, EL SISTEMA pinta su celda
  con uno de cuatro niveles de intensidad calculados en quintiles relativos al día más
  intenso del periodo: nivel = techo(4 × minutos del día / máximo de minutos del
  periodo), nunca menor que 1 ni mayor que 4. El día más intenso queda siempre en
  nivel 4 y cualquier día con sesiones queda al menos en nivel 1.
- RF-4: EL SISTEMA pinta los días del rango sin sesiones con el nivel "sin actividad".
- RF-5: MIENTRAS un día del rango sea posterior a hoy, EL SISTEMA muestra su celda como
  fuera de calendario: sin color de actividad y sin interacción.
- RF-6: EL SISTEMA muestra una leyenda de los cuatro niveles, de menos a más.
- RF-7: EL SISTEMA etiqueta sobre el mapa el mes de la primera semana visible de cada
  mes.
- RF-8: CUANDO la persona pasa el puntero sobre una celda o la enfoca con el teclado,
  EL SISTEMA muestra la fecha del día y sus minutos totales, o "sin sesiones" si no
  tiene ninguna.
- RF-9: CUANDO la persona guarda una sesión, EL SISTEMA actualiza el mapa junto con la
  racha y los días del mes, sin recargar la página.
- RF-10: SI una sesión almacenada tiene una fecha inválida o no interpretable, ENTONCES
  EL SISTEMA la ignora al construir el mapa, sin modificar ni eliminar ninguna sesión
  guardada.

## Requisitos no funcionales
- RNF-1: Sin dependencias ni build. Debe seguir funcionando abriendo `index.html` con
  doble clic (constitución, principio 1).
- RNF-2: El cálculo del mapa es lógica pura, sin DOM ni localStorage, y recibe `today`
  como parámetro (constitución, principio 3).
- RNF-3: Fechas siempre en hora local; nunca `toISOString()` (constitución, principio 5).
- RNF-4: La página no hace scroll horizontal a 360px de ancho, ni en la columna de
  560px del escritorio. El mapa tiene su propia área con desplazamiento horizontal, que
  al abrirse queda situada en las semanas más recientes.
- RNF-5: Las celdas son enfocables con el teclado y el texto emergente no depende solo
  del color (constitución de accesibilidad implícita en la interfaz existente).
- RNF-6: Sin movimiento no solicitado por la persona; se respeta
  `prefers-reduced-motion`.
- RNF-7: Interfaz y textos en español; código e identificadores en inglés
  (constitución, principio 6).

## Casos límite
- Sin ninguna sesión guardada: el mapa se muestra vacío (correcto, no es un error).
- Ningún día con sesiones en el periodo: el máximo es 0 y todas las celdas quedan en
  nivel 0 sin dividir entre cero.
- Empate en el día más intenso: varios días comparten el nivel 4, que es lo esperado.
- Varias sesiones el mismo día: se suman sus minutos en una sola celda.
- Rango de 53 o 54 semanas según dónde caiga el lunes de hace 12 meses.
- Sesiones con fecha futura: no se pintan (celdas fuera de calendario), pero no se
  borran ni se alteran.
- Sesiones con minutos 0 o negativos: se ignoran al sumar, igual que en el formulario.
- El rango cruza el cambio de año y el 29 de febrero: las semanas deben alinearse por
  lunes, no por número de año.
- Cambio de hora (DST): al restar días se usan componentes de fecha locales, nunca
  sumas de milisegundos, para no saltarse un día en la madrugada.
- localStorage corrupto o con JSON que no es un array: ya se trata en `cargarSesiones`
  devolviendo lista vacía; el mapa debe tolerarlo.
- La app abierta en dos pestañas: la última escritura gana y no hay sincronización
  (fuera de alcance).

## Fuera de alcance
- Backend, cuentas, sincronización entre dispositivos.
- Rango de tiempo configurable o zoom del mapa.
- Desglose por tema o color por materia.
- Editar o borrar sesiones existentes.
- Exportar datos y comparativas entre meses.
- Modo oscuro.

## Criterios de finalización
- Todos los RF con test en verde con `node --test`, incluidos los casos límite.
- Demo manual: registrar una sesión de hoy y otra de un día pasado y ver el mapa, la
  leyenda y el texto emergente actualizarse sin recargar.
- Revisión de la vista móvil (360px) y de escritorio; consola sin errores.
- Recargar no pierde ninguna sesión previa (localStorage intacto).

## Dudas abiertas
Ninguna. Resueltas por la persona usuaria el 18 de octubre de 2026:
- Rango: 12 meses con desplazamiento horizontal dentro del propio mapa (reflejado en
  RF-1 y RNF-4).
- Intensidad: quintiles relativos al día más intenso del periodo (RF-3).
- Ubicación: debajo de la cabecera y antes del formulario.
