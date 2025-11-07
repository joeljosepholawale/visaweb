function doPost(e) {
  try {
    // Parse the incoming JSON payload
    const payload = JSON.parse(e.postData.contents);
    
    // Get or create the folder for submissions
    const folderName = payload.formType === 'canada' ? 'Canada Form Submissions' : 
                      payload.formType === 'schengen' ? 'Schengen Form Submissions' :
                      'DS-160 Form Submissions';
    let folder;
    const folders = DriveApp.getFoldersByName(folderName);
    if (folders.hasNext()) {
      folder = folders.next();
    } else {
      folder = DriveApp.createFolder(folderName);
    }
    
    // Create JSON backup file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const applicantName = payload.applicantName || 'Applicant';
    const jsonFileName = `${payload.fileName || 'Submission_' + timestamp}.json`;
    
    const jsonFile = folder.createFile(
      jsonFileName,
      JSON.stringify(payload, null, 2),
      MimeType.PLAIN_TEXT
    );
    
    // Create a formatted Google Doc
    const docFile = createFormattedDoc(folder, payload, timestamp);
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        fileId: docFile.getId(),
        fileName: docFile.getName(),
        jsonFileId: jsonFile.getId(),
        timestamp: new Date().toISOString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function createFormattedDoc(folder, payload, timestamp) {
  const applicantName = payload.applicantName || 'Applicant';
  const formType = payload.formType || 'ds160';
  const docTitle = formType === 'canada' ? 'Canada Visa Application' :
                   formType === 'schengen' ? 'Schengen Visa Application' :
                   'DS-160 Nonimmigrant Visa Application';
  
  const doc = DocumentApp.create(`${docTitle} - ${applicantName} - ${timestamp}`);
  const body = doc.getBody();
  
  // Title
  const title = body.appendParagraph(docTitle.toUpperCase());
  title.setHeading(DocumentApp.ParagraphHeading.HEADING1);
  title.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  
  // Submission info
  const submittedDate = new Date(payload.createdAt || new Date());
  body.appendParagraph(`Submitted: ${submittedDate.toLocaleString('en-US', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', 
    hour: '2-digit', minute: '2-digit', timeZoneName: 'short' 
  })}`);
  body.appendParagraph(`Applicant: ${applicantName}`);
  body.appendHorizontalRule();
  
  const data = payload.data || {};
  
  // Define sections with field labels
  const sections = [
    {
      title: 'PERSONAL INFORMATION',
      fields: [
        { key: 'surname', label: 'Surname (Last Name)' },
        { key: 'givenNames', label: 'Given Names (First and Middle)' },
        { key: 'nativeFullName', label: 'Full Name in Native Alphabet' },
        { key: 'otherNamesUsed', label: 'Have you used other names?' },
        { key: 'sex', label: 'Sex' },
        { key: 'maritalStatus', label: 'Marital Status' },
        { key: 'nationalID', label: 'National Identification Number' },
        { key: 'usSSN', label: 'U.S. Social Security Number' },
        { key: 'usTaxpayerID', label: 'U.S. Taxpayer ID Number' },
        { key: 'dob', label: 'Date of Birth' },
        { key: 'birthCity', label: 'City of Birth' },
        { key: 'birthState', label: 'State/Province of Birth' },
        { key: 'birthCountry', label: 'Country of Birth' },
        { key: 'nationality', label: 'Nationality' },
        { key: 'otherNationalityYN', label: 'Other Nationality' },
        { key: 'hasTelecode', label: 'Has Telecode?' },
        { key: 'permanentResident', label: 'Permanent Resident of Other Country?' }
      ]
    },
    {
      title: 'CONTACT INFORMATION',
      fields: [
        { key: 'homeStreet', label: 'Street Address' },
        { key: 'homeCity', label: 'City' },
        { key: 'homeState', label: 'State/Province' },
        { key: 'homePostal', label: 'Postal Code' },
        { key: 'homeCountry', label: 'Country' },
        { key: 'mailingSame', label: 'Mailing Address Same as Home?' },
        { key: 'mailingAddress', label: 'Mailing Address' },
        { key: 'primaryPhone', label: 'Primary Phone' },
        { key: 'primaryPhoneConfirm', label: 'Primary Phone Confirmation' },
        { key: 'secondaryPhone', label: 'Secondary Phone' },
        { key: 'email', label: 'Primary Email' },
        { key: 'email2', label: 'Secondary Email' },
        { key: 'socialMedia', label: 'Social Media' },
        { key: 'otherPhones5y', label: 'Used Other Phones in Last 5 Years?' },
        { key: 'otherPhones5yDetails', label: 'Other Phone Numbers' }
      ]
    },
    {
      title: 'PASSPORT INFORMATION',
      fields: [
        { key: 'passportType', label: 'Passport Type' },
        { key: 'passportNumber', label: 'Passport Number' },
        { key: 'passportBookNumber', label: 'Passport Book Number' },
        { key: 'passportIssuingCountry', label: 'Issuing Country' },
        { key: 'passportIssueCity', label: 'City of Issuance' },
        { key: 'passportIssueCountry', label: 'Country of Issuance' },
        { key: 'passportIssueDate', label: 'Issue Date' },
        { key: 'passportExpiryDate', label: 'Expiration Date' },
        { key: 'otherPassportYN', label: 'Other Passports?' },
        { key: 'otherPassports', label: 'Other Passport Details' },
        { key: 'lostStolenYN', label: 'Lost/Stolen Passport?' },
        { key: 'lostStolenExplain', label: 'Lost/Stolen Explanation' }
      ]
    },
    {
      title: 'TRAVEL INFORMATION',
      fields: [
        { key: 'purposeOfTrip', label: 'Purpose of Trip' },
        { key: 'purposeDetails', label: 'Purpose Details' },
        { key: 'hasSpecificPlans', label: 'Has Specific Travel Plans?' },
        { key: 'arriveDate', label: 'Arrival Date' },
        { key: 'arriveFlight', label: 'Arrival Flight' },
        { key: 'arriveCity', label: 'Arrival City' },
        { key: 'departDate', label: 'Departure Date' },
        { key: 'departFlight', label: 'Departure Flight' },
        { key: 'departCity', label: 'Departure City' },
        { key: 'visitLocations', label: 'Locations to Visit' },
        { key: 'estArriveDate', label: 'Estimated Arrival Date' },
        { key: 'stayValue', label: 'Length of Stay (Value)' },
        { key: 'stayUnit', label: 'Length of Stay (Unit)' },
        { key: 'usStayStreet1', label: 'U.S. Stay Address Line 1' },
        { key: 'usStayStreet2', label: 'U.S. Stay Address Line 2' },
        { key: 'usStayCity', label: 'U.S. Stay City' },
        { key: 'usStayState', label: 'U.S. Stay State' },
        { key: 'usStayZip', label: 'U.S. Stay ZIP' },
        { key: 'tripPayer', label: 'Who is Paying for Trip?' },
        { key: 'payerSurname', label: 'Payer Surname' },
        { key: 'payerGiven', label: 'Payer Given Name' },
        { key: 'payerPhone', label: 'Payer Phone' },
        { key: 'payerEmail', label: 'Payer Email' },
        { key: 'payerRelationship', label: 'Payer Relationship' }
      ]
    },
    {
      title: 'ACCOMPANYING TRAVELERS',
      fields: [
        { key: 'hasCompanions', label: 'Traveling with Others?' },
        { key: 'companionSurname', label: 'Companion Surname' },
        { key: 'companionGivenName', label: 'Companion Given Name' },
        { key: 'companionRelationship', label: 'Companion Relationship' },
        { key: 'companionDOB', label: 'Companion Date of Birth' },
        { key: 'companionNationality', label: 'Companion Nationality' },
        { key: 'companionPassportNumber', label: 'Companion Passport Number' },
        { key: 'asGroup', label: 'Traveling as Group/Organization?' },
        { key: 'groupName', label: 'Group Name' }
      ]
    },
    {
      title: 'PREVIOUS U.S. TRAVEL',
      fields: [
        { key: 'beenToUS', label: 'Been to U.S. Before?' },
        { key: 'lastVisitDates', label: 'Last Visit Dates' },
        { key: 'prevStayLength', label: 'Previous Stay Length' },
        { key: 'overstayedUS', label: 'Ever Overstayed?' },
        { key: 'usVisaIssued', label: 'U.S. Visa Issued?' },
        { key: 'lastVisaIssueDate', label: 'Last Visa Issue Date' },
        { key: 'visaNumber', label: 'Visa Number' },
        { key: 'visaNumberUnknown', label: 'Visa Number Unknown' },
        { key: 'sameVisaType', label: 'Same Visa Type?' },
        { key: 'sameCountryApply', label: 'Same Country Application?' },
        { key: 'tenPrinted', label: 'Ten-Printed?' },
        { key: 'visaLostStolen', label: 'Visa Lost/Stolen?' },
        { key: 'visaLostYear', label: 'Visa Lost Year' },
        { key: 'visaLostExplain', label: 'Visa Lost Explanation' },
        { key: 'visaCancelled', label: 'Visa Cancelled?' },
        { key: 'visaCancelledExplain', label: 'Visa Cancelled Explanation' },
        { key: 'usVisaRefused', label: 'Visa Refused?' },
        { key: 'usVisaRefusedExplain', label: 'Visa Refusal Explanation' },
        { key: 'hasUSDL', label: 'Has U.S. Driver License?' },
        { key: 'usdlNumber', label: 'Driver License Number' },
        { key: 'usdlState', label: 'Driver License State' },
        { key: 'usdlUnknown', label: 'Driver License Unknown' },
        { key: 'uscisPetition', label: 'USCIS Petition Filed?' },
        { key: 'uscisPetitionExplain', label: 'USCIS Petition Explanation' }
      ]
    },
    {
      title: 'U.S. POINT OF CONTACT',
      fields: [
        { key: 'usContactName', label: 'Contact Name' },
        { key: 'usContactOrg', label: 'Organization' },
        { key: 'usContactRelationship', label: 'Relationship' },
        { key: 'usContactPhone', label: 'Phone Number' },
        { key: 'usContactEmail', label: 'Email' },
        { key: 'usPOCStreet', label: 'Street' },
        { key: 'usPOCCity', label: 'City' },
        { key: 'usPOCState', label: 'State' },
        { key: 'usPOCZip', label: 'ZIP Code' }
      ]
    },
    {
      title: 'FAMILY INFORMATION',
      fields: [
        { key: 'fatherSurname', label: "Father's Surname" },
        { key: 'fatherGiven', label: "Father's Given Name" },
        { key: 'fatherDOB', label: "Father's Date of Birth" },
        { key: 'fatherDOBUnknown', label: "Father's DOB Unknown" },
        { key: 'fatherInUS', label: 'Father in U.S.?' },
        { key: 'motherSurname', label: "Mother's Surname" },
        { key: 'motherGiven', label: "Mother's Given Name" },
        { key: 'motherDOB', label: "Mother's Date of Birth" },
        { key: 'motherDOBUnknown', label: "Mother's DOB Unknown" },
        { key: 'motherInUS', label: 'Mother in U.S.?' },
        { key: 'hasImmediateRelativesUS', label: 'Has Immediate Relatives in U.S.?' },
        { key: 'immediateRelativeSurname', label: 'Immediate Relative Surname' },
        { key: 'immediateRelativeGivenName', label: 'Immediate Relative Given Name' },
        { key: 'immediateRelativeRelationship', label: 'Immediate Relative Relationship' },
        { key: 'immediateRelativeStatus', label: 'Immediate Relative U.S. Status' },
        { key: 'immediateRelativeStreet', label: 'Immediate Relative Street Address' },
        { key: 'immediateRelativeCity', label: 'Immediate Relative City' },
        { key: 'immediateRelativeState', label: 'Immediate Relative State' },
        { key: 'immediateRelativeZip', label: 'Immediate Relative ZIP Code' },
        { key: 'immediateRelativePhone', label: 'Immediate Relative Phone Number' },
        { key: 'hasOtherRelativesUS', label: 'Has Other Relatives in U.S.?' },
        { key: 'otherRelativeSurname', label: 'Other Relative Surname' },
        { key: 'otherRelativeGivenName', label: 'Other Relative Given Name' },
        { key: 'otherRelativeRelationship', label: 'Other Relative Relationship' },
        { key: 'otherRelativeStatus', label: 'Other Relative U.S. Status' },
        { key: 'otherRelativeStreet', label: 'Other Relative Street Address' },
        { key: 'otherRelativeCity', label: 'Other Relative City' },
        { key: 'otherRelativeState', label: 'Other Relative State' },
        { key: 'otherRelativeZip', label: 'Other Relative ZIP Code' },
        { key: 'otherRelativePhone', label: 'Other Relative Phone Number' },
        { key: 'hasSpouse', label: 'Has Spouse?' },
        { key: 'spouseName', label: 'Spouse Name' },
        { key: 'spouseDOB', label: 'Spouse Date of Birth' },
        { key: 'spouseNationality', label: 'Spouse Nationality' },
        { key: 'spouseBirthCity', label: 'Spouse Birth City' },
        { key: 'spouseBirthCountry', label: 'Spouse Birth Country' },
        { key: 'spouseAddressKind', label: 'Spouse Address Type' },
        { key: 'spouseAddressOther', label: 'Spouse Address (Other)' },
        { key: 'hasChildren', label: 'Has Children?' },
        { key: 'childrenNames', label: 'Children Information' }
      ]
    },
    {
      title: 'PRESENT WORK INFORMATION',
      fields: [
        { key: 'occupation', label: 'Primary Occupation' },
        { key: 'employerName', label: 'Employer/School Name' },
        { key: 'empStreet1', label: 'Street Address Line 1' },
        { key: 'empStreet2', label: 'Street Address Line 2' },
        { key: 'empCity', label: 'City' },
        { key: 'empState', label: 'State/Province' },
        { key: 'empZip', label: 'Postal/ZIP Code' },
        { key: 'empCountry', label: 'Country' },
        { key: 'empPhone', label: 'Phone Number' },
        { key: 'empStartDate', label: 'Start Date' },
        { key: 'monthlyIncome', label: 'Monthly Income' },
        { key: 'duties', label: 'Job Duties' }
      ]
    },
    {
      title: 'PREVIOUS WORK INFORMATION',
      fields: [
        { key: 'hasPreviousWork', label: 'Has Previous Work Experience?' },
        { key: 'prevEmployerName', label: 'Previous Employer Name' },
        { key: 'prevJobTitle', label: 'Previous Job Title' },
        { key: 'prevEmpStreet', label: 'Previous Employer Street' },
        { key: 'prevEmpCity', label: 'Previous Employer City' },
        { key: 'prevEmpState', label: 'Previous Employer State' },
        { key: 'prevEmpZip', label: 'Previous Employer ZIP Code' },
        { key: 'prevEmpCountry', label: 'Previous Employer Country' },
        { key: 'prevEmpPhone', label: 'Previous Employer Phone Number' },
        { key: 'prevEmpStartDate', label: 'Previous Job Start Date' },
        { key: 'prevEmpEndDate', label: 'Previous Job End Date' },
        { key: 'prevDuties', label: 'Previous Job Duties' },
        { key: 'prevSupervisorSurname', label: 'Previous Supervisor Surname' },
        { key: 'prevSupervisorGivenName', label: 'Previous Supervisor Given Name' },
        { key: 'prevSupervisorPhone', label: 'Previous Supervisor Phone Number' }
      ]
    },
    {
      title: 'ADDITIONAL WORK & ACTIVITIES',
      fields: [
        { key: 'clanTribe', label: 'Belongs to Clan/Tribe?' },
        { key: 'clanTribeName', label: 'Clan/Tribe Name' },
        { key: 'languages', label: 'Languages Spoken' },
        { key: 'traveled5y', label: 'Traveled in Last 5 Years?' },
        { key: 'traveled5yDetails', label: 'Travel Details' },
        { key: 'orgMembership', label: 'Organization Membership?' },
        { key: 'orgMembershipExplain', label: 'Organization Membership Details' },
        { key: 'specialSkills', label: 'Specialized Skills?' },
        { key: 'specialSkillsExplain', label: 'Specialized Skills Details' },
        { key: 'servedMilitary', label: 'Served in Military?' },
        { key: 'milFrom', label: 'Military Service From' },
        { key: 'milTo', label: 'Military Service To' },
        { key: 'paramilitaryAssoc', label: 'Paramilitary Association?' },
        { key: 'paramilitaryExplain', label: 'Paramilitary Details' }
      ]
    },
    {
      title: 'EDUCATION',
      fields: [
        { key: 'studiedSecondaryUp', label: 'Attended Secondary Level or Above?' },
        { key: 'schoolName', label: 'School/Institution Name' },
        { key: 'schoolStreet', label: 'School Street Address' },
        { key: 'schoolCity', label: 'School City' },
        { key: 'schoolState', label: 'School State/Province' },
        { key: 'schoolPostal', label: 'School Postal Code' },
        { key: 'schoolCountry', label: 'School Country' },
        { key: 'courseOfStudy', label: 'Course of Study' },
        { key: 'schoolStartDate', label: 'School Start Date' },
        { key: 'schoolEndDate', label: 'School End Date' }
      ]
    }
  ];
  
  // Render each section
  sections.forEach(section => {
    body.appendParagraph(''); // spacing
    const sectionTitle = body.appendParagraph(section.title);
    sectionTitle.setHeading(DocumentApp.ParagraphHeading.HEADING2);
    
    let hasContent = false;
    section.fields.forEach(field => {
      const value = data[field.key];
      if (value && String(value).trim() !== '') {
        hasContent = true;
        const para = body.appendParagraph(`${field.label}: ${value}`);
        para.setIndentStart(20);
      }
    });
    
    if (!hasContent) {
      const para = body.appendParagraph('No information provided');
      para.setIndentStart(20);
      para.setItalic(true);
    }
  });
  
  // Security & Background Questions (only for DS-160)
  if (formType === 'ds160') {
    body.appendParagraph('');
    const secTitle = body.appendParagraph('SECURITY & BACKGROUND QUESTIONS');
    secTitle.setHeading(DocumentApp.ParagraphHeading.HEADING2);
    
    const secQuestions = [
      "Do you have a communicable disease of public health significance?",
      "Do you have a mental or physical disorder that poses a threat to yourself or others?",
      "Are you or have you ever been a drug abuser or addict?",
      "Have you ever been arrested or convicted for any offense or crime?",
      "Have you ever violated or engaged in a conspiracy to violate any law relating to controlled substances?",
      "Are you seeking to engage in or have you ever engaged in terrorist activities?",
      "Have you ever or do you intend to provide financial assistance or support to terrorists?",
      "Are you a member of or affiliated with a terrorist organization?",
      "Have you ever ordered, incited, committed, assisted, or otherwise participated in genocide?",
      "Have you ever committed, ordered, incited, assisted, or otherwise participated in torture?",
      "Have you ever committed, ordered, incited, assisted, or otherwise participated in extrajudicial killings, political killings, or other acts of violence?",
      "Have you ever engaged in the recruitment or the use of child soldiers?",
      "Have you, while serving as a government official, been responsible for or directly carried out particularly severe violations of religious freedom?",
      "Are you the spouse, son, or daughter of an individual who has been involved in trafficking in persons and have you, within the last five years, knowingly benefitted from the trafficking activities?",
      "Do you seek to enter the United States to engage in prostitution or unlawful commercialized vice or have you been engaged in prostitution or procuring (or attempting to procure) prostitutes within the past 10 years?",
      "Have you ever been involved in money laundering?",
      "Have you ever committed or conspired to commit a human trafficking offense in the United States or outside the United States?",
      "Have you ever knowingly aided, abetted, assisted, or colluded with a human trafficker?",
      "Are you the spouse, son, or daughter of an individual who has committed or conspired to commit a human trafficking offense and have you, within the last five years, knowingly benefitted from the trafficking activities?",
      "Have you ever engaged in the illicit trafficking of firearms, explosives, or other weapons?",
      "Have you ever been removed or deported from the United States?",
      "Have you ever overstayed a previous U.S. visa or violated the terms of a U.S. visa?",
      "Have you ever sought to obtain or assist others to obtain a visa, entry into the United States, or any other U.S. immigration benefit by fraud or willful misrepresentation or other unlawful means?",
      "Have you ever withheld custody of a U.S. citizen child outside the United States from a person granted legal custody by a U.S. court?",
      "Have you ever voted in the United States in violation of any law or regulation?",
      "Have you ever renounced United States citizenship for the purpose of avoiding taxation?"
    ];
    
    let hasSecurityIssues = false;
    for (let i = 1; i <= secQuestions.length; i++) {
      const answer = data[`secQ${i}`];
      if (answer) {
        const para = body.appendParagraph(`Q${i}. ${secQuestions[i-1]}`);
        para.setIndentStart(20);
        para.setBold(true);
        
        const answerPara = body.appendParagraph(`Answer: ${answer}`);
        answerPara.setIndentStart(40);
        
        if (answer === 'Yes') {
          hasSecurityIssues = true;
          answerPara.setForegroundColor('#CC0000'); // Red for Yes answers
          
          const explanation = data[`secQ${i}Explain`];
          if (explanation) {
            const explainPara = body.appendParagraph(`Explanation: ${explanation}`);
            explainPara.setIndentStart(40);
            explainPara.setItalic(true);
          }
        }
      }
    }
    
    if (!hasSecurityIssues) {
      const para = body.appendParagraph('All security questions answered "No" or not answered');
      para.setIndentStart(20);
      para.setItalic(true);
    }
  }
  
  // Footer
  body.appendParagraph('');
  body.appendHorizontalRule();
  body.appendParagraph(`End of ${docTitle}`).setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  
  doc.saveAndClose();
  
  // Move the document to the submissions folder
  const file = DriveApp.getFileById(doc.getId());
  file.moveTo(folder);
  
  return file;
}

// Test function (run this to verify your script works)
function test() {
  const testPayload = {
    e: {
      postData: {
        contents: JSON.stringify({
          formType: 'ds160',
          fileName: 'test_submission.json',
          applicantName: 'John Doe',
          createdAt: new Date().toISOString(),
          data: {
            surname: 'Doe',
            givenNames: 'John',
            email: 'john.doe@example.com',
            occupation: 'Engineer',
            hasPreviousWork: 'Yes',
            prevEmployerName: 'Previous Company Inc.'
          }
        })
      }
    }
  };
  
  const result = doPost(testPayload.e);
  Logger.log(result.getContent());
}
