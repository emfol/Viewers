import cloneDeep from 'lodash.clonedeep';
import merge from 'lodash.merge';

import * as viewportLayoutUtils from '../../utils/viewportLayoutUtils';
import {
  CLEAR_VIEWPORT,
  SET_ACTIVE_SPECIFIC_DATA,
  SET_SPECIFIC_DATA,
  SET_VIEWPORT,
  SET_VIEWPORT_ACTIVE,
  SET_VIEWPORT_LAYOUT,
  SET_VIEWPORT_LAYOUT_AND_DATA,
} from './../constants/ActionTypes.js';

export const DEFAULT_STATE = {
  initialized: false,
  numRows: 1,
  numColumns: 1,
  activeViewportIndex: 0,
  layout: createLayout(viewportLayoutUtils.getStandardGridLayout(1, 1)),
  viewportSpecificData: {},
};

/**
 *  Take the new number of rows and columns, delete all not used viewport data and also set
 *  active viewport as default in case current one is not available anymore.
 *
 * @param {Number} numRows
 * @param {Number} numColumns
 * @param {Object} currentViewportSpecificData
 * @returns
 */
const findActiveViewportSpecificData = (
  numRows,
  numColumns,
  currentViewportSpecificData = {}
) => {
  const numberOfViewports = numRows * numColumns;
  const viewportSpecificData = cloneDeep(currentViewportSpecificData);
  const viewportSpecificDataKeys = Object.keys(viewportSpecificData);

  if (numberOfViewports < viewportSpecificDataKeys.length) {
    const lastViewportIndex = numberOfViewports - 1;
    viewportSpecificDataKeys.forEach(key => {
      if (key > lastViewportIndex) {
        delete viewportSpecificData[key];
      }
    });
  }

  return viewportSpecificData;
};
/**
 *  Take new number of rows and columns and make sure the current active viewport index is still available, if not, return the default
 *
 * @param {Number} numRows
 * @param {Number} numColumns
 * @param {Number} currentActiveViewportIndex
 * @returns
 */
const getActiveViewportIndex = (
  numRows,
  numColumns,
  currentActiveViewportIndex
) => {
  const numberOfViewports = numRows * numColumns;

  return currentActiveViewportIndex > numberOfViewports - 1
    ? DEFAULT_STATE.activeViewportIndex
    : currentActiveViewportIndex;
};

/**
 * The definition of a viewport action.
 *
 * @typedef {Object} ViewportAction
 * @property {string} type -
 * @property {Object} data -
 * @property {Object} layout -
 * @property {number} viewportIndex -
 * @property {Object} viewportSpecificData -
 */

/**
 * @param {Object} [state=DEFAULT_STATE] The current viewport state.
 * @param {ViewportAction} action A viewport action.
 */
