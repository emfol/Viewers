import OHIF from '@ohif/core';
import {
  save,
  getDicomWebClientFromContext,
  getSOPInstanceReferenceFromActiveViewport,
} from './utils';
import downloadAndZip from './downloadAndZip';

export function getCommands(context) {
  const actions = {
    downloadAndZip({ servers, dicomWebClient, listOfUIDs, options }) {
      return save(
        downloadAndZip(
          dicomWebClient || getDicomWebClientFromContext(context, servers),
          listOfUIDs,
          options
        ),
        listOfUIDs
      );
    },
    downloadAndZipSeriesOnActiveViewport({ servers, viewports, progress }) {
      const dicomWebClient = getDicomWebClientFromContext(context, servers);
      const listOfUIDs = getSOPInstanceReferenceFromActiveViewport(viewports);
      return save(
        downloadAndZip(dicomWebClient, listOfUIDs, { progress }),
        listOfUIDs
      );
    },
  };

  const definitions = {
    downloadAndZip: {
      commandFn: actions.downloadAndZip,
      storeContexts: ['servers', 'viewports'],
    },
    downloadAndZipSeriesOnActiveViewport: {
      commandFn: actions.downloadAndZipSeriesOnActiveViewport,
      storeContexts: ['servers', 'viewports'],
      options: {
        progress(info) {
          OHIF.log.info('Progress:', info.percent);
        },
      },
    },
  };

  return {
    actions,
    definitions,
  };
}
