const fs = require("node:fs");
const path = require("node:path");

const templateBootstrapConfig = {
  ignore_dirs: [
    ".ai",
    ".claude",
    ".codex",
    ".github",
    ".mcp",
    ".planning",
    "docs",
    "scripts",
    "tests",
    "node_modules",
    "dist",
    "build",
    "target"
  ],
  ignore_files: [
    ".DS_Store",
    ".gitignore",
    "AGENTS.md",
    "README.md",
    "package.json",
    "pnpm-lock.yaml"
  ]
};

const runtimeDefinitions = {
  claude: {
    label: "Claude",
    flag: "--claude",
    rootDirName: ".claude",
    installMarkers: [
      path.join(".claude", "commands", "gsd"),
      path.join(".claude", "agents"),
      path.join(".claude", "get-shit-done")
    ],
    versionFile: path.join(".claude", "get-shit-done", "VERSION"),
    templateConfigPath: path.join(".claude", "get-shit-done", "templates", "config.json")
  },
  codex: {
    label: "Codex",
    flag: "--codex",
    rootDirName: ".codex",
    installMarkers: [
      path.join(".codex", "skills", "gsd-help"),
      path.join(".codex", "agents"),
      path.join(".codex", "get-shit-done")
    ],
    versionFile: path.join(".codex", "get-shit-done", "VERSION"),
    templateConfigPath: path.join(".codex", "get-shit-done", "templates", "config.json")
  }
};

const runtimeNames = Object.keys(runtimeDefinitions);

function pathExists(targetPath) {
  return fs.existsSync(targetPath);
}

function readJson(jsonPath) {
  return JSON.parse(fs.readFileSync(jsonPath, "utf8"));
}

