(async () => {
  const shell = document.getElementById("shell");
  if (shell) shell.className = "inactive";
  const thisScript = document.getElementById("inject");
  const argv = JSON.parse(thisScript.dataset.argv);

  window.postMessage({
    type: "load-file",
    file: argv[0],
  });

  let fileContent = "";
  await new Promise((resolve, reject) => {
    const remove = (event) => {
      if (event.data.type == "file") {
        fileContent = event.data.content;
        window.removeEventListener("message", remove);
        resolve();
      }
    };
    window.addEventListener("message", remove);
  });

  const container = document.createElement("div");
  container.className = "container";

  const styles = document.createElement("style");
  styles.innerText = `
  .editor {
    width: 100%;
    counter-reset: lineNo -1;
    margin-bottom: 60px;
    /*border-collapse: collapse;*/
  }
  .line:focus-within {
    border-bottom: white solid 1px;
  }
  .line-number {
    text-align: right;
    counter-increment: lineNo;
    width: 0;
  }
  .line-number::before {
    content: counter(lineNo)" ";
    color: #e5b566
  }
  .line-content {
    border: none;
    resize: none;
    outline: none;
    width: 100%;
  }
  .instructions {
    position: fixed;
    bottom: 0;
    display: grid;
    gap: 5px;
    background-color: var(--main-bg-color);
    width: 100%;
    height: 50px;
    padding: 5px 0;
  }
  .message {
    width: 100%;
    position: fixed;
    bottom: 60px;
    text-align: center;
    background-color: unset;
  }
  .message .content {
    -webkit-filter: invert(100%);
    filter: invert(100%);
  }
  .instructions .shortcut {
    -webkit-filter: invert(100%);
    filter: invert(100%);
  }
  `;

  let table;
  const createRow = (lineContent) => {
    const row = document.createElement("tr");
    row.className = "line";
    const lineCell = document.createElement("td");
    lineCell.className = "line-number";

    const textCell = document.createElement("input");
    textCell.className = "line-content";
    textCell.type = "text";
    textCell.value = lineContent;

    textCell.addEventListener("keydown", (event) => {
      if (event.keyCode === 38 || event.keyCode === 40) {
        // Up/Down Arrow
        let sibling =
          event.keyCode === 38
            ? row.previousElementSibling
            : row.nextElementSibling;
        if (sibling) {
          event.preventDefault();
          let target = sibling.childNodes[1];
          target.focus();
          target.setSelectionRange(
            textCell.selectionStart,
            textCell.selectionStart
          );
        }
      } else if (event.keyCode === 13) {
        // Enter
        event.preventDefault();
        let currentText = textCell.value;
        textCell.value = currentText.slice(0, textCell.selectionStart);
        let newRow = createRow(currentText.slice(textCell.selectionStart));

        if (row.nextElementSibling) {
          table.insertBefore(newRow, row.nextElementSibling);
        } else table.appendChild(newRow);
        newRow.childNodes[1].focus();
        newRow.childNodes[1].setSelectionRange(0, 0);
      } else if (event.keyCode === 8 && textCell.selectionStart === 0) {
        // Backspace
        if (row.previousElementSibling) {
          let target = row.previousElementSibling.childNodes[1];
          event.preventDefault();
          let sel = target.value.length;
          target.value += textCell.value;
          target.focus();
          target.setSelectionRange(sel, sel);
          row.remove();
        }
      } else if (
        event.keyCode === 46 &&
        textCell.selectionStart === textCell.value.length
      ) {
        // Delete
        if (row.nextElementSibling) {
          event.preventDefault();
          let target = row.nextElementSibling.childNodes[1];
          let sel = textCell.value.length;
          textCell.value += target.value;
          target.parentElement.remove();
          textCell.setSelectionRange(sel, sel);
        }
      }
    });

    row.appendChild(lineCell);
    row.appendChild(textCell);
    return row;
  };

  const createTable = (lines) => {
    const table = document.createElement("table");
    table.className = "editor";
    for (let line of lines) {
      let row = createRow(line);
      table.appendChild(row);
    }
    return table;
  };

  const createInstruction = (shortcut, description) => {
    const inst = document.createElement("span");
    inst.textContent = shortcut;
    inst.className = "shortcut";

    const para = document.createElement("p");
    para.innerHTML = `${inst.outerHTML} ${description}`;
    para.className = "instruction";

    return para;
  };

  const render = () => {
    return Array.from(table.querySelectorAll("input"))
      .map((inp) => inp.value)
      .join("\n");
  };

  let lines = fileContent.split("\n");
  table = createTable(lines);

  const message = document.createElement("p");
  message.className = "message"

  const instructions = document.createElement("div");
  instructions.className = "instructions";
  instructions.appendChild(createInstruction("^O", "Write Out"));
  instructions.appendChild(createInstruction("^X", "Exit"));

  container.appendChild(styles);
  container.appendChild(table);
  container.appendChild(message);
  container.appendChild(instructions);

  thisScript.parentElement.insertBefore(container, thisScript);

  table.childNodes[0].childNodes[1].focus();
  table.childNodes[0].childNodes[1].setSelectionRange(0, 0);

  await new Promise((resolve, reject) => {
    table.addEventListener("keydown", (event) => {
      if (event.ctrlKey && event.keyCode === 88) {
        // ctrl-x
        event.preventDefault();
        resolve();
      } else if (event.ctrlKey && event.keyCode === 79) {
        // ctrl-o
        // TODO: Feedback
        let count = table.childElementCount;
        message.innerHTML = `<span class="content">[ Wrote ${count} line${ count === 1 ? "" : "s" } ]</span>`;
        event.preventDefault();
        window.postMessage({
          type: "save-file",
          file: argv[0],
          content: render(),
        });
      }
    });
  });

  container.remove();
  if (shell) {
    shell.className = "active";
    shell.querySelector("#entry").focus();
  }
  window.postMessage({ type: "executables-close" });
})();
