import { createControlPlaneApp } from "./app-state.js";
import { getPort } from "./config.js";
import { seedDemonstration } from "./seed/demo-seed.js";
import { createServer } from "./server/create-server.js";

const command = process.argv[2] ?? "help";

async function main(): Promise<void> {
  const app = createControlPlaneApp();

  if (command === "seed") {
    const force = process.argv.includes("--force");
    await seedDemonstration(app.repo, { force });
    console.log(`Seeded demonstration at ${app.dbPath}`);
    return;
  }

  if (command === "serve") {
    if (!app.repo.isSeeded()) {
      await seedDemonstration(app.repo);
    }
    const port = getPort();
    const server = createServer(app);
    server.listen(port, () => {
      console.log(
        `Auto Meat control plane dashboard: http://localhost:${port}/`,
      );
    });
    return;
  }

  console.log(`Usage: tsx src/cli.ts <seed|serve> [--force]`);
  process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
