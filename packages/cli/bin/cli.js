#!/usr/bin/env node

'use strict';

import {Command} from 'commander';
import chalk from "chalk";
import inquirer from "inquirer";
import ora from "ora";
import {execSync, exec} from "child_process";

const program = new Command();

const prompt = (projectName) => {
  const promptList = [
    {
      type: 'input',
      message: 'Please input project name:',
      name: 'name',
      default: projectName,
      validate(val) {
        if (val.trim() === '') {
          return 'Project name is required!';
        }
        return true;
      }
    }
  ]
  inquirer.prompt(promptList).then(res => {
    downloadGit(res.name)
  })
}

const downloadGit = (projectName) => {
  let spinner = ora('downloading template...');
  spinner.start();
  exec(`git clone https://github.com/congeer/minigame-template.git ${projectName}`,
      (err, stdout, stderr) => {
        if (err) {
          spinner.fail();
          console.log(chalk.red(err));
          return;
        }
        execSync(`rm -rf ${projectName}/.git`);
        const packageString = execSync(`cat ${projectName}/package.json`).toString();
        const packageJson = JSON.parse(packageString);
        packageJson.name = projectName;
        execSync(`echo '${JSON.stringify(packageJson, null, 4)}' > ${projectName}/package.json`);
        execSync(`cd ${projectName} && git init && git add . && git commit -m "init"`);
        spinner.succeed();
        console.log(chalk.green('Project initialization finished!'));
      })
}
program.name('zero-cli')


program.command("init [projectName]").action((projectName) => {
  prompt(projectName)
})


program.on('--help', () => {
  console.log('Commands:');
  console.log('  init [projectName]  init a new project');
})

program.parse(process.argv)
