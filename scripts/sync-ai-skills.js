const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const rootDir = path.resolve(__dirname, "..");
const aiDir = path.join(rootDir, ".ai");
const localDir = path.join(aiDir, "local");
const sharedDir = path.join(aiDir, "shared");
const sourcesDir = path.join(aiDir, "_sources");
const cachedSharedRepoDir = path.join(sourcesDir, "shared-ai-skills");
const manifestPath = path.join(aiDir, "manifest.json");
const siblingSharedRepoDir = path.resolve(rootDir, "..", "shared-ai-skills");
const defaultSharedRepoUrl = "https://github.com/koshhi/shared-ai-skills.git";

const syncableEntries = ["skills", "templates", "prompts", "metadata.json"];

const defaultManifest = {
  sharedSkillsVersion: null,
  lastSyncedAt: null,
  localSkills: []
};

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function runGit(args, options = {}) {
  return execFileSync("git", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    ...options
  }).trim();
}

function copyRecursive(sourcePath, targetPath) {
  const stat = fs.statSync(sourcePath);

  if (stat.isDirectory()) {
    ensureDir(targetPath);

    for (const entry of fs.readdirSync(sourcePath)) {
      copyRecursive(
        path.join(sourcePath, entry),
        path.join(targetPath, entry)
      );
    }

    return;
  }

  ensureDir(path.dirname(targetPath));
  fs.copyFileSync(sourcePath, targetPath);
}

function walkFiles(dirPath, rootPath = dirPath) {
  if (!fs.existsSync(dirPath)) {
    return [];
  }

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.name === ".gitkeep") {
      continue;
    }

    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      files.push(...walkFiles(fullPath, rootPath));
      continue;
    }

    files.push(path.relative(rootPath, fullPath));
  }

  return files.sort((left, right) => left.localeCompare(right));
}

function readManifest() {
  if (!fs.existsSync(manifestPath)) {
    return { ...defaultManifest };
  }

  return { ...defaultManifest, ...JSON.parse(fs.readFileSync(manifestPath, "utf8")) };
}

function readVersion(sourcePath) {
  const metadataPath = path.join(sourcePath, "metadata.json");

  if (fs.existsSync(metadataPath)) {
    try {
      const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf8"));
      if (typeof metadata.version === "string" && metadata.version.trim() !== "") {
        return metadata.version.trim();
      }
    } catch (error) {
      console.warn(`Warning: could not parse metadata.json (${error.message})`);
    }
  }

  try {
    return runGit(["-C", sourcePath, "rev-parse", "--short", "HEAD"], {
      stdio: ["ignore", "pipe", "ignore"]
    });
  } catch {
    return new Date().toISOString();
  }
}

function ensureCachedSharedRepo() {
  const repoUrl = process.env.SHARED_AI_SKILLS_REPO_URL || defaultSharedRepoUrl;

  ensureDir(sourcesDir);

  if (fs.existsSync(cachedSharedRepoDir)) {
    try {
      runGit(["-C", cachedSharedRepoDir, "pull", "--ff-only"], {
        stdio: ["ignore", "pipe", "ignore"]
      });
      return {
        sourcePath: cachedSharedRepoDir,
        sourceLabel: `${cachedSharedRepoDir} (updated from ${repoUrl})`
      };
    } catch (error) {
      throw new Error(
        `Could not update cached shared-ai-skills repo at ${cachedSharedRepoDir}. ${error.message}`
      );
    }
  }

  try {
    runGit(["clone", "--depth", "1", repoUrl, cachedSharedRepoDir], {
      stdio: ["ignore", "pipe", "ignore"]
    });
  } catch (error) {
    throw new Error(
      `Could not bootstrap shared-ai-skills from ${repoUrl}. ${error.message}`
    );
  }

  return {
    sourcePath: cachedSharedRepoDir,
    sourceLabel: `${cachedSharedRepoDir} (bootstrapped from ${repoUrl})`
  };
}

function resolveSource() {
  const rawSourcePath = process.env.SHARED_AI_SKILLS_PATH;

  if (rawSourcePath) {
    const sourcePath = path.resolve(rawSourcePath);

    if (!fs.existsSync(sourcePath) || !fs.statSync(sourcePath).isDirectory()) {
      throw new Error(`Invalid SHARED_AI_SKILLS_PATH: ${sourcePath}`);
    }

    return {
      sourcePath,
      sourceLabel: `${sourcePath} (from SHARED_AI_SKILLS_PATH)`
    };
  }

  if (fs.existsSync(siblingSharedRepoDir) && fs.statSync(siblingSharedRepoDir).isDirectory()) {
    return {
      sourcePath: siblingSharedRepoDir,
      sourceLabel: `${siblingSharedRepoDir} (from sibling folder)`
    };
  }

  return ensureCachedSharedRepo();
}

function main() {
  const { sourcePath, sourceLabel } = resolveSource();

  if (sourcePath === sharedDir) {
    throw new Error("The shared source cannot point to .ai/shared.");
  }

  ensureDir(aiDir);
  ensureDir(localDir);

  fs.rmSync(sharedDir, { recursive: true, force: true });
  ensureDir(sharedDir);

  const copiedEntries = [];

  for (const entryName of syncableEntries) {
    const sourceEntry = path.join(sourcePath, entryName);

    if (!fs.existsSync(sourceEntry)) {
      continue;
    }

    copyRecursive(sourceEntry, path.join(sharedDir, entryName));
    copiedEntries.push(entryName);
  }

  const manifest = readManifest();
  manifest.sharedSkillsVersion = readVersion(sourcePath);
  manifest.lastSyncedAt = new Date().toISOString();
  manifest.localSkills = walkFiles(localDir);

  ensureDir(path.dirname(manifestPath));
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

  console.log(`✓ synced from ${sourceLabel}`);

  if (copiedEntries.length === 0) {
    console.log("✓ no shareable content found");
  } else {
    console.log(`✓ copied ${copiedEntries.join(", ")}`);
  }

  console.log("✓ manifest updated");
  console.log(`Shared skills version: ${manifest.sharedSkillsVersion}`);
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
