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