const viewports = (state = DEFAULT_STATE, action) => {
  let useActiveViewport = false;

  switch (action.type) {
    /**
     * Sets the active viewport index.
     *
     * @return {Object} New state.
     */
    case SET_VIEWPORT_ACTIVE: {
      const activeViewportIndex = getActiveViewportIndex(
        state.numRows,
        state.numColumns,
        action.viewportIndex
      );
      return { ...state, activeViewportIndex };
    }

    /**
     * Sets viewport layout.
     *
     * @return {Object} New state.
     */
    case SET_VIEWPORT_LAYOUT: {
      const { numRows, numColumns } = action;
      const viewportSpecificData = findActiveViewportSpecificData(
        numRows,
        numColumns,
        state.viewportSpecificData
      );
      const activeViewportIndex = getActiveViewportIndex(
        numRows,
        numColumns,
        state.activeViewportIndex
      );

      return {
        ...state,
        numRows: action.numRows,
        numColumns: action.numColumns,
        layout: { viewports: [...action.viewports] },
        viewportSpecificData,
        activeViewportIndex,
      };
    }

    /**
     * Sets viewport layout and data.
     *
     * @return {Object} New state.
     */
    case SET_VIEWPORT_LAYOUT_AND_DATA: {
      const { numRows, numColumns } = action;
      const viewportSpecificData = findActiveViewportSpecificData(
        numRows,
        numColumns,
        action.viewportSpecificData
      );
      const activeViewportIndex = getActiveViewportIndex(
        numRows,
        numColumns,
        state.activeViewportIndex
      );

      return {
        ...state,
        numRows: action.numRows,
        numColumns: action.numColumns,
        layout: { viewports: [...action.viewports] },
        viewportSpecificData,
        activeViewportIndex,
      };
    }

    /**
     * Sets viewport specific data of active viewport.
     *
     * @return {Object} New state.
     */
    case SET_VIEWPORT: {
      const layout = cloneDeep(state.layout);

      let viewportSpecificData = cloneDeep(state.viewportSpecificData);
      viewportSpecificData[action.viewportIndex] = merge(
        {},
        viewportSpecificData[action.viewportIndex],
        action.viewportSpecificData
      );

      if (action.viewportSpecificData && action.viewportSpecificData.plugin) {
        layout.viewports[action.viewportIndex].plugin =
          action.viewportSpecificData.plugin;
      }

      return { ...state, layout, viewportSpecificData };
    }

    /**
     * Sets viewport specific data of active/any viewport.
     *
     * @return {Object} New state.
     */
    case SET_ACTIVE_SPECIFIC_DATA:
      useActiveViewport = true;
    // Allow fall-through
    // eslint-disable-next-line
    case SET_SPECIFIC_DATA: {
      const layout = cloneDeep(state.layout);
      const viewportIndex = useActiveViewport
        ? state.activeViewportIndex
        : action.viewportIndex;

      let viewportSpecificData = cloneDeep(state.viewportSpecificData);
      viewportSpecificData[viewportIndex] = {
        ...action.viewportSpecificData,
      };

      if (action.viewportSpecificData && action.viewportSpecificData.plugin) {
        layout.viewports[viewportIndex].plugin =
          action.viewportSpecificData.plugin;
      }

      return { ...state, layout, viewportSpecificData };
    }

    /**
     * Clears viewport specific data of any viewport.
     *
     * @return {Object} New state.
     */
    case CLEAR_VIEWPORT: {
      let viewportSpecificData = cloneDeep(state.viewportSpecificData);

      if (action.viewportIndex) {
        viewportSpecificData[action.viewportIndex] = {};
        return { ...state, viewportSpecificData };
      } else {
        return DEFAULT_STATE;
      }
    }

    /**
     * Returns the current application state.
     *
     * @return {Object} The current state.
     */
    default: {
      return state;
    }
  }
};

/**
 * Utils
 */

function createState() {
  return {
    initialized: false,
    numRows: 1,
    numColumns: 1,
    activeViewportIndex: 0,
    layout: createLayout(viewportLayoutUtils.getStandardGridLayout(1, 1)),
    viewportSpecificData: {},
  };
}

function createLayout(struct, groups, viewports) {
  return Object.freeze({
    viewports: createViewports(struct, getAttributesSource(viewports)),
    groups: createGroups(struct, groups),
    struct,
  });
}

function createViewports(struct, attributesSource) {
  const viewportCount = viewportLayoutUtils.getViewportCount(struct);
  if (viewportCount > 0) {
    const viewportList = new Array(viewportCount);
    for (let i = 0; i < viewportCount; ++i) {
      viewportList[i] = createViewport(
        viewportLayoutUtils.getViewport(struct, i),
        attributesSource(i)
      );
    }
    return Object.freeze(viewportList);
  }
  return null;
}

function createViewport(struct, attributes) {
  return Object.freeze({
    ...attributes,
    struct,
  });
}

function createGroups(struct, groups) {
  if (Array.isArray(groups) && groups.length > 0) {
    const { length } = groups;
    const viewportGroups = new Array(length);
    let i = 0;
    for (; i < length; ++i) {
      const group = viewportLayoutUtils.createVewportGroup(struct, groups[i]);
      if (!group) {
        break;
      }
      viewportGroups[i] = createLayout(group);
    }
    if (i === length) {
      return viewportGroups;
    }
  }
  return null;
}

function getAttributesSource(attributesList) {
  const isValidList = Array.isArray(attributesList);
  return function attributesSource(index) {
    // prevent deopts from out of bounds access
    if (isValidList && index < attributesList.length) {
      return attributesList[index];
    }
  };
}

/**
 * Exports
 */

export default viewports;
