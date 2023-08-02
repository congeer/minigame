import chalk from "chalk";
import {exec, execSync} from "child_process";
import inquirer from "inquirer";
import ora from "ora";

const prompt = (projectName: string) => {
    const promptList = [
        {
            type: 'input',
            message: 'Please input project name:',
            name: 'name',
            default: projectName,
            validate(val: string) {
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

const downloadGit = (projectName: string) => {
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

export const create = {
    command: "create [projectName]",
    description: "create a new project",
    action: (projectName: string) => {
        prompt(projectName)
    }
}
