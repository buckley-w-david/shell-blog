export const absolute = (currentDirectory, path) => {
  if (path[0] === "/") {
    return path;
  } else if (path.slice(0, 2) == "./") {
    if (currentDirectory === "/") {
      return "/" + path.slice(2);
    } else {
      return `${currentDirectory}/${path.slice(2)}`;
    }
  } else {
    if (currentDirectory === "/") {
      return "/" + path;
    } else {
      return `${currentDirectory}/${path}`;
    }
  }
};

export const parent = (path) => {
  let dirParts = path.split("/").slice(0, -1);
  if (dirParts.length === 1) {
    return "/";
  } else {
    return dirParts.join("/");
  }
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
