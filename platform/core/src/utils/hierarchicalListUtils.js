/**
 * API
 */

function addToList(list, ...values) {
  if (Array.isArray(list)) {
    if (values.length > 0) {
      addValuesToList(list, values);
    }
    return list;
  }
  return null;
}

function forEach(list, callback) {
  if (Array.isArray(list)) {
    if (typeof callback === 'function') {
      forEachValue(list, callback);
    }
    return list;
  }
  return null;
}

function print(list) {
  let text = '';
  if (Array.isArray(list)) {
    let prev = [];
    forEachValue(list, function(...args) {
      let prevLen = prev.length;
      for (let i = 0, l = args.length; i < l; ++i) {
        if (i < prevLen && args[i] === prev[i]) {
          continue;
        }
        text += '  '.repeat(i) + args[i] + '\n';
      }
      prev = args;
    });
  }
  return text;
}

/**
 * Utils
 */

function forEachValue(list, callback) {
  for (let i = 0, l = list.length; i < l; ++i) {
    let item = list[i];
    if (isSublist(item)) {
      if (item[1].length > 0) {
        forEachValue(item[1], callback.bind(null, item[0]));
        continue;
      }
      item = item[0];
    }
    callback(item);
  }
}

function addValuesToList(list, values) {
  let value = values.shift();
  let index = add(list, value);
  if (index >= 0) {
    if (values.length > 0) {
      let sublist = list[index];
      if (!isSublist(sublist)) {
        sublist = toSublist(value);
        list[index] = sublist;
      }
      return addValuesToList(sublist[1], values);
    }
    return true;
  }
  return false;
}

function add(list, value) {
  let index = find(list, value);
  if (index === -2) {
    index = list.push(value) - 1;
  }
  return index;
}

function find(list, value) {
  if (typeof value === 'string') {
    for (let i = 0, l = list.length; i < l; ++i) {
      let item = list[i];
      if (item === value || (isSublist(item) && item[0] === value)) {
        return i;
      }
    }
    return -2;
  }
  return -1;
}

function isSublist(subject) {
  return (
    Array.isArray(subject) &&
    subject.length === 2 &&
    typeof subject[0] === 'string' &&
    Array.isArray(subject[1])
  );
}

function toSublist(value) {
  return [value + '', []];
}

/**
 * Exports
 */

export { addToList, forEach, print };