function writeJson(jsonPath, value) {
  fs.mkdirSync(path.dirname(jsonPath), { recursive: true });
  fs.writeFileSync(jsonPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function getTemplateBootstrapConfigPath(rootDir) {
  return path.join(rootDir, ".ai", "template-bootstrap.json");
}

function ensureTemplateBootstrapConfig(rootDir) {
  const configPath = getTemplateBootstrapConfigPath(rootDir);

  if (!pathExists(configPath)) {
    writeJson(configPath, templateBootstrapConfig);
    return {
      created: true,
      path: configPath
    };
  }

  return {
    created: false,
    path: configPath
  };
}

function parseRuntimeSelection(argv) {
  const runtimeArgument = argv.find(
    (entry) => entry === "--runtime" || entry.startsWith("--runtime=")
  );

  if (!runtimeArgument) {
    return runtimeNames;
  }

  const runtimeValue =
    runtimeArgument === "--runtime"
      ? argv[argv.indexOf(runtimeArgument) + 1]
      : runtimeArgument.split("=")[1];

  if (!runtimeValue) {
    throw new Error("Missing value for --runtime. Use claude, codex, or both.");
  }

  if (runtimeValue === "both") {
    return runtimeNames;
  }

  if (!runtimeDefinitions[runtimeValue]) {
    throw new Error(`Unsupported runtime "${runtimeValue}". Use claude, codex, or both.`);
  }

  return [runtimeValue];
}

function getInstallSpec() {
  const installSpec = process.env.GSD_INSTALL_SPEC;
  return installSpec && installSpec.trim() !== ""
    ? installSpec.trim()
    : "get-shit-done-cc@latest";
}

function getRuntimeStatus(rootDir, runtimeName) {
  const runtime = runtimeDefinitions[runtimeName];
  const missingMarkers = runtime.installMarkers.filter(
    (marker) => !pathExists(path.join(rootDir, marker))
  );
  const versionPath = path.join(rootDir, runtime.versionFile);
  const version = pathExists(versionPath)
    ? fs.readFileSync(versionPath, "utf8").trim() || null
    : null;

  return {
    runtime: runtimeName,
    label: runtime.label,
    installed: missingMarkers.length === 0,
    version,
    missingMarkers
  };
}

function getAllRuntimeStatuses(rootDir) {
  return runtimeNames.map((runtimeName) => getRuntimeStatus(rootDir, runtimeName));
}

function getPlanningStatus(rootDir) {
  const planningDir = path.join(rootDir, ".planning");
  const configPath = path.join(planningDir, "config.json");
  const projectFiles = ["PROJECT.md", "ROADMAP.md", "STATE.md"].map((fileName) =>
    path.join(planningDir, fileName)
  );
  const hasPlanningDir = pathExists(planningDir);
  const hasConfig = pathExists(configPath);
  const hasProjectArtifacts = projectFiles.every((filePath) => pathExists(filePath));

  let state = "absent";

  if (hasProjectArtifacts) {
    state = "project initialized";
  } else if (hasConfig) {
    state = "configured";
  } else if (hasPlanningDir) {
    state = "partial";
  }

  return {
    state,
    hasPlanningDir,
    hasConfig,
    hasProjectArtifacts,
    planningDir,
    configPath
  };
}

function getTemplateConfigPath(rootDir, preferredRuntimes = runtimeNames) {
  for (const runtimeName of preferredRuntimes) {
    const templateConfigPath = path.join(
      rootDir,
      runtimeDefinitions[runtimeName].templateConfigPath
    );

    if (pathExists(templateConfigPath)) {
      return templateConfigPath;
    }
  }

  return null;
}

function createFallbackConfig() {
  return {
    mode: "interactive",
    granularity: "standard",
    workflow: {
      research: true,
      plan_check: true,
      verifier: true,
      auto_advance: false,
      nyquist_validation: true,
      discuss_mode: "discuss",
      research_before_questions: false
    },
    planning: {
      commit_docs: true,
      search_gitignored: false,
      sub_repos: []
    },
    parallelization: {
      enabled: true,
      plan_level: true,
      task_level: false,
      skip_checkpoints: true,
      max_concurrent_agents: 3,
      min_plans_for_parallel: 2
    },
    gates: {
      confirm_project: true,
      confirm_phases: true,
      confirm_roadmap: true,
      confirm_breakdown: true,
      confirm_plan: true,
      execute_next_plan: true,
      issues_review: true,
      confirm_transition: true
    },
    safety: {
      always_confirm_destructive: true,
      always_confirm_external_services: true
    },
    hooks: {
      context_warnings: true
    },
    git: {
      branching_strategy: "none"
    }
  };
}

function normalizePlanningConfig(config) {
  return {
    ...config,
    planning: {
      ...(config.planning || {}),
      commit_docs: true,
      search_gitignored: false
    },
    git: {
      ...(config.git || {}),
      branching_strategy: "none"
    }
  };
}

function ensurePlanningConfig(rootDir, preferredRuntimes = runtimeNames) {
  const planningStatus = getPlanningStatus(rootDir);

  if (planningStatus.hasConfig) {
    return {
      created: false,
      path: planningStatus.configPath
    };
  }

  const templateConfigPath = getTemplateConfigPath(rootDir, preferredRuntimes);
  const config = templateConfigPath
    ? normalizePlanningConfig(readJson(templateConfigPath))
    : createFallbackConfig();

  writeJson(planningStatus.configPath, config);

  return {
    created: true,
    path: planningStatus.configPath
  };
}

function patchGsdInitForTemplateBootstrap(rootDir, runtimeName) {
  const initPath = path.join(
    rootDir,
    runtimeDefinitions[runtimeName].rootDirName,
    "get-shit-done",
    "bin",
    "lib",
    "init.cjs"
  );

  if (!pathExists(initPath)) {
    return {
      patched: false,
      reason: "missing init.cjs",
      path: initPath
    };
  }

  const source = fs.readFileSync(initPath, "utf8");

  if (source.includes("template-bootstrap.json")) {
    return {
      patched: false,
      reason: "already patched",
      path: initPath
    };
  }

  const detectionBlock = `hasPackageFile = pathExistsInternal(cwd, 'package.json') ||
                   pathExistsInternal(cwd, 'requirements.txt') ||
                   pathExistsInternal(cwd, 'Cargo.toml') ||
                   pathExistsInternal(cwd, 'go.mod') ||
                   pathExistsInternal(cwd, 'Package.swift');`;

  const injectedBlock = `${detectionBlock}

  let isTemplateBootstrapOnlyProject = false;
  try {
    const templateBootstrapPath = path.join(cwd, '.ai', 'template-bootstrap.json');
    if (fs.existsSync(templateBootstrapPath)) {
      const templateBootstrap = JSON.parse(fs.readFileSync(templateBootstrapPath, 'utf8'));
      const defaultSkippedDirs = new Set(['node_modules', '.git', '.planning', '.claude', '.codex', '__pycache__', 'target', 'dist', 'build']);
      const ignoredDirs = new Set(templateBootstrap.ignore_dirs || []);
      const ignoredFiles = new Set(templateBootstrap.ignore_files || []);
      function hasNonTemplateFiles(dir, depth, relativeDir = '') {
        if (depth > 4) return false;
        let entries;
        try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return false; }
        for (const entry of entries) {
          const relativePath = relativeDir ? path.posix.join(relativeDir, entry.name) : entry.name;
          if (entry.isDirectory()) {
            if (defaultSkippedDirs.has(entry.name) || ignoredDirs.has(entry.name) || ignoredDirs.has(relativePath)) continue;
            if (hasNonTemplateFiles(path.join(dir, entry.name), depth + 1, relativePath)) return true;
            continue;
          }
          if (ignoredFiles.has(entry.name) || ignoredFiles.has(relativePath)) continue;
          return true;
        }
        return false;
      }
      isTemplateBootstrapOnlyProject = !hasNonTemplateFiles(cwd, 0);
      if (isTemplateBootstrapOnlyProject) {
        hasCode = false;
        hasPackageFile = false;
      }
    }
  } catch { /* intentionally empty — template bootstrap detection is best-effort */ }`;

  if (!source.includes(detectionBlock)) {
    throw new Error(`Could not patch GSD brownfield detection for ${runtimeName}.`);
  }

  fs.writeFileSync(initPath, source.replace(detectionBlock, injectedBlock), "utf8");

  return {
    patched: true,
    reason: "template bootstrap patch applied",
    path: initPath
  };
}

module.exports = {
  ensureTemplateBootstrapConfig,
  ensurePlanningConfig,
  getAllRuntimeStatuses,
  getInstallSpec,
  getPlanningStatus,
  getRuntimeStatus,
  getTemplateBootstrapConfigPath,
  normalizePlanningConfig,
  parseRuntimeSelection,
  patchGsdInitForTemplateBootstrap,
  templateBootstrapConfig,
  runtimeDefinitions,
  runtimeNames
};
