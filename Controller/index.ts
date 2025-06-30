import fs from "fs";
import path from "path";
import inquirer from "inquirer";

const ARGUMENT_NAMES = /function\s.*?\(([^)]*)\)/;

function getArgNames(func: Function): string[] {
  const funcString = func.toString().replace(/[/][/].*$/mg,''); // remove comments
  const matches = ARGUMENT_NAMES.exec(funcString);
  if (matches && matches[1]) {
    // Split the arguments string by comma and trim whitespace
    const args = matches[1].split(',').map(arg => arg.trim());
    // Filter out empty strings which can occur for functions with no arguments
    return args.filter(arg => arg.length > 0);
  }
  return [];
}

// get all challenges, which is all folders except this one in the parent folder
const challenges : string[] = fs.readdirSync(path.join(__dirname, "..")).filter((file) => {
  return fs.statSync(path.join(__dirname, "..", file)).isDirectory() && file !== "node_modules" && file !== "Controller";
});

async function showChallenge(challenge: string) {
    console.clear();
    console.log("==================");
    console.log(`Challenge: ${challenge}`);
    console.log("==================");

    const challengePath = path.join(__dirname, "..", challenge);
    const challengeFiles = fs.readdirSync(challengePath);

    for (const file of challengeFiles) {
        const filePath = path.join(challengePath, file);
        const script = require(filePath);
        
        //show all functions as options, as well as a return option
        const functions = Object.keys(script);
        const answers = await inquirer.prompt([
            {
                type: "list",
                name: "function",
                message: "Select a function:",
                choices: [...functions,
                    new inquirer.Separator(),
                    "Return"],
            },
        ]);

        const functionName = answers.function;

        if (functionName === "Return") {
            showChallenges();
            return;
        }

        const exportedItem = script[functionName];

        const argNames = getArgNames(exportedItem);
        const argCount = argNames.length;

        console.clear();
        console.log("==================");
        console.log(`Challenge: ${challenge}`);
        console.log(`Function: ${functionName}`);
        console.log(`Arguments: ${argCount}`);
        console.log("==================");

        if (argCount > 0) {
            const args = [];
            for (let i = 0; i < argCount; i++) {
                const argValue = await inquirer.prompt([
                    {
                        type: "input",
                        name: argNames[i],
                        message: `Enter value for argument ${argNames[i]}:`,
                    },
                ]);
                args.push(argValue[argNames[i]]);
                console.clear();
                console.log("==================");
                console.log(`Challenge: ${challenge}`);
                console.log(`Function: ${functionName}`);
                console.log(`Arguments: ${argCount}`);
                console.log("==================");
            }

            const result = script[functionName](...args);
            console.log(`Result: ${result}`);
        } else {
            const result = script[functionName]();
            console.log(`Result: ${result}`);
        }
    }

    console.log("==================");

    //enter to continue
    await inquirer.prompt([
        {
            type: "input",
            name: "continue",
            message: "Press enter to continue...",
        },
    ]);

    showChallenge(challenge);
}

async function showChallenges() {
    console.clear();
    console.log("==================");
    console.log("Challenges:");
    console.log("==================");

    try {
        const answers = await inquirer.prompt([
            {
                type: "list",
                name: "challenge",
                message: "Select a challenge:",
                choices: [
                    ...challenges,
                    new inquirer.Separator(),
                    "Exit",
                ],
            },
        ]);

        const challenge = answers.challenge;

        if (challenge === "Exit") {
            console.clear();
            console.log("Exiting...");
            process.exit(0);
        } else if (challenges.includes(challenge)) {
            showChallenge(challenge);
        }
    } catch (error) {
        console.error(error);
    }
}

showChallenges();