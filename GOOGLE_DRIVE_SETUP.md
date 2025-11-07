# Google Drive Integration Setup

This guide will help you set up automatic form submissions to Google Drive using Google Apps Script.

## Step 1: Create a Google Apps Script Project

1. Go to [script.google.com](https://script.google.com)
2. Click "New Project"
3. Copy the code below into the Code.gs file
4. Save the project with a name like "DS-160 Form Handler"

## Step 2: Apps Script Code

```javascript
function doPost(e) {
  try {
    // Parse the incoming JSON payload
    const payload = JSON.parse(e.postData.contents);
    
    // Get or create the folder for DS-160 submissions
    const folderName = 'DS-160 Form Submissions';
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
    const jsonFileName = `DS160_${applicantName.replace(/\s+/g, '_')}_${timestamp}.json`;
    
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
  const doc = DocumentApp.create(`DS-160 Application - ${applicantName} - ${timestamp}`);
  const body = doc.getBody();
  
  // Title
  const title = body.appendParagraph('DS-160 NONIMMIGRANT VISA APPLICATION');
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
        { key: 'languages', label: 'Languages Spoken' }
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
        { key: 'secondaryPhone', label: 'Secondary Phone' },
        { key: 'email', label: 'Primary Email' },
        { key: 'email2', label: 'Secondary Email' },
        { key: 'socialMedia', label: 'Social Media' }
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
      title: 'PREVIOUS U.S. TRAVEL',
      fields: [
        { key: 'beenToUS', label: 'Have you been to the U.S.?' },
        { key: 'lastUSVisitDates', label: 'Last U.S. Visit Dates' },
        { key: 'overstayed', label: 'Ever Overstayed?' },
        { key: 'usVisaIssued', label: 'U.S. Visa Issued Before?' },
        { key: 'visaNumber', label: 'Most Recent Visa Number' },
        { key: 'visaRefused', label: 'Visa Ever Refused?' },
        { key: 'visaRefusedExplain', label: 'Visa Refusal Explanation' },
        { key: 'i94Number', label: 'I-94 Number' }
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
        { key: 'usContactAddress', label: 'Address' }
      ]
    },
    {
      title: 'FAMILY INFORMATION',
      fields: [
        { key: 'fatherSurname', label: "Father's Surname" },
        { key: 'fatherGiven', label: "Father's Given Name" },
        { key: 'motherSurname', label: "Mother's Surname" },
        { key: 'motherGiven', label: "Mother's Given Name" },
        { key: 'hasSpouse', label: 'Has Spouse?' },
        { key: 'spouseName', label: 'Spouse Name' },
        { key: 'spouseDOB', label: 'Spouse Date of Birth' },
        { key: 'spouseNationality', label: 'Spouse Nationality' },
        { key: 'hasChildren', label: 'Has Children?' },
        { key: 'childrenNames', label: 'Children Information' }
      ]
    },
    {
      title: 'WORK/EDUCATION',
      fields: [
        { key: 'occupation', label: 'Occupation' },
        { key: 'employerOrSchool', label: 'Employer/School Name' },
        { key: 'employerAddress', label: 'Employer/School Address' },
        { key: 'monthlyIncome', label: 'Monthly Income' },
        { key: 'duties', label: 'Duties/Description' }
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
  
  // Security & Background Questions
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
  
  // Footer
  body.appendParagraph('');
  body.appendHorizontalRule();
  body.appendParagraph('End of DS-160 Application Form').setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  
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
          fileName: 'test_submission.json',
          applicantName: 'John Doe',
          createdAt: new Date().toISOString(),
          data: {
            surname: 'Doe',
            givenNames: 'John',
            email: 'john.doe@example.com'
          }
        })
      }
    }
  };
  
  const result = doPost(testPayload.e);
  Logger.log(result.getContent());
}
```

## Step 3: Deploy the Web App

1. Click "Deploy" → "New deployment"
2. Click the gear icon ⚙️ → Select "Web app"
3. Configuration:
   - **Description**: DS-160 Form Handler
   - **Execute as**: Me (your email)
   - **Who has access**: Anyone
4. Click "Deploy"
5. Copy the **Web App URL** (it will look like: `https://script.google.com/macros/s/ABC123.../exec`)

## Step 4: Update Your React App

1. Open `src/utils/drive.js`
2. Replace `YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE` with your Web App URL:

```javascript
const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec'
```

## Step 5: Test the Integration

1. Fill out the DS-160 form
2. Sign and submit
3. Check your Google Drive for a new folder called "DS-160 Form Submissions"
4. Verify the JSON file was created

## Troubleshooting

### "Access Denied" Error
- Make sure you set "Who has access" to "Anyone" in the deployment settings
- Try redeploying the script

### No file created
- Run the `test()` function in Apps Script to check for errors
- Check the Executions log in Apps Script for error messages

### CORS Issues
- The React app uses `mode: 'no-cors'` which is normal for Google Apps Script
- You won't get a response body, but the file will still be created

## Security Note

Anyone with the Web App URL can submit to your Google Drive. For production use, consider:
- Adding authentication tokens
- Validating requests
- Rate limiting
- Using a database instead of direct file storage

## Folder Structure

```
Google Drive
└── DS-160 Form Submissions/
    ├── DS160_John_Doe_2025-01-19.json
    ├── DS160_Jane_Smith_2025-01-19.json
    └── ...
```

## Next Steps

- Set up email notifications when forms are submitted
- Create a Google Sheet to track submissions
- Generate PDF summaries automatically
- Add signature image storage
