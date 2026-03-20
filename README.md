# project-template

Base mínima para arrancar proyectos con una convención común de contexto para IA.

## Qué incluye

- estructura `.ai/` con separación entre contexto shared y local
- contrato operativo para agentes en `AGENTS.md`
- políticas base de MCP en `.mcp/`
- scripts nativos de Node para `setup`, `ai:sync` y `ai:list`

## Primer arranque

```bash
pnpm install
pnpm setup
SHARED_AI_SKILLS_PATH=/ruta/a/shared-ai-skills pnpm ai:sync
pnpm ai:list
```

## Shared vs local

- `.ai/shared/`: contenido generado por sincronización. No se edita manualmente.
- `.ai/local/`: conocimiento específico del repositorio. Sí se edita.
- `.ai/manifest.json`: estado mínimo del sistema, incluyendo última sincronización.

## Más contexto

El flujo operativo básico está documentado en `docs/ai-workflow.md`.
