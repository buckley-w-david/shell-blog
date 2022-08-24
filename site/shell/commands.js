import { fileSystem } from "./filesystem.js";
import { absolute, parent } from "./utils.js";

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

const response = (stdout, stderr, status) => {
  return { stdout: stdout, stderr: stderr, status: status };
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
    const path = absolute(currentDirectory, target);
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
    console.log(currentDirectory, file, target);

    if (Object.keys(fileSystem.files).includes(target)) {
      contents.push(fileSystem.files[target]);
    } else {
      contents.push(`cat: ${file}: No such file or directory`);
    }
  }
  stdout = contents.join("\n");
  return response(stdout, stderr, status);
};

const echo = (argc, argv, env) => success(argv.join(" "));

export const commands = {
  help: help,
  ls: ls,
  echo: echo,
  cat: cat,
}
