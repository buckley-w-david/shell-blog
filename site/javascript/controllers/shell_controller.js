import { Controller } from "../stimulus.js"
import { fileSystem, makeCommands, tokenize, makeAbsolute, parent, env  } from "../shell.js";

// Native javascript % returns negative values
// To get the behaviour I actually want, I have to implement it myself
function mod(n, m) {
  return ((n % m) + m) % m;
}

// FIXME Would be nice to find some way to modularize
//       Originally completions and history were in their own controller but that got messy with responsability over data (pwd)
//       and communication between controllers
export class ShellController extends Controller {
  static targets = [ "entry", "directory", "ps1", "history", "entryLine", "complete" ];
  static values = { completeSelected: Number, completeMount: Number, pwd: String }

  initialize() {
    this.history = [];
    this.historyCursor = 0;
    this.variables = {};
    this.commands = makeCommands(this);
    // FIXME This is a bad name
    this.builtins = [...Object.keys(this.commands), "cd", "clear"];

    // FIXME this will run when spawning new shells instead of just at startup time in the first shell
    const params = new Proxy(new URLSearchParams(window.location.search), {
      get: (searchParams, prop) => searchParams.get(prop),
    });

    if (params.bashrc) {
      this.entryTarget.value = params.bashrc;
      this.execute();
    }
  }

  execute(event) {
    if (event) event.preventDefault();

    let entry = this.entryTarget;

    let command = entry.value;
    this.history.push(command);
    this.historyCursor = 0;

    entry.classList.remove("invalid");
    entry.classList.add("valid");
    entry.value = "";

    const tokens = tokenize(this.pwdValue, command);

    const executable = tokens[0];
    const argv = tokens.slice(1);
    const argc = argv.length;
    let result = {
      stderr: undefined,
      stdout: "",
      statusCode: 0,
    }

    switch (executable) {
    case "clear":
      // special case to prevent clear line from ending up in the history afterwards
      // The need for this kinda implies my architechure sucks
      // If we didn't need this then output generation could be consistent across all branches
      this.historyTarget.textContent = "";
      break;
    case "cd":
      if (argv.length !== 1) result.stderr = "Too many args for cd command";
      else if (argv[0] == "..") {
        let target = parent(this.pwdValue);

        if (Object.keys(fileSystem.dirs).includes(target)) {
          this.pwdValue = target;
          this.variables.PWD = target;
        } else {
          result.stderr = `cd: The directory "${target}" does not exist`;
          result.statusCode = 1;
        }
      } else {
        let target = makeAbsolute(this.pwdValue, argv[0]);

        if (Object.keys(fileSystem.dirs).includes(target)) {
          this.pwdValue = target;
          this.variables.PWD = target;
        } else {
          result.stderr = `cd: The directory "${target}" does not exist`;
          result.statusCode = 1;
        }
      }

      this.output(command, result);
      break;
    default:
      if (Object.keys(this.commands).includes(executable)) {
        // FIXME need to inject tihs.pwdValue into commnd scope somehow
        //       probably just by making it an argument
        result = this.commands[executable](argc, argv);
      } else if (fileSystem.executables.includes(makeAbsolute(this.pwdValue, executable))) {
        const event = new CustomEvent("syscall", { detail: { type: "spawn", exe: executable, args: argv, pwd: this.pwdValue }});
        window.dispatchEvent(event);
      } else {
        result.stderr = `Unknown command: ${executable}`;
        result.statusCode = 127;
      }

      this.output(command, result);
      break;
    }

    this.directoryTargets[this.directoryTargets.length-1].textContent = this.pwdValue;
    this.entryTarget.scrollIntoView(false);
  }

  output(command, result) {
    const ps1Clone = this.ps1Targets[this.ps1Targets.length-1].cloneNode(true);

    const historyLine = document.createElement("div");
    historyLine.className = "entry-line";

    const historyCommand = document.createElement("p");
    historyCommand.textContent = command;
    historyLine.appendChild(ps1Clone);
    historyLine.appendChild(historyCommand);

    const item = document.createElement("div");
    item.className = `status-${result.statusCode}`;

    // Jank
    // Markdown files go through a process I call "markupsidedown"
    // This transforms them into html documents that _look_ like markdown
    // As such, they shouldn't be displayed with just a pre tag
    let resultPart;
    if (command == "latest" || (command.slice(0, 4) === "cat " && command.slice(command.length-3, command.length) === ".md")) {
      resultPart = document.createElement("div");
      resultPart.className = "blog-post";
    } else {
      resultPart = document.createElement("pre");
    }
    let content = "";
    if (result.stderr !== undefined) content += result.stderr + "\n";

    content += result.stdout;
    resultPart.innerHTML = content;
    item.appendChild(historyLine);
    item.appendChild(resultPart);
    this.historyTarget.appendChild(item);
  }

