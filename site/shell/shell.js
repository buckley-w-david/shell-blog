import { fileSystem } from "./filesystem.js";
import { absolute, parent, tokenize } from "./utils.js";
import { commands } from "./commands.js";

const shell = document.getElementById("shell");
const canvas = document.getElementById("display");
const entry = document.getElementById("entry");
const output = document.getElementById("history");

// Whenever something changes in the terminal, we scoll down (to keep the entry in view)
const config = { attributes: true, childList: true, subtree: true };
const observer = new MutationObserver((mutationList, observer) => {
  shell.scrollIntoView(false);
});
// Start observing the target node for configured mutations
observer.observe(output, config);

const entryLine = shell.querySelector(".entry-line");
const ps1 = shell.querySelector(".ps1");
const directory = shell.querySelector(".directory");

let currentDirectory = "/";
const history = [];
let historyCursor = 0;
const builtins = [...Object.keys(commands), "cd", "clear"];
const variables = { PWD: "/" };

const abs = (path) => absolute(currentDirectory, path);

const exec = (command) => {
  let stderr = undefined;
  let stdout = "";
  let status = 0;

  const argv = command.slice(1);
  const argc = argv.length;
  const env = { currentDirectory: currentDirectory };

  if (Object.keys(commands).includes(command[0])) {
    return commands[command[0]](argc, argv, env);
  }

  switch (command[0]) {
    case "":
      break;
    case "cd":
      if (argv.length !== 1) stderr = "Too many args for cd command";
      else if (argv[0] == "..") {
        let target = parent(currentDirectory);

        if (Object.keys(fileSystem.dirs).includes(target)) {
          currentDirectory = target;
          variables.PWD = target;
          directory.textContent = target;
        } else {
          stderr = `cd: The directory "${target}" does not exist`;
          status = 1;
        }
      } else {
        let target = abs(argv[0]);

        if (Object.keys(fileSystem.dirs).includes(target)) {
          currentDirectory = target;
          variables.PWD = target;
          directory.textContent = target;
        } else {
          stderr = `cd: The directory "${target}" does not exist`;
          status = 1;
        }
      }
      break;
    default:
      if (fileSystem.executables.includes(abs(command[0]))) {
        const scriptTag = document.createElement("script");
        scriptTag.type = "text/javascript";
        scriptTag.src = abs(command[0]) + ".js";
        scriptTag.id = "inject";
        const remove = (event) => {
          if (event.data == "executables-close") {
            scriptTag.remove();
            canvas.className = "inactive";
            shell.className = "active";
            const context = canvas.getContext("2d");
            context.clearRect(0, 0, canvas.width, canvas.height);
            window.removeEventListener("message", remove);
          }
        };
        window.addEventListener("message", remove);
        document.body.appendChild(scriptTag);
      } else {
        stderr = `Unknown command: ${command[0]}`;
        status = 127;
      }
      break;
  }
  return {
    stdout: stdout,
    stderr: stderr,
    statusCode: status,
  };
};

const validate = (text) => {
  const command = tokenize(currentDirectory, text)[0];
  return (
    command === "" ||
    builtins.includes(command) ||
    fileSystem.executables.includes(abs(command))
  );
};

const runCommand = (command) => {
  historyCursor = 0;
  entry.className = "valid";
  const ps1Clone = ps1.cloneNode(true);
  entry.value = "";

  const tokens = tokenize(currentDirectory, command);

  history.push(command);
  if (tokens[0] == "clear") {
    // special case to prevent clear line from ending up in the history afterwards
    // The need for this kinda implies my architechure sucks
    output.textContent = "";
  } else {
    let result = exec(tokens);

    const historyLine = document.createElement("div");
    historyLine.className = "entry-line";

    const historyCommand = document.createElement("p");
    historyCommand.textContent = command;
    historyLine.appendChild(ps1Clone);
    historyLine.appendChild(historyCommand);

    const item = document.createElement("div");
    item.className = `status-${result.statusCode}`;

    const resultPart = document.createElement("pre");
    let content = "";
    if (result.stderr !== undefined) content += result.stderr + "\n";

    content += result.stdout;
    resultPart.innerHTML = content;
    item.appendChild(historyLine);
    item.appendChild(resultPart);
    output.appendChild(item);
  }
};

entry.addEventListener("keydown", (event) => {
  if (event.keyCode == 38) {
    if (historyCursor >= history.length) {
      return;
    }
    historyCursor += 1;
    entry.value = history[history.length - historyCursor];
    return;
  } else if (event.keyCode == 40) {
    if (historyCursor == 0) {
      return;
    }
    historyCursor -= 1;

    if (historyCursor == 0) {
      entry.value = "";
    } else {
      entry.value = history[history.length - historyCursor];
    }
    return;
  } else if (event.keyCode !== 13) return;

  runCommand(entry.value);
});

entry.addEventListener("keyup", (event) => {
  if (validate(entry.value)) entry.className = "valid";
  else entry.className = "invalid";
});

const params = new Proxy(new URLSearchParams(window.location.search), {
  get: (searchParams, prop) => searchParams.get(prop),
});
if (params.bashrc) runCommand(params.bashrc);
