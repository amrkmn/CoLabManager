The codebase is structured as follows:
- `src/`: Contains the main application source code.
  - `routes/`: Defines the application's pages and API endpoints using file-based routing.
  - `lib/`: Holds reusable components, server-side logic, data stores, and utility functions.
  - `hooks.server.ts`: Server-side hooks for handling requests.
- `prisma/`: Manages the database schema (`schema.prisma`) and migration files.
- `static/`: Stores static assets like images and fonts.
- `scripts/`: Contains deployment scripts, particularly for Docker.
- `package.json`: Lists project dependencies and scripts.
- `svelte.config.js`, `vite.config.ts`, `tailwind.config.cjs`: Configuration files for SvelteKit, Vite, and Tailwind CSS.