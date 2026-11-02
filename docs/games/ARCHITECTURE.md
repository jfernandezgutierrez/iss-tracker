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

## Evolución móvil — 2026-11-02 (comportamiento actual)
La ruta /juegos/iss-runner usa ahora Orbital Rush. Los apartados anteriores sobre plataformas documentan runner-v1, conservado en el código y en el validador para no romper registros previos. La instrucción posterior del usuario reemplaza la preferencia inicial de desplazamiento libre en la interfaz predeterminada.

La física de vuelo determinista está en shared/games/flight.ts. Usa avance automático, aceleración por propulsor mantenido, límite de velocidad vertical, suelo y techo seguros, emisores de energía con aberturas y dificultad gradual. La escena createFlightGame.ts adapta el ancho lógico al tamaño real del panel con ResizeObserver, manteniendo la misma altura física. La relación de aspecto modifica el encuadre, no la simulación ni los resultados. Los objetos visuales y las partículas siguen limitados por pools; se desconecta el observador al destruir el juego.

RunnerGame.client.vue aloja todos los paneles y controles. No se monta una tienda ni clasificación debajo del canvas. Los paneles son vistas de la pantalla del juego con scroll interno; visitar uno pausa el vuelo. El hangar usa una ilustración vectorial y una vista previa del piloto sin cargar Phaser. Al comenzar se importan motor y escena de vuelo; los sprites no se descargan desde la web principal.

Las misiones son medallas, sin recompensa monetaria añadida. El invitado usa una clave local independiente iss-flight-guest-missions; el progreso de una cuenta nunca se toma de ese almacenamiento. player_missions solo admite SELECT del propietario desde cliente. El trigger privado record_flight_missions se ejecuta en la transacción del resultado verificado, impidiendo progreso doble al reintentar. El modo de cada puntuación se deriva de su sesión protegida y permite filtrar la clasificación sin exponer semillas o loadouts de otros usuarios.

La mejora double-jump conserva su identificador de compra, niveles y precio; en vuelo se presenta como Impulso reforzado y añade empuje vertical. El rescate de emergencia absorbe una derrota por impacto una vez por vuelo. El modo de plataformas previo conserva sus efectos originales. Las mejoras se capturan al comenzar: una compra durante la pausa no altera la partida actual.

## Plataforma de progresión y juegos arcade — 2026-11-02

El catálogo ya no tiene juegos conceptuales pendientes: Meteor Dodge e ISS Docking tienen páginas y una escena Phaser compartida con representación distinta por juego. app/components/games/ArcadeGame.client.vue aloja sus menús, HUD y controles. Phaser sigue cargándose bajo demanda y se destruyen instancia, ResizeObserver y escuchadores al abandonar una ruta.

shared/games/arcade.ts contiene física y reglas deterministas a 60 pasos por segundo, con límite de tres minutos. Meteor registra direcciones discretas derivadas del arrastre y pulsos del escudo; un toque rápido se retiene hasta el siguiente paso de simulación para no perderlo entre fotogramas. Docking registra dirección e impulsor, calcula inercia/frenado y solo concede créditos de acoplamiento si se cumplen los límites de contacto. El servidor usa el modo de la sesión protegida, no un modo enviado libremente por el cliente.

shared/games/progression.ts centraliza mapas, umbrales, descripciones y niveles de los dos juegos nuevos. Los valores de precio y límites se siembran en la migración y se comprueban en pruebas SQL. El servidor de base de datos es la autoridad para compras y desbloqueos de cuenta.

useGameProgress mantiene separados el progreso invitado y el de la cuenta. El almacenamiento local se divide por juego y nunca se importa como saldo de cuenta. Cada partida local tiene identificador de deduplicación; las compras se serializan con navigator.locks cuando el navegador lo admite. Entrar o salir de una cuenta cambia el contexto y vuelve a cargar el saldo autorizado.

start_mapped_game comprueba juego, mapa, mejor resultado verificado y mejoras del juego; crea semilla, rules_version y snapshot de loadout con map_index. No acepta niveles ni precio desde el navegador. purchase_game_equipment bloquea la cartera y valida el producto del juego; los identificadores idempotentes no se pueden reutilizar para otro juego/producto.

game_objectives tiene RLS de propietario y ningún permiso de escritura del cliente. Su trigger solo se ejecuta para puntuaciones reproducidas de los juegos nuevos. La actualización comparte la transacción de puntuación, cartera y registro; un resultado duplicado no vuelve a incrementar objetivos.

Las puntuaciones mantienen la fórmula existente score = distance + coins × 10. En Meteor distance representa el avance de la patrulla (diez unidades por segundo); en Docking, metros de aproximación. La clasificación solo muestra los puntos en estos juegos y filtra tanto game_id como rules_version. Los registros de los distintos juegos no se mezclan.

Mapas: Runner modifica velocidad, anchura del corredor y consumo; Meteor modifica frecuencia y velocidad de meteoritos; Docking modifica distancia, combustible y tolerancias. Los parámetros salen exclusivamente del loadout de sesión para las partidas oficiales. Los mapas del invitado se desbloquean con sus récords locales y son independientes de los de su cuenta.

## Finalización visual de Meteor y Docking
Los atlas v2 están en public/games/arcade/v2, con frames de tamaño real. La escena carga solo el atlas elegido, registra los recortes como frames de textura y usa esos objetos en la partida. Las animaciones visuales son independientes del contador determinista: no afectan a colisiones, puntuación ni repetición en servidor.

ArcadeGame incorpora fase ending antes de over. El motor detiene la física al terminar, mantiene brevemente animación de impacto/acoplamiento y comunica un único resultado. El temporizador de interfaz pasa al informe tras 1,15 s y se limpia al desmontar. Los menús y el reinicio se bloquean durante esa transición. El guardado conserva el identificador de partida y la idempotencia previos.

El sonido es opcional y local, separado de las reglas. El modo silenciado se recuerda; se liberan nodos y AudioContext al salir. Un error de carga de sprites devuelve al inicio con mensaje y posibilidad de reintentar.

La prueba test-arcade-finish.mjs usa el reloj de Playwright para acelerar el tiempo de navegador y entradas reales de teclado/interfaz. Alinea la nave de Docking por la telemetría visible y frena antes del contacto; no fuerza el estado success ni el resultado. En Meteor elige una semilla de ensayo para comprobar la derrota y el reinicio. Verifica que la pantalla de resultados no duplica la recompensa local.
