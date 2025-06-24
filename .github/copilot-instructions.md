We use pnpm for managing dependencies.
UI is done with tailwind using the catalyst library of components already in the repository.
Use absolute imports for components and utilities, e.g., `@/components/Button`.
Use `import type` for importing types.
Use `import { type TypeName } from 'module'` for importing types from modules.
Prefer for...of loops over forEach.
Use formatting defined by biome in biome.json.
Use `const` for variables that are not reassigned.