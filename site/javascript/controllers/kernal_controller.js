import { Controller } from "../stimulus.js"
import { makeAbsolute, fileSystem } from "../shell.js";

export class KernalController extends Controller {
  static targets = [ "shell", "terminal", "process" ];
  static outlets = [ "shell", "terminal" ];

  syscall(event) {
    switch (event.detail.type) {
      case "spawn":
        const scriptTag = document.createElement("script");
        scriptTag.type = "text/javascript";
        // Instead of explicitly sending pwd, should we send the whole shell and have this "inherit" the pwd?
        scriptTag.src = makeAbsolute(event.detail.pwd, event.detail.exe) + ".js";

        const processId = `process-${this.processTargets.length}`;
        scriptTag.dataset.processId = processId;

        const process = document.createElement("div");
        process.dataset.kernalTarget = "process";
        // FIXME: If a shell is deleted while an exe is running this index will be incorrect.
        //        I think we have to give each a unique ID (somehow) and look them up by that
        process.dataset.shellIndex = this.terminalOutlet.activeValue;
        process.dataset.pwd = event.detail.pwd;
        process.dataset.argv = JSON.stringify(event.detail.args);

        process.id = processId;
        process.className = 'process'
        process.appendChild(scriptTag);

        const activeShell = this.shellOutlets[this.terminalOutlet.activeValue];
        this.terminalTarget.insertBefore(process, activeShell.element);
        activeShell.hide();
        break;
      case "read":
        let name = makeAbsolute(event.detail.source.dataset.pwd, event.detail.file);
        let content = fileSystem.files[name];
        // FIXME: I don't love this implementation of responses
        const response = new CustomEvent("syscall-response", { detail: { type: "read", content: content ? content : "", } });
        event.detail.source.dispatchEvent(response);
        break;
      case "write":
        let target = makeAbsolute(event.detail.source.dataset.pwd, event.detail.file);
        const dirPoint = target.lastIndexOf("/");
        const stem = target.substring(0, dirPoint + 1);
        const leaf = target.substring(dirPoint + 1, target.length);

        let dir = stem === "/" ? "/" : stem.slice(0, -1);
        if (!fileSystem.dirs[dir].includes(leaf)) {
          fileSystem.dirs[dir].push(leaf);
        }

        fileSystem.files[target] = event.detail.content;
        break;
      case "exit":
        const exitingProcess = event.detail.process;
        this.shellOutlets[parseInt(exitingProcess.dataset.shellIndex)].show();
        exitingProcess.remove();
        break;
    }
  }
}
