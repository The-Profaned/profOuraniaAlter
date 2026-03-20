# profOuraniaAlter

## Bare-bones setup

`git clone https://github.com/deafwave/osrs-botmaker-typescript`

`cd osrs-botmaker-typescript`

`pnpm i`

## VS Code extensions used in this repo

- `dbaeumer.vscode-eslint`
- `esbenp.prettier-vscode`
- `rvest.vs-code-prettier-eslint`
- `ms-vscode.vscode-typescript-next`

## Script structure

- `index.ts` with base imports + lifecycle hooks
- `State Manager/script-state.ts`
- `State Manager/logging.ts`
- `State Manager/constants.ts`
- `State Manager/state-manager.ts`
- `State Manager/State/*.ts` individual state handlers

## Current main states

- `TRAVEL_TO_OURANIA_ALTAR`
- `INTERACT_WITH_OURANIA_ALTAR`
- `TRAVEL_TO_PRAYER_ALTAR`
- `SWAP_MAGE_BOOK`
- `USE_PRAYER_ALTAR`
- `TRAVEL_TO_BANK`
- `INTERACT_WITH_BANK`
- `IDLE`

The state machine is intentionally scaffolded for expansion. Add or modify state handlers in `State Manager/State` as features are implemented.
