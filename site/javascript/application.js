import { Application } from "./stimulus"

import { TerminalController } from "./controllers/terminal_controller"
import { ShellController } from "./controllers/shell_controller"
import { KernalController } from "./controllers/kernal_controller"

window.Stimulus = Application.start();
Stimulus.register("kernal", KernalController);
Stimulus.register("terminal", TerminalController);
Stimulus.register("shell", ShellController);
