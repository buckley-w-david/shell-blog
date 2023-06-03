import { fileSystem } from "./filesystem.js";
import { absolute, parent, join } from "./utils.js";
import { env } from "./env.js";

const helpMessage = `\
davidbuckley.ca pseudo-shell, version 0.1.0
These shell commands are defined internally.  Type \`help\' to see this list.
No, pipes and input redirection don't work.
ls [FILE]... - list directory contents.
cat [FILE]... - concatenate files and print on the standard output. Supports Images.
open [FILE] - open up a given resource in a new tab.
echo [STRING]... - display a line of text.
tree [FILE] - list contents of directories in a tree-like format.
latest - display the content of the latest blog post
cd dirName - change working directory.
help - you're looking at it.
clear - clear the terminal screen
disable-tab-complete - Disables tab completion of filenames. Available for accessability purposes.\
`;

const response = (stdout, stderr, status) => {
  return { stdout: stdout, stderr: stderr, statusCode: status };
};
const success = (stdout) => response(stdout, undefined, 0);

const help = (argc, argv) => success(helpMessage);
const ls = (argc, argv) => {
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
    let path = absolute(target);

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

const cat = (argc, argv) => {
  if (argc == 0) {
    let images = fileSystem.dirs["/assets/shelley"];
    argv = ["/assets/shelley/" + images[Math.floor(Math.random()*images.length)]];
  }

  const currentDirectory = env.currentDirectory;
  let status = 0;
  let stdout = "";
  let stderr = undefined;
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
  return response(stdout, stderr, status);
};

const open = (argc, argv) => {
  if (argc !== 1) {
    return response("", "Too many args for open command", 1);
  }
  let target = absolute(argv[0]);
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

const echo = (argc, argv) => success(argv.join(" "));

const _tree = (root, prefix) => {
  let contents = [];
  let nodes = fileSystem.dirs[root];

  for (let [i, node] of nodes.entries()) {
    if (i === nodes.length - 1) {
      contents.push(prefix + "└── " + node);
    } else {
      contents.push(prefix + "├── " + node);
    }
    if (node.endsWith("/")) {
      let name = node.substring(0, node.length - 1);
      let dir = join(root, name);
      contents = contents.concat(_tree(dir, prefix + "│   "));
    }
  }
  return contents;
};

const tree = (argc, argv) => {
  let root, vroot;
  if (argc == 0) {
    root = env.currentDirectory;
    vroot = ".";
  } else {
    root = absolute(argv[0]);
    vroot = argv[0];
  }
  let contents = [vroot].concat(_tree(root, ""));
  let stdout = contents.join("\n");
  return response(stdout, undefined, 0);
};

const latest = (argc, argv) => {
  const file = fileSystem.dirs["/blog"][0];
  const content = fileSystem.files[`/blog/${file}`];
  return success(content);
}

const toggleTabComplete = (argc, argv) => {
  env.tabComplete = !env.tabComplete;
  return success("");
};

export const commands = {
  help: help,
  ls: ls,
  echo: echo,
  cat: cat,
  open: open,
  tree: tree,
  latest: latest,
  "disable-tab-complete": toggleTabComplete,
};
