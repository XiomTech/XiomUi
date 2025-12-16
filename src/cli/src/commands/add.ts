/** biome-ignore-all lint/suspicious/useIterableCallbackReturn: <explanation> */
import axios from "axios";
import chalk from "chalk";
import { execa } from "execa";
import fs from "fs-extra";
import ora from "ora";
import path from "path";
import prompts from "prompts";

// Change this to your deployed URL
const REGISTRY_URL =
  process.env.REGISTRY_URL || "http://localhost:3000/api/registry";

interface Component {
  name: string;
  dependencies: string[];
  devDependencies: string[];
  registryDependencies: string[];
  files: { name: string; content: string }[];
}

export async function add(
  components: string[],
  options: { yes?: boolean; overwrite?: boolean; all?: boolean }
) {
  // Check for config
  const configPath = path.resolve("xiom-ui.json");
  if (!(await fs.pathExists(configPath))) {
    console.log(
      chalk.red("\n❌ Config not found. Run `npx xiom-ui init` first.\n")
    );
    process.exit(1);
  }

  const config = await fs.readJSON(configPath);

  // If --all flag, fetch all components
  if (options.all) {
    const { data: registry } = await axios.get(REGISTRY_URL);
    components = registry.components.map((c: any) => c.name);
  }

  // If no components specified, show picker
  if (!components.length) {
    const { data: registry } = await axios.get(REGISTRY_URL);

    const { selectedComponents } = await prompts({
      type: "multiselect",
      name: "selectedComponents",
      message: "Which components would you like to add?",
      choices: registry.components.map((c: any) => ({
        title: c.name,
        value: c.name,
        description: c.description,
      })),
      hint: "Space to select, Enter to confirm",
    });

    components = selectedComponents;
  }

  if (!components.length) {
    console.log(chalk.yellow("\nNo components selected.\n"));
    return;
  }

  console.log("");

  const allDependencies: Set<string> = new Set();
  const allDevDependencies: Set<string> = new Set();

  for (const componentName of components) {
    const spinner = ora(`Fetching ${componentName}...`).start();

    try {
      // Fetch component from registry
      const { data: component } = await axios.get<Component>(
        `${REGISTRY_URL}/${componentName}`
      );

      // Check for registry dependencies (other components this depends on)
      if (component.registryDependencies?.length) {
        spinner.text = `Installing dependencies for ${componentName}...`;
        await add(component.registryDependencies, {
          yes: true,
          overwrite: options.overwrite,
        });
      }

      // Collect dependencies
      component.dependencies?.forEach((dep) => allDependencies.add(dep));
      component.devDependencies?.forEach((dep) => allDevDependencies.add(dep));

      // Write component files
      for (const file of component.files) {
        const targetPath = path.join(config.aliases.components, file.name);

        // Check if file exists
        if (await fs.pathExists(targetPath)) {
          if (!options.overwrite && !options.yes) {
            const { overwrite } = await prompts({
              type: "confirm",
              name: "overwrite",
              message: `${file.name} already exists. Overwrite?`,
              initial: false,
            });
            if (!overwrite) {
              spinner.info(chalk.yellow(`Skipped ${file.name}`));
              continue;
            }
          }
        }

        // Transform the import path for utils
        let content = file.content;
        content = content.replace(
          /@\/lib\/utils/g,
          config.aliases.utils.replace(/^src\//, "@/")
        );

        await fs.ensureDir(path.dirname(targetPath));
        await fs.writeFile(targetPath, content);
      }

      spinner.succeed(chalk.green(`Added ${componentName}`));
    } catch (error: any) {
      if (error.response?.status === 404) {
        spinner.fail(chalk.red(`Component "${componentName}" not found`));
      } else {
        spinner.fail(chalk.red(`Failed to add ${componentName}`));
        console.error(chalk.dim(error.message));
      }
    }
  }

  // Install all collected dependencies
  if (allDependencies.size > 0) {
    const depsSpinner = ora("Installing dependencies...").start();
    try {
      await execa("npm", ["install", ...allDependencies]);
      depsSpinner.succeed(chalk.green("Dependencies installed"));
    } catch {
      depsSpinner.fail(chalk.red("Failed to install some dependencies"));
    }
  }

  if (allDevDependencies.size > 0) {
    try {
      await execa("npm", ["install", "-D", ...allDevDependencies]);
    } catch {
      // Silent fail for dev deps
    }
  }

  console.log(chalk.dim("\n✨ Done!\n"));
}
