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
