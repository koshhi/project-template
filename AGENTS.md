# AGENTS

## Context Sources

- Read `README.md` first for the project bootstrap flow.
- Review `.ai/shared/` for shared rules synced from the common skills repository.
- Review `.ai/local/` for project-specific context captured by the team.
- Check `.ai/manifest.json` to understand the current shared sync state.

## Rules

- Do not edit `.ai/shared/` manually.
- Use `.ai/local/` for repository-specific knowledge and operating notes.
- Preserve the project structure and existing scripts unless there is an explicit reason to change them.
- Treat `.mcp/` policies and any live MCP credentials as sensitive configuration.

## Working Agreement

- Prefer existing project scripts before introducing ad hoc commands.
- Keep shared and local context clearly separated.
- If shared knowledge needs to change, update the shared source and run `pnpm ai:sync`.
