// ====== Diario de Estudio: interfaz ======
// Aquí solo se toca el DOM y localStorage. Todo el cálculo vive en logic.js,
// en funciones puras que reciben la fecha de hoy como parámetro.

// Clave con la que guardamos las sesiones en el navegador.
var CLAVE = "diarioDeEstudio.sesiones";


// ============================================================
// Guardar y leer las sesiones (localStorage)
// ============================================================

function cargarSesiones() {
  var texto = localStorage.getItem(CLAVE);
  if (!texto) {
    return []; // Todavía no hay nada guardado.
  }
  try {
    var datos = JSON.parse(texto);
    return Array.isArray(datos) ? datos : [];
  } catch (error) {
    return []; // Si algo se ha corrompido, empezamos de cero.
  }
}

function guardarSesiones(sesiones) {
  localStorage.setItem(CLAVE, JSON.stringify(sesiones));
}


// ============================================================
// Referencias a los elementos del HTML
// ============================================================

var formulario = document.getElementById("formulario");
var campoFecha = document.getElementById("fecha");
var campoTema = document.getElementById("tema");
var campoMinutos = document.getElementById("minutos");
var listaSesiones = document.getElementById("lista-sesiones");
var mensajeVacio = document.getElementById("mensaje-vacio");
var rachaNumero = document.getElementById("racha-numero");
var rachaEtiqueta = document.getElementById("racha-etiqueta");
var diasMesNumero = document.getElementById("dias-mes-numero");
var fechaHoy = document.getElementById("fecha-hoy");
var mapaScroll = document.getElementById("mapa-scroll");
var mapaRejilla = document.getElementById("mapa-rejilla");

var sesiones = cargarSesiones();


// ============================================================
// Pintar la interfaz
// ============================================================

// Muestra la racha en la cabecera.
function pintarRacha(today) {
  var racha = StudyLogic.calculateStreak(sesiones, today);
  rachaNumero.textContent = racha;
  rachaEtiqueta.textContent = (racha === 1 ? "día seguido" : "días seguidos") + " 🔥";
}

// Muestra cuántos días se ha estudiado este mes, en la cabecera.
function pintarDiasMes(today) {
  diasMesNumero.textContent = StudyLogic.daysThisMonth(sesiones, today);
}

// Crea la celda de un día del mapa.
function crearCelda(dia) {
  // Los días que aún no han llegado no son parte del calendario.
  if (dia.isFuture) {
    var fuera = document.createElement("div");
    fuera.className = "mapa-celda fuera-calendario";
    fuera.setAttribute("aria-hidden", "true");
    return fuera;
  }

  var minutos = dia.minutes > 0 ? dia.minutes + " min" : "sin sesiones";

  var celda = document.createElement("button");
  celda.type = "button";
  celda.className = "mapa-celda nivel-" + dia.level;
  celda.dataset.date = dia.date;
  celda.setAttribute("aria-label", StudyLogic.formatDate(dia.date) + ", " + minutos);

  // Los días sin sesiones no entran en el recorrido del tabulador: solo
  // estorbarían (hasta 365 paradas), y su detalle no aporta nada.
  if (dia.minutes === 0) {
    celda.tabIndex = -1;
  }

  // Texto emergente: aparece al pasar el ratón y al enfocar con el teclado.
  var tooltip = document.createElement("span");
  tooltip.className = "mapa-tooltip";
  tooltip.setAttribute("aria-hidden", "true"); // El aria-label ya lo dice todo.

  var tooltipFecha = document.createElement("span");
  tooltipFecha.textContent = StudyLogic.formatDate(dia.date);
  var tooltipMinutos = document.createElement("span");
  tooltipMinutos.textContent = minutos;
  tooltip.appendChild(tooltipFecha);
  tooltip.appendChild(tooltipMinutos);

  celda.appendChild(tooltip);
  return celda;
}

