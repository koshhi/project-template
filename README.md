# project-template

Base mínima para arrancar proyectos con una convención común de contexto para IA.

## Qué incluye

- estructura `.ai/` con separación entre contexto shared y local
- soporte opcional para GSD con runtimes locales de Claude y Codex
- contrato operativo para agentes en `AGENTS.md`
- políticas base de MCP en `.mcp/`
- scripts nativos de Node para `setup`, `ai:sync`, `ai:list` y `ai:gsd:init`

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
8. Activa GSD si el proyecto va a usar Claude o Codex con planning local.
9. Lista las skills disponibles para comprobar el estado inicial.

Ejemplo:

```bash
git clone https://github.com/<tu-org-o-usuario>/<tu-repo-creado-desde-project-template>.git
cd <tu-repo-creado-desde-project-template>
pnpm install
pnpm setup
pnpm ai:sync
pnpm ai:gsd:init
pnpm ai:list
```

Resolución de la fuente shared:

- si `SHARED_AI_SKILLS_PATH` está definida, se usa esa ruta
- si existe una carpeta hermana `../shared-ai-skills`, se usa esa copia local
- si no existe ninguna de las dos, `pnpm ai:sync` descarga automáticamente `shared-ai-skills` en `.ai/_sources/shared-ai-skills`

Estado esperado después del arranque:

- `.ai/local/` existe y está lista para editarse
- `.ai/shared/` se puebla al ejecutar `pnpm ai:sync`
- `.ai/_sources/shared-ai-skills` puede existir como caché local del repo compartido
- `.ai/manifest.json` refleja la última sincronización
- `.planning/config.json` existe si se ejecutó `pnpm ai:gsd:init`
- `pnpm ai:list` muestra las skills shared, las locales y el estado de GSD

## Shared vs local

- `.ai/shared/`: contenido generado por sincronización. No se edita manualmente.
- `.ai/local/`: conocimiento específico del repositorio. Sí se edita.
- `.ai/manifest.json`: estado mínimo del sistema, incluyendo última sincronización.
- `.planning/`: estado operativo de GSD. Vive separado del contexto reusable de `.ai/`.

## GSD opcional

Si el proyecto necesita planning y ejecucion con GSD, activa la integracion local:

```bash
pnpm ai:gsd:init
```

Por defecto instala GSD para Claude y Codex en el repo actual y si falta crea `.planning/config.json`.
Tambien aplica un parche local a GSD para que `new-project` ignore la infraestructura del template y no trate un repo recien creado como brownfield solo por incluir los scripts del scaffold.

Opciones utiles:

- `pnpm ai:gsd:init -- --runtime=claude`
- `pnpm ai:gsd:init -- --runtime=codex`
- `GSD_INSTALL_SPEC=get-shit-done-cc@latest pnpm ai:gsd:init`

Comandos de uso diario por runtime:

| Runtime | Comando base |
| --- | --- |
| Claude | `/gsd:help` |
| Codex | `$gsd-help` |

La sintaxis cambia dentro del runtime, pero la estructura del repo es la misma:

- `.ai/*` para contexto shared y local
- `.planning/*` para roadmap, estado y memoria de ejecucion GSD

## Más contexto

El flujo operativo básico está documentado en [docs/ai-workflow.md](docs/ai-workflow.md).
