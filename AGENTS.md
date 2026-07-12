# AGENTS.md

## Project

A mobile-first browser-based vocal pitch monitor for music students and teachers.

## Product goal

Help a singer hear, see, and correct monophonic vocal pitch in real time.

## Non-negotiable rules

- Keep microphone processing local.
- Do not introduce a backend without an approved issue.
- Do not upload, store, or log microphone audio.
- Optimize first for mobile Safari and then Android Chrome.
- Preserve raw pitch separately from filtering and visual smoothing.
- Silence and low-confidence input must create gaps, not invented notes.
- Use equal vertical spacing per semitone.
- Keep the MVP small.
- Do not copy another application's branding or interface pixel-for-pixel.

## Engineering principles

- Prefer small, typed, testable modules.
- Avoid unnecessary dependencies.
- Explain every new dependency in the pull request.
- Avoid high-frequency React re-renders.
- Release microphone tracks and audio nodes during cleanup.
- Use timestamps for pitch history.
- Keep deterministic music-theory functions pure.
- Ensure controls work with touch, pointer, and keyboard where relevant.

## Workflow

- Work on one GitHub issue at a time.
- Read the issue and relevant project files before coding.
- Create a dedicated branch.
- Do not silently expand scope.
- Add or update tests.
- Run lint, unit tests, and build before completion.
- For UI changes, include screenshots or a short visual description.
- Summarize changed files, test results, and known limitations.
- Open a pull request rather than pushing broad unreviewed changes.

## Definition of done

A task is complete only when:

- acceptance criteria are met;
- tests pass;
- build succeeds;
- error and cleanup paths are handled;
- mobile behavior has been considered;
- documentation is updated when behavior changes.

## Expected commands

```bash
npm install
npm run dev
npm run lint
npm run test
npm run build
```

## Pull request summary format

```md
## What changed

## Why

## Testing

## Screenshots or notes

## Known limitations
```
