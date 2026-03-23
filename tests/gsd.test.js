const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const {
  ensurePlanningConfig,
  getPlanningStatus,
  getRuntimeStatus,
  normalizePlanningConfig,
  parseRuntimeSelection
} = require("../scripts/lib/gsd");

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "project-template-gsd-"));
}

test("parseRuntimeSelection defaults to both runtimes", () => {
  assert.deepEqual(parseRuntimeSelection([]), ["claude", "codex"]);
});

test("parseRuntimeSelection supports explicit runtime", () => {
  assert.deepEqual(parseRuntimeSelection(["--runtime=claude"]), ["claude"]);
  assert.deepEqual(parseRuntimeSelection(["--runtime", "codex"]), ["codex"]);
});

test("getRuntimeStatus detects codex markers and version", () => {
  const rootDir = makeTempDir();
  fs.mkdirSync(path.join(rootDir, ".codex", "skills", "gsd-help"), {
    recursive: true
  });
  fs.mkdirSync(path.join(rootDir, ".codex", "agents"), { recursive: true });
  fs.mkdirSync(path.join(rootDir, ".codex", "get-shit-done"), {
    recursive: true
  });
  fs.writeFileSync(
    path.join(rootDir, ".codex", "get-shit-done", "VERSION"),
    "v1.2.3\n",
    "utf8"
  );

  const status = getRuntimeStatus(rootDir, "codex");

  assert.equal(status.installed, true);
  assert.equal(status.version, "v1.2.3");
});

test("ensurePlanningConfig seeds normalized config from installed runtime template", () => {
  const rootDir = makeTempDir();
  const templateConfigPath = path.join(
    rootDir,
    ".codex",
    "get-shit-done",
    "templates",
    "config.json"
  );

  fs.mkdirSync(path.dirname(templateConfigPath), { recursive: true });
  fs.writeFileSync(
    templateConfigPath,
    JSON.stringify(
      {
        planning: {
          commit_docs: false,
          search_gitignored: true
        }
      },
      null,
      2
    ),
    "utf8"
  );

  const result = ensurePlanningConfig(rootDir, ["codex"]);
  const planningConfig = JSON.parse(
    fs.readFileSync(path.join(rootDir, ".planning", "config.json"), "utf8")
  );

  assert.equal(result.created, true);
  assert.equal(planningConfig.planning.commit_docs, true);
  assert.equal(planningConfig.planning.search_gitignored, false);
  assert.equal(planningConfig.git.branching_strategy, "none");
});

test("getPlanningStatus reports initialized only when core artifacts exist", () => {
  const rootDir = makeTempDir();
  const planningDir = path.join(rootDir, ".planning");

  fs.mkdirSync(planningDir, { recursive: true });
  fs.writeFileSync(path.join(planningDir, "config.json"), "{}\n", "utf8");
  assert.equal(getPlanningStatus(rootDir).state, "configured");

  for (const fileName of ["PROJECT.md", "ROADMAP.md", "STATE.md"]) {
    fs.writeFileSync(path.join(planningDir, fileName), `${fileName}\n`, "utf8");
  }

  assert.equal(getPlanningStatus(rootDir).state, "project initialized");
});

test("normalizePlanningConfig enforces planning defaults", () => {
  const config = normalizePlanningConfig({
    planning: {
      commit_docs: false
    },
    git: {
      branching_strategy: "phase"
    }
  });

  assert.equal(config.planning.commit_docs, true);
  assert.equal(config.planning.search_gitignored, false);
  assert.equal(config.git.branching_strategy, "none");
});
