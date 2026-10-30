# ISS Tracker Games — Plan maestro de implementación

**Proyecto:** ISS Tracker Live
**URL principal:** https://isstrackerlive.es/
**Portal de juegos:** https://isstrackerlive.es/juegos
**Primer videojuego:** ISS Runner
**Estado inicial:** Pendiente de implementación

## 1. Objetivo

Ampliar la aplicación existente ISS Tracker Live incorporando un portal de videojuegos espaciales, sin sustituir ni perjudicar las funcionalidades actuales.

El portal debe integrarse visualmente con la web, pero funcionar como una sección independiente.

**Instrucción fundamental para Codex:** antes de modificar código, inspeccionar el repositorio, identificar la estructura real de Nuxt, componentes, layouts, estilos, dependencias, autenticación existente y sistema de despliegue. Reutilizar lo que ya existe.

No reescribir el proyecto ni cambiar versiones de dependencias sin necesidad.

## 2. Navegación y diseño

### Fase 1 — Portal `/juegos`

- Añadir una opción «Juegos» al menú de navegación principal.
- Crear la ruta `/juegos`.
- Utilizar un layout específico para el portal.
- Ocultar el menú principal dentro del portal, sin eliminarlo del resto de la aplicación.
- Mantener identidad visual, colores, fuentes, modo oscuro y estilos generales.
- Mostrar una cabecera propia con título «Juegos espaciales».
- Incluir un botón «Volver a ISS Tracker» que navegue a `/`.
- Preparar un área para iniciar sesión, perfil del jugador y monedas.
- Diseñar una cuadrícula adaptable de juegos, inspirada en las tarjetas de noticias existentes.

Cada tarjeta tendrá:

- Imagen de portada.
- Nombre del juego.
- Descripción breve.
- Categoría.
- Estado: disponible o próximamente.
- Botón o acción para consultar el juego.

### Fase 2 — Información de cada juego

Al seleccionar una tarjeta disponible, abrir un diálogo responsive con:

- Imagen o ilustración del videojuego.
- Título y descripción completa.
- Objetivo del juego.
- Controles para PC.
- Controles para móvil.
- Mecánicas principales.
- Reglas de puntuación.
- Botón «Jugar».
- Botón para cerrar.

Al pulsar «Jugar»:

1. Cerrar el diálogo.
2. Navegar a `/juegos/iss-runner`.
3. Inicializar Phaser exclusivamente en el cliente.
4. Mostrar la pantalla de inicio.
5. Permitir comenzar la partida.

No inicializar el juego durante SSR. Cargar el motor y sus recursos bajo demanda.

### Fase 3 — Autenticación con Supabase

Implementar:

- Registro mediante correo y contraseña.
- Inicio y cierre de sesión.
- Recuperación de contraseña.
- Confirmación de correo cuando corresponda.
- Perfil público con nombre de jugador.
- Gestión de sesión persistente.
- Validación de nombres de usuario.

El usuario invitado podrá jugar sin registrarse.

Para guardar puntuaciones oficiales, monedas, compras y progresión en la nube deberá iniciar sesión.

No utilizar claves `service_role` en el navegador. Aplicar políticas RLS a todas las tablas accesibles desde el cliente.

### Fase 4 — Desarrollo de ISS Runner

**Motor:** Phaser
**Lenguaje:** TypeScript
**Framework anfitrión:** Nuxt/Vue

Juego de plataformas 2D de desplazamiento lateral, inspirado en los clásicos del género, con personajes y gráficos originales.

#### Mecánicas iniciales

- Personaje astronauta.
- Movimiento lateral.
- Salto con físicas.
- Plataformas y colisiones.
- Cámara que sigue al jugador.
- Generación procedural de segmentos.
- Eliminación de segmentos fuera de pantalla.
- Monedas coleccionables.
- Obstáculos y enemigos.
- Barra de oxígeno.
- Puntuación por distancia y monedas.
- Pantalla de derrota y reinicio.
- Pausa y reanudación.

El mundo será potencialmente infinito, sin cargar un mapa completo en memoria.

La generación debe respetar límites de salto, velocidad, distancia entre plataformas y dificultad. Los segmentos deben ser superables.

**Importante:** en la primera versión implementar movimiento lateral libre. El desplazamiento automático puede añadirse como modo adicional.

#### Progresión

La dificultad aumentará progresivamente:

- Mayor velocidad de los obstáculos.
- Plataformas más separadas, dentro de límites alcanzables.
- Mayor frecuencia de enemigos.
- Menor disponibilidad de oxígeno.
- Nuevos biomas y peligros.

Incluir mecanismos que eviten obstáculos imposibles y situaciones sin salida.

### Fase 5 — Sprites y recursos gráficos

Crear un sistema visual de pixel art espacial original, coherente entre personajes, interfaces y escenarios.

No utilizar sprites, personajes, música ni gráficos extraídos de Super Mario Bros u otros videojuegos protegidos.

#### Personaje principal: astronauta

Diseñar una hoja de sprites con animaciones:

| Animación | Fotogramas iniciales |
|---|---:|
| Idle | 4 |
| Correr | 8 |
| Saltar | 2 |
| Caer | 2 |
| Recibir daño | 3 |
| Morir | 6 |
| Celebración | 4 |

Especificaciones:

- Base sugerida: 32 × 32 píxeles por fotograma.
- Fondo transparente.
- Tamaños consistentes.
- Animaciones reutilizables.
- Orientación izquierda/derecha mediante inversión horizontal cuando proceda.
- Exportación a PNG y atlas JSON cuando resulte útil.

#### Enemigos y obstáculos

Crear diseños originales de:

- Meteoritos pequeños y grandes.
- Drones espaciales.
- Robots averiados.
- Satélites peligrosos.
- Campos eléctricos.
- Plataformas móviles.

Cada enemigo debe tener, cuando corresponda, animaciones de movimiento, impacto y destrucción.

#### Escenarios

Preparar fondos por capas para parallax:

1. Órbita terrestre.
2. Campo de asteroides.
3. Superficie lunar.
4. Planeta rojo.
5. Estación espacial futurista.

Cada escenario tendrá paleta y obstáculos diferenciados.

#### Objetos y efectos

- Monedas espaciales.
- Cápsulas de oxígeno.
- Escudos.
- Propulsores.
- Imán de monedas.
- Partículas de salto.
- Explosiones.
- Indicadores de daño.
- Efectos de recogida.

#### Requisitos de producción

Crear un inventario de assets con nombre, dimensiones, formato, estados y ubicación.

Si Codex no dispone de herramientas para generar imágenes gráficas finales, deberá preparar especificaciones visuales y recursos provisionales originales, claramente identificados, sin presentar placeholders como sprites definitivos.

### Fase 6 — Tienda y mejoras

Crear una tienda interna donde se gasten monedas obtenidas jugando.

Mejoras iniciales:

- Doble salto.
- Imán de monedas.
- Escudo inicial.
- Mayor capacidad de oxígeno.
- Multiplicador de monedas.
- Propulsores temporales.

Cada mejora tendrá:

- Identificador único.
- Nombre y descripción.
- Precio.
- Nivel máximo.
- Efecto verificable.
- Estado comprado/no comprado.

Los precios y efectos se definirán en configuración centralizada.

Las compras persistentes deberán procesarse mediante operaciones seguras del backend, nunca modificando directamente el saldo desde el cliente.

### Fase 7 — Base de datos y clasificaciones

Proponer y crear migraciones versionadas de Supabase.

Tablas iniciales:

**profiles**
- id, vinculado a `auth.users`
- username
- avatar
- created_at

**games**
- id
- slug
- title
- status

**game_scores**
- id
- user_id
- game_id
- score
- distance
- created_at
- verification_status

**wallets**
- user_id
- currency_balance
- updated_at

**wallet_transactions**
- id
- user_id
- amount
- reason
- created_at

**upgrades**
- id
- game_id
- key
- price
- max_level

**user_upgrades**
- user_id
- upgrade_id
- level

Crear índices, restricciones, claves foráneas y políticas RLS.

#### Seguridad de puntuaciones

No confiar en puntuaciones enviadas libremente desde JavaScript.

Para récords oficiales, implementar un mecanismo de validación en servidor. Evaluar sesiones de partida con identificadores, semillas, duración, eventos y comprobaciones de plausibilidad.

Documentar que la validación de plausibilidad no elimina por completo las trampas. Para clasificaciones competitivas, prever simulación determinista o verificación más robusta.

Las recompensas de monedas y compras deben ser transacciones atómicas y resistentes a solicitudes duplicadas.

### Fase 8 — Monetización con Monetag

Preparar la integración, pero **no activar anuncios reales todavía**.

Crear un adaptador o servicio aislado para publicidad, independiente del motor del videojuego.

Configuración prevista:

- `enabled`: false inicialmente.
- `provider`: monetag.
- Identificadores de zona mediante variables de entorno públicas cuando sean identificadores no secretos.
- Control de consentimiento y privacidad.
- Control de frecuencia.
- Estados de carga, error y disponibilidad.
- Modo de pruebas sin anuncios reales.

Ubicaciones previstas:

1. Catálogo de videojuegos, fuera de las tarjetas interactivas.
2. Página informativa del juego.
3. Pantalla de resultados al finalizar una partida.
4. Posibles anuncios recompensados, solo si el formato y las condiciones de Monetag lo permiten.

**No mostrar anuncios invasivos durante el control activo del personaje.**

No asumir que cualquier formato de Monetag sirve para anuncios recompensados. Verificar documentación, formatos permitidos y políticas vigentes antes de habilitar cada ubicación.

No conceder recompensas por un anuncio sin una confirmación fiable del proveedor.

Evitar integrar scripts publicitarios globalmente en la web principal.

Preparar gestión de consentimiento para usuarios de España y del Espacio Económico Europeo según las obligaciones aplicables.

### Fase 9 — Rendimiento y compatibilidad

- Juego adaptable a pantallas de móvil.
- Controles táctiles.
- Soporte para teclado.
- Pausa cuando la pestaña pierde visibilidad.
- Audio opcional y silenciado configurable.
- Gestión correcta de redimensionamiento.
- Destruir instancias Phaser al abandonar la página.
- Evitar fugas de memoria.
- Reutilizar objetos mediante pools cuando sea necesario.
- Optimizar texturas y atlas.
- No cargar assets de juegos que no se estén utilizando.
- No bloquear la carga de la web principal.

### Fase 10 — SEO y accesibilidad

- Metadatos propios para `/juegos`.
- Títulos y descripciones individuales.
- Contenido HTML indexable para el catálogo y las explicaciones.
- URLs canónicas.
- Integración en sitemap.
- Tarjetas con textos alternativos.
- Navegación por teclado en menús y diálogos.
- Estados de foco visibles.
- Evitar que el canvas sea la única fuente de instrucciones.

### Fase 11 — Pruebas y despliegue

Comprobar:

- Que la web principal sigue funcionando.
- Que la navegación entre layouts es correcta.
- Que los invitados pueden jugar.
- Que solo los usuarios registrados pueden guardar progresos.
- Que un usuario no puede modificar datos de otro.
- Que no se pueden duplicar recompensas.
- Que el juego funciona en móvil.
- Que los segmentos infinitos no provocan crecimiento indefinido de memoria.
- Que los anuncios permanecen desactivados por defecto.
- Que el proyecto compila y se despliega con la infraestructura existente.

## 3. Forma de trabajo obligatoria para Codex

Trabajar por fases, sin implementar todo de golpe.

En cada fase:

1. Inspeccionar los archivos relacionados.
2. Explicar los cambios propuestos.
3. Implementar exclusivamente el alcance aprobado.
4. Ejecutar las comprobaciones disponibles.
5. Informar de archivos modificados.
6. Documentar decisiones y problemas pendientes.
7. Actualizar el seguimiento del proyecto.
8. Esperar confirmación antes de avanzar a la siguiente fase.

Crear en el repositorio:

- `docs/games/PLAN.md`
- `docs/games/PROGRESS.md`
- `docs/games/ASSETS.md`
- `docs/games/ARCHITECTURE.md`
- `docs/games/MONETIZATION.md`

En `PROGRESS.md`, mantener una checklist por fases con fecha, estado, pruebas realizadas y tareas pendientes.

## 4. Primera orden de ejecución

**Comenzar únicamente con la Fase 1.**

Inspeccionar la aplicación existente y desarrollar el portal `/juegos`, reutilizando el diseño de las noticias.

Crear tarjetas de ejemplo para ISS Runner, Meteor Dodge e ISS Docking. Solo ISS Runner debe aparecer como próximo juego principal; no marcar como jugable ningún videojuego que todavía no esté implementado.

Implementar el diálogo informativo reutilizable y preparar la navegación hacia la futura ruta de juego, sin intentar iniciar Phaser hasta que exista una implementación funcional.

No conectar todavía Supabase, Monetag ni crear el videojuego completo.

Al finalizar, presentar resumen de cambios, comprobaciones y siguientes pasos.
