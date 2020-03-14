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
    list: null,
    failed: false,
    awaiting: null,
    progress: 0.0,
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
    task.list = list;
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

function update(task, value) {
  if (isTask(task) && isValidProgress(value) && value < 1.0) {
    const { progress } = task;
    if (value !== progress) {
      const { list } = task;
      task.progress = value;
      if (isList(list)) {
        notify(list, getOverallProgress(list));
      }
    }
  }
}

function finish(task) {
  if (isTask(task)) {
    const { list } = task;
    task.progress = 1.0;
    task.awaiting = null;
    Object.freeze(task);
    if (isList(list)) {
      notify(list, getOverallProgress(list));
    }
  }
}

function getOverallProgress(list) {
  const status = createStatus();
  if (isList(list) && isTask(list.head)) {
    let item = list.head;
    do {
      const { progress } = item;
      status.total++;
      if (isValidProgress(progress)) {
        status.partial += progress;
        if (progress === 1.0 && item.failed) status.failures++;
      }
      item = item.next;
    } while (isTask(item));
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
    return function setProgress(value) {
      update(task, value);
    };
  }
  return null;
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
  createTask,
  createList,
  increaseList,
  isTask,
  isList,
  update,
  finish,
  getOverallProgress,
  waitOn,
  addObserver,
};
