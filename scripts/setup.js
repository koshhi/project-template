const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");
const aiDir = path.join(rootDir, ".ai");
const localDir = path.join(aiDir, "local");
const sharedDir = path.join(aiDir, "shared");
const manifestPath = path.join(aiDir, "manifest.json");
const mcpDir = path.join(rootDir, ".mcp");

const defaultManifest = {
  sharedSkillsVersion: null,
  lastSyncedAt: null,
  localSkills: []
};

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function ensureManifest() {
  if (!fs.existsSync(manifestPath)) {
    fs.writeFileSync(
      manifestPath,
      `${JSON.stringify(defaultManifest, null, 2)}\n`,
      "utf8"
    );
    return;
  }

  const raw = fs.readFileSync(manifestPath, "utf8");
  JSON.parse(raw);
}

function main() {
  ensureDir(aiDir);
  ensureDir(localDir);
  ensureDir(sharedDir);
  ensureManifest();
  ensureDir(mcpDir);

  console.log("✓ .ai/local ready");
  console.log("✓ .ai/shared ready");
  console.log("✓ manifest ready");
  console.log("✓ .mcp ready");
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
