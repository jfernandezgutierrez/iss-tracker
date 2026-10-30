# Arquitectura de ISS Tracker Games

Actualizado: 2026-10-30.

## Integración con la aplicación
Nuxt 4 / Vue 3. La aplicación usa NuxtLayout: default conserva la navegación principal; games mantiene un portal independiente. Se reutilizan tokens, botones y tarjetas existentes; el repositorio no tiene la sección de noticias descrita en el plan.

El catálogo tipado vive en app/data/games.ts. ISS Runner está disponible; Meteor Dodge e ISS Docking siguen como conceptos. GameDetails comparte contenido HTML entre el diálogo accesible y la página del juego. El diálogo usa showModal, Escape, retorno del foco y bloqueo de scroll.

## Autenticación
useGameAccount crea un único cliente Supabase exclusivamente en el navegador y solo al entrar en el portal. Se usa la clave publishable pública, nunca service_role. Sesión persistente con renovación automática y flujo PKCE. PlayerAccount permite registro, acceso, cierre de sesión, cambio de nombre y recuperación de contraseña. Supabase gestiona confirmación de correo y límites de envío. Los nombres públicos aceptan 3–20 caracteres a-z, números y guiones bajos, con validación y unicidad en la base de datos.

El correo y las credenciales permanecen en Supabase Auth. profiles expone únicamente id, nombre público, avatar simbólico y fecha de alta. No se usa user_metadata para autorizar operaciones: solo como sugerencia inicial de nombre, validada por el trigger.

## Juego y recursos
RunnerGame.client.vue presenta inicio, HUD, pausa, controles táctiles, resultados y reintento de guardado. Phaser 3.90 se importa dinámicamente al pulsar Comenzar; la web principal y el catálogo no cargan el motor ni los sprites. Se destruyen juego, audio y escuchadores al salir. El foco fuera del juego, una pestaña oculta o una ventana sin foco pausan la partida.

Phaser renderiza sprites y parallax. La física es una simulación TypeScript compartida a 60 pasos por segundo en shared/games/runner.ts, en lugar de depender de tiempos variables del renderizador. Así el servidor puede reproducir exactamente el mismo recorrido. Los movimientos son libres; retroceder no suma otra vez distancia.

Cada segmento se calcula a partir de semilla, índice y dificultad. Los huecos y alturas respetan el salto base. Se conservan como máximo ocho segmentos y se liberan identificadores de recogidas anteriores al límite de retroceso. Pools: 48 objetos y 10 peligros visuales; partículas limitadas a 64. No se permite retroceder más de 1000 píxeles desde el punto más lejano. Cinco biomas con tres capas de parallax; peligros y consumo de oxígeno aumentan con la distancia.

El recorrido es procedural; cada misión tiene un límite de diez minutos para acotar la repetición en servidor. Al terminar se puede reiniciar con una nueva semilla. No existe un mapa completo cargado en memoria.

## Validación y economía
La migración supabase/migrations/20261030083440_games_platform.sql crea las ocho tablas previstas y game_sessions. Todas las tablas públicas tienen RLS. Cada jugador solo puede leer su cartera, compras y sesiones; no puede escribir saldos, puntuaciones, transacciones ni niveles directamente. Solo puede editar su nombre de perfil. Las clasificaciones leen resultados con estado replayed.

start_game_run genera una semilla en la base de datos y captura las mejoras del jugador. El cliente registra cambios de controles con su número de paso. POST /api/games/finish valida el usuario con auth.getUser, lee su sesión bajo RLS y repite la simulación compartida. Rechaza controles inválidos, exceso de pasos, partidas no terminadas y eventos posteriores al final. No toma puntuaciones o monedas calculadas libremente por el navegador.

El servidor firma el resultado con HMAC SHA-256. Una clave privada, configurada como NUXT_GAME_VERIFICATION_SECRET, coincide con la almacenada en games_private.verification_keys; no aparece en migraciones, repositorio ni cliente. La base de datos verifica firma, propietario y tiempo real antes de registrar el resultado y acreditar monedas. Falta de clave: el guardado oficial falla de forma explícita; el juego invitado sigue disponible.

Las funciones privilegiadas viven en games_private, con search_path vacío, auth.uid obligatorio y EXECUTE restringido. Las funciones públicas son wrappers SECURITY INVOKER. Compras y recompensas bloquean la cartera, se aplican en una transacción y tienen identificadores únicos. Repetir o enviar concurrentemente la misma compra o partida no duplica el débito o recompensa. Las mejoras se aplican a la próxima partida, nunca a una sesión ya empezada.

La reproducción valida reglas y movimientos, pero no demuestra que una persona jugó: scripts o bots pueden construir entradas válidas. No es un sistema competitivo libre de trampas. Antes de competir por premios se necesitan controles adicionales, supervisión, sesiones más robustas y una política de abuso.

## Publicidad y privacidad
Adaptador independiente, desactivado por defecto; no hay scripts Monetag ni recompensas por anuncios. Hay ubicaciones de catálogo, información y resultados y un modo de prueba local. La publicidad AdSense existente se restringe al layout principal. El service worker no cachea callbacks de cuenta ni peticiones de Supabase.

## Comprobaciones y límites
Pruebas unitarias, navegador escritorio/móvil y pruebas de integración reales en Supabase. Las dos cuentas de ensayo se eliminaron junto con sus datos. La compilación pasa. El chequeo global de tipos encuentra problemas previos de mapa, galería y predicción de pases; el código nuevo de juegos no produce errores propios en el chequeo.

Registro y recuperación tienen UI e integración implementadas. La entrega efectiva de correos y los enlaces en producción requieren configurar SMTP, Site URL y destinos permitidos en Supabase y comprobarlos con un buzón real. No se han enviado correos de prueba a personas.
