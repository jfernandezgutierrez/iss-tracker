# Publicidad del portal

`shared/games/ads.ts` define un adaptador aislado del motor. `enabled=false`, proveedor previsto `monetag`, anuncios recompensados desactivados. No se descarga ningún script de Monetag.

Ubicaciones preparadas: catálogo, información y resultados. El motor no solicita anuncios. Durante una partida activa, el adaptador rechaza solicitudes; tampoco concede recompensas. El modo de prueba (`NUXT_PUBLIC_GAME_ADS_TEST_MODE=true`) muestra solo una caja local sin red.

Estados: desactivado, necesita consentimiento, cargando (reservado para el proveedor futuro), prueba, no disponible, limitado por frecuencia y error. Frecuencia mínima prevista: dos minutos por instancia. Antes de activar un proveedor, la frecuencia deberá persistirse por sesión/dispositivo según los formatos elegidos.

`GamePrivacy.vue` permite rechazar o permitir publicidad opcional y cambiar la preferencia. Se parte de rechazo y no se impide jugar. Esta preparación no sustituye la revisión de consentimiento y privacidad necesaria para un proveedor real en España y el EEE.

El identificador de zona no secreto tiene una variable pública preparada (`NUXT_PUBLIC_MONETAG_ZONE`), sin uso hasta integrar el proveedor. Deben verificarse documentación, formatos, políticas, consentimiento y confirmación de recompensas antes de añadir un SDK o habilitar monetización.

El script global de AdSense que ya tenía el proyecto se movió al layout principal. Ya no se incluye al cargar directamente el portal. Si un usuario visitó primero la web principal, los scripts que ya ejecutó el navegador no se pueden deshacer al navegar; la futura auditoría de publicidad de la web principal debe contemplarlo.
