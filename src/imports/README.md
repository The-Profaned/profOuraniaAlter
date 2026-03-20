# @prof/imports

Shared reusable helper functions for all scripts in this repository.

## Usage

Prefer importing shared helpers via the package alias:

- `import { logger } from '@prof/imports/logger.js';`
- `import { gameTick } from '@prof/imports/general-function.js';`

## Notes

- Source location remains `src/imports`.
- Alias resolution is configured in root `tsconfig.json` under `@prof/imports/*`.
- Existing relative imports continue to work; migrate gradually as needed.
