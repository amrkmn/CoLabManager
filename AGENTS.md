# CoLab Manager - Agent Development Guide

## Build & Development

- `yarn dev`: Start development server
- `yarn build`: Build for production
- `yarn start`: Start production server
- `yarn check`: Run TypeScript and Svelte checks (no specific test command found)
- `yarn format`: Format code with Prettier
- `yarn lint`: Check code formatting

## Database Commands

- `npx prisma generate`: Generate Prisma client
- `npx prisma migrate dev`: Run database migrations
- `npx prisma studio`: Open database GUI

## Code Style

- **Formatting**: Tabs, single quotes, no trailing commas, 100 char line length. Run `yarn format`.
- **TypeScript**: Strict mode is enabled. Use `$lib/` for library imports and `$env/` for environment variables.
- **Svelte**: Use Svelte 5 syntax (`$props`, `$state`, `$derived`).
- **File Structure**: API routes in `src/routes/api/`, pages in `src/routes/`, components in `src/lib/components/`.
- **Database**: Use Prisma client for queries. Models use ULID primary keys.
- **Error Handling**: Return `{ error: true, message: string }` for API errors with proper HTTP status codes. Use the logger in `src/lib/utils/logger.ts`.
- **Styling**: Use Tailwind CSS with `dark:` mode support. Use `cn()` from `$lib/utils/style` for conditional classes.
