import { execSync } from "child_process";

try {
    console.log("Running CLI e2e test...");
    const output = execSync("npx tsx src/cli/index.ts compile 0x4200000000000000000000000000000000000015", {
        encoding: "utf-8",
        stdio: ["ignore", "pipe", "pipe"],
    });

    if (!output.includes("intent")) {
        throw new Error("FAIL: Output does not include intent");
    }

    if (!output.includes("functions") && !output.includes("privileged_functions")) {
        throw new Error("FAIL: Output does not include structural facts");
    }

    console.log("✅ End-to-End Compile passed");
} catch (err: any) {
    console.error("FAIL:", err.message);
    if (err.stdout) console.error(err.stdout);
    if (err.stderr) console.error(err.stderr);
    process.exit(1);
}
