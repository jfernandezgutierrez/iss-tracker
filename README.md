# Nuxt Minimal Starter

Look at the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## Setup

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.

## Portal de juegos

`/juegos` incluye ISS Runner, cuentas Supabase, mejoras y clasificaciones verificadas. Meteor Dodge e ISS Docking siguen como próximos juegos. La publicidad del portal permanece desactivada.

- Configuración y despliegue: [docs/games/DEPLOYMENT.md](docs/games/DEPLOYMENT.md).
- Arquitectura y seguridad: [docs/games/ARCHITECTURE.md](docs/games/ARCHITECTURE.md).
- Estado y pruebas: [docs/games/PROGRESS.md](docs/games/PROGRESS.md).

Copiar `.env.example` a `.env` y configurar las variables. La clave de validación es privada y debe coincidir con la tabla privada de Supabase; nunca se debe incluir en Git.

```bash
npm ci
npm run dev
npm run test:games
npm run build
```

Pruebas de navegador: instalar Chromium con `npx playwright install chromium`, iniciar la aplicación y ejecutar `GAMES_TEST_URL=http://localhost:3000 npm run test:games:browser` (usar la sintaxis equivalente de variables de entorno en Windows). Las pruebas de integración requieren dos cuentas de ensayo y un saldo controlado, definidos en un archivo ignorado indicado por `GAMES_TEST_ACCOUNTS`. No ejecutarlas con cuentas reales.

### Versión móvil: Orbital Rush

ISS Runner se juega con un solo control: mantener pulsado para subir y soltar para descender. El hangar incluye tienda, misiones, récords y perfil. El servidor conserva compatibilidad con registros de plataformas anteriores y valida el nuevo modo runner-flight-v2.

Migración adicional: `supabase/migrations/20261102072406_runner_mobile_missions.sql`. El cliente, el servidor y la base de datos deben usar la versión correspondiente. Las misiones de cuenta solo avanzan tras validar el vuelo; las medallas de invitado se guardan en el dispositivo y no conceden monedas en la nube.

Las pruebas de integración admiten `GAMES_TEST_MODE=flight` para comprobar la nueva sesión, repetición de controles, clasificación y progreso de misiones. `tests/flight-security.sql` verifica las políticas y los triggers con fixtures dentro de una transacción que se revierte.

### Catálogo y progresión ampliados

Meteor Dodge e ISS Docking ya son jugables. Los tres juegos ofrecen mapas y equipo por niveles; las cuentas usan compras atómicas y resultados reproducidos en servidor. Los invitados tienen saldo y progresión propios del dispositivo, separados de la cuenta.

- Migración: `supabase/migrations/20261102121130_arcade_worlds_progression.sql`.
- Reglas: `shared/games/arcade.ts` y `shared/games/progression.ts`.
- Arte reproducible: `scripts/generate-arcade-assets.py`.
- Navegador: `GAMES_TEST_URL=http://localhost:3000 node scripts/test-arcade-browser.mjs`.
- Seguridad de mapas, equipo y misiones: `tests/arcade-security.sql`, transacción con rollback.

### Sprites y pruebas de partida completa

Los atlas finales de Meteor Dodge e ISS Docking están en `public/games/arcade/v2/`; su procedencia y prompts se documentan en `docs/games/SPRITE_PROMPTS.md`. Se incluyen animaciones visuales, sonido opcional y secuencia final antes del informe.

Para comprobar el cierre y reinicio de ambos juegos: `GAMES_TEST_URL=http://localhost:3000 node scripts/test-arcade-finish.mjs`. Esta prueba acelera el reloj de navegador y usa los controles del juego, sin escribir resultados ni crear cuentas.
