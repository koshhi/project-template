# MCP Policy

- Use MCP servers only when they add context or execution capability that is not already available in the repo.
- Prefer repository sources before external systems to avoid duplicating knowledge.
- Keep secrets and credentials out of versioned files.
- Treat `.mcp/servers.example.json` as a template, not as a live configuration.
