/**
 * Constants
 */

const TYPE = Symbol('Type');
const TASK = Symbol('Task');
const LIST = Symbol('List');

/**
 * Public Methods
 */

function createTask() {
  return objectWithType(TASK, {
    next: null,
    failed: false,
    finished: false,
    awaiting: null,
  });
}

function createList() {
  return objectWithType(LIST, {
    head: null,
    observers: [],
  });
}

function increaseList(list) {
  if (isList(list)) {
    const task = createTask();
    if (isTask(list.head)) {
      task.next = list.head;
    }
    list.head = task;
    return task;
  }
  return null;
}

function isTask(subject) {
  return isOfType(TASK, subject);
}

function isList(subject) {
  return isOfType(LIST, subject);
}

function progress(list) {
  const status = createStatus();
  if (isList(list) && isTask(list.head)) {
    let item = list.head;
    do {
      ++status.total;
      if (item.finished) {
        ++status.finished;
        if (item.failed) ++status.failed;
      }
      item = item.next;
    } while (isTask(item));
  }
  if (status.total > 0) {
    status.ratio = status.finished / status.total;
  }
  return Object.freeze(status);
}

function waitOn(list, thenable) {
  const task = increaseList(list);
  if (isTask(task)) {
    const finish = function finish() {
      task.finished = true;
      task.awaiting = null;
      Object.freeze(task);
      notify(list, progress(list));
    };
    task.awaiting = Promise.resolve(thenable).then(finish, function() {
      task.failed = true;
      finish();
    });
    return true;
  }
  return false;
}

function addObserver(list, observer) {
  if (
    isList(list) &&
    Array.isArray(list.observer) &&
    typeof observer === 'function'
  ) {
    list.observers.push(observer);
  }
}

/**
 * Utils
 */

function createStatus() {
  return Object.seal({
    total: 0,
    finished: 0,
    failures: 0,
    ratio: 0.0,
  });
}

function objectWithType(type, object) {
  return Object.seal(Object.defineProperty(object, TYPE, { value: type }));
}

function isOfType(type, subject) {
  return (
    subject !== null && typeof subject === 'object' && subject[TYPE] === type
  );
}

function notify(list, data) {
  if (
    isList(list) &&
    Array.isArray(list.observers) &&
    list.observers.length > 0
  ) {
    list.observers.slice().forEach(function(observer) {
      if (typeof observer === 'function') {
        try {
          observer(data, list);
        } catch (e) {
          /* Oops! */
        }
      }
    });
  }
}

/**
 * Exports
 */

export {
  createTask,
  createList,
  increaseList,
  isTask,
  isList,
  progress,
  waitOn,
  addObserver,
};
