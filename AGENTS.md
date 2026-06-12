# Repository Guidelines

## Project Structure & Module Organization

This is a Vite + React + TypeScript app using Tailwind CSS v4 and shadcn/ui.

- `src/main.tsx` mounts the React app and global providers.
- `src/App.tsx` is the current top-level application view.
- `src/components/` contains shared UI and app components.
- `src/components/ui/` contains shadcn-generated primitives.
- `src/components/theme/` contains theme state and theme toggle logic.
- `src/components/providers/` wires cross-cutting providers such as TanStack Query.
- `src/lib/` is for shared utilities.
- `public/` holds static assets copied as-is at build time.
- `dist/` is generated output and should not be edited.
- `my-app/` is a reference project ignored by root ESLint.

## Build, Test, and Development Commands

Use `pnpm`.

- `pnpm dev` starts the Vite dev server.
- `pnpm dev:development`, `pnpm dev:stage`, `pnpm dev:production` run Vite with the matching mode.
- `pnpm build` runs TypeScript checks and creates a production bundle.
- `pnpm build:development`, `pnpm build:stage`, `pnpm build:production` build with mode-specific env files.
- `pnpm preview` serves the built `dist/` output locally.
- `pnpm typecheck` runs TypeScript without emitting files.
- `pnpm lint` runs ESLint.
- `pnpm format` formats TypeScript and TSX files with Prettier.

## Coding Style & Naming Conventions

Use TypeScript, React function components, and ESM imports. Prefer the `@/` alias for imports from `src`.

Follow the existing style: two-space indentation through Prettier, no semicolons, double quotes in TS/TSX. Component files use kebab-case names such as `theme-toggle-button.tsx`; exported React components use PascalCase. Keep shadcn components in `src/components/ui/`.

## Testing Guidelines

No test runner is configured yet. For now, every change should pass:

```bash
pnpm typecheck
pnpm lint
pnpm build
```

When adding tests, place them near the code under test with names such as `component-name.test.tsx` or in a feature-level `__tests__/` directory. Prefer behavior-focused tests over snapshots.

## Commit & Pull Request Guidelines

Git history currently only shows `feat: initial commit`; use concise Conventional Commit-style messages, for example `feat: add query provider` or `fix: correct stage env`.

Pull requests should include a short summary, validation commands run, linked issue or task when available, and screenshots for visible UI changes. Mention any env file, dependency, or build-mode changes explicitly.

## Configuration Notes

Mode-specific variables live in `.env.development`, `.env.stage`, and `.env.production`. Vite exposes only `VITE_*` variables to the client. Do not commit secrets; these env files should only contain safe public configuration.
