// TODO: probably should break this up into a few files

const terminal = document.getElementById("terminal");
const entry = document.getElementById("entry");
const output = document.getElementById("history");

const entryLine = terminal.querySelector(".entry-line");
const directory = terminal.querySelector(".directory");

// WARNING: Remember to keep the different parts of this consistent
const fileSystem = {
  dirs: { 
      "/": ["blog/", "about", "785F4AB379E9C2E734EBCB88CFB8BC016685639D" ], 
      "/blog": ["hello-world", "string-interpolation-and-sql", "colour-sort", "stacksort"], 
  },
  executables: [],
  //TODO: File contents can't be in-line
  files: {
    "/about": "ABOUT CONTENT",
    "/785F4AB379E9C2E734EBCB88CFB8BC016685639D": "PUBLIC KEY",
    "/blog/hello-world": "Hello, World!", 
    "/blog/string-interpolation-and-sql": "SQL Stuff", 
    "/blog/colour-sort": "all-rgb stuff",
    "/blog/stacksort": "stacksort stuff"
  },
};
let currentDirectory = "/";
const history = [];
let historyCursor = 0;
const builtins = ["ls", "cat", "echo", "cd", "help", "clear"];
const variables = { PWD: "/" };
const helpMessage = `\
davidbuckley.ca pseudo-shell, version 0.1.0
These shell commands are defined internally.  Type \`help\' to see this list.
No, pipes and input redirection don't work.
ls [FILE]... - list directory contents
cat [FILE]... - concatenate files and print on the standard output
echo [STRING]... - display a line of text
cd dirName - Change working directory
help - What you're looking at
clear - clear the terminal screen\
`;


const absolute = (path) => {
  if (path[0] === "/") {
    return path;
  } else if (path.slice(0, 2) == "./") {
    if (currentDirectory === "/") {
      return "/" + path.slice(2);
    } else {
      return `${currentDirectory}/${path.slice(2)}`;
    }
  } else {
    if (currentDirectory === "/") {
      return "/" + path;
    } else {
      return `${currentDirectory}/${path}`;
    }
  }
};

const parent = (path) => {
  let dirParts = path.split("/").slice(0, -1);
  if (dirParts.length === 1) {
      return "/";
  } else {
      return dirParts.join("/"); 
  }
}

const exec = (command) => {
  let stderr = undefined;
  let stdout = "";
  let status = 0;

  const argv = command.slice(1);
  const argc = argv.length;

  switch (command[0]) {
    case "":
      break;
    case "help":
      stdout = helpMessage;
      break;
    case "ls":
      //: ls {{{
      let targets;
      if (!argv.length) {
        targets = [currentDirectory];
      } else {
        targets = argv;
      }

      let matches = {};
      for (let target of targets) {
        const path = absolute(target);
        if (Object.keys(fileSystem.dirs).includes(path)) {
            if (matches[path] === undefined) {
              matches[path] = [...fileSystem.dirs[path]]
            } else {
              matches[path].push(...fileSystem.dirs[path])
            }
        } else if (Object.keys(fileSystem.files).includes(path)) {
            let p = parent(path);
            if (matches[p] === undefined) {
              matches[p] = [target]
            } else {
              matches[p].push(target)
            }
        } else {
            let msg = `ls: cannot access '${target}': No such file or directory`
            if (stderr === undefined) {
                stderr = msg
            } else {
                stderr += ("\n" + msg)
            }
        }
        let keys = Object.keys(matches);
        if (keys.length === 0) {
        } else if (keys.length === 1) {
            stdout = matches[keys[0]].join(" ");
        } else {
            // Not perfect, but good enough
            let result = []
            for (let dir of keys) {
                result.push(`${dir}:\n${matches[dir].join(" ")}`)
            }
            stdout = result.join("\n\n");
        }
      }
      //#: }}}
      break;
    case "cat":
      //: cat {{{
      let contents = [];
      for (let file of argv) {
        let target = absolute(file);

        if (Object.keys(fileSystem.files).includes(target)) {
          contents.push(fileSystem.files[target]);
        } else {
          contents.push(`cat: ${file}: No such file or directory`);
        }
      }
      stdout = contents.join("\n");
      //#: }}}
      break;
    case "echo":
      //: echo {{{
      stdout = argv.join(" ");
      //#: }}}
      break;
    case "cd":
      //: cd {{{
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
        let target = absolute(argv[0]);

        if (Object.keys(fileSystem.dirs).includes(target)) {
          currentDirectory = target;
          variables.PWD = target;
          directory.textContent = target;
        } else {
          stderr = `cd: The directory "${target}" does not exist`;
          status = 1;
        }
      }
      //#: }}}
      break;
    default:
      //: script execution {{{
      if (
        command[0].substring(0, 2) == "./" &&
        fileSystem.executables.includes(absolute(command[0]))
      ) {
        // TODO local scripts
        //#: }}}
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

const expand = (text) => {
  // TODO apply globbing
  // TODO apply variable expansion
  return text;
};

const tokenize = (text) => {
  // TODO properly split command into tokens (quote handling)
  return text.trim().split(" ");
};

const validate = (text) => {
  const command = text.split(" ")[0];
  return (
    command === "" ||
    builtins.includes(command) ||
    (command.substring(0, 2) == "./" &&
      fileSystem.executables.includes(
        `${currentDirectory}/${command.substring(2)}`
      )) ||
    fileSystem.executables.includes(command)
  );
};

// TODO autofocus entry
entry.addEventListener("keydown", (event) => {
  //: history {{{
  if (event.keyCode == 38) {
      if (historyCursor >= history.length) {
          return;
      }
      historyCursor += 1;
      entry.value = history[history.length-historyCursor];
      return;
  } else if (event.keyCode == 40) {
      if (historyCursor == 0) {
          return;
      }
      historyCursor -= 1;

      if (historyCursor == 0) {
        entry.value = "";
      } else {
        entry.value = history[history.length-historyCursor];
      }
      return;
  //: }}}
  } else if (event.keyCode !== 13) {
    return;
  }

  //: exec {{{
  const entryClone = entryLine.cloneNode(true);
  entry.className = "valid";
  const command = entry.value;
  entry.value = "";

  const tokens = tokenize(command).map((token) => expand(token));

  history.push(command);
  if (tokens[0] == "clear") {
    // special case to prevent clear line from ending up in the history afterwards
    // The need for this kinda implies my architechure sucks
    output.textContent = "";
  } else {
    let result = exec(tokens);

    const item = document.createElement("div");
    item.className = `status-${result.statusCode}`;

    const resultPart = document.createElement("pre");
    if (result.stderr !== undefined) {
      resultPart.appendChild(document.createTextNode(result.stderr + "\n"));
    }
    resultPart.appendChild(document.createTextNode(result.stdout));
    item.appendChild(entryClone);
    item.appendChild(resultPart);
    output.appendChild(item);
  }
  //: }}}
});

entry.addEventListener("keyup", (event) => {
  if (validate(entry.value)) {
    entry.className = "valid";
  } else {
    entry.className = "invalid";
  }
});
