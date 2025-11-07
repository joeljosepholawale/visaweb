import { COUNTRIES, COUNTRIES_EU } from '../../data/countries.js'

const YESNO = ['Yes','No'];

export const SCHENGEN_SECTIONS = [
  { group:'Applicant', title:'Applicant', id:'applicant', instruction:'Provide complete personal information about the applicant as it appears on official documents:', fields:[
    {type:'text', name:'surname', label:'1. Surname (Family name)', required:true},
    {type:'text', name:'surnameAtBirth', label:'2. Surname at birth (former family name/s)'},
    {type:'text', name:'firstName', label:'3. First name(s)', required:true},
    {type:'date', name:'dob', label:'4. Date of birth (day-month-year)', required:true},
    {type:'text', name:'placeOfBirth', label:'5. Place of birth', required:true},
    {type:'select', name:'countryOfBirth', label:'6. Country of birth', options:COUNTRIES, required:true},
    {type:'select', name:'nationality', label:'7. Current nationality', options:COUNTRIES, required:true},
    {type:'text', name:'nationalitiesAtBirth', label:'Nationality at birth, if different'},
    {type:'select', name:'sex', label:'8. Sex', options:['Male','Female','Other'], required:true},
    {type:'select', name:'maritalStatus', label:'9. Marital status', options:['Single','Married','Registered Partnership','Separated','Divorced','Widow(er)'], required:true},
    {type:'text', name:'nationalIdNumber', label:'10. National identity number, where applicable'},
    {type:'text', name:'minorGuardians', label:'11. For minors: Guardian(s) name(s), address, nationality'},
  ]},
  { group:'Travel Document', title:'Travel Document', id:'document', instruction:'Enter your travel document information exactly as it appears on your passport:', fields:[
    {type:'select', name:'docType', label:'12. Type of travel document', options:['Ordinary passport','Diplomatic passport','Service passport','Official passport','Special passport','Other travel document'], required:true},
    {type:'text', name:'docNumber', label:'13. Number of travel document', required:true},
    {type:'select', name:'docIssuedByCountry', label:'14. Issued by (country/authority)', options:COUNTRIES, required:true},
    {type:'date', name:'docIssueDate', label:'15. Date of issue', required:true},
    {type:'date', name:'docExpiryDate', label:'16. Valid until', required:true},
    {type:'text', name:'docIssuedAt', label:'Place of issue'},
  ]},
  { group:'Contact', title:'Home & Contact', id:'contact', instruction:'Provide your home address and current contact details:', fields:[
    {type:'text', name:'homeAddress', label:'17. Applicant home address', required:true},
    {type:'text', name:'homePostal', label:'Postal code, city'},
    {type:'select', name:'homeCountry', label:'Country', options:COUNTRIES, required:true},
    {type:'tel', name:'phone', label:'18. Telephone number(s)'},
    {type:'email', name:'email', label:'19. E-mail address'},
    {type:'select', name:'residingOtherCountryYN', label:'20. Residence in another country?', options:YESNO},
    {type:'text', name:'residencePermitNo', label:'Residence permit No.', showIf:{name:'residingOtherCountryYN', in:['Yes']}},
    {type:'date', name:'residencePermitValidUntil', label:'Valid until', showIf:{name:'residingOtherCountryYN', in:['Yes']}},
  ]},
  { group:'Employment', title:'Occupation / Employer', id:'employment', instruction:'Provide information about your current occupation and employer or school:', fields:[
    {type:'text', name:'occupation', label:'21. Current occupation', required:true},
    {type:'text', name:'employerName', label:'22. Employer (name, address, telephone) / for students: school name + address', required:true},
  ]},
  { group:'Travel', title:'Trip Details', id:'trip', instruction:'Provide complete details about your intended trip to the Schengen Area:', fields:[
    {type:'select', name:'purpose', label:'23. Main purpose(s) of the journey', options:['Tourism','Business','Visiting family or friends','Cultural','Sports','Official visit','Medical reasons','Study','Transit','Airport transit','Other'], required:true},
    {type:'text', name:'memberStatesDestination', label:'24. Member State(s) of destination', required:true},
    {type:'text', name:'firstEntryMemberState', label:'25. Member State of first entry', required:true},
    {type:'select', name:'numberOfEntries', label:'26. Number of entries requested', options:['Single','Two','Multiple'], required:true},
    {type:'number', name:'durationDays', label:'27. Intended duration (days)', required:true},
    {type:'select', name:'schengenVisasLast3YearsYN', label:'28. Schengen visas in past 3 years?', options:YESNO, required:true},
    {type:'text', name:'schengenVisasDetails', label:'Date(s) of validity of previous visas', showIf:{name:'schengenVisasLast3YearsYN', in:['Yes']}},
    {type:'select', name:'fingerprintsYN', label:'29. Fingerprints collected previously?', options:YESNO, required:true},
    {type:'select', name:'entryPermitFinalCountryYN', label:'30. Entry permit for final destination country (if applicable)', options:YESNO},
    {type:'text', name:'entryPermitNo', label:'Entry permit No.', showIf:{name:'entryPermitFinalCountryYN', in:['Yes']}},
    {type:'date', name:'entryPermitValidFrom', label:'Valid from', showIf:{name:'entryPermitFinalCountryYN', in:['Yes']}},
    {type:'date', name:'entryPermitValidUntil', label:'Valid until', showIf:{name:'entryPermitFinalCountryYN', in:['Yes']}},
    {type:'date', name:'arrivalDate', label:'31. Intended date of arrival', required:true},
    {type:'date', name:'departureDate', label:'31. Intended date of departure', required:true},
  ]},
  { group:'Sponsor', title:'Inviting Person / Sponsor', id:'sponsor', instruction:'If someone is inviting you or sponsoring your trip, provide their details:', fields:[
    {type:'select', name:'invitedBy', label:'32. Inviting person or company/organisation', options:['Person','Company/Organisation','None'], required:true},
    {type:'text', name:'inviterSurname', label:'Inviting person Surname', showIf:{name:'invitedBy', in:['Person']}},
    {type:'text', name:'inviterFirstName', label:'Inviting person First name', showIf:{name:'invitedBy', in:['Person']}},
    {type:'text', name:'inviterCompanyName', label:'Company/Organisation name', showIf:{name:'invitedBy', in:['Company/Organisation']}},
    {type:'text', name:'inviterAddress', label:'Address & e-mail of inviting person/company/organisation', showIf:{name:'invitedBy', in:['Person','Company/Organisation']}},
    {type:'tel', name:'inviterPhone', label:'Telephone', showIf:{name:'invitedBy', in:['Person','Company/Organisation']}},
    {type:'text', name:'hostMemberState', label:'Member State(s) (host)', showIf:{name:'invitedBy', in:['Person','Company/Organisation']}},
  ]},
  { group:'Costs', title:'Costs & Means of Support', id:'costs', instruction:'Indicate how the costs of your trip and stay will be covered:', fields:[
    {type:'select', name:'costsCoveredBy', label:'33. Costs covered by', options:['Applicant','Sponsor (referenced person/company)'], required:true},
    {type:'text', name:'meansOfSupport', label:'Means of support (cash, cards, accommodation, etc.)', required:true},
    {type:'select', name:'hasMedicalInsurance', label:'Travel medical insurance', options:YESNO, required:true},
    {type:'text', name:'insuranceDetails', label:'Insurance details (company, policy No.)', showIf:{name:'hasMedicalInsurance', in:['Yes']}},
  ]},
  { group:'Family', title:'EU/EEA/Swiss Family Members', id:'eu-family', instruction:'If you have family members who are citizens of EU/EEA or Switzerland, provide their information:', fields:[
    {type:'select', name:'hasEUFamily', label:'Do you have a family member who is an EU/EEA/Swiss citizen?', options:YESNO, required:true},
    {type:'text', name:'euFamilySurname', label:'Family Member Surname', showIf:{name:'hasEUFamily', in:['Yes']}},
    {type:'text', name:'euFamilyGiven', label:'Family Member Given Name', showIf:{name:'hasEUFamily', in:['Yes']}},
    {type:'date', name:'euFamilyDOB', label:'Family Member Date of Birth', showIf:{name:'hasEUFamily', in:['Yes']}},
    {type:'select', name:'euFamilyNationality', label:'Family Member Nationality', options:COUNTRIES_EU, showIf:{name:'hasEUFamily', in:['Yes']}},
    {type:'text', name:'euFamilyDocNo', label:'Travel Document Number', showIf:{name:'hasEUFamily', in:['Yes']}},
    {type:'select', name:'euFamilyRelationship', label:'Family Relationship', options:['Spouse','Registered Partner','Child','Grandchild','Dependent Ascendant','Other'], showIf:{name:'hasEUFamily', in:['Yes']}},
  ]},
  { group:'Review', title:'Review & Submit', id:'review', custom:'review' }
];

export const SCHENGEN_REQUIRED = [
  'surname', 'firstName', 'dob', 'placeOfBirth', 'countryOfBirth', 'nationality',
  'sex', 'maritalStatus', 'docType', 'docNumber', 'docIssuedByCountry', 'docIssueDate',
  'docExpiryDate', 'homeAddress', 'homeCountry', 'occupation', 'employerName',
  'purpose', 'memberStatesDestination', 'firstEntryMemberState', 'numberOfEntries',
  'durationDays', 'schengenVisasLast3YearsYN', 'fingerprintsYN', 'arrivalDate',
  'departureDate', 'invitedBy', 'costsCoveredBy', 'meansOfSupport', 'hasMedicalInsurance', 'hasEUFamily'
];
