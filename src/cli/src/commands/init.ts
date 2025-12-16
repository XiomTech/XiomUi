import chalk from "chalk";
import { execa } from "execa";
import fs from "fs-extra";
import ora from "ora";
import path from "path";
import prompts from "prompts";

export async function init() {
  console.log(chalk.bold("\n⚡ Welcome to xiom-ui!\n"));

  const response = await prompts([
    {
      type: "text",
      name: "componentsDir",
      message: "Where would you like to install components?",
      initial: "src/components/ui",
    },
    {
      type: "text",
      name: "utilsPath",
      message: "Where is your utils file? (we'll create cn helper)",
      initial: "src/lib/utils.ts",
    },
    {
      type: "select",
      name: "style",
      message: "Which style would you like to use?",
      choices: [
        { title: "Default", value: "default" },
        { title: "New York", value: "new-york" },
      ],
    },
    {
      type: "text",
      name: "tailwindCss",
      message: "Where is your global CSS file?",
      initial: "src/app/globals.css",
    },
  ]);

  // Create config file
  const config = {
    $schema: "https://xiom-ui.dev/schema.json",
    style: response.style,
    tailwind: {
      css: response.tailwindCss,
    },
    aliases: {
      components: response.componentsDir,
      utils: response.utilsPath.replace(/\.ts$/, ""),
    },
  };

  const spinner = ora("Initializing project...").start();

  try {
    // Write config
    await fs.writeJSON("xiom-ui.json", config, { spaces: 2 });

    // Create utils directory and file
    await fs.ensureDir(path.dirname(response.utilsPath));

    const utilsContent = `import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
`;
    await fs.writeFile(response.utilsPath, utilsContent);

    // Create components directory
    await fs.ensureDir(response.componentsDir);

    spinner.text = "Installing dependencies...";

    // Install required dependencies
    await execa("npm", [
      "install",
      "clsx",
      "tailwind-merge",
      "class-variance-authority",
    ]);

    spinner.succeed(chalk.green("Project initialized successfully!"));

    console.log(chalk.dim("\nNext steps:"));
    console.log(chalk.cyan("  npx xiom-ui add button"));
    console.log(chalk.cyan("  npx xiom-ui add card input\n"));
  } catch (error) {
    spinner.fail(chalk.red("Failed to initialize project"));
    console.error(error);
    process.exit(1);
  }
}
