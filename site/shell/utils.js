import { fileSystem } from "./filesystem.js";

export const absolute = (currentDirectory, path) => {
  if (path[0] !== "/") {
    if (currentDirectory === "/") path = `/${path}`;
    else path = `${currentDirectory}/${path}`;
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

export const tokenize = (currentDirectory, text) => {
  // TODO apply variable expansion

  let tokens = [];
  let buffer = "";
  let glob = false;

  const push = (t) => {
    if (glob) {
      let ref = absolute(currentDirectory, t);
      let dir = parent(ref); // FIXME: Handle more than one level of globbing
      const re = new RegExp("^" + t.replaceAll("*", ".*") + "/?$");

      for (let d of fileSystem.dirs[dir]) {
        if (re.test(d)) tokens.push(d);
      }
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
