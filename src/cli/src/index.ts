#!/usr/bin/env node
import { Command } from "commander";
import { add } from "./commands/add.js";
import { init } from "./commands/init.js";

const program = new Command();

program
  .name("xiom-ui")
  .description("Add beautiful UI components to your project")
  .version("0.1.0");

program
  .command("init")
  .description("Initialize your project and install dependencies")
  .action(init);

program
  .command("add")
  .description("Add components to your project")
  .argument("[components...]", "Components to add")
  .option("-y, --yes", "Skip confirmation prompt")
  .option("-o, --overwrite", "Overwrite existing files")
  .option("-a, --all", "Add all available components")
  .action(add);

program.parse();
