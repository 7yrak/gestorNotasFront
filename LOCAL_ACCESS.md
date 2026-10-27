# Acceso local

La pantalla solicita usuario y contraseña para la única cuenta del Gestor de Notas. No ofrece KOVA ni registro. La cuenta y su hash BCrypt se configuran en el backend, según LOCAL_ACCESS.md de gestorNotasBack.

El cliente usa auth/session, auth/csrf, auth/login y auth/logout relativos a la base del frontend. Las llamadas API también respetan esa base, tanto en / como en /gestor-notas/. El proxy debe dirigir estas rutas al backend.

Las contraseñas no se guardan en localStorage. Las sesiones usan cookie HttpOnly. Un 401 muestra de nuevo el formulario y un 403 de una operación no cierra una sesión válida.

Validar con npm test y npm run build -- --base-href=/gestor-notas/.
