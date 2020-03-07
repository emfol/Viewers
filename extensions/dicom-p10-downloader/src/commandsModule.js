import {
  getDicomWebClientFromContext,
  getSOPInstanceReferenceFromActiveViewport,
} from './utils';
import downloadAndZip from './downloadAndZip';

export function getCommands(context) {
  const actions = {
    downloadAndZipSeriesOnActiveViewport({ servers, viewports }) {
      const dicomWebClient = getDicomWebClientFromContext(context, servers);
      if (dicomWebClient) {
        const reference = getSOPInstanceReferenceFromActiveViewport(viewports);
        if (reference) {
          downloadAndZip(
            dicomWebClient,
            reference.studyInstanceUID,
            reference.seriesInstanceUID,
            reference.sopInstanceUID
          );
        }
      }
    },
  };

  const definitions = {
    downloadAndZipSeriesOnActiveViewport: {
      commandFn: actions.downloadAndZipSeriesOnActiveViewport,
      storeContexts: ['servers', 'viewports'],
    },
  };

  return {
    actions,
    definitions,
  };
}
