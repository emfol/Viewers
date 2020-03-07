export default function resolveObjectPath(root, path, defaultValue) {
  let result;
  if (root !== null && typeof root === 'object' && typeof path === 'string') {
    let separator = path.indexOf('.');
    result =
      separator >= 0
        ? resolveObjectPath(
            root[path.slice(0, separator)],
            path.slice(separator + 1, path.length)
          )
        : root[path];
  }
  return result === undefined && defaultValue !== undefined
    ? defaultValue
    : result;
}
