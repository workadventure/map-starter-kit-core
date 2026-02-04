# @workadventure/map-starter-kit-core

Core app, HTML pages and static assets for the **WorkAdventure Map Starter Kit**. Update this package to get new UI and server features without touching your maps or config.

## Features

- **Web UI** – Step-by-step wizard (Git, hosting, steps, validation) for setting up and validating your map project
- **Map listing** – Discovers `.tmj` maps on disk with properties (name, description, image, copyright, size, last modified)
- **Uploader** – Configure and run map uploads to [map-storage](https://github.com/workadventure/map-storage); list maps from map-storage for self-hosted flows
- **Static assets** – Serves public assets, tilesets, and compiled JS; transforms and serves TypeScript under `/src` (esbuild) for browser scripts
- **Express app** – CORS, JSON body parsing, cache headers; can be mounted in another app or run standalone via Vite

## Installation

```bash
npm install @workadventure/map-starter-kit-core
```

**Peer / consumer:** The built server expects `express` to be available at runtime. For TypeScript consumers, `@types/express` is used for the exported `Application` type.

## Usage

### As a dependency (programmatic)

Use the built Express app in your own server:

```ts
import core from "@workadventure/map-starter-kit-core/dist/server.js";

const app = core.default;  // or core.viteNodeApp

// Mount or start your server
app.listen(3000, () => console.log("Listening on 3000"));
```

Types are provided: `core` is typed as `{ default: Application; viteNodeApp: Application }` (see `types/server.d.ts`).

### Development server (standalone)

From the **map-starter-kit** repo (or a project that uses this package as the core):

```bash
npm run dev
```

Runs the Vite dev server with vite-plugin-node (Express). Opens the app at the configured host (e.g. `http://localhost:5173/`).

### Build for production

```bash
npm run build
```

- Runs `tsc` (type-check only; `noEmit: true` in tsconfig)
- Builds the server bundle with Vite into `dist/server.js`
- Copies `types/server.d.ts` to `dist/server.d.ts` for published types

## Project structure

```
map-starter-kit-core/
├── src/
│   ├── server.ts              # Express app entry (CORS, static, routes)
│   ├── getCoreRoot.ts         # Resolve core package root (cwd vs package dir)
│   ├── controllers/
│   │   ├── FrontController.ts # HTML pages (Mustache): /, step1-git, step2-hosting, step3-*, step4-*
│   │   ├── MapController.ts   # /maps/list – list .tmj maps with properties
│   │   └── UploaderController.ts  # /uploader/* – configure, status, maps-storage-list, upload
│   └── views/                 # Mustache HTML templates
│       ├── index.html
│       ├── step1-git.html … step4-validated-selfhosted.html
├── public/                    # Static assets (images, styles, etc.)
├── types/
│   └── server.d.ts            # Module declaration for dist/server.js (copied to dist on build)
├── dist/                      # Build output (server.js, server.d.ts, assets)
├── vite.config.ts
├── tsconfig.json
└── package.json
```

## API / Routes

| Method | Path | Description |
|--------|------|-------------|
| **Front (HTML)** | | |
| GET | `/` | Home (index) |
| GET | `/step1-git` | Step 1 – Git |
| GET | `/step2-hosting` | Step 2 – Hosting |
| GET | `/step3-steps` | Step 3 – Steps |
| GET | `/step3-steps-selfhosted` | Step 3 – Self-hosted |
| GET | `/step4-validated` | Step 4 – Validated |
| GET | `/step4-validated-selfhosted` | Step 4 – Validated (self-hosted) |
| **Maps** | | |
| GET | `/maps/list` | List `.tmj` maps with properties (path, mapName, mapImage, size, lastModified, etc.) |
| **Uploader** | | |
| POST | `/uploader/configure` | Configure MAP_STORAGE (body: `mapStorageUrl`, `mapStorageApiKey`, `uploadDirectory`) |
| GET | `/uploader/status` | Current config status (e.g. presence of `.env.secret`) |
| GET | `/uploader/maps-storage-list` | List maps from map-storage (for self-hosted step 4) |
| POST | `/uploader/upload` | Run the upload (uses config from `.env.secret`) |

Static and special paths:

- `/public/*` – Static files from core’s `public/`
- `/assets/*` – From project’s `dist/assets/`
- `/tilesets/*` – From project’s `tilesets/`
- `/src/*.ts` – Served as compiled JS (esbuild), e.g. for browser scripts using WorkAdventure APIs

## Configuration

### Uploader (MAP_STORAGE)

Configure via **POST `/uploader/configure`** with:

- `mapStorageUrl` – map-storage base URL
- `mapStorageApiKey` – API key for map-storage
- `uploadDirectory` – Local directory to upload from

This writes (or updates) a secret file (e.g. `.env.secret` or `src/.env.secret` depending on route) used by the upload and maps-storage-list endpoints. Do not commit this file.

### Core root

`getCoreRoot()` resolves the root of the core package:

- When run from the **project root** (e.g. map-starter-kit): `process.cwd()`
- When run from **packages/map-starter-kit-core** or **node_modules**: the package directory

So templates and `public` are always loaded from the core package, while maps, `.env`, and `tilesets` stay in the project root.

## Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `vite` | Start dev server (Express via vite-plugin-node) |
| `build` | `tsc && vite build && node -e "…"` | Type-check, build server to `dist/`, copy `server.d.ts` |

## Releasing

Releases are automated with **semantic-release** and **GitHub Actions**:

- **Workflow:** `.github/workflows/release.yml`
- **Trigger:** Push to `main` or `master`
- **Conventions:** [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `BREAKING CHANGE:`) determine the next version; a release is published only when there are relevant commits.
- **Artifacts:** GitHub Release + **npm** publish of `@workadventure/map-starter-kit-core`.

**npm auth (after classic token deprecation):**

- **Recommended:** [Trusted Publishing (OIDC)](https://docs.npmjs.com/trusted-publishers) for this repo and workflow (no long-lived token).
- **Alternative:** Create a **granular access token** on [npm](https://www.npmjs.com/settings/~/tokens), then set the **NPM_TOKEN** secret in the repo.

## Tech stack

- **Runtime:** Node.js, Express 5
- **Build:** TypeScript 5, Vite 7, vite-plugin-node
- **Templates:** Mustache
- **Release:** semantic-release

## License

MIT. See [LICENSE](LICENSE).

## Links

- **Repository:** [github.com/workadventure/map-starter-kit-core](https://github.com/workadventure/map-starter-kit-core)
- **Issues:** [github.com/workadventure/map-starter-kit-core/issues](https://github.com/workadventure/map-starter-kit-core/issues)
- **npm:** [@workadventure/map-starter-kit-core](https://www.npmjs.com/package/@workadventure/map-starter-kit-core)
