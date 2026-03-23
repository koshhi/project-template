const fs = require("node:fs");
const path = require("node:path");
const {
  getAllRuntimeStatuses,
  getPlanningStatus
} = require("./lib/gsd");

const rootDir = path.resolve(__dirname, "..");
const sharedSkillsDir = path.join(rootDir, ".ai", "shared", "skills");
const sharedFallbackDir = path.join(rootDir, ".ai", "shared");
const localDir = path.join(rootDir, ".ai", "local");

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

    const relativePath = path.relative(rootPath, fullPath);
    files.push(relativePath);
  }

  return files.sort((left, right) => left.localeCompare(right));
}

function listSharedSkills() {
  if (fs.existsSync(sharedSkillsDir)) {
    return walkFiles(sharedSkillsDir);
  }

  return walkFiles(sharedFallbackDir).filter(
    (entry) => entry !== "metadata.json" && !entry.startsWith("templates/")
  );
}

function printSection(title, entries) {
  console.log(`${title}:`);

  if (entries.length === 0) {
    console.log("- (none)");
    return;
  }

  for (const entry of entries) {
    console.log(`- ${entry}`);
  }
}

function printGsdStatus() {
  const runtimeStatuses = getAllRuntimeStatuses(rootDir);
  const planningStatus = getPlanningStatus(rootDir);

  console.log("GSD:");

  for (const runtimeStatus of runtimeStatuses) {
    const versionSuffix =
      runtimeStatus.installed && runtimeStatus.version
        ? ` (${runtimeStatus.version})`
        : "";

    console.log(
      `- ${runtimeStatus.label}: ${
        runtimeStatus.installed ? "installed" : "not installed"
      }${versionSuffix}`
    );
  }

  console.log(`- Planning: ${planningStatus.state}`);
}

printSection("Shared skills", listSharedSkills());
console.log("");
printSection("Local skills", walkFiles(localDir));
console.log("");
printGsdStatus();
