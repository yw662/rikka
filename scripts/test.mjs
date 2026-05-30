import { execSync } from "node:child_process";

const packages = ["utils/rikka-signal", "utils/rikka-dom", "utils/rikka-elements", "components/rikka-live-playground"];

let failed = false;

for (const pkg of packages) {
  console.log(`\n🧪 Testing ${pkg}...`);
  try {
    execSync("rstest", { cwd: pkg, stdio: "inherit" });
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
