# Seguimiento — ISS Tracker Games

Actualizado: 2026-10-30. El usuario autorizó continuar todas las fases y subir todos los cambios a la rama debelop.

| Fase | Estado | Evidencia y límites |
|---|---|---|
| 1 · Portal | Implementada y probada | Layout, menú, tres tarjetas, diálogo, retorno y móvil |
| 2 · Información e inicio | Implementada y probada | Instrucciones HTML, diálogo, ruta real, inicio y carga Phaser solo en cliente |
| 3 · Autenticación | Implementada; correo de producción pendiente | Acceso real, sesión tras recarga y cierre probados; registro y recuperación preparados sin enviar correos |
| 4 · ISS Runner | Primera versión funcional | Movimiento libre, salto, colisiones, oxígeno, monedas, peligros, segmentos, pausa, reinicio y dificultad |
| 5 · Recursos | Primera versión original | 29 frames astronauta, 24 de peligros, objetos, 15 capas y sonidos sintetizados; posible refinamiento artístico futuro |
| 6 · Tienda | Implementada y probada | Seis mejoras; saldo y niveles del servidor; compras atómicas e idempotentes |
| 7 · Base de datos | Aplicada y probada | Migración, RLS, índices, sesiones, reproducción de controles y clasificación |
| 8 · Monetización | Preparación implementada | Adaptador desactivado, consentimiento editable, frecuencia y pruebas sin anuncios reales |
| 9 · Compatibilidad | Implementada y probada | Teclado, táctil, pausa, audio opcional, resize FIT, destrucción y memoria acotada |
| 10 · SEO y accesibilidad | Implementada y probada en el alcance | HTML, metadatos, canonical, sitemap, alt, foco modal y retorno por Escape |
| 11 · Pruebas y despliegue | Pruebas locales completadas; publicación pendiente | GitHub debelop solicitado; Hostinger requiere conexión y configuración de entorno |

## Comprobaciones realizadas
- Compilación Nuxt / Nitro de producción completada.
- Seis pruebas automáticas: repetición exacta y rechazo de registros falsos, movimiento libre sin duplicar distancia, alcance de salto en 6400 pares de plataformas, efectos de mejoras, memoria del recorrido durante 36000 pasos, adaptador publicitario sin anuncios ni recompensas.
- Pruebas Playwright en escritorio 1440×1000 y móvil 390×844: diálogo, restauración de foco y Escape, navegación, inicio, pausa, final, reinicio, controles táctiles, ausencia de desbordamiento y eliminación del canvas al salir.
- Verificación de carga diferida: catálogo y ficha antes de comenzar no descargan sprites ni Phaser; sin peticiones publicitarias reales en el portal.
- Prueba real de cuenta en navegador: acceso, recarga con sesión persistente y cierre.
- Integración real Supabase con dos cuentas desechables: aislamiento entre usuarios, rechazo de modificación de cartera/puntuaciones/mejoras, nombres inválidos, funciones bloqueadas para invitados y firma falsa rechazada.
- Cinco compras concurrentes con un mismo identificador: un único débito. Resultado repetido cuatro veces: una única recompensa.
- POST de validación: sin sesión 401, partida ajena 404, registro inválido 422 y partida válida 200 con resultado calculado en servidor.
- Las dos cuentas y sus datos de ensayo fueron eliminados; no se enviaron correos a personas.
- Asesores Supabase: sin alertas de seguridad de nivel WARNING o ERROR. Aviso informativo esperado por RLS sin políticas en la tabla privada de claves (denegación completa); índices recién creados aún sin uso suficiente para estadísticas.
- Chequeo global de tipos: errores previos en mapa, galería y cálculo de pases. Los archivos nuevos de juegos no tienen errores propios tras generar los tipos de Nuxt e instalar las definiciones de Node.
- npm audit detecta 33 avisos en el árbol del framework existente (incluidos Nuxt/Vue y dependencias transitivas). No se aplicaron actualizaciones mayores ni npm audit fix indiscriminado: requiere una revisión de actualización separada.

## Decisiones
- Sin reescritura de la aplicación ni actualización de versiones declaradas previas. Nuevas bibliotecas fijadas: Supabase JS 2.118.0 y Phaser 3.90.0; lock npm actualizado.
- Física determinista compartida con renderizado Phaser; evita aceptar puntuaciones libres del navegador.
- Mundo generado por segmentos con límite de retroceso y misión de diez minutos para acotar CPU y tamaño de registro.
- Mejoras persistentes para la siguiente partida; invitados sin monedas en la nube.
- Monetag permanece desactivado; activar publicidad real requiere revisión de proveedor y consentimiento.
- Secreto de validación guardado solo en .env ignorado y en tabla privada remota; ninguna clave service_role en código.

## Pendientes de producción
- Habilitar acceso a Hostinger y configurar las variables del servidor; confirmar el tipo de aplicación y sus ajustes actuales antes de publicar.
- Permitir callback /juegos/cuenta en Supabase y probar confirmación/recuperación con correo real y SMTP.
- Verificar las rutas públicas tras el despliegue. El código subido a GitHub no equivale a un despliegue realizado.
- Revisar los avisos de dependencias del framework y los errores de tipos previos antes de una campaña pública amplia.

## Archivos
- app/layouts, app/pages/juegos, app/components/games, app/composables/useGameAccount.ts: portal, cuentas, juego y tienda.
- shared/games: reglas, simulación y adaptador de publicidad.
- app/games/runner/createGame.ts: renderizado Phaser y recursos.
- server/api/games/finish.post.ts y server/utils/gameUser.ts: validación autenticada y firma privada.
- supabase/migrations: esquema, políticas, triggers y operaciones transaccionales.
- public/games y scripts/generate-game-assets.py: recursos originales y generador.
- tests/games.test.ts, scripts/test-games*.mjs: pruebas reproducibles.
- docs/games: plan, progreso, arquitectura, recursos, monetización y despliegue.
