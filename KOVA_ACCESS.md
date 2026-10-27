# Acceso exclusivo con KOVA

Esta instalación exige la cuenta KOVA autorizada. No incorpora un login local ni un usuario de demostración. La autorización OIDC usa código y PKCE; las API privadas rechazan accesos anónimos. No desactivar Spring Security, CSRF o la comprobación de permisos para recuperar una sesión.

La instalación personal conserva su base PostgreSQL nativa y sus datos. Sólo la cuenta propietaria configurada y administradora global recibe acceso; iniciar sesión como comprador no da acceso a datos personales. El piloto y las instancias de clientes de TaskTracker continúan aislados.

Notas V2 vincula el sub KOVA al usuario ya existente mediante kova_identity_binding, sin reasignar ni copiar contenido. La interfaz toma esa identidad desde el servidor; localStorage y los parámetros del navegador no seleccionan la cuenta. Nunca habilitar compradores sobre esta base personal.

El procedimiento de despliegue, respaldos, comparación de contenido, requisitos de servicio y comprobación real está en [KOVA_ONLY_ACCESS.md](https://github.com/7yrak/kova/blob/main/docs/KOVA_ONLY_ACCESS.md). Usar el instalador revisado; el instalador antiguo que exige una API anónima con 200 es incompatible. No reiniciar PostgreSQL ni restaurar automáticamente un artefacto con acceso abierto.
