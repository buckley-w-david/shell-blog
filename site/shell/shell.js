import { fileSystem } from "./filesystem.js";
import { absolute, parent, tokenize, join } from "./utils.js";
import { commands } from "./commands.js";
import { env } from "./env.js";

const shell = document.getElementById("shell");
const canvas = document.getElementById("display");
const entry = document.getElementById("entry");
const output = document.getElementById("history");
const tabComplete = document.getElementById("tab-complete");

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

const history = [];
let historyCursor = 0;
const builtins = [...Object.keys(commands), "cd", "clear"];
const variables = { PWD: "/" };

const abs = (path) => absolute(path);

const exec = (command) => {
  let stderr = undefined;
  let stdout = "";
  let status = 0;

  const argv = command.slice(1);
  const argc = argv.length;

  if (Object.keys(commands).includes(command[0])) {
    return commands[command[0]](argc, argv);
  }

  switch (command[0]) {
    case "":
      break;
    case "cd":
      if (argv.length !== 1) stderr = "Too many args for cd command";
      else if (argv[0] == "..") {
        let target = parent(env.currentDirectory);

        if (Object.keys(fileSystem.dirs).includes(target)) {
          env.currentDirectory = target;
          variables.PWD = target;
          directory.textContent = target;
        } else {
          stderr = `cd: The directory "${target}" does not exist`;
          status = 1;
        }
      } else {
        let target = abs(argv[0]);

        if (Object.keys(fileSystem.dirs).includes(target)) {
          env.currentDirectory = target;
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
        scriptTag.dataset.argv = JSON.stringify(command.slice(1));
        const remove = (event) => {
          if (event.data.type === "executables-close") {
            scriptTag.remove();
            canvas.className = "inactive";
            shell.className = "active";
            const context = canvas.getContext("2d");
            context.clearRect(0, 0, canvas.width, canvas.height);
            window.removeEventListener("message", remove);
          } else if (event.data.type === "load-file") {
            let content = fileSystem.files[absolute(event.data.file)];
            event.source.postMessage({
              type: "file",
              content: content ? content : "",
            });
          } else if (event.data.type === "save-file") {
            let target = absolute(event.data.file);
            const dirPoint = target.lastIndexOf("/");
            const stem = target.substring(0, dirPoint + 1);
            const leaf = target.substring(dirPoint + 1, target.length);

            let dir = stem === "/" ? "/" : stem.slice(0, -1)
            if (!fileSystem.dirs[dir].includes(leaf)) {
              fileSystem.dirs[dir].push(leaf);
            }

            fileSystem.files[target] = event.data.content;
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
  const command = tokenize(text)[0];
  return (
    command === "" ||
    builtins.includes(command) ||
    fileSystem.executables.includes(abs(command))
  );
};

const completeCommand = (backwards) => {
  const emptyTab = entry.value.endsWith(" ");
  const tokens = tokenize(entry.value);

  if (tabComplete.childNodes.length !== 0) {
    if (tabComplete.dataset.selected === undefined) {
      tabComplete.dataset.selected = tabComplete.childElementCount - 1;
    }
    let idx = parseInt(tabComplete.dataset.selected);
    let mountPoint = parseInt(tabComplete.dataset.mountPoint);

    // Unset selected for previous completion
    tabComplete.childNodes[idx].className = "";

    idx = (idx + 1 - 2 * backwards) % tabComplete.childElementCount;

    const selected = tabComplete.childNodes[idx];
    selected.className = "selected";
    tabComplete.dataset.selected = idx;

    if (emptyTab) {
      tokens.push(selected.textContent);
    } else {
      tokens[tokens.length - 1] =
        tokens[tokens.length - 1].substring(0, mountPoint + 1) +
        selected.textContent;
    }
    entry.value = tokens.join(" ");
  } else {
    const completionElement = emptyTab ? "" : tokens[tokens.length - 1];
    const mountPoint = completionElement.lastIndexOf("/");
    const completeCommand =
      tokens.length === 0 || (tokens.length === 1 && !emptyTab && mountPoint < 1);

    const base = absolute(completionElement.substring(0, mountPoint + 1));
    const last = completionElement.substring(
      mountPoint + 1,
      completionElement.length
    );

    const directories = fileSystem.dirs[base].filter(item => item.endsWith("/"));
    const targets = completeCommand ? builtins.concat(directories) : fileSystem.dirs[base];

    const matches = [];
    for (let file of targets) {
      if (file.startsWith(last)) {
        const span = document.createElement("span");
        span.textContent = file;
        matches.push(span);
      }
    }

    tabComplete.dataset.mountPoint = mountPoint;
    if (matches.length == 1) {
      if (emptyTab) tokens.push(matches[0].textContent);
      else
        tokens[tokens.length - 1] =
          tokens[tokens.length - 1].substring(0, mountPoint + 1) +
          matches[0].textContent;
    } else if (matches.length > 1) {
      for (let span of matches) {
        tabComplete.appendChild(span);
      }
    }
    entry.value = tokens.join(" ") + (emptyTab ? " " : "");
  }
};

const runCommand = (command) => {
  historyCursor = 0;
  entry.className = "valid";
  const ps1Clone = ps1.cloneNode(true);
  entry.value = "";

  const tokens = tokenize(command);

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
  if (event.keyCode !== 9 && event.keyCode !== 16) {
    tabComplete.innerHTML = "";
    delete tabComplete.dataset.selected;
    delete tabComplete.dataset.mountPoint;
  }

  if (event.keyCode == 38) {
    event.preventDefault();
    if (historyCursor >= history.length) {
      return;
    }
    historyCursor += 1;
    let content = history[history.length - historyCursor];
    entry.value = content;
    entry.setSelectionRange(content.length, content.length);
    return;
  } else if (event.keyCode == 40) {
    event.preventDefault();
    if (historyCursor == 0) {
      return;
    }
    historyCursor -= 1;

    if (historyCursor == 0) {
      entry.value = "";
    } else {
      let content = history[history.length - historyCursor];
      entry.value = content;
      entry.setSelectionRange(content.length, content.length);
    }
    return;
  } else if (event.keyCode === 9 && env.tabComplete) {
    event.preventDefault();
    completeCommand(event.shiftKey);
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
