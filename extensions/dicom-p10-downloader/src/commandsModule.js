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
          downloadAndZip(dicomWebClient, reference, progress)
            .then(url => {
              console.info('Zip file successfully created:', url);
              location.href = url;
            })
            .catch(error => {
              console.error(
                'Failed to create Zip file with downloaded instances',
                error
              );
            });
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
