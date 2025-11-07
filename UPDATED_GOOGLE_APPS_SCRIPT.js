function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const formType = payload.formType || "nonimmigrant";

    // Log for debugging
    Logger.log("Received formType: " + formType);
    Logger.log("Applicant Name: " + (payload.applicantName || "Unknown"));
    Logger.log("Data keys: " + Object.keys(payload.data || {}).length);

    // Get or create appropriate folder based on form type
    let folderName;
    if (formType === "schengen") {
      folderName = "Schengen Visa Application Submissions";
    } else if (formType === "canada") {
      folderName = "Canada Visa Application Submissions";
    } else {
      folderName = "Online Nonimmigrant Visa Application Submissions";
    }

    let folder;
    const folders = DriveApp.getFoldersByName(folderName);
    if (folders.hasNext()) {
      folder = folders.next();
    } else {
      folder = DriveApp.createFolder(folderName);
    }

    // Create timestamp and applicant folder
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const applicantName = payload.applicantName || "Applicant";
    const safeName = applicantName.replace(/\s+/g, "_");
    const submissionFolder = folder.createFolder(`${safeName}_${timestamp}`);

    // Handle images if present (DS-160 Nonimmigrant only)
    let photoFile = null;
    let signatureFile = null;
    const cleanData = { ...payload.data };

    if (formType === "nonimmigrant" || formType === "ds160") {
      if (payload.data.photoDataURL) {
        photoFile = createImageFile(
          submissionFolder,
          payload.data.photoDataURL,
          "passport_photo.png"
        );
      }

      if (payload.data.signatureDataURL) {
        signatureFile = createImageFile(
          submissionFolder,
          payload.data.signatureDataURL,
          "signature.png"
        );
      }

      // Clean up base64 data
      delete cleanData.photoDataURL;
      delete cleanData.signatureDataURL;
    }

    // Create formatted Google Doc (contains all data)
    let docFile;
    if (formType === "schengen") {
      docFile = createSchengenDoc(submissionFolder, payload, timestamp);
    } else if (formType === "canada") {
      docFile = createCanadaDoc(submissionFolder, payload, timestamp);
    } else {
      docFile = createNonimmigrantDoc(submissionFolder, payload, timestamp);
    }

    return ContentService.createTextOutput(
      JSON.stringify({
        success: true,
        timestamp: new Date().toISOString(),
      })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({
        success: false,
        error: error.toString(),
      })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function createImageFile(folder, dataURL, fileName) {
  const parts = dataURL.split(",");
  const mimeMatch = parts[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : "image/png";
  const base64 = parts[1];
  const bytes = Utilities.base64Decode(base64);
  const blob = Utilities.newBlob(bytes, mime, fileName);
  return folder.createFile(blob);
}

function createNonimmigrantDoc(folder, payload, timestamp) {
  const applicantName = payload.applicantName || "Applicant";
  const doc = DocumentApp.create(
    `Nonimmigrant_Visa_Application_${applicantName}_${timestamp}`
  );
  const body = doc.getBody();

  // Title
  const title = body.appendParagraph("ONLINE NONIMMIGRANT VISA APPLICATION");
  title.setHeading(DocumentApp.ParagraphHeading.HEADING1);
  title.setAlignment(DocumentApp.HorizontalAlignment.CENTER);

  // Submission info
  const submittedDate = new Date(payload.createdAt || new Date());
  body.appendParagraph(
    `Submitted: ${submittedDate.toLocaleString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    })}`
  );
  body.appendParagraph(`Applicant: ${applicantName}`);
  body.appendHorizontalRule();

  const data = payload.data || {};

  // Define sections with field labels
  const sections = [
    {
      title: "PERSONAL INFORMATION",
      fields: [
        { key: "surname", label: "Surname (Last Name)" },
        { key: "givenNames", label: "Given Names (First and Middle)" },
        { key: "nativeFullName", label: "Full Name in Native Alphabet" },
        { key: "otherNamesUsed", label: "Have you used other names?" },
        { key: "sex", label: "Sex" },
        { key: "maritalStatus", label: "Marital Status" },
        { key: "nationalID", label: "National Identification Number" },
        { key: "usSSN", label: "U.S. Social Security Number" },
        { key: "usTaxpayerID", label: "U.S. Taxpayer ID Number" },
        { key: "dob", label: "Date of Birth" },
        { key: "birthCity", label: "City of Birth" },
        { key: "birthState", label: "State/Province of Birth" },
        { key: "birthCountry", label: "Country of Birth" },
        { key: "nationality", label: "Nationality" },
        { key: "otherNationalityYN", label: "Other Nationality" },
        { key: "languages", label: "Languages Spoken" },
      ],
    },
    {
      title: "CONTACT INFORMATION",
      fields: [
        { key: "homeStreet", label: "Street Address" },
        { key: "homeCity", label: "City" },
        { key: "homeState", label: "State/Province" },
        { key: "homePostal", label: "Postal Code" },
        { key: "homeCountry", label: "Country" },
        { key: "mailingSame", label: "Mailing Address Same as Home?" },
        { key: "mailingAddress", label: "Mailing Address" },
        { key: "primaryPhone", label: "Primary Phone" },
        { key: "secondaryPhone", label: "Secondary Phone" },
        { key: "email", label: "Primary Email" },
        { key: "email2", label: "Secondary Email" },
        { key: "socialMedia", label: "Social Media" },
      ],
    },
    {
      title: "PASSPORT INFORMATION",
      fields: [
        { key: "passportType", label: "Passport Type" },
        { key: "passportNumber", label: "Passport Number" },
        { key: "passportBookNumber", label: "Passport Book Number" },
        { key: "passportIssuingCountry", label: "Issuing Country" },
        { key: "passportIssueCity", label: "City of Issuance" },
        { key: "passportIssueCountry", label: "Country of Issuance" },
        { key: "passportIssueDate", label: "Issue Date" },
        { key: "passportExpiryDate", label: "Expiration Date" },
        { key: "otherPassportYN", label: "Other Passports?" },
        { key: "otherPassports", label: "Other Passport Details" },
        { key: "lostStolenYN", label: "Lost/Stolen Passport?" },
        { key: "lostStolenExplain", label: "Lost/Stolen Explanation" },
      ],
    },
    {
      title: "PREVIOUS U.S. TRAVEL",
      fields: [
        { key: "beenToUS", label: "Have you been to the U.S.?" },
        { key: "lastUSVisitDates", label: "Last U.S. Visit Dates" },
        { key: "overstayed", label: "Ever Overstayed?" },
        { key: "usVisaIssued", label: "U.S. Visa Issued Before?" },
        { key: "visaNumber", label: "Most Recent Visa Number" },
        { key: "visaRefused", label: "Visa Ever Refused?" },
        { key: "visaRefusedExplain", label: "Visa Refusal Explanation" },
        { key: "i94Number", label: "I-94 Number" },
      ],
    },
    {
      title: "U.S. POINT OF CONTACT",
      fields: [
        { key: "usContactName", label: "Contact Name" },
        { key: "usContactOrg", label: "Organization" },
        { key: "usContactRelationship", label: "Relationship" },
        { key: "usContactPhone", label: "Phone Number" },
        { key: "usContactEmail", label: "Email" },
        { key: "usContactAddress", label: "Address" },
      ],
    },
    {
      title: "FAMILY INFORMATION",
      fields: [
        { key: "fatherSurname", label: "Father's Surname" },
        { key: "fatherGiven", label: "Father's Given Name" },
        { key: "motherSurname", label: "Mother's Surname" },
        { key: "motherGiven", label: "Mother's Given Name" },
        { key: "hasSpouse", label: "Has Spouse?" },
        { key: "spouseName", label: "Spouse Name" },
        { key: "spouseDOB", label: "Spouse Date of Birth" },
        { key: "spouseNationality", label: "Spouse Nationality" },
        { key: "hasChildren", label: "Has Children?" },
        { key: "childrenNames", label: "Children Information" },
      ],
    },
    {
      title: "WORK/EDUCATION",
      fields: [
        { key: "occupation", label: "Occupation" },
        { key: "employerOrSchool", label: "Employer/School Name" },
        { key: "employerAddress", label: "Employer/School Address" },
        { key: "monthlyIncome", label: "Monthly Income" },
        { key: "duties", label: "Duties/Description" },
      ],
    },
  ];

  // Render each section
  sections.forEach((section) => {
    body.appendParagraph("");
    const sectionTitle = body.appendParagraph(section.title);
    sectionTitle.setHeading(DocumentApp.ParagraphHeading.HEADING2);

    let hasContent = false;
    section.fields.forEach((field) => {
      const value = data[field.key];
      if (
        value !== undefined &&
        value !== null &&
        String(value).trim() !== ""
      ) {
        hasContent = true;
        const para = body.appendParagraph(`${field.label}: ${value}`);
        para.setIndentStart(20);
      }
    });

    if (!hasContent) {
      const para = body.appendParagraph("No information provided");
      para.setIndentStart(20);
      para.setItalic(true);
    }
  });

  // Security & Background Questions
  body.appendParagraph("");
  const secTitle = body.appendParagraph("SECURITY & BACKGROUND QUESTIONS");
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
    "Have you ever renounced United States citizenship for the purpose of avoiding taxation?",
  ];

  let hasSecurityIssues = false;
  for (let i = 1; i <= secQuestions.length; i++) {
    const answer = data[`secQ${i}`];
    if (answer) {
      const para = body.appendParagraph(`Q${i}. ${secQuestions[i - 1]}`);
      para.setIndentStart(20);
      para.setBold(true);

      const answerPara = body.appendParagraph(`Answer: ${answer}`);
      answerPara.setIndentStart(40);

      if (answer === "Yes") {
        hasSecurityIssues = true;
        answerPara.setForegroundColor("#CC0000");

        const explanation = data[`secQ${i}Explain`];
        if (explanation) {
          const explainPara = body.appendParagraph(
            `Explanation: ${explanation}`
          );
          explainPara.setIndentStart(40);
          explainPara.setItalic(true);
        }
      }
    }
  }

  if (!hasSecurityIssues) {
    const para = body.appendParagraph(
      'All security questions answered "No" or not answered'
    );
    para.setIndentStart(20);
    para.setItalic(true);
  }

  body.appendParagraph("");
  body.appendHorizontalRule();
  body
    .appendParagraph("End of Online Nonimmigrant Visa Application Form")
    .setAlignment(DocumentApp.HorizontalAlignment.CENTER);

  doc.saveAndClose();
  const file = DriveApp.getFileById(doc.getId());
  file.moveTo(folder);
  return file;
}

function createSchengenDoc(folder, payload, timestamp) {
  const applicantName = payload.applicantName || "Applicant";
  const doc = DocumentApp.create(`Schengen_Visa_${applicantName}_${timestamp}`);
  const body = doc.getBody();

  // Title
  const title = body.appendParagraph("SCHENGEN VISA APPLICATION");
  title.setHeading(DocumentApp.ParagraphHeading.HEADING1);
  title.setAlignment(DocumentApp.HorizontalAlignment.CENTER);

  const submittedDate = new Date(payload.createdAt || new Date());
  body
    .appendParagraph(
      `Submitted: ${submittedDate.toLocaleString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZoneName: "short",
      })}`
    )
    .setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  body
    .appendParagraph(`Applicant: ${applicantName}`)
    .setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  body.appendHorizontalRule();

  const data = payload.data || {};

  // Applicant Information
  addSchengenSection(
    body,
    "APPLICANT INFORMATION",
    [
      { key: "surname", label: "1. Surname (Family name)" },
      { key: "surnameAtBirth", label: "2. Surname at birth" },
      { key: "firstName", label: "3. First name(s)" },
      { key: "dob", label: "4. Date of birth" },
      { key: "placeOfBirth", label: "5. Place of birth" },
      { key: "countryOfBirth", label: "6. Country of birth" },
      { key: "nationality", label: "7. Current nationality" },
      { key: "nationalitiesAtBirth", label: "Nationality at birth" },
      { key: "sex", label: "8. Sex" },
      { key: "maritalStatus", label: "9. Marital status" },
      { key: "nationalIdNumber", label: "10. National identity number" },
      { key: "minorGuardians", label: "11. For minors: Guardian(s)" },
    ],
    data
  );

  // Travel Document
  addSchengenSection(
    body,
    "TRAVEL DOCUMENT",
    [
      { key: "docType", label: "12. Type of travel document" },
      { key: "docNumber", label: "13. Number of travel document" },
      { key: "docIssuedByCountry", label: "14. Issued by" },
      { key: "docIssueDate", label: "15. Date of issue" },
      { key: "docExpiryDate", label: "16. Valid until" },
      { key: "docIssuedAt", label: "Place of issue" },
    ],
    data
  );

  // Contact
  addSchengenSection(
    body,
    "HOME & CONTACT",
    [
      { key: "homeAddress", label: "17. Home address" },
      { key: "homePostal", label: "Postal code, city" },
      { key: "homeCountry", label: "Country" },
      { key: "phone", label: "18. Telephone" },
      { key: "email", label: "19. E-mail" },
      {
        key: "residingOtherCountryYN",
        label: "20. Residing in another country?",
      },
      { key: "residencePermitNo", label: "Residence permit No." },
      {
        key: "residencePermitValidUntil",
        label: "Residence permit valid until",
      },
    ],
    data
  );

  // Employment
  addSchengenSection(
    body,
    "OCCUPATION / EMPLOYER",
    [
      { key: "occupation", label: "21. Current occupation" },
      { key: "employerName", label: "22. Employer / School name" },
      { key: "employerAddress", label: "Employer address" },
      { key: "employerPhone", label: "Employer phone" },
    ],
    data
  );

  // Trip Details
  addSchengenSection(
    body,
    "TRIP DETAILS",
    [
      { key: "purpose", label: "23. Main purpose of journey" },
      {
        key: "memberStatesDestination",
        label: "24. Member State(s) of destination",
      },
      {
        key: "firstEntryMemberState",
        label: "25. Member State of first entry",
      },
      { key: "numberOfEntries", label: "26. Number of entries requested" },
      { key: "durationDays", label: "27. Intended duration (days)" },
      {
        key: "schengenVisasLast3YearsYN",
        label: "28. Schengen visas in past 3 years?",
      },
      { key: "schengenVisasDetails", label: "Previous visa dates" },
      {
        key: "fingerprintsYN",
        label: "29. Fingerprints collected previously?",
      },
      { key: "fingerprintsDate", label: "Fingerprints collection date" },
      {
        key: "entryPermitFinalCountryYN",
        label: "30. Entry permit for final destination?",
      },
      { key: "entryPermitNo", label: "Entry permit No." },
      { key: "entryPermitValidFrom", label: "Entry permit valid from" },
      { key: "entryPermitValidUntil", label: "Entry permit valid until" },
      { key: "arrivalDate", label: "31. Intended date of arrival" },
      { key: "departureDate", label: "Intended date of departure" },
    ],
    data
  );

  // Sponsor
  addSchengenSection(
    body,
    "INVITING PERSON / SPONSOR",
    [
      { key: "invitedBy", label: "32. Invited by" },
      { key: "inviterSurname", label: "Surname" },
      { key: "inviterFirstName", label: "First name" },
      { key: "inviterCompanyName", label: "Company/Organisation name" },
      { key: "inviterAddress", label: "Address & e-mail" },
      { key: "inviterPhone", label: "Telephone" },
      { key: "hostMemberState", label: "Member State(s)" },
    ],
    data
  );

  // Costs
  addSchengenSection(
    body,
    "COSTS & MEANS OF SUPPORT",
    [
      { key: "costsCoveredBy", label: "33. Costs covered by" },
      { key: "meansOfSupport", label: "Means of support" },
      { key: "hasMedicalInsurance", label: "Travel medical insurance" },
      { key: "insuranceDetails", label: "Insurance details" },
      { key: "sponsorName", label: "Sponsor name" },
      { key: "sponsorRelationship", label: "Sponsor relationship" },
    ],
    data
  );

  // EU/EEA/Swiss Family Members
  addSchengenSection(
    body,
    "EU/EEA/SWISS FAMILY MEMBERS",
    [
      { key: "hasEUFamily", label: "Has EU/EEA/Swiss family member" },
      { key: "euFamilySurname", label: "Family member surname" },
      { key: "euFamilyGiven", label: "Family member given name" },
      { key: "euFamilyDOB", label: "Family member date of birth" },
      { key: "euFamilyNationality", label: "Family member nationality" },
      { key: "euFamilyDocNo", label: "Family member travel document number" },
      { key: "euFamilyRelationship", label: "Family relationship" },
    ],
    data
  );

  body.appendParagraph("");
  body.appendHorizontalRule();
  body
    .appendParagraph("End of Schengen Visa Application Form")
    .setAlignment(DocumentApp.HorizontalAlignment.CENTER);

  doc.saveAndClose();
  const file = DriveApp.getFileById(doc.getId());
  file.moveTo(folder);
  return file;
}

function addSchengenSection(body, title, fields, data) {
  body.appendParagraph("");
  const sectionTitle = body.appendParagraph(title);
  sectionTitle.setHeading(DocumentApp.ParagraphHeading.HEADING2);

  let hasContent = false;
  fields.forEach((field) => {
    const value = data[field.key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      hasContent = true;
      const para = body.appendParagraph(`${field.label}: ${value}`);
      para.setIndentStart(20);
    }
  });

  if (!hasContent) {
    const para = body.appendParagraph("No information provided");
    para.setIndentStart(20);
    para.setItalic(true);
  }
}

function createCanadaDoc(folder, payload, timestamp) {
  const applicantName = payload.applicantName || "Applicant";
  const doc = DocumentApp.create(`Canada_Visa_${applicantName}_${timestamp}`);
  const body = doc.getBody();

  // Title
  const title = body.appendParagraph("CANADA VISA APPLICATION");
  title.setHeading(DocumentApp.ParagraphHeading.HEADING1);
  title.setAlignment(DocumentApp.HorizontalAlignment.CENTER);

  const submittedDate = new Date(payload.createdAt || new Date());
  body
    .appendParagraph(
      `Submitted: ${submittedDate.toLocaleString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZoneName: "short",
      })}`
    )
    .setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  body
    .appendParagraph(`Applicant: ${applicantName}`)
    .setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  body.appendHorizontalRule();

  const data = payload.data || {};

  // Application Details
  addCanadaSection(
    body,
    "APPLICATION DETAILS",
    [
      { key: "applyFor", label: "I want to apply for" },
      { key: "whyVisa", label: "Why do you need a visa" },
      { key: "plans", label: "Plans in Canada" },
      { key: "enterDate", label: "Entry date" },
      { key: "leaveDate", label: "Departure date" },
      { key: "uci", label: "UCI" },
    ],
    data
  );

  // Applicant Identity
  addCanadaSection(
    body,
    "APPLICANT IDENTITY",
    [
      { key: "surname", label: "Surname or last name" },
      { key: "given", label: "Given name or first name" },
      { key: "dob", label: "Date of birth" },
      { key: "sex", label: "Gender" },
    ],
    data
  );

  // Travel Document
  addCanadaSection(
    body,
    "TRAVEL DOCUMENT",
    [
      { key: "travellingWith", label: "Document type" },
      { key: "passportKind", label: "Passport kind" },
      { key: "passportCountryCode", label: "Country code on passport" },
      { key: "passportNationality", label: "Nationality on passport" },
      { key: "passportNumber", label: "Passport number" },
      { key: "passportIssue", label: "Date of issue" },
      { key: "passportExpiry", label: "Date of expiry" },
      { key: "isUSLPR", label: "U.S. lawful permanent resident" },
      { key: "heldCdnVisa10y", label: "Held Canadian visa in past 10 years" },
      { key: "holdUSNIV", label: "Hold valid U.S. non-immigrant visa" },
      { key: "travelByAir", label: "Travelling by air" },
    ],
    data
  );

  // Citizenship & Birth
  addCanadaSection(
    body,
    "CITIZENSHIP & BIRTH",
    [
      { key: "birthCountry", label: "Country of birth" },
      { key: "birthCity", label: "City of birth" },
      { key: "isMultiCitizen", label: "Citizen of multiple countries" },
      { key: "citizenOf", label: "Citizen of" },
      { key: "citizenByBirth", label: "Citizen since birth" },
      { key: "citizenSince", label: "Citizen since date" },
    ],
    data
  );

  // National Identity Document
  addCanadaSection(
    body,
    "NATIONAL IDENTITY DOCUMENT",
    [
      { key: "hasNID", label: "Has national identity document" },
      { key: "nidNumber", label: "Document number" },
      { key: "nidIssue", label: "Date of issue" },
      { key: "nidIssuingCountry", label: "Issuing country" },
    ],
    data
  );

  // Names Used in the Past
  addCanadaSection(
    body,
    "NAMES USED IN THE PAST",
    [
      { key: "usedOtherName", label: "Used another name" },
      { key: "otherNameType", label: "Type of name" },
      { key: "otherSurname", label: "Other surname" },
      { key: "otherGiven", label: "Other given name" },
    ],
    data
  );

  // Contact Information
  addCanadaSection(
    body,
    "CONTACT INFORMATION",
    [
      { key: "resCountry", label: "Country" },
      { key: "street", label: "Street address" },
      { key: "city", label: "City or town" },
      { key: "mailSame", label: "Mailing address same as residential" },
      { key: "resStatus", label: "Status in country of residence" },
      { key: "resFrom", label: "Residing from date" },
      { key: "currentResidence", label: "Currently live here" },
    ],
    data
  );

  // Biometrics
  addCanadaSection(
    body,
    "BIOMETRICS",
    [
      { key: "bioGiven10y", label: "Provided biometrics in last 10 years" },
      { key: "bioReuse", label: "Wish to reuse valid biometrics" },
    ],
    data
  );

  // Invitation
  addCanadaSection(
    body,
    "INVITATION",
    [
      { key: "invSurname", label: "Inviter surname" },
      { key: "invGiven", label: "Inviter given name" },
      { key: "invRelationship", label: "Relationship" },
      { key: "invOrg", label: "Organization or conference" },
      { key: "invCountry", label: "Country" },
      { key: "invStreetNo", label: "Street number" },
      { key: "invStreetName", label: "Street name" },
      { key: "invCity", label: "City" },
      { key: "invProvince", label: "Province" },
      { key: "invPostal", label: "Postal code" },
      { key: "invTelType", label: "Telephone type" },
      { key: "invTelCountry", label: "Telephone country" },
      { key: "invDial", label: "Dial code" },
      { key: "invTel", label: "Telephone number" },
      { key: "invEmail", label: "Email address" },
      { key: "hasOtherInviter", label: "Other inviter" },
    ],
    data
  );

  // Special Event
  addCanadaSection(
    body,
    "SPECIAL EVENT",
    [
      { key: "hasEventCode", label: "Has event/conference code" },
      { key: "eventCode", label: "Special event code" },
    ],
    data
  );

  // Finances
  addCanadaSection(
    body,
    "FINANCES",
    [
      { key: "fundsCAD", label: "Funds available (CAD)" },
      { key: "otherFunding", label: "Receiving money from someone else" },
      { key: "fundingPersonName", label: "Name of person providing funds" },
      { key: "fundingRelationship", label: "Relationship to you" },
      { key: "fundingAmount", label: "Amount being provided (CAD)" },
      { key: "fundingPersonEmail", label: "Funder's email address" },
      { key: "fundingPersonPhone", label: "Funder's phone number" },
      { key: "fundingAdditionalInfo", label: "Additional funding information" },
    ],
    data
  );

  // Education, Work & Activities
  addCanadaSection(
    body,
    "EDUCATION, WORK & ACTIVITIES",
    [
      {
        key: "studiedPostSecondary",
        label: "Studied at post-secondary school",
      },
      { key: "schoolName", label: "School/institution name" },
      { key: "studyFrom", label: "Study from" },
      { key: "studyTo", label: "Study to" },
      { key: "studyLevel", label: "Level of study" },
      { key: "fieldOfStudy", label: "Field of study" },
      { key: "work1Activity", label: "Work/Activity" },
      { key: "work1JobTitle", label: "Job title" },
      { key: "work1Employer", label: "Employer" },
      { key: "work1Duties", label: "Duties" },
      { key: "work1Country", label: "Country" },
      { key: "work1From", label: "From" },
      { key: "work1To", label: "To" },
      { key: "work1Current", label: "Currently working here" },
      { key: "servedMilitary", label: "Military/civil defence service" },
      { key: "militaryDetails", label: "Military service details" },
    ],
    data
  );

  // Travel History
  addCanadaSection(
    body,
    "TRAVEL HISTORY",
    [
      { key: "traveled5years", label: "Travelled in past 5 years" },
      {
        key: "overstayOrUnauthorized",
        label: "Overstayed or worked/studied without authorization",
      },
      { key: "refusedOrRemoved", label: "Refused visa or removed" },
      { key: "refusalDetails", label: "Refusal/removal details" },
    ],
    data
  );

  // Criminality & Security
  addCanadaSection(
    body,
    "CRIMINALITY & SECURITY",
    [
      { key: "anyCrime", label: "Committed any crime" },
      { key: "arrestedCrime", label: "Arrested for criminal offence" },
      { key: "chargedCrime", label: "Charged for criminal offence" },
      { key: "convictedCrime", label: "Convicted for criminal offence" },
      { key: "violentOrgAssoc", label: "Associated with violent organization" },
      { key: "illTreatment", label: "Witnessed/participated in ill treatment" },
    ],
    data
  );

  // Medical Background
  addCanadaSection(
    body,
    "MEDICAL BACKGROUND",
    [
      {
        key: "irccExam12m",
        label: "Medical exam by IRCC physician in last 12 months",
      },
      {
        key: "tbDiagnosed2y",
        label: "Diagnosed with tuberculosis in last 2 years",
      },
      {
        key: "tbContact5y",
        label: "Close contact with tuberculosis in last 5 years",
      },
      { key: "dialysis", label: "Currently receiving dialysis" },
      { key: "drugAlcohol", label: "Drug/alcohol addiction" },
      { key: "mentalHealth", label: "Mental health condition" },
      { key: "syphilis", label: "Ever diagnosed with syphilis" },
    ],
    data
  );

  // Family Information
  addCanadaSection(
    body,
    "FAMILY INFORMATION",
    [
      { key: "maritalStatus", label: "Marital status" },
      { key: "marriageDate", label: "Marriage/common-law start date" },
      { key: "spouseSurname", label: "Spouse surname" },
      { key: "spouseGiven", label: "Spouse given name" },
      { key: "spouseDOB", label: "Spouse date of birth" },
      { key: "spouseBirthCountry", label: "Spouse country of birth" },
      { key: "spouseBirthCity", label: "Spouse city of birth" },
      { key: "spouseOccupation", label: "Spouse occupation" },
      { key: "spouseAccompany", label: "Spouse will accompany" },
      { key: "spouseSameAddress", label: "Spouse lives at same address" },
      { key: "hasChildren", label: "Has children" },
      { key: "childrenBlock", label: "Children details" },
      { key: "parent1Surname", label: "Parent 1 surname" },
      { key: "parent1Given", label: "Parent 1 given name" },
      { key: "parent1Relationship", label: "Parent 1 relationship" },
      { key: "parent1DOB", label: "Parent 1 date of birth" },
      { key: "parent1Deceased", label: "Parent 1 deceased" },
      { key: "parent1DOD", label: "Parent 1 date of death" },
      { key: "parent1BirthCountry", label: "Parent 1 country of birth" },
      { key: "parent2Surname", label: "Parent 2 surname" },
      { key: "parent2Given", label: "Parent 2 given name" },
      { key: "parent2Relationship", label: "Parent 2 relationship" },
      { key: "parent2DOB", label: "Parent 2 date of birth" },
      { key: "parent2Deceased", label: "Parent 2 deceased" },
      { key: "parent2DOD", label: "Parent 2 date of death" },
      { key: "parent2BirthCountry", label: "Parent 2 country of birth" },
    ],
    data
  );

  // Language & Communication
  addCanadaSection(
    body,
    "LANGUAGE & COMMUNICATION",
    [
      { key: "nativeLanguage", label: "Native language" },
      { key: "canCommunicate", label: "Can communicate in" },
      { key: "contactLanguage", label: "Preferred contact language" },
      { key: "appEmail", label: "Email address" },
      { key: "appEmailConfirm", label: "Email address (confirmed)" },
      { key: "telType", label: "Telephone type" },
      { key: "telCountry", label: "Telephone country" },
      { key: "telDial", label: "Dial code" },
      { key: "telNumber", label: "Telephone number" },
    ],
    data
  );

  body.appendParagraph("");
  body.appendHorizontalRule();
  body
    .appendParagraph("End of Canada Visa Application Form")
    .setAlignment(DocumentApp.HorizontalAlignment.CENTER);

  doc.saveAndClose();
  const file = DriveApp.getFileById(doc.getId());
  file.moveTo(folder);
  return file;
}

function addCanadaSection(body, title, fields, data) {
  body.appendParagraph("");
  const sectionTitle = body.appendParagraph(title);
  sectionTitle.setHeading(DocumentApp.ParagraphHeading.HEADING2);

  let hasContent = false;
  fields.forEach((field) => {
    const value = data[field.key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      hasContent = true;
      const para = body.appendParagraph(`${field.label}: ${value}`);
      para.setIndentStart(20);
    }
  });

  if (!hasContent) {
    const para = body.appendParagraph("No information provided");
    para.setIndentStart(20);
    para.setItalic(true);
  }
}

// Test function
function test() {
  const testPayload = {
    e: {
      postData: {
        contents: JSON.stringify({
          formType: "canada",
          applicantName: "John Doe",
          createdAt: new Date().toISOString(),
          data: {
            surname: "Doe",
            given: "John",
            applyFor: "Visitor visa (TRV)",
            whyVisa: "Tourism",
            enterDate: "2025-05-01",
            leaveDate: "2025-05-15",
          },
        }),
      },
    },
  };

  const result = doPost(testPayload.e);
  Logger.log(result.getContent());
}
