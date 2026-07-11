import { spawn } from "node:child_process";

const port = process.env.PORT ?? "3000";
const executable = process.platform === "win32" ? "next.cmd" : "next";

const child = spawn(
  executable,
  ["start", "--hostname", "0.0.0.0", "--port", port],
  {
    shell: process.platform === "win32",
    stdio: "inherit"
  }
);

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});

