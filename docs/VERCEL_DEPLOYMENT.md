# Vercel deployment

## Architecture

Vocal Tuner deploys as a static React, TypeScript, and Vite single-page application. Vercel installs npm dependencies, runs the production build, and serves `dist`. There is no application server, backend, API route, Vercel Function, Firebase project, authentication layer, analytics service, or manual artifact-upload requirement.

Microphone analysis and reference-drone synthesis remain entirely in the browser. Practice data and timeline events remain in memory and disappear on refresh.

## Prerequisites

- A GitHub repository containing the project and `main` branch.
- A Vercel account connected to GitHub.
- Node.js 22 for local verification, matching `package.json` and GitHub Actions.
- npm, using the committed `package-lock.json`.

No Vercel token belongs in the repository. The Vercel CLI is not required for the normal workflow.

## GitHub deployment workflow

1. Work on a feature branch.
2. Push the branch to GitHub.
3. Vercel creates a Preview Deployment for the branch or pull request.
4. Test that HTTPS Preview URL on desktop and physical phones.
5. Merge the reviewed branch into `main`.
6. Vercel creates the Production Deployment from `main`.

Vercel and GitHub Actions are complementary. GitHub Actions validates the repository; Vercel owns Preview and Production hosting.

## Detected project settings

Vercel should infer these settings without repository-specific overrides:

- Framework Preset: `Vite`
- Root Directory: repository root
- Install Command: inferred as `npm install` from `package-lock.json`
- Build Command: `npm run build`
- Output Directory: `dist`
- Production Branch: `main`
- Node.js: `22.x`, from `package.json`

The build runs TypeScript before Vite and then validates deployment JSON, manifest assets, built files, and absence of localhost endpoints or local filesystem paths. No development server is needed after the build.

## SPA rewrite

`vercel.json` rewrites application paths to `/index.html`. Vercel continues serving existing static files such as hashed assets, the manifest, and icons from the filesystem. The fallback is forward-compatible even though the current single-screen UI has no client-side router. There are no `/api` routes or Functions to preserve.

## Environment-variable policy

No user-configured environment variables are required for Issue 018.

Vercel automatically supplies deployment and Git metadata during its build. Vite exposes only these deliberately selected, non-sensitive values:

- application version;
- Vercel environment (`preview` or `production`);
- Git commit SHA;
- Git ref.

Missing or malformed values use safe local fallbacks and never fail a local build. No token, secret, repository credential, filesystem path, or full error stack is exposed.

New Vercel projects normally expose system environment variables automatically. If the developer label unexpectedly says `unknown` in Preview, open Project Settings → Environment Variables and confirm **Automatically expose System Environment Variables** is enabled; do not copy those values into repository files.

`VITE_ENABLE_TEST_CONTROLS=true` is reserved for the local automated browser build. Do not configure it in Vercel. Even if accidentally present, a Vercel Production build still rejects fabricated tuner input.

## Deployment metadata

One typed build-info module derives `development`, `preview`, `production`, `test`, or `unknown`. Local and Preview developer diagnostics show a compact label such as `v0.0.0 · preview · abc1234`. Student-facing Production hides this developer area.

Build timestamps are intentionally omitted so ordinary builds do not change solely because wall-clock time changed.

## Debug and demo flags

Query parameters are convenience switches, never authentication.

| Flag or diagnostic         | Development                           | Preview                               | Production         | Automated test build                               |
| -------------------------- | ------------------------------------- | ------------------------------------- | ------------------ | -------------------------------------------------- |
| Pitch detector diagnostics | Visible                               | Visible                               | Hidden             | Visible                                            |
| `droneDiagnostics`         | Diagnostics already visible           | Enables drone detail                  | Ignored            | Enabled                                            |
| `droneDebug`               | Enables concise console transitions   | Enables concise console transitions   | Ignored            | Available                                          |
| `centsMeterDemo`           | Requires explicit test-controls build | Requires explicit test-controls build | Always ignored     | Enables deterministic injected tuner/practice data |
| `audioDiagnostics`         | Read-only reference-audio lifecycle   | Read-only reference-audio lifecycle   | Explicitly allowed | Read-only reference-audio lifecycle                |

