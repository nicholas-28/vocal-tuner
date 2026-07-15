# Vocal Tuner

A mobile-first vocal pitch monitor for students and teachers.

## Purpose

The app helps a singer:

- see the current note;
- understand whether the pitch is above or below the note center;
- observe pitch movement over time;
- hear a reference note;
- practice pitch correction without ads, accounts, or unnecessary complexity.

## Current status

Planning and technical validation.

## Deployment

The application is prepared for Git-connected Vercel deployment as a static Vite SPA. Feature branches and pull requests receive Preview Deployments; merges to `main` produce Production Deployments. Vercel should use Node 22, `npm run build`, and the `dist` output directory. No backend or runtime environment variables are required.

See [`docs/VERCEL_DEPLOYMENT.md`](docs/VERCEL_DEPLOYMENT.md) for the exact dashboard setup, production-safe diagnostics policy, mobile HTTPS checklist, rollback, and troubleshooting steps.

## MVP

- Live microphone input
- Current note, frequency, and cents deviation
- Scrolling pitch history
- Semitone grid with piano-style note labels
- Tap or hold a note to hear a reference tone
- Pause and clear controls
- Mobile-first web interface
- Local audio processing
- No login
- No ads

## Recommended stack

- Vite
- React
- TypeScript
- Web Audio API
- AudioWorklet
- Canvas
- Vitest
- Playwright
- PWA manifest

## Repository map

- `PRODUCT.md` — product definition and scope
- `ROADMAP.md` — milestones and implementation order
- `ARCHITECTURE.md` — technical structure
- `AGENTS.md` — instructions for coding agents
- `docs/UX.md` — interface and interaction principles
- `docs/AUDIO_ENGINE.md` — pitch detection requirements
- `docs/TESTING.md` — testing strategy
- `docs/DECISIONS.md` — architecture decision log
- `docs/ISSUES_BACKLOG.md` — ready-to-create GitHub issues
