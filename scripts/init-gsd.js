const { execFileSync } = require("node:child_process");
const path = require("node:path");

const {
  ensurePlanningConfig,
  getInstallSpec,
  getPlanningStatus,
  getRuntimeStatus,
  parseRuntimeSelection,
  runtimeDefinitions
} = require("./lib/gsd");

const rootDir = path.resolve(__dirname, "..");

function installRuntime(runtimeName, installSpec) {
  const runtime = runtimeDefinitions[runtimeName];

  console.log(`> Installing GSD for ${runtime.label} (${runtime.flag} --local)`);

  execFileSync("npx", [installSpec, runtime.flag, "--local"], {
    cwd: rootDir,
    stdio: "inherit"
  });
}

function formatRuntimeStatus(status) {
  if (!status.installed) {
    return `${status.label}: not installed`;
  }

  return status.version
    ? `${status.label}: installed (${status.version})`
    : `${status.label}: installed`;
}

function main() {
  const selectedRuntimes = parseRuntimeSelection(process.argv.slice(2));
  const installSpec = getInstallSpec();

  for (const runtimeName of selectedRuntimes) {
    installRuntime(runtimeName, installSpec);
  }

  const planningConfig = ensurePlanningConfig(rootDir, selectedRuntimes);
  const planningStatus = getPlanningStatus(rootDir);

  console.log("");
  console.log("GSD status:");

  for (const runtimeName of selectedRuntimes) {
    console.log(`- ${formatRuntimeStatus(getRuntimeStatus(rootDir, runtimeName))}`);
  }

  console.log(`- Planning: ${planningStatus.state}`);
  console.log(
    planningConfig.created
      ? `- Seeded ${path.relative(rootDir, planningConfig.path)}`
      : `- Reused ${path.relative(rootDir, planningConfig.path)}`
  );
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
