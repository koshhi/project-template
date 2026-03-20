# project-template

Base mínima para arrancar proyectos con una convención común de contexto para IA.

## Qué incluye

- estructura `.ai/` con separación entre contexto shared y local
- contrato operativo para agentes en `AGENTS.md`
- políticas base de MCP en `.mcp/`
- scripts nativos de Node para `setup`, `ai:sync` y `ai:list`

## Primer arranque

Requisitos:

- Node.js instalado
- `pnpm` disponible en el entorno
- acceso a GitHub para crear un repo desde este template
- conexión de red disponible la primera vez que se ejecute `pnpm ai:sync` si no hay una copia local de `shared-ai-skills`

Flujo recomendado:

1. En GitHub, usa `Use this template` sobre `project-template`.
2. Crea tu nuevo repositorio a partir del template.
3. Clona tu nuevo proyecto.
4. Entra en la carpeta clonada del proyecto.
5. Instala dependencias.
6. Prepara la estructura base del proyecto.
7. Sincroniza las shared skills.
8. Lista las skills disponibles para comprobar el estado inicial.

Ejemplo:

```bash
git clone https://github.com/<tu-org-o-usuario>/<tu-repo-creado-desde-project-template>.git
cd <tu-repo-creado-desde-project-template>
pnpm install
pnpm setup
pnpm ai:sync
pnpm ai:list
```

Resolución de la fuente shared:

- si `SHARED_AI_SKILLS_PATH` está definida, se usa esa ruta
- si existe una carpeta hermana `../shared-ai-skills`, se usa esa copia local
- si no existe ninguna de las dos, `pnpm ai:sync` descarga automáticamente `shared-ai-skills` en `.ai/_sources/shared-ai-skills`

Estado esperado después del arranque:

- `.ai/local/` existe y está lista para editarse
- `.ai/shared/` contiene las skills sincronizadas
- `.ai/_sources/shared-ai-skills` puede existir como caché local del repo compartido
- `.ai/manifest.json` refleja la última sincronización
- `pnpm ai:list` muestra las skills shared y las locales

## Shared vs local

- `.ai/shared/`: contenido generado por sincronización. No se edita manualmente.
- `.ai/local/`: conocimiento específico del repositorio. Sí se edita.
- `.ai/manifest.json`: estado mínimo del sistema, incluyendo última sincronización.

## Más contexto

El flujo operativo básico está documentado en [docs/ai-workflow.md](docs/ai-workflow.md).
