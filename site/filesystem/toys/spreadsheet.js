(async () => {
  const thisScript = document.currentScript;
  const process = document.getElementById(thisScript.dataset.processId);

  let spreadsheet = {
    rawValues: {},
    dependencies: {},
    dependants: {},
    formula: {},
  };

  const rowLabel = y => {
    return y + 1;
  };

  const columnLabel = x => {
    let label = "";
    while (x >= 0) {
      label = String.fromCharCode(65 + (x % 26)) + label;
      x = Math.floor(x / 26) - 1;
    }

    return label;
  }

  const extractReferences = formula => {
    const regex = /([A-Z]+)(\d+)/g;
    const references = [];
    let match;

    while ((match = regex.exec(formula)) !== null) {
      references.push(match[0]);
    }

    return references;
  }

  const recalculateDag = (cellLabel, row, column) => {
    let formula = spreadsheet.rawValues[cellLabel]

    let references = extractReferences(formula);

    // Remove cellLabel from the dependants of any cells it used to depend on
    spreadsheet.dependencies[cellLabel]?.forEach(label => {
      if ((label in spreadsheet.dependants) === false)
        spreadsheet.dependants[label] = new Set();
      spreadsheet.dependants[label].delete(cellLabel);
    });

    if (formula[0] === "=") {
      // Overwrite the dependancies with the new references
      spreadsheet.dependencies[cellLabel] = new Set(references);

      // Add cellLabel to dependants of new references
      references.forEach(label => {
        if (label in spreadsheet.dependants === false)
          spreadsheet.dependants[label] = new Set();

        spreadsheet.dependants[label].add(cellLabel)
      });

      let body = `
        "use strict";
        function ROW() {
          return ${row};
        }
        function COLUMN() {
          return ${column};
        }
        return (${formula.slice(1)});
      `;

      spreadsheet.formula[cellLabel] = new Function(...references, body);
    } else {
      // Static cells can't depend on anything
      spreadsheet.dependencies[cellLabel]?.clear();
      if (cellLabel in spreadsheet.formula)
        delete spreadsheet.formula[cellLabel];

    }
  };

  function isNumeric(str) {
    if (typeof str != "string") return false
    return !isNaN(str) && !isNaN(parseFloat(str))
  }

  let cache = {};

  const invalidateCache = label => {
    delete cache[label];

    if (label in spreadsheet.dependants === false)
      return;

    let history = new Set(label);
    let stack = Array.from(spreadsheet.dependants[label]);
    while (stack.length > 0) {
      let label = stack.pop();
      if (history.has(label)) {
        console.log('Ahhhhhhhhhhhhhhh!');
        cache = {};
        return;
      }
      history.add(label);

      if (label in spreadsheet.dependants)
        stack.push(...spreadsheet.dependants[label])

      delete cache[label];
    }
  };

  const handleCellUpdate = event => {
    let label = event.target.id;
    let row = parseInt(event.target.dataset.row);
    let column = parseInt(event.target.dataset.column);

    if (isNumeric(event.target.value))
      spreadsheet.rawValues[label] = parseFloat(event.target.value);
    else
      spreadsheet.rawValues[label] = event.target.value;

    recalculateDag(label, row+1, column+1);
    invalidateCache(label);
  }

  const replaceWithFormula = event => {
    if (event.target.id in spreadsheet.rawValues) {
      event.target.value = spreadsheet.rawValues[event.target.id];
    }
  }

  const calculateCell = cellLabel => {
    if (cellLabel in cache)
      return cache[cellLabel];

    let value;
    if (cellLabel in spreadsheet.formula) {
      let values = [];
      if (cellLabel in spreadsheet.dependencies)
        values = Array.from(spreadsheet.dependencies[cellLabel].values(), label => calculateCell(label));

      value = spreadsheet.formula[cellLabel](...values);
    } else {
      value = spreadsheet.rawValues[cellLabel];
    }

    cache[cellLabel] = value;
    return value
  }

  const replaceWithValue = event => {
    let label = event.target.id;

    let value = calculateCell(label);
    if (value !== undefined)
      event.target.value = value;

    if ((label in spreadsheet.dependants) === false)
      return;

    let stack = Array.from(spreadsheet.dependants[label]);
    while (stack.length > 0) {
      let label = stack.pop();
      if (label in spreadsheet.dependants)
        stack.push(...spreadsheet.dependants[label])

      let value = calculateCell(label);
      if (value !== undefined)
        document.getElementById(label).value = value;
    }
  }

  const container = document.createElement("div");
  container.className = "container";

  const styles = document.createElement("style");
  styles.innerText = `
    .spreadsheet-container {
      margin-top: 20px;
    }

    .spreadsheet {
      display: grid;
      grid-template-columns: 50px repeat(26, 100px);
      grid-auto-rows: 30px;
      border: 1px solid #ccc;
    }

    .cell {
      border: 1px solid #ddd;
      padding: 4px;
      display: flex;
      align-items: center;
      white-space: nowrap;
    }

    .cell input {
      border: none;
    }

    .header-cell {
      font-weight: bold;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .row-header {
      font-weight: bold;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  `;
  const spreadsheetElem = document.createElement("div");
  spreadsheetElem.className = "spreadsheet";

  let rowCount = 99;
  let columnCount = 26;

  const topLeftCell = document.createElement('div');
  topLeftCell.className = 'cell header-cell';
  spreadsheetElem.appendChild(topLeftCell);

  for (let col = 0; col < columnCount; col++) {
    const headerCell = document.createElement('div');
    headerCell.className = 'cell header-cell';
    headerCell.textContent = columnLabel(col);
    spreadsheetElem.appendChild(headerCell);
  }


  for (let y = 0; y < rowCount; y++) {
    const rowHeader = document.createElement('div');
    rowHeader.className = 'cell row-header';
    rowHeader.textContent = rowLabel(y);
    spreadsheetElem.appendChild(rowHeader);

    for (let x = 0; x < columnCount; x++) {
      const cell = document.createElement("div");
      cell.className = 'cell';

      let inp = document.createElement("input");
      inp.id = `${columnLabel(x)}${rowLabel(y)}`;
      inp.type = 'text';
      inp.dataset.row = y;
      inp.dataset.column = x;

      inp.addEventListener("change", handleCellUpdate)
      inp.addEventListener("focus", replaceWithFormula)
      inp.addEventListener("blur", replaceWithValue)

      cell.appendChild(inp);
      spreadsheetElem.appendChild(cell);
    }
  }

  container.appendChild(styles);
  container.appendChild(spreadsheetElem);
  process.appendChild(container);

  await new Promise((resolve, reject) => {
    const controls = event => {
      // ctrl-d
      if (event.ctrlKey && event.keyCode === 68) {
        window.removeEventListener("keydown", controls);
        event.preventDefault();
        resolve();
      }
    };
    // FIXME: We shouldn't use window for this
    window.addEventListener("keydown", controls);
  });

  const event = new CustomEvent("syscall", { detail: { type: "exit", process: process } });
  window.dispatchEvent(event);
})();
