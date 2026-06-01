# Magic Arena Agent Guide

This repository contains one Open Party Lab game package. Keep it focused on Magic Arena only.

## Contract

Export only the public entrypoints declared in `package.json`:

- `./manifest`
- `./protocol`
- `./server`
- `./host`
- `./controller`

Do not import private files from the Party Platform apps. Use `@open-party-lab/game-core` for shared game contracts.

## Verification

Run at least:

```bash
npm run typecheck
npm run build
```

When testing inside the Party Platform, run this from the Platform repo:

```bash
npm run games:sync-local
npm run typecheck
npm run dev:all
```

Use the Codex in-app browser for screenshots. External browser executables are acceptable when the maintainer explicitly allows fallback browser checks.
