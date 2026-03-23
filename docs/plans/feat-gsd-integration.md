# Integracion de GSD en `project-template` para Claude y Codex

## Resumen

Integrar GSD como capa operativa opcional del template, sin mezclarlo con `.ai/shared` ni `.ai/local`. El template seguira gestionando contexto y skills compartidas; GSD anadira planificacion y ejecucion con `.planning/` y artefactos locales de runtime para Claude (`.claude/`) y Codex (`.codex/`).

La UX base sera comun para ambos runtimes:

- bootstrap del repo: `pnpm setup`, `pnpm ai:sync`
- bootstrap de GSD: `pnpm ai:gsd:init`
- uso diario: comandos nativos del runtime (`/gsd:help` en Claude, `$gsd-help` en Codex)

La rama de implementacion prevista es `feat-gsd-integration`.

## Cambios clave

### 1. Wrapper runtime-aware en el template

- Anadir un nuevo script Node `scripts/init-gsd.js` invocado por `pnpm ai:gsd:init`.
- `ai:gsd:init` instalara GSD en modo local para ambos runtimes por defecto, ejecutando el instalador externo con flags equivalentes a:
  - Claude: `npx get-shit-done-cc --claude --local`
  - Codex: `npx get-shit-done-cc --codex --local`
- El script sera idempotente: si se relanza, reinstala o repara sin romper el repo.
- Exponer un override de version o fuente mediante `GSD_INSTALL_SPEC`, con default `get-shit-done-cc@latest`.
- Permitir seleccion opcional de runtime con `pnpm ai:gsd:init -- --runtime=claude|codex|both`, con default `both`.

### 2. Capa de planificacion GSD sin contaminar `.ai/`

- Crear `.planning/` solo al inicializar GSD, no durante `pnpm setup`.
- Sembrar `.planning/config.json` solo si no existe, partiendo del template de GSD y fijando:
  - `planning.commit_docs: true`
  - `planning.search_gitignored: false`
  - `git.branching_strategy: "none"` si el bloque `git` no existe
- No crear `PROJECT.md`, `ROADMAP.md` ni `STATE.md` desde el template; esos artefactos se delegan a `$gsd-new-project` o `/gsd:help` segun runtime.
- No modificar `.ai/manifest.json`; el estado de GSD se detectara en tiempo real por inspeccion de `.claude/`, `.codex/` y `.planning/`.

### 3. Contrato multi-runtime del repo

- Actualizar `AGENTS.md` para declarar el orden de contexto:
  - `README.md`
  - `.ai/shared/`
  - `.ai/local/`
  - `.planning/` si existe
  - codigo del repo
- Anadir una nota explicita de separacion de responsabilidades:
  - `.ai/*` = conocimiento y contexto reusable o local
  - `.planning/*` = estado operativo, roadmap y memoria de ejecucion GSD
- No copiar ni sincronizar skills internas de GSD dentro de `shared-ai-skills`.

### 4. Descubribilidad y documentacion

- Extender `package.json` con `ai:gsd:init`.
- Extender `scripts/list-ai-skills.js` para mostrar, ademas del inventario actual:
  - estado GSD Claude: instalado o no instalado
  - estado GSD Codex: instalado o no instalado
  - estado `.planning/`: ausente, configurado o proyecto inicializado
- Actualizar `README.md` y `docs/ai-workflow.md` con un flujo explicito:
  - base del sistema
  - activacion opcional de GSD
  - tabla de correspondencia por runtime:
    - Claude: `/gsd:help`
    - Codex: `$gsd-help`, `$gsd-new-project`, `$gsd-plan-phase`, `$gsd-execute-phase`
  - aclaracion de que la sintaxis dentro del runtime cambia, pero la estructura del repo y el bootstrap son los mismos

## Interfaces publicas y comportamiento

- Nuevo comando publico: `pnpm ai:gsd:init`
- CLI extendido: `pnpm ai:list` mostrara skills y estado GSD
- Nueva variable soportada: `GSD_INSTALL_SPEC`
- Nuevo parametro de wrapper: `--runtime=claude|codex|both`
- Estructuras detectadas por el sistema:
  - Claude: `.claude/`
  - Codex: `.codex/`
  - planificacion: `.planning/config.json`, `.planning/PROJECT.md`, `.planning/ROADMAP.md`, `.planning/STATE.md`

## Plan de pruebas

- Smoke test de `pnpm ai:gsd:init` en un clon limpio del template:
  - instala Claude y Codex localmente
  - crea `.planning/config.json`
  - no toca `.ai/local/`
  - no rompe `pnpm ai:sync`
- Reejecucion idempotente de `pnpm ai:gsd:init`.
- Verificacion de `pnpm ai:list` en 3 escenarios:
  - sin GSD
  - con un solo runtime instalado
  - con Claude + Codex + `.planning/` inicializado
- Verificacion documental:
  - `README.md` y `docs/ai-workflow.md` describen el mismo flujo
  - no hay instrucciones que mezclen `.ai/*` con `.planning/*`
- Si se anaden tests automatizados, usar `node:test` para cubrir:
  - parseo de flags
  - deteccion de runtimes instalados
  - deteccion de estado `.planning/`
  - generacion condicional de `config.json`

## Suposiciones y defaults elegidos

- La integracion se implementa en `project-template`, no en `shared-ai-skills` ni solo en este meta-repo.
- GSD se instala local al proyecto, no global.
- El template debe funcionar con Claude y Codex a la vez.
- `.planning/` queda versionado por defecto.
- No se vendoriza GSD dentro del template; se usa el instalador oficial envuelto por scripts propios.
- El nombre de rama valido adoptado para la implementacion es `feat-gsd-integration`.
