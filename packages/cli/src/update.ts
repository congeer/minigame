import {execSync} from "child_process";

export const update = {
    command: "update [version]",
    description: "update project version",
    action: (version: string) => {
        if (!version) {
            console.log("Please input version")
            return;
        }
        let packageString;
        try {
            packageString = execSync(`cat ./package.json`).toString();
        } catch (e) {
            console.log("Can't find package.json")
            return;
        }
        const packageJson = JSON.parse(packageString);
        for (let dependenciesKey in packageJson.dependencies) {
            if (dependenciesKey.startsWith("@minigame/")) {
                packageJson.dependencies[dependenciesKey] = `^${version}`;
            }
        }
        for (let devDependenciesKey in packageJson.devDependencies) {
            if (devDependenciesKey.startsWith("@minigame/")) {
                packageJson.devDependencies[devDependenciesKey] = `^${version}`;
            }
        }
        execSync(`echo '${JSON.stringify(packageJson, null, 2)}' > ./package.json`);
        console.log("Update success");
    }
}