  validate() {
    const command = tokenize(this.pwdValue, this.entryTarget.value)[0];
    const valid = (
      command === "" ||
      this.builtins.includes(command) ||
      fileSystem.executables.includes(makeAbsolute(this.pwdValue, command))
    );

    if (valid) {
      this.entryTarget.classList.remove("invalid");
      this.entryTarget.classList.add("valid");
    } else {
      this.entryTarget.classList.remove("valid");
      this.entryTarget.classList.add("invalid");
    }
  }

  hide() {
    this.element.classList.add("d-none");
  }

  show() {
    this.element.classList.remove("d-none");
  }

  // =================== History ========================
  historyBack(event) {
    event.preventDefault();

    if (this.historyCursor >= this.history.length) {
      return;
    }

    this.historyCursor += 1;
    let content = this.history[this.history.length - this.historyCursor];
    this.entryTarget.value = content;
    this.entryTarget.setSelectionRange(content.length, content.length);

    return;
  }

  historyForward(event) {
    event.preventDefault();

    if (this.historyCursor == 0) {
      return;
    }
    this.historyCursor -= 1;

    if (this.historyCursor == 0) {
      this.entryTarget.value = "";
    } else {
      let content = this.history[this.history.length - this.historyCursor];
      this.entryTarget.value = content;
      this.entryTarget.setSelectionRange(content.length, content.length);
    }

    return;
  }

  // =================== Completions ========================
  completionBack(event) {
    if (!env.tabComplete) return;
    event.preventDefault();

    this.completeCommand(true);
    this.completeTarget.scrollIntoView(false);
  }

  completionForward(event) {
    if (!env.tabComplete) return;
    event.preventDefault();

    this.completeCommand(false);
    this.completeTarget.scrollIntoView(false);
  }

  completionClear(event) {
    // Clear completions on every key except tab/shift
    if (event.keyCode === 9 || event.keyCode === 16) return;

    this.completeTarget.innerHTML = "";
    this.mountValue = -1;
    this.completeSelectedValue = -1;
  }

  // TODO: Clean this up
  completeCommand(backwards) {
    const emptyTab = this.entryTarget.value.endsWith(" ");
    const tokens = tokenize(this.pwdValue, this.entryTarget.value);

    if (this.completeTarget.childNodes.length !== 0) {
      if (this.completeSelectedValue === -1) {
        this.completeSelectedValue = this.completeTarget.childElementCount - 1;
      }
      // Unset selected for previous completion
      this.completeTarget.childNodes[this.completeSelectedValue].className = "";

      const idx = mod(this.completeSelectedValue + 1 - 2 * backwards, this.completeTarget.childElementCount);

      const selected = this.completeTarget.childNodes[idx];
      selected.className = "selected";
      this.completeSelectedValue = idx;

      if (emptyTab) {
        tokens.push(selected.textContent);
      } else {
        tokens[tokens.length - 1] =
          tokens[tokens.length - 1].substring(0, this.mountValue + 1) +
          selected.textContent;
      }
      this.entryTarget.value = tokens.join(" ");
    } else {
      const completionElement = emptyTab ? "" : tokens[tokens.length - 1];
      const mountPoint = completionElement.lastIndexOf("/");
      const completeCommand =
        tokens.length === 0 ||
        (tokens.length === 1 && !emptyTab && mountPoint < 1);

      const base = makeAbsolute(this.pwdValue, completionElement.substring(0, mountPoint + 1));
      const last = completionElement.substring(
        mountPoint + 1,
        completionElement.length
      );

      const directories = fileSystem.dirs[base].filter((item) =>
        item.endsWith("/")
      );
      const targets = completeCommand
        ? this.builtins.concat(directories)
        : fileSystem.dirs[base];

      const matches = [];
      for (let file of targets) {
        if (file.startsWith(last)) {
          const span = document.createElement("span");
          span.textContent = file;
          matches.push(span);
        }
      }

      this.mountValue = mountPoint;
      if (matches.length == 1) {
        if (emptyTab) tokens.push(matches[0].textContent);
        else
          tokens[tokens.length - 1] =
            tokens[tokens.length - 1].substring(0, mountPoint + 1) +
            matches[0].textContent;
      } else if (matches.length > 1) {
        for (let span of matches) {
          this.completeTarget.appendChild(span);
        }
      }
      this.entryTarget.value = tokens.join(" ") + (emptyTab ? " " : "");
    }
  }
}
