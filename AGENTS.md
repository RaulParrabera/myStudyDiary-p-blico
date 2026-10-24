## Stack y estructura
- Tecnologías y versiones clave.
- Qué hay en cada carpeta o archivo importante (solo lo que no es obvio).
## Comandos
- Cómo ejecutar, probar, hacer lint y compilar (comandos exactos, copiables).
- Tests: `node --test`
## Convenciones
- Estilo de código, nombres, idioma de comentarios y textos.
- Patrones que hay que seguir (y cuál es el archivo de referencia).
## Reglas de dominio / trampas conocidas
- Lo que es fácil hacer mal y el agente no puede deducir leyendo el código.
- Lee `docs/constitution.md` y la spec activa (`specs/NNN-*/`) antes de tocar código.
## Forma de trabajar
- Cuándo planificar antes de tocar código, tamaño de los cambios, qué explicar al
terminar.
## Límites
- ✅ Siempre: lo que debe hacer sin preguntar.
- ⚠️ Pregunta antes: dependencias nuevas, archivos nuevos, cambios en el formato de
datos…
- 🚫 Nunca: lo que no debe tocar bajo ningún concepto.
## Verificación
- Tests: `node --test` (carpeta `tests/`). Cubren la lógica pura de `logic.js` y deben
pasar en verde antes de dar un cambio por terminado.
- Lo que los tests no cubren se verifica en el navegador con el MCP de Chrome DevTools:
abre `index.html`, prueba la funcionalidad, revisa la consola y comprueba la vista móvil
a 360px.