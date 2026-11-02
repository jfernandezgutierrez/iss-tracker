# Recursos de ISS Runner

Todos los gráficos se dibujaron expresamente para el proyecto. El generador reproducible está en `scripts/generate-game-assets.py` (Python + Pillow). No se utiliza material de otros videojuegos.

| Recurso | Archivo en public/games/runner | Dimensiones | Estado |
|---|---|---|---|
| Astronauta | astronaut.png | 928 × 32, 29 frames de 32 × 32 | Pixel art original, primera versión |
| Animaciones | astronaut.animations.json | Índices, velocidad y repetición | Exportado |
| Meteoritos, drones, robots, satélite y electricidad | hazards.png | 128 × 192, seis filas de cuatro frames de 32 × 32 | Original, primera versión |
| Monedas, oxígeno y símbolos de mejoras/efectos | objects.png | 128 × 16, ocho frames de 16 × 16 | Original, primera versión |
| Fondos de cinco biomas, tres capas cada uno | biome-{0..4}-{0..2}.png | 960 × 540 cada capa | Original, primera versión |
| Partículas de salto, recogida, daño y explosión | Gráficos Phaser en createGame.ts | Dibujados durante la partida, máximo 64 partículas | Implementado |
| Plataformas fijas y móviles, escudo | Gráficos Phaser en createGame.ts | Dimensiones variables | Implementado |
| Efectos de sonido | Web Audio en createGame.ts | Síntesis sin archivos externos | Opcional; silenciado inicialmente |

## Animaciones del astronauta
Idle: 4; correr: 8; saltar: 2; caer: 2; daño: 3; morir: 6; celebración: 4. Fondo transparente, izquierda/derecha mediante inversión horizontal. La celebración corresponde a completar una misión de diez minutos.

## Biomas
0: órbita terrestre; 1: asteroides; 2: Luna; 3: planeta rojo; 4: estación futurista. Cada uno usa tres capas con distintas velocidades de parallax; el bioma cambia cada veinte segmentos. Los peligros usan seis variantes y la dificultad crece progresivamente.

## Portadas del catálogo
`public/games/iss-runner.svg`, `meteor-dodge.svg`, `iss-docking.svg`: viewBox 800 × 450. Son ilustraciones conceptuales provisionales, no capturas del juego.

El arte jugable es funcional y original; admite una posterior pasada artística. No se presenta como arte de producción de terceros ni como material generado a partir de referencias protegidas.

## Arte móvil — 2026-11-02

Nuevo arte propio, generado de forma reproducible por el mismo generador, sin reutilizar personajes, logotipos ni recursos de Jetpack Joyride.

| Archivo en public/games/runner | Dimensiones | Uso |
|---|---|---|
| flight-pilot.png | 768×48 | 16 frames de 48×48: 8 de vuelo libre y 8 con propulsor |
| flight-pilot-preview.png | 192×192 | Vista previa del piloto en hangar, ampliación nearest-neighbor |
| flight-hazards.png | 192×144 | Tres tipos de emisor, cuatro frames de 48×48 por tipo |
| hangar.svg | viewBox 960×1000 | Hangar vectorial original, adaptable a vertical y horizontal |
| flight-cover.png | 960×540 | Portada del catálogo, compuesta con los sprites originales |

Los pasillos con ventanas, paneles, rayos, suelo y techo se dibujan con gráficos Phaser reutilizados. Los iconos de navegación, tienda y misiones son trazos SVG propios en GameIcon.vue. Los recursos runner-v1 se mantienen, pero no se cargan al jugar al modo de vuelo.

## Recursos arcade — 2026-11-02

Generador reproducible: scripts/generate-arcade-assets.py (Pillow). Todo el arte es original y se dibuja para este proyecto.

| Archivo en public/games/arcade | Dimensiones | Uso |
|---|---|---|
| meteor-ship.png | 256×64 | Cuatro frames de nave, 64×64 |
| docking-ship.png | 256×64 | Cuatro frames de nave de aproximación, 64×64 |
| meteors.png | 256×64 | Cuatro asteroides originales, 64×64 |
| station.png | 256×256 | Estación y puerto de acoplamiento |
| meteor-cover.png | 960×540 | Portada de Meteor Dodge |
| docking-cover.png | 960×540 | Portada de ISS Docking |

Los cristales, estrellas, retículas, rejillas y escudos se dibujan con gráficos Phaser reutilizados. Meteor mantiene pools de 32 asteroides y 32 cristales; las reglas prueban el límite de objetos simultáneos. Los iconos y tarjetas de destino son SVG/CSS propios. No se carga ningún recurso arcade al visitar la web principal.
