import OHIF from '@ohif/core';
import { api } from 'dicomweb-client';
import dicomParser from 'dicom-parser';
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
 * Download and Zip all DICOM P10 instances from specified DICOM Web Client
 * based on an hierarchical list of UIDs;
 *
 * @param {DICOMwebClient} dicomWebClient A DICOMwebClient instance through
 *  which the referenced instances will be retrieved;
 * @param {Array} listOfUIDs The hierarchical list of UIDs from the instances
 *  that should be retrieved:
 *  A hierarchical list of UIDs is a regular JS Array where the type of the UID
 *  (study, series, instance) is determined by its nasting lavel. For example:
 *    @ The following list instructs the library to download all the instances
 *      from both studies "A" and "B":
 *
 *    ['studyUIDFromA', 'studyUIDFromB']
 *
 *    @ In the previous example both UIDs are treated as STUDY UIDs because both
 *      of them are listed in the same (top) level of the list. If, on the other
 *      hand, only instances from series "I" and "J" from the study "B"
 *      are to be downloaded, the expected hierarchical list would be:
 *
 *    ['studyUIDFromA', ['studyUIDFromB', ['seriesUIDFromI', 'seriesUIDFromJ']]]
 *
 *    @ Which, when prettified, reads like this:
 *
 *    [
 *      'studyUIDFromA',
 *      ['studyUIDFromB', [
 *        'seriesUIDFromI',
 *        'seriesUIDFromJ'
 *      ]]
 *    ]
 *
 *    @ Furthermore, if only instances "X", "Y" and "Z" from series "J" need to
 *      be downloaded (instead of all the instances from that series), the list
 *      could be changed to:
 *
 *    [
 *      'studyUIDFromA',
 *      ['studyUIDFromB', [
 *        'seriesUIDFromI',
 *        ['seriesUIDFromJ', [
 *          'instanceUIDFromX',
 *          'instanceUIDFromY',
 *          'instanceUIDFromZ'
 *        ]]
 *      ]]
 *    ]
 *
 * @param {Object} options A plain object with options;
 * @param {function} options.progress A callback to retrieve notifications
 * @returns {Promise} A promise that resolves to an URL from which the ZIP file
 *  can be downloaded;
 */

async function downloadAndZip(dicomWebClient, listOfUIDs, options) {
  if (dicomWebClient instanceof api.DICOMwebClient) {
    const buffers = await downloadAll(dicomWebClient, listOfUIDs, options);
    return zipAll(buffers, options);
  }
  throw new Error('A valid DICOM Web Client instance is expected');
}

/**
 * Utils
 */

async function zipAll(buffers) {
  const zip = new JSZip();
  OHIF.log.info('Adding DICOM P10 files to archive:', buffers.length);
  buffers.forEach((buffer, i) => {
    const path = buildPath(buffer) || `${i}.dcm`;
    zip.file(path, buffer);
  });
  return URL.createObjectURL(await zip.generateAsync({ type: 'blob' }));
}

function buildPath(buffer) {
  let path;
  try {
    const byteArray = new Uint8Array(buffer);
    const dataSet = dicomParser.parseDicom(byteArray, {
      // Stop parsing after SeriesInstanceUID is found
      untilTag: 'x0020000e',
    });
    const StudyInstanceUID = dataSet.string('x0020000d');
    const SeriesInstanceUID = dataSet.string('x0020000e');
    const SOPInstanceUID = dataSet.string('x00080018');
    if (StudyInstanceUID && SeriesInstanceUID && SOPInstanceUID) {
      path = `${StudyInstanceUID}/${SeriesInstanceUID}/${SOPInstanceUID}.dcm`;
    }
  } catch (e) {
    OHIF.log.error('Error parsing downloaded DICOM P10 file...', e);
  }
  return path;
}

async function downloadAll(dicomWebClient, listOfUIDs, options) {
  const downloads = [];

  // Initiate download for each item of the hierarchical list
  hierarchicalListUtils.forEach(
    listOfUIDs,
    (StudyInstanceUID, SeriesInstanceUID, SOPInstanceUID) => {
      if (isDicomUid(StudyInstanceUID)) {
        downloads.push(
          download(
            dicomWebClient,
            StudyInstanceUID,
            SeriesInstanceUID,
            SOPInstanceUID
          )
        );
      }
    }
  );

  // Make sure at least one download was initiated
  if (downloads.length < 1) {
    throw new Error('No valid reference to be downloaded');
  }

  // Print tree of hierarchical references
  OHIF.log.info('Downloading DICOM P10 files for references:');
  OHIF.log.info(hierarchicalListUtils.print(listOfUIDs));

  // Wait on created download promises
  return Promise.all(downloads).then(results => {
    const buffers = [];
    // The "results" array may directly contain buffers (ArrayBuffer instances)
    // or arrays of buffers, depending on the type of downloads initiated on the
    // previous step (retrieveStudy, retrieveSeries or retrieveinstance). Ex:
    // results = [buf1, [buf2, buf3], buf4, [buf5], ...];
    results.forEach(
      function select(nesting, result) {
        if (result instanceof ArrayBuffer) {
          buffers.push(result);
        } else if (nesting && Array.isArray(result)) {
          // "nesting" argument is important to make sure only two levels
          // of arrays are visited. For example, "bufX" should not be visited:
          // [buf1, [buf2, buf3, [bufX]], buf4, [buf5], ...];
          result.forEach(select.bind(null, false));
        }
      }.bind(null, true)
    );
    return buffers;
  });
}

async function download(
  dicomWebClient,
  studyInstanceUID,
  seriesInstanceUID,
  sopInstanceUID
) {
  // Strict DICOM-formatted variable names COULDN'T be used here because the
  // DICOM Web client interface expects them in this specific format.
  if (!isDicomUid(studyInstanceUID)) {
    throw new Error('Download requires at least a "StudyInstanceUID" property');
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

export { downloadAndZip as default, downloadAndZip };
