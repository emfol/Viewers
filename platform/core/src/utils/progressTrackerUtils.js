const IS_TASK = Symbol('isTask');
const IS_LIST = Symbol('isList');

function createTask() {
  const task = {
    finished: false,
    failed: false,
    next: null,
    waitingOn: null,
  };
  return Object.seal(Object.defineProperty(task, IS_TASK, { value: true }));
}

function createList() {
  const list = {
    head: createTask(),
    observers: [],
  };
  return Object.freeze(Object.defineProperty(list, IS_LIST, { value: true }));
}

function isTask(subject) {
  return (
    subject !== null && typeof subject === 'object' && subject[IS_TASK] === true
  );
}

function isList(subject) {
  return (
    subject !== null && typeof subject === 'object' && subject[IS_LIST] === true
  );
}

function addObserver(list, observer) {
  if (isList(list) && typeof observer === 'function') {
    list.observers.push(observer);
  }
}

function progress(list) {
  const status = {
    total: 0,
    finished: 0,
    failures: 0,
    ratio: 0.0,
  };
  if (isList(list) && isTask(list.head)) {
    let item = list.head;
    do {
      ++status.total;
      if (item.finished) ++status.finished;
      if (item.failed) ++status.failed;
      item = item.next;
    } while (isTask(item));
  }
  if (status.total > 0) {
    status.ratio = status.finished / status.total;
  }
  Object.freeze(status);
  notify(list, status);
  return status;
}

function notify(list, status) {
  if (
    isList(list) &&
    Array.isArray(list.observers) &&
    list.observers.length > 0
  ) {
    list.observers.slice().forEach(observer => {
      if (typeof observer === 'function') {
        try {
          observer(status, list);
        } catch (e) {
          /* Oops! */
        }
      }
    });
  }
}

function appendToList(list, task) {
  if (isList(list)) {
    return append(list.head, task);
  }
  return false;
}

function insert(head, task) {
  if (isTask(head) && isTask(task)) {
    if (isTask(head.next)) {
      task.next = head.next;
    }
    head.next = task;
    return true;
  }
  return false;
}

function append(head, task) {
  if (isTask(head) && isTask(task)) {
    let last = head;
    while (isTask(last.next)) {
      last = last.next;
    }
    last.next = task;
    return true;
  }
  return false;
}

function waitOn(task, thenable) {
  const promise = Promise.resolve(thenable);
  if (!task.finished && task.waitingOn === null) {
    const finish = function finish() {
      task.finished = true;
      task.waitingOn = null;
      if (isList(task.list)) {
        task.list.update();
      }
    };
    task.waitingOn = promise.then(finish, function() {
      task.failed = true;
      finish();
    });
  }
  return promise;
}

export {
  createTask,
  createList,
  isTask,
  isList,
  addObserver,
  progress,
  notify,
  appendToList,
  insert,
  append,
  waitOn,
};
