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