// Muestra el mapa de constancia de los últimos 12 meses.
function pintarMapa(today) {
  var mapa = StudyLogic.buildHeatmap(sesiones, today);

  // Etiquetas de mes por índice de semana, para colocarlas sin buscar.
  var etiquetas = {};
  for (var e = 0; e < mapa.monthLabels.length; e++) {
    etiquetas[mapa.monthLabels[e].weekIndex] = mapa.monthLabels[e].label;
  }

  mapaRejilla.innerHTML = "";

  // Una columna por semana: etiqueta de mes y siete días, en orden.
  for (var w = 0; w < mapa.weeks.length; w++) {
    var etiqueta = document.createElement("span");
    etiqueta.className = "mapa-mes";
    etiqueta.textContent = etiquetas[w] || "";
    mapaRejilla.appendChild(etiqueta);

    var semana = mapa.weeks[w];
    for (var d = 0; d < semana.days.length; d++) {
      mapaRejilla.appendChild(crearCelda(semana.days[d]));
    }
  }

  // Al abrir, dejamos a la vista las semanas más recientes.
  ajustarMapaAlFinal();
}

// Coloca el mapa en las semanas más recientes.
function ajustarMapaAlFinal() {
  mapaScroll.scrollLeft = mapaScroll.scrollWidth;
}

// Muestra la lista de sesiones, de la más reciente a la más antigua.
function pintarLista() {
  // Ordenamos por fecha descendente. Como las fechas son "YYYY-MM-DD",
  // compararlas como texto ya las deja en el orden correcto.
  var ordenadas = sesiones.slice().sort(function (a, b) {
    return b.fecha.localeCompare(a.fecha);
  });

  listaSesiones.innerHTML = "";

  // Si no hay sesiones, mostramos el mensaje y salimos.
  if (ordenadas.length === 0) {
    listaSesiones.classList.add("oculto");
    mensajeVacio.classList.remove("oculto");
    return;
  }

  listaSesiones.classList.remove("oculto");
  mensajeVacio.classList.add("oculto");

  for (var i = 0; i < ordenadas.length; i++) {
    var sesion = ordenadas[i];

    var li = document.createElement("li");
    li.className = "sesion";

    // Bloque izquierdo: tema y fecha.
    var izquierda = document.createElement("div");
    var tema = document.createElement("div");
    tema.className = "sesion-tema";
    tema.textContent = sesion.tema;
    var fecha = document.createElement("div");
    fecha.className = "sesion-fecha";
    fecha.textContent = StudyLogic.formatDate(sesion.fecha);
    izquierda.appendChild(tema);
    izquierda.appendChild(fecha);

    // Líder punteado entre el tema y los minutos.
    var conector = document.createElement("span");
    conector.className = "sesion-conector";

    // Bloque derecho: minutos.
    var minutos = document.createElement("div");
    minutos.className = "sesion-minutos";
    minutos.textContent = sesion.minutos + " min";

    li.appendChild(izquierda);
    li.appendChild(conector);
    li.appendChild(minutos);
    listaSesiones.appendChild(li);
  }
}

// Vuelve a pintar todo. Se lee el reloj una sola vez por render.
function pintarTodo() {
  var today = StudyLogic.toISO(new Date());

  pintarRacha(today);
  pintarDiasMes(today);
  pintarMapa(today);
  pintarLista();
}


// ============================================================
// Registrar una sesión nueva
// ============================================================

formulario.addEventListener("submit", function (evento) {
  evento.preventDefault(); // Evita que la página se recargue.

  var fecha = campoFecha.value;              // "YYYY-MM-DD"
  var tema = campoTema.value.trim();         // Quitamos espacios sobrantes
  var minutos = Number(campoMinutos.value);

  // Comprobaciones básicas (además de las del propio HTML).
  if (!StudyLogic.isValidISODate(fecha) || tema === "" || minutos <= 0) {
    return;
  }

  var nuevaSesion = {
    fecha: fecha,
    tema: tema,
    minutos: minutos
  };

  sesiones.push(nuevaSesion);
  guardarSesiones(sesiones);
  pintarTodo();

  // Dejamos el formulario listo para la siguiente sesión.
  // La fecha se mantiene, porque es habitual apuntar varios temas del mismo día.
  campoTema.value = "";
  campoMinutos.value = "";
  campoTema.focus();
});


// ============================================================
// Arranque
// ============================================================

// La fecha del formulario empieza en hoy (pero se puede cambiar).
campoFecha.value = StudyLogic.toISO(new Date());

// La fecha de hoy, en la cabecera de la bitácora.
fechaHoy.textContent = StudyLogic.formatDate(StudyLogic.toISO(new Date()));

pintarTodo();

// Las fuentes se cargan después y pueden mover la maquetación: volvemos a
// colocar el mapa en las semanas recientes cuando estén listas.
if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(ajustarMapaAlFinal);
}
