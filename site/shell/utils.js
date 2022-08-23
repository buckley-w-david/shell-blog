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

export const expand = (text) => {
  // TODO apply globbing
  // TODO apply variable expansion
  return text;
};

export const tokenize = (text) => {
  // TODO properly split command into tokens (quote handling)
  return text.trim().split(" ");
};
