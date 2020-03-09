import OHIF from '@ohif/core';
import { api } from 'dicomweb-client';

const {
  utils: { hierarchicalListUtils },
} = OHIF;

// import { api } from 'dicomweb-client';
// import { DICOMWeb } from '@ohif/core';
//https://server.dcmjs.org/dcm4chee-arc/aets/DCM4CHEE/wado?requestType=WADO&studyUID=1.2.840.113619.2.66.2158408118.16050010109105933.20000&seriesUID=1.2.840.113619.2.66.2158408118.16050010109105933.10001&objectUID=1.2.840.113619.2.66.2158408118.16050010109110601.7&contentType=application/dicom&transferSyntax=*

export default function downloadAndZip(dicomWebClient, references, progress) {
  if (dicomWebClient instanceof api.DICOMwebClient) {
    hierarchicalListUtils.forEach(references, function(...args) {
      console.log('Oops! References:', args);
    });
  }
}

window.hierarchicalListUtils = hierarchicalListUtils;
