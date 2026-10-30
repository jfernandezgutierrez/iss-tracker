# Despliegue en Hostinger

Estado: código preparado y compilación local verificada; todavía no desplegado. El usuario identificó Hostinger como alojamiento. La sesión no tiene una conexión Hostinger habilitada ni una configuración local que identifique el sitio Node.js y sus ajustes.

## Requisitos
- Desplegar como aplicación Nuxt / Node.js con servidor Nitro. Una publicación solo estática no ejecuta /api/games/finish y no permite validar resultados oficiales.
- Usar Node.js 22 LTS o una versión compatible con Nuxt y Supabase; instalar con npm ci y compilar con npm run build.
- Inicio: node .output/server/index.mjs. Hostinger debe aportar PORT y enrutar el dominio al proceso.
- Conservar las variables ya existentes del alojamiento al añadir las nuevas.

## Variables
Consultar .env.example. Configurar en el entorno del servidor:
- NUXT_PUBLIC_SUPABASE_URL: URL pública del proyecto.
- NUXT_PUBLIC_SUPABASE_KEY: clave publishable, pública por diseño.
- NUXT_GAME_VERIFICATION_SECRET: valor privado ya preparado en .env local y en games_private.verification_keys. No copiarlo a un archivo público, al repositorio ni a variables NUXT_PUBLIC_. Transferirlo usando el gestor seguro de variables del alojamiento.
- NUXT_PUBLIC_GAME_ADS_TEST_MODE=false y NUXT_PUBLIC_MONETAG_ZONE vacío.

El secreto local está excluido de Git. Si se rota, actualizar tanto el entorno de Hostinger como la fila privada de Supabase. Sin esa coincidencia no se aceptan resultados oficiales.

## Supabase
La migración games_platform se aplicó al proyecto isstraker. No volver a ejecutar el mismo DDL sobre tablas existentes. La copia del repositorio conserva el SQL versionado para auditoría y otros entornos.

En Auth → URL Configuration, configurar Site URL como https://isstrackerlive.es y permitir el destino exacto https://isstrackerlive.es/juegos/cuenta. Para desarrollo, añadir el origen local que se utilice, con esa misma ruta. Confirmar configuración de correo, SMTP y confirmación de registro; comprobar registro y recuperación con un buzón controlado antes de anunciar cuentas al público. No se cambió la configuración de correo existente.

## Verificación posterior al despliegue
1. / conserva el mapa y la navegación; /juegos usa el layout propio.
2. El catálogo abre el diálogo; Jugar abre ISS Runner sin recargar el motor en la web principal.
3. Invitado: iniciar, saltar, pausar, cambiar de pestaña, reiniciar y salir sin canvas residual.
4. Cuenta: registro, confirmación, acceso, persistencia, recuperación y cierre de sesión.
5. Partida autenticada: resultado validado y acreditado una sola vez; compra aplicada a la siguiente misión.
6. Clasificación pública sin correos; cuentas ajenas sin acceso a carteras o sesiones.
7. Sin solicitudes a Monetag y sin anuncios reales en el portal.

La subida a GitHub en debelop permite revisar el trabajo antes de conectar esa rama al despliegue. No se cambió la configuración de producción ni se sobrescribió el sitio existente.
