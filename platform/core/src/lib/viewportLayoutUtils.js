/**
 * For the "Display Environment Spatial Position" (0072,0108) Attribute,
 * the lower left corner of the overall bounding box has Cartesian coordinates
 * of (0.0,0.0).
 * The upper right corner has coordinates of (1.0,1.0).
 * The scale of the box is based on the "Number of Vertical Pixels" (0072,0104)
 * and "Number of Horizontal Pixels" (0072,0106), not the physical size of the
 * screens that are part of the workstation.
 * The coordinates of each individual screen's box are defined in absolute
 * coordinates relative to the (0,0) and (1,1) range of the overall box.
 * Position of a box is given by a (x1,y1), (x2,y2) pair that identifies the
 * UPPER LEFT CORNER and LOWER RIGHT CORNER if the box is rectangular.
 */

/**
 * Constants
 */

const EPSILON = 0.000001;
const SEPARATOR = '/';
const IS_VALID_OFFSET_LIST = Symbol('isValidOffsetList');

/**
 * Private Methods & Utils
 */

function unsafeGetGridLayout(rows, cols) {
  const offsetList = [];
  const col2offset = (width => (col => col * width))(1 / cols);
  const row2offset = (height => (row => 1 - row * height))(1 / rows);
  for (let row = 0; row < rows; ++row) {
    const y1 = row2offset(row);
    const y2 = row2offset(row + 1);
    for (let col = 0; col < cols; ++col) {
      const x1 = col2offset(col);
      const x2 = col2offset(col + 1);
      offsetList.push(x1, y1, x2, y2);
    }
  }
  return createLayout(offsetList);
}

function fmt(n) {
  return Number(n).toFixed(6).replace(/\.?0+$/, '');
}

function eq(a, b) {
  // using absolute error margin since the range in known
  return Math.abs(a - b) < EPSILON;
}

function trunc(n) {
  return n < 0 ? Math.ceil(n) : Math.floor(n);
}


function viewport(x1, y1, x2, y2) {
  return [x1, y1, x2, y2].map(fmt).join(SEPARATOR);
}

/**
 * Check if a given value is a valid offset
 * @param {any} subject A value to be tested
 * @returns {boolean}
 */
function isOffset(subject) {
  return typeof subject === 'number' && subject >= 0 && subject <= 1;
}

/**
 * Check if the given object is a valid offset list
 * @param {any} subject The object to be tested
 * @returns {boolean}
 */
function isValidOffsetList(subject) {
  if (Array.isArray(subject)) {
    const { length } = subject;
    return (
      length > 0 &&
      length % 4 === 0 &&
      subject.every(isOffset)
    );
  }
  return false;
}

/**
 * Ensure the given object is a valid layout object
 * @param {any} subject The object to be tested
 * @param {boolean} skip Boolean indicating if the creation of a valid layout
 *  object should be attempted;
 */
function ensureLayout(subject, skip) {
  if (subject !== null && typeof subject === 'object') {
    if (subject[IS_VALID_OFFSET_LIST]) {
      return subject;
    }
    if (!skip) {
      return createLayout(subject.offsetList);
    }
  }
  return null;
}

/**
 * Creates an immutable layout object
 * @param {Array} offsetList An array of offsets
 * @returns {Object} An immutable layout object or null if an invalid list
 *  of offsets was provided
 */

function createLayout(offsetList) {
  if (isValidOffsetList(offsetList)) {
    return Object.freeze({
      offsetList: Object.freeze(offsetList.slice()),
      [IS_VALID_OFFSET_LIST]: true
    });
  }
  return null;
}

function getViewport(givenLayout, index) {
  const layout = ensureLayout(givenLayout, true);
  if (layout) {
    const { offsetList } = layout;
    const start = index * 4;
    const end = start + 4;
    if (end <= offsetList.length) {
      return createLayout(offsetList.slice(start, end));
    }
  }
  return null;
}

/**
 * Interface
 */

function getGridLayout(rows, cols) {
  if (rows > 0 && cols > 0 && rows === trunc(rows) && cols === trunc(cols)) {
    return unsafeGetGridLayout(rows, cols);
  }
  return null;
}

/**
 * Exports
 */

export {
  isOffset,
  isValidOffsetList,
  createLayout,
  ensureLayout,
  getGridLayout,
  getViewport
}
