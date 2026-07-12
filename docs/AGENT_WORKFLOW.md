# Agent Workflow

## Roles

### Product and architecture chat

Use for:

- product decisions;
- scope;
- UX reasoning;
- architecture;
- issue writing;
- reviewing outcomes;
- deciding what comes next.

### Coding agent

Use for:

- changing repository files;
- running commands;
- implementing one issue;
- adding tests;
- opening a pull request;
- reporting technical limitations.

## Standard loop

1. Select one issue.
2. Confirm it has clear acceptance criteria.
3. Mark it `codex-ready`.
4. Ask the coding agent to implement only that issue.
5. Review the pull request.
6. Test the deployed preview on a phone when relevant.
7. Record defects as separate issues.
8. Merge only after acceptance criteria are met.
9. Update `DECISIONS.md` when architecture changes.
10. Move to the next issue.

## Suggested prompt for a coding agent

```text
Implement GitHub Issue #<number>.

Before coding:
- read AGENTS.md;
- read PRODUCT.md;
- read ARCHITECTURE.md;
- read the complete issue.

Work only within the issue scope.
Add or update tests.
Run lint, tests, and build.
Open a pull request.

In the final report include:
- files changed;
- implementation summary;
- commands run and results;
- screenshots or UI notes when relevant;
- known limitations;
- anything that requires human testing.
```

## Review checklist

- Does the implementation solve the stated user problem?
- Did the agent expand scope?
- Are cleanup and error paths handled?
- Does it work on mobile?
- Are tests meaningful?
- Did a new dependency appear?
- Is audio kept local?
- Is the interface understandable?
- Are known limitations documented?
