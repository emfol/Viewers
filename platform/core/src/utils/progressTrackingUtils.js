/**
 * Constants
 */

const TYPE = Symbol('Type');
const TASK = Symbol('Task');
const LIST = Symbol('List');

/**
 * Public Methods
 */

function createList() {
  return objectWithType(LIST, {
    head: null,
    observers: [],
  });
}

function isList(subject) {
  return isOfType(LIST, subject);
}

function createTask(list, next) {
  return objectWithType(TASK, {
    list: isList(list) ? list : null,
    next: isTask(next) ? next : null,
    failed: false,
    awaiting: null,
    progress: 0.0,
  });
}

function isTask(subject) {
  return isOfType(TASK, subject);
}

function increaseList(list) {
  if (isList(list)) {
    const task = createTask(list, list.head);
    list.head = task;
    notify(list, getOverallProgress(list));
    return task;
  }
  return null;
}

function update(task, value) {
  if (isTask(task) && isValidProgress(value) && value < 1.0) {
    if (task.progress !== value) {
      task.progress = value;
      if (isList(task.list)) {
        notify(task.list, getOverallProgress(task.list));
      }
    }
  }
}

function finish(task) {
  if (isTask(task)) {
    task.progress = 1.0;
    task.awaiting = null;
    Object.freeze(task);
    if (isList(task.list)) {
      notify(task.list, getOverallProgress(task.list));
    }
  }
}

function getOverallProgress(list) {
  const status = createStatus();
  if (isList(list)) {
    let task = list.head;
    while (isTask(task)) {
      status.total++;
      if (isValidProgress(task.progress)) {
        status.partial += task.progress;
        if (task.progress === 1.0 && task.failed) status.failures++;
      }
      task = task.next;
    }
  }
  if (status.total > 0) {
    status.progress = status.partial / status.total;
  }
  return Object.freeze(status);
}

function waitOn(list, thenable) {
  const task = increaseList(list);
  if (isTask(task)) {
    task.awaiting = Promise.resolve(thenable).then(
      function() {
        finish(task);
      },
      function() {
        task.failed = true;
        finish(task);
      }
    );
    return task;
  }
  return null;
}

function addObserver(list, observer) {
  if (
    isList(list) &&
    Array.isArray(list.observers) &&
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
    partial: 0.0,
    progress: 0.0,
    failures: 0,
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

function isValidProgress(value) {
  return typeof value === 'number' && value >= 0.0 && value <= 1.0;
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
  createList,
  isList,
  createTask,
  isTask,
  increaseList,
  update,
  finish,
  getOverallProgress,
  waitOn,
  addObserver,
};
