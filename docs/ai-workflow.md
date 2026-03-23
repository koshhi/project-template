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

`pnpm setup` crea la estructura; las shared skills no se versionan dentro del template y solo aparecen tras `pnpm ai:sync`.

## 3. Sincronizar shared skills

```bash
pnpm ai:sync
```

El sync:

- usa `SHARED_AI_SKILLS_PATH` si está definida
- usa `../shared-ai-skills` si existe como carpeta hermana
- descarga automáticamente `shared-ai-skills` en `.ai/_sources/shared-ai-skills` si no encuentra una fuente local
- copia `skills/`, `templates/` y `prompts/` si existen
- actualiza `.ai/manifest.json`
- no modifica `.ai/local/`

## 4. Consultar skills disponibles

```bash
pnpm ai:list
```

Ademas de shared y local, este comando muestra:

- estado GSD para Claude
- estado GSD para Codex
- estado de `.planning/`

## 5. Activar GSD para Claude y Codex (opcional)

```bash
pnpm ai:gsd:init
```

Este bootstrap:

- instala GSD localmente para Claude y Codex por defecto
- acepta `--runtime=claude|codex|both`
- crea `.planning/config.json` si falta
- crea `.ai/template-bootstrap.json` para marcar la infraestructura del scaffold
- parchea localmente la deteccion brownfield de GSD para ignorar el codigo del propio template
- no toca `.ai/local/`

Comandos base por runtime:

- Claude: `/gsd:help`
- Codex: `$gsd-help`

## 6. Añadir contexto local

Cualquier conocimiento específico del repo debe vivir en `.ai/local/`.

Mantén separadas las dos capas:

- `.ai/*` para conocimiento reusable y contexto del proyecto
- `.planning/*` para el estado operativo de GSD
