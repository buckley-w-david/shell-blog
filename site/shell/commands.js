import { fileSystem } from "./filesystem.js";
import { absolute, parent } from "./utils.js";

const helpMessage = `\
davidbuckley.ca pseudo-shell, version 0.1.0
These shell commands are defined internally.  Type \`help\' to see this list.
No, pipes and input redirection don't work.
ls [FILE]... - list directory contents.
cat [FILE]... - concatenate files and print on the standard output. Supports Images.
open [FILE] - open up a given resource in a new tab.
echo [STRING]... - display a line of text.
cd dirName - change working directory.
help - you're looking at it.
clear - clear the terminal screen\
`;

const response = (stdout, stderr, status) => {
  return { stdout: stdout, stderr: stderr, statusCode: status };
};
const success = (stdout) => response(stdout, undefined, 0);

const help = (argc, argv, env) => success(helpMessage);
const ls = (argc, argv, env) => {
  const currentDirectory = env.currentDirectory;
  let stdout = "";
  let stderr = undefined;
  let status = 0;

  let targets;
  if (!argv.length) {
    targets = [currentDirectory];
  } else {
    targets = argv;
  }

  let matches = {};
  for (let target of targets) {
    let path = absolute(currentDirectory, target);

    // Remove "/" characters at the end of directories
    // It's a bit of a hack, but meh
    if (
      path !== "/" &&
      path.slice(-1) === "/" &&
      Object.keys(fileSystem.dirs).includes(path.slice(0, -1))
    ) {
      path = path.replace(/\/$/, "");
    }

    if (Object.keys(fileSystem.dirs).includes(path)) {
      if (matches[path] === undefined) {
        matches[path] = [...fileSystem.dirs[path]];
      } else {
        matches[path].push(...fileSystem.dirs[path]);
      }
    } else if (Object.keys(fileSystem.files).includes(path)) {
      let p = parent(path);
      if (matches[p] === undefined) {
        matches[p] = [target];
      } else {
        matches[p].push(target);
      }
    } else {
      status = 2;
      let msg = `ls: cannot access '${target}': No such file or directory`;
      if (stderr === undefined) {
        stderr = msg;
      } else {
        stderr += "\n" + msg;
      }
    }
    let keys = Object.keys(matches);
    if (keys.length === 0) {
    } else if (keys.length === 1) {
      stdout = matches[keys[0]].join(" ");
    } else {
      // Not perfect, but good enough
      let result = [];
      for (let dir of keys) {
        result.push(`${dir}:\n${matches[dir].join(" ")}`);
      }
      stdout = result.join("\n\n");
    }
  }
  return response(stdout, stderr, status);
};

const cat = (argc, argv, env) => {
  const currentDirectory = env.currentDirectory;
  let status = 0;
  let stdout = "";
  let stderr = undefined;
  let contents = [];
  for (let file of argv) {
    let target = absolute(currentDirectory, file);

    if (Object.keys(fileSystem.files).includes(target)) {
      contents.push(fileSystem.files[target]);
    } else {
      contents.push(`cat: ${file}: No such file or directory`);
    }
  }
  stdout = contents.join("\n");
  return response(stdout, stderr, status);
};

const open = (argc, argv, env) => {
  if (argc !== 1) {
    return response("", "Too many args for open command", 1);
  }
  let target = absolute(env.currentDirectory, argv[0]);
  if (Object.keys(fileSystem.files).includes(target)) {
    if (target.slice(-3) === ".md") {
      target = target.slice(0, -3) + ".html";
    }
    window.open(target, "_blank");
    return success("");
  } else {
    return response("", `open: ${argv[0]}: No such file`, 1);
  }
};

const echo = (argc, argv, env) => success(argv.join(" "));

export const commands = {
  help: help,
  ls: ls,
  echo: echo,
  cat: cat,
  open: open,
};
