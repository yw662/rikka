import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

const packages = ["utils/rikka-signal", "utils/rikka-dom", "utils/rikka-elements", "components/rikka-live-playground"];

let failed = false;

for (const pkg of packages) {
  console.log(`\n🧪 Testing ${pkg}...`);
  try {
    // Resolve rstest from the root node_modules
    const rstestBin = path.join(rootDir, "node_modules", ".pnpm", "node_modules", ".bin", "rstest");
    execSync(rstestBin, { cwd: pkg, stdio: "inherit" });
  } catch {
    console.error(`❌ ${pkg} tests failed`);
    failed = true;
  }
}

if (failed) {
  process.exit(1);
} else {
  console.log("\n✅ All tests passed");
}
