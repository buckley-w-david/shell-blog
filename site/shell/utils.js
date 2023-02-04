import { fileSystem } from "./filesystem.js";
import { env } from "./env.js";

export const absolute = (path) => {
  if (path[0] !== "/") {
    if (env.currentDirectory === "/") path = `/${path}`;
    else path = `${env.currentDirectory}/${path}`;
  }
  if (path.slice(-1) === "/" && path !== "/") {
    path = path.slice(0, -1);
  }

  let result = path.split("/").reduce((acc, part) => {
    if (part === ".") return acc;
    else if (part === "..") return parent(acc);
    else {
      if (acc === "/") return "/" + part;
      else return `${acc}/${part}`;
    }
  });

  return result;
};

export const parent = (path) => {
  let dirParts = path.split("/").slice(0, -1);

  if (dirParts.length === 1) return "/";
  else return dirParts.join("/");
};

export const tokenize = text => {
  // TODO apply variable expansion
  // TODO support escaping quotes

  let tokens = [];
  let buffer = "";
  let glob = false;

  const push = (t) => {
    if (glob) {
      let ref = absolute(env.currentDirectory, t);
      let dir = parent(ref); // FIXME: Handle more than one level of globbing
      const re = new RegExp("^" + t.replaceAll("*", ".*") + "/?$");

      let files = [];

      for (let d of fileSystem.dirs[dir]) {
        if (re.test(d)) {
          files.push(d);
        }
      }

      if (files.length === 0) tokens.push(buffer)
      else tokens.push(...files)
    } else {
      tokens.push(t);
    }
  }

  for (let i = 0; i < text.length; i++) {
    let c = text[i];

    if (c === ' ') {
      push(buffer);
      buffer = '';
      glob = false;
    } else if (c === '"' ) {
        i++;
        while( i < text.length && text[i] !== '"' ) { buffer += text[i++]; }
    } else {
      glob ||= (c === "*");
      buffer += c; 
    }
  }
  if (buffer || tokens.length == 0) push(buffer);

  return tokens;
};

export const complete = () => {
  const entry = document.getElementById("entry");
  const tabComplete = document.getElementById("tab-complete");
  if (event.keyCode == 9) {
    event.preventDefault();
    const tokens = tokenize(entry.value);

    if (tabComplete.textContent !== "") {
      if (tabComplete.dataset.selected === undefined) {
        tabComplete.dataset.selected = tabComplete.childElementCount-1;
      }
      let idx = parseInt(tabComplete.dataset.selected);

      // Unset selected for previous completion
      tabComplete.childNodes[idx].className = "";

      idx = (idx + 1) % tabComplete.childElementCount;

      const selected = tabComplete.childNodes[idx];
      selected.className = "selected"
      tabComplete.dataset.selected = idx;

      tokens[tokens.length-1] = selected.textContent;
      entry.value = tokens.join(" ");
    } else {
      const completionElement = tokens[tokens.length-1];
      const matches = [];
      for (let file of fileSystem.dirs[env.currentDirectory]) {
        if (file.startsWith(completionElement)) {
          const span =  document.createElement("span");
          span.textContent = file
          matches.push(span);
        }
      }
      if (matches.length == 1) {
        tokens[tokens.length-1] = matches[0].textContent;
      } else if (matches.length > 1) {
        for (let span of matches) {
          tabComplete.appendChild(span);
        }
      }
      entry.value = tokens.join(" ");
    }
  } else {
    tabComplete.innerHTML = "";
  }
}
