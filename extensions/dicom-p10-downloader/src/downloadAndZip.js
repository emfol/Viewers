import OHIF from '@ohif/core';
import { api } from 'dicomweb-client';
import JSZip from 'jszip';

/**
 * Constants
 */

const {
  utils: { isDicomUid, hierarchicalListUtils },
} = OHIF;

/**
 * Public Methods
 */

/**
 * Download and Zip a list of
 * @param {DICOMwebClient} dicomWebClient A DICOMwebClient instance through
 *  which the referenced instances will be retrieved;
 * @param {Array} references The hierarchical list of references to be
 *  retrieved;
 * @param {function} progress Callback to be called on download and zip progress
 *  update;
 */

async function downloadAndZip(dicomWebClient, references, progress) {
  if (!(dicomWebClient instanceof api.DICOMwebClient)) {
    throw new Error('A valid DICOM Web Client instance is expected');
  }
  return downloadAll(dicomWebClient, references, progress).then(zipAll);
}

/**
 * Utils
 */

async function zipAll(buffers) {
  const zip = new JSZip();
  buffers.forEach((buffer, i) => {
    zip.file(`${i}.dcm`, buffer);
  });
  return zip
    .generateAsync({ type: 'blob' })
    .then(blob => URL.createObjectURL(blob));
}

async function downloadAll(client, references, progress) {
  const downloads = [];
  hierarchicalListUtils.forEach(references, (study, series, instance) => {
    if (isDicomUid(study)) {
      downloads.push(download(client, study, series, instance));
    }
  });
  if (downloads.length < 1) {
    throw new Error('No valid reference to be downloaded');
  }
  return Promise.all(downloads).then(results => {
    const buffers = [];
    results.forEach(function bufferMapper(result) {
      if (result instanceof ArrayBuffer) {
        buffers.push(result);
      } else if (Array.isArray(result)) {
        result.forEach(bufferMapper);
      }
    });
    return buffers;
  });
}

async function download(
  dicomWebClient,
  studyInstanceUID,
  seriesInstanceUID,
  sopInstanceUID
) {
  if (!isDicomUid(studyInstanceUID)) {
    throw new Error('Download requires at least a "studyInstanceUID" property');
  }
  if (!isDicomUid(seriesInstanceUID)) {
    // Download entire study
    return dicomWebClient.retrieveStudy({
      studyInstanceUID,
    });
  }
  if (!isDicomUid(sopInstanceUID)) {
    // Download entire series
    return dicomWebClient.retrieveSeries({
      studyInstanceUID,
      seriesInstanceUID,
    });
  }
  // Download specific instance
  return dicomWebClient.retrieveInstance({
    studyInstanceUID,
    seriesInstanceUID,
    sopInstanceUID,
  });
}

/**
 * Exports
 */

// @TODO: Remove this
window.hierarchicalListUtils = hierarchicalListUtils;

export { downloadAndZip as default, downloadAndZip };
