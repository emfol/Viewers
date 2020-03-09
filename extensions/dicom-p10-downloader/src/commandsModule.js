import {
  getDicomWebClientFromContext,
  getSOPInstanceReferenceFromActiveViewport,
} from './utils';
import downloadAndZip from './downloadAndZip';

export function getCommands(context) {
  const actions = {
    downloadAndZipSeriesOnActiveViewport({ servers, viewports, progress }) {
      const dicomWebClient = getDicomWebClientFromContext(context, servers);
      if (dicomWebClient) {
        const reference = getSOPInstanceReferenceFromActiveViewport(viewports);
        if (reference) {
          downloadAndZip(dicomWebClient, reference, progress);
        }
      }
    },
  };

  const definitions = {
    downloadAndZipSeriesOnActiveViewport: {
      commandFn: actions.downloadAndZipSeriesOnActiveViewport,
      storeContexts: ['servers', 'viewports'],
      options: {
        progress(descriptor) {
          console.log('Progress:', descriptor.percent);
        },
      },
    },
  };

  return {
    actions,
    definitions,
  };
}