The normal Vercel Preview build does not enable fabricated microphone or practice data. Playwright creates a separate local build with the explicit test flag. Production smoke coverage builds without that flag and verifies ordinary public query parameters cannot activate mock input. `audioDiagnostics=1` is a temporary, read-only physical-device troubleshooting exception; its tone button synthesizes local output but never fabricates microphone or practice data.

## Manifest and mobile shell

The application links a valid web manifest with the Vocal Tuner name, standalone display mode, dark theme/background colors, and a local maskable SVG icon. No service worker or offline cache is added in this issue, so install and offline behavior are not yet a full PWA guarantee. The viewport retains `viewport-fit=cover` and the CSS retains safe-area insets.

## Manual Vercel setup

1. Push the repository and `main` branch to GitHub.
2. Sign in to Vercel.
3. Choose Add New → Project.
4. Import the Vocal Tuner GitHub repository.
5. Confirm Framework Preset: Vite.
6. Confirm Root Directory: repository root.
7. Confirm Build Command: `npm run build`.
8. Confirm Output Directory: `dist`.
9. Leave Environment Variables empty for this issue unless repository inspection proves otherwise.
10. Deploy.
11. Open the generated production URL.
12. Allow microphone access only after pressing Start microphone.
13. Test reference drone.
14. Test a practice session.
15. Open the URL on a physical phone.
16. Add the Vercel domain to any browser/site permissions if needed.
17. Verify Preview Deployment by pushing a feature branch.
18. Verify Production Deployment by merging into `main`.

## Mobile acceptance checklist

- Initial load never opens a microphone permission prompt.
- Start microphone requests permission only after the button gesture.
- iPhone Safari and Android Chrome show an HTTPS secure context.
- The reference keyboard responds to touch and the drone starts only after a gesture.
- Headphones prevent the drone from feeding back into pitch detection.
- A practice session can Start, Pause, Resume, Finish, and show its timeline.
- The page has no horizontal overflow at 320 CSS pixels.
- Refresh clears current in-memory pitch history and practice data.

## Optional Vercel CLI workflow

The CLI may be used for personal troubleshooting after installing it outside the repository, but it is not the primary deployment path. GitHub integration should remain authoritative. Never commit `.vercel` project credentials or paste Vercel tokens into source files.

## Rollback basics

In the Vercel dashboard, open the project’s Deployments list, select a previously verified Production Deployment, and use Promote to Production or the dashboard rollback action available for the account. Rolling back changes the served static build; it does not restore user data because Vocal Tuner has no server-side or persisted session data.

## Troubleshooting

### Build fails

Run Node 22, `npm ci`, `npm run format:check`, `npm run lint`, `npm run test:run`, and `npm run build`. The build validator prints a direct message for invalid Vercel JSON, manifest paths, missing built assets, localhost endpoints, or leaked local paths.

### A deep link returns 404

Confirm the root `vercel.json` was included in the deployment and the project Root Directory is the repository root.

### Microphone is unavailable

Confirm the page uses HTTPS, press Start microphone explicitly, inspect site permissions, and check that another application is not exclusively using the device. The page itself should still load when capture is unsupported or denied.

### Reference drone is silent

Activate a reference key through a direct gesture, check device volume and output routing, and use headphones. Open `?audioDiagnostics=1`, run the one-second output test, copy the report, and follow `IOS_SAFARI_AUDIO_DEBUGGING.md`. Production still ignores the broader `droneDiagnostics` switch.

## Privacy baseline

- Microphone frames are analyzed locally and are not uploaded or recorded.
- Reference tones are synthesized locally with Web Audio.
- Pitch history, practice totals, and timeline events remain in browser memory.
- Refresh clears the current in-memory session data.
- There is no Firebase, backend, analytics, tracking pixel, cookie, account, or error-reporting service.

## Known limitations

- Connecting the GitHub repository and creating the Vercel project are manual account actions.
- No custom domain is configured.
- No service worker or offline application cache exists yet.
- Physical iPhone Safari and Android Chrome audio behavior must be verified on the generated HTTPS URLs.
- Production errors remain local and show a reload fallback; there is no external error reporting.
