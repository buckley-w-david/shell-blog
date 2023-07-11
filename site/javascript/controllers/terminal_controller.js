import { Controller } from "../stimulus"

// Native javascript % returns negative values
// To get the behaviour I actually want, I have to implement it myself
function mod(n, m) {
  return ((n % m) + m) % m;
}

export class TerminalController extends Controller {
  static targets = [ "shell" ];
  static values = { active: Number };
  static outlets = [ "shell" ];

  spawn(event) {
    event.preventDefault();

    if (this.activeValue === -1) {
      this.shellTargets[0].classList.remove("d-none");
      this.activeValue = 0;
    } else {
      const newShell = this.shellTarget.cloneNode(true);
      newShell.querySelector(".history").innerHTML = "";
      this.activeShell.after(newShell);
      this.activeValue += 1;
    }
    this.refocus();
    this.resetGrid();
  }

  swapLeft(event) {
    event.preventDefault();

    this.activeValue = mod(this.activeValue - 1, this.shellTargets.length)
    this.refocus();
  }

  swapRight(event) {
    event.preventDefault();

    this.activeValue = mod(this.activeValue + 1, this.shellTargets.length)
    this.refocus();
  }

  activate(event) {
    let shell = event.target.closest(".shell");
    this.activeValue = this.shellTargets.indexOf(shell);
    this.refocus();
  }

  close(event) {
    event.preventDefault();

    // We don't delete the last shell so we still have something to clone
    if (this.shellTargets.length === 1) {
      this.shellTargets[0].querySelector(".history").innerHTML = "";
      this.shellTargets[0].classList.add("d-none");
      this.activeValue = -1;
    } else {
      this.activeShell.remove();
      this.activeValue = Math.min(this.activeValue, this.shellTargets.length-1);
      this.refocus();
    }
    this.resetGrid();
  }

  refocus() {
    this.activeShell.querySelector(".entry").focus();
  }

  resetGrid() {
    this.element.style = `--process-rows: ${Math.max(1, this.shellTargets.length-1)}; --process-columns: ${this.shellTargets.length > 1 ? 2 : 1}`
  }

  get activeShell() {
    return this.shellTargets[this.activeValue];
  }
}
