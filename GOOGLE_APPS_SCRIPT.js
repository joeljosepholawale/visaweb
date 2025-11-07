/**
 * Google Apps Script for Visa Application Form Submissions
 * Handles both DS-160 and Schengen forms
 * Creates: Google Doc (readable), Images (PNG), and JSON (backup)
 */

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const { formType, applicantName, createdAt, data } = payload;
    
    // Create folder structure
    const rootFolder = DriveApp.getFoldersByName('Visa Applications').hasNext() 
      ? DriveApp.getFoldersByName('Visa Applications').next()
      : DriveApp.createFolder('Visa Applications');
    
    const formFolder = getOrCreateFolder(rootFolder, formType.toUpperCase());
    const timestamp = new Date(createdAt).toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const appFolder = formFolder.createFolder(`${applicantName}_${timestamp}`);
    
    // Save passport photo if exists
    let photoFile = null;
    if (data.photoDataURL) {
      const photoBlob = dataURLtoBlob(data.photoDataURL);
      photoFile = appFolder.createFile(photoBlob).setName('passport_photo.png');
    }
    
    // Save signature if exists
    let signatureFile = null;
    if (data.signatureDataURL) {
      const sigBlob = dataURLtoBlob(data.signatureDataURL);
      signatureFile = appFolder.createFile(sigBlob).setName('signature.png');
    }
    
    // Create formatted Google Doc
    const doc = DocumentApp.create(`${formType.toUpperCase()} - ${applicantName}`);
    const docFile = DriveApp.getFileById(doc.getId());
    docFile.moveTo(appFolder);
    
    const body = doc.getBody();
    
    // Document header
    body.appendParagraph(formType === 'schengen' ? 'SCHENGEN VISA APPLICATION' : 'DS-160 APPLICATION')
      .setHeading(DocumentApp.ParagraphHeading.HEADING1)
      .setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    
    body.appendParagraph(`Applicant: ${applicantName}`)
      .setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    
    body.appendParagraph(`Submitted: ${new Date(createdAt).toLocaleString()}`)
      .setAlignment(DocumentApp.HorizontalAlignment.CENTER)
      .setSpacingAfter(20);
    
    body.appendHorizontalRule();
    
    // Add passport photo
    if (photoFile) {
      body.appendParagraph('PASSPORT PHOTO').setHeading(DocumentApp.ParagraphHeading.HEADING2);
      const photoBlob = photoFile.getBlob();
      const image = body.appendImage(photoBlob);
      image.setWidth(150).setHeight(200);
      body.appendParagraph('').setSpacingAfter(10);
    }
    
    // Generate form sections based on form type
    if (formType === 'schengen') {
      generateSchengenDoc(body, data);
    } else {
      generateDS160Doc(body, data);
    }
    
    // Add signature section
    if (data.signaturePlace || data.signatureDate || signatureFile) {
      body.appendHorizontalRule();
      body.appendParagraph('DECLARATION & SIGNATURE').setHeading(DocumentApp.ParagraphHeading.HEADING2);
      
      if (data.signaturePlace) {
        addField(body, 'Place', data.signaturePlace);
      }
      if (data.signatureDate) {
        addField(body, 'Date', data.signatureDate);
      }
      if (data.isMinor) {
        addField(body, 'Applicant is a minor', data.isMinor);
      }
      
      if (signatureFile) {
        body.appendParagraph('Signature:').setBold(true);
        const sigBlob = signatureFile.getBlob();
        const sigImage = body.appendImage(sigBlob);
        sigImage.setWidth(300).setHeight(100);
      }
    }
    
    doc.saveAndClose();
    
    // Save backup JSON (without base64 images)
    const cleanData = { ...data };
    delete cleanData.photoDataURL;
    delete cleanData.signatureDataURL;
    
    const jsonData = {
      formType,
      applicantName,
      submittedAt: createdAt,
      data: cleanData
    };
    
    const jsonBlob = Utilities.newBlob(JSON.stringify(jsonData, null, 2), 'application/json', 'form_data.json');
    appFolder.createFile(jsonBlob);
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      fileName: appFolder.getName(),
      folderId: appFolder.getId(),
      folderUrl: appFolder.getUrl(),
      docUrl: doc.getUrl()
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function generateSchengenDoc(body, data) {
  // Applicant Information
  if (data.surname || data.firstName) {
    body.appendParagraph('APPLICANT INFORMATION').setHeading(DocumentApp.ParagraphHeading.HEADING2);
    addField(body, '1. Surname (Family name)', data.surname);
    addField(body, '2. Surname at birth', data.surnameAtBirth);
    addField(body, '3. First name(s)', data.firstName);
    addField(body, '4. Date of birth', data.dob);
    addField(body, '5. Place of birth', data.placeOfBirth);
    addField(body, '6. Country of birth', data.countryOfBirth);
    addField(body, '7. Current nationality', data.nationality);
    addField(body, 'Nationality at birth', data.nationalitiesAtBirth);
    addField(body, '8. Sex', data.sex);
    addField(body, '9. Marital status', data.maritalStatus);
    addField(body, '10. National identity number', data.nationalIdNumber);
    addField(body, '11. For minors: Guardian(s)', data.minorGuardians);
    body.appendParagraph('');
  }
  
  // Travel Document
  if (data.docType || data.docNumber) {
    body.appendParagraph('TRAVEL DOCUMENT').setHeading(DocumentApp.ParagraphHeading.HEADING2);
    addField(body, '12. Type of travel document', data.docType);
    addField(body, '13. Number of travel document', data.docNumber);
    addField(body, '14. Issued by', data.docIssuedByCountry);
    addField(body, '15. Date of issue', data.docIssueDate);
    addField(body, '16. Valid until', data.docExpiryDate);
    addField(body, 'Place of issue', data.docIssuedAt);
    body.appendParagraph('');
  }
  
  // Contact Information
  if (data.homeAddress || data.email) {
    body.appendParagraph('HOME & CONTACT').setHeading(DocumentApp.ParagraphHeading.HEADING2);
    addField(body, '17. Home address', data.homeAddress);
    addField(body, 'Postal code, city', data.homePostal);
    addField(body, 'Country', data.homeCountry);
    addField(body, '18. Telephone', data.phone);
    addField(body, '19. E-mail', data.email);
    addField(body, '20. Residence in another country?', data.residingOtherCountryYN);
    if (data.residingOtherCountryYN === 'Yes') {
      addField(body, 'Residence permit No.', data.residencePermitNo);
      addField(body, 'Valid until', data.residencePermitValidUntil);
    }
    body.appendParagraph('');
  }
  
  // Employment
  if (data.occupation || data.employerName) {
    body.appendParagraph('OCCUPATION / EMPLOYER').setHeading(DocumentApp.ParagraphHeading.HEADING2);
    addField(body, '21. Current occupation', data.occupation);
    addField(body, '22. Employer / School', data.employerName);
    body.appendParagraph('');
  }
  
  // Trip Details
  if (data.purpose || data.arrivalDate) {
    body.appendParagraph('TRIP DETAILS').setHeading(DocumentApp.ParagraphHeading.HEADING2);
    addField(body, '23. Main purpose of journey', data.purpose);
    addField(body, '24. Member State(s) of destination', data.memberStatesDestination);
    addField(body, '25. Member State of first entry', data.firstEntryMemberState);
    addField(body, '26. Number of entries requested', data.numberOfEntries);
    addField(body, '27. Intended duration (days)', data.durationDays);
    addField(body, '28. Schengen visas in past 3 years?', data.schengenVisasLast3YearsYN);
    if (data.schengenVisasLast3YearsYN === 'Yes') {
      addField(body, 'Previous visa dates', data.schengenVisasDetails);
    }
    addField(body, '29. Fingerprints collected previously?', data.fingerprintsYN);
    addField(body, '30. Entry permit for final destination?', data.entryPermitFinalCountryYN);
    if (data.entryPermitFinalCountryYN === 'Yes') {
      addField(body, 'Entry permit No.', data.entryPermitNo);
      addField(body, 'Valid from', data.entryPermitValidFrom);
      addField(body, 'Valid until', data.entryPermitValidUntil);
    }
    addField(body, '31. Intended date of arrival', data.arrivalDate);
    addField(body, 'Intended date of departure', data.departureDate);
    body.appendParagraph('');
  }
  
  // Sponsor
  if (data.invitedBy) {
    body.appendParagraph('INVITING PERSON / SPONSOR').setHeading(DocumentApp.ParagraphHeading.HEADING2);
    addField(body, '32. Invited by', data.invitedBy);
    if (data.invitedBy === 'Person') {
      addField(body, 'Surname', data.inviterSurname);
      addField(body, 'First name', data.inviterFirstName);
    } else if (data.invitedBy === 'Company/Organisation') {
      addField(body, 'Company/Organisation name', data.inviterCompanyName);
    }
    addField(body, 'Address & e-mail', data.inviterAddress);
    addField(body, 'Telephone', data.inviterPhone);
    addField(body, 'Member State(s)', data.hostMemberState);
    body.appendParagraph('');
  }
  
  // Costs
  if (data.costsCoveredBy || data.meansOfSupport) {
    body.appendParagraph('COSTS & MEANS OF SUPPORT').setHeading(DocumentApp.ParagraphHeading.HEADING2);
    addField(body, '33. Costs covered by', data.costsCoveredBy);
    addField(body, 'Means of support', data.meansOfSupport);
    addField(body, 'Travel medical insurance', data.hasMedicalInsurance);
    if (data.hasMedicalInsurance === 'Yes') {
      addField(body, 'Insurance details', data.insuranceDetails);
    }
    body.appendParagraph('');
  }
}

function generateDS160Doc(body, data) {
  // Add DS-160 specific sections here
  // For now, iterate through all data fields
  body.appendParagraph('APPLICATION DATA').setHeading(DocumentApp.ParagraphHeading.HEADING2);
  
  for (const key in data) {
    if (data.hasOwnProperty(key) && key !== 'photoDataURL' && key !== 'signatureDataURL') {
      const value = data[key];
      if (value !== null && value !== undefined && value !== '') {
        addField(body, formatFieldName(key), value);
      }
    }
  }
}

function addField(body, label, value) {
  if (value !== null && value !== undefined && value !== '') {
    const para = body.appendParagraph('');
    para.appendText(label + ': ').setBold(true);
    para.appendText(String(value));
  }
}

function formatFieldName(name) {
  return name
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
}

function dataURLtoBlob(dataURL) {
  const parts = dataURL.split(',');
  const mimeMatch = parts[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/png';
  const base64 = parts[1];
  const bytes = Utilities.base64Decode(base64);
  return Utilities.newBlob(bytes, mime);
}

function getOrCreateFolder(parent, name) {
  const folders = parent.getFoldersByName(name);
  return folders.hasNext() ? folders.next() : parent.createFolder(name);
}
