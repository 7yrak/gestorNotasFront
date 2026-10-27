# gestorNotasFront

## Jenkins

Este repositorio incluye un `Jenkinsfile` con `triggers { githubPush() }` para que el job se ejecute cuando GitHub notifique un commit.

Configuracion necesaria:

1. En Jenkins, crear o editar el job como Pipeline desde SCM usando este repositorio.
2. Verificar que el agente Jenkins tenga disponibles `node` y `npm`.
3. En el job, activar el uso del `Jenkinsfile` desde la rama `main`.
4. En GitHub, agregar un webhook apuntando a `https://TU_JENKINS/github-webhook/`.
5. En el webhook, seleccionar `Just the push event`.

Con eso, cada push a GitHub gatilla el pipeline del frontend.


## Validación local

- `npm test`: regresiones del autoguardado por página y campo, orden de escritura y reintento tras errores. Usa Node.js 22 y las dependencias existentes.
- `npm run build`: compilación de Angular y comprobación de tipos y plantillas.

El cambio de página envía los guardados pendientes sin cancelar los que están en curso. Los borradores de contenido se conservan en memoria durante la sesión para recuperarlos al volver a una nota; no sobreviven a recargar o cerrar el navegador.
