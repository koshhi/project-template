# AI Workflow

## 1. Instalar dependencias

```bash
pnpm install
```

## 2. Preparar estructura base

```bash
pnpm setup
```

Esto asegura que existan:

- `.ai/local/`
- `.ai/shared/`
- `.ai/manifest.json`
- `.mcp/`

## 3. Sincronizar shared skills

```bash
SHARED_AI_SKILLS_PATH=/ruta/a/shared-ai-skills pnpm ai:sync
```

El sync:

- lee la fuente compartida
- copia `skills/`, `templates/` y `prompts/` si existen
- actualiza `.ai/manifest.json`
- no modifica `.ai/local/`

## 4. Consultar skills disponibles

```bash
pnpm ai:list
```

## 5. Añadir contexto local

Cualquier conocimiento específico del repo debe vivir en `.ai/local/`.
