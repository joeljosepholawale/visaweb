import React, { useState, useMemo, useEffect } from 'react'
import { LeftStepper, TopTabs } from './components/Stepper.jsx'
import ReviewPage from './components/ReviewPage.jsx'
import SuccessModal from './components/SuccessModal.jsx'
import InfoTooltip from './components/InfoTooltip.jsx'
import { uploadToGoogleDrive } from './utils/drive.js'
import { COUNTRIES } from './data/countries.js'
import { CANADA_HELP } from './data/canadaHelpText.js'
import { validatePhone, validateNIN, validatePassportMatch, validateNIDMatch, validatePhoneMatch, formatPhone, formatNIN } from './utils/validation.js'
import { saveFormData, loadFormData, clearFormData, setupAutoSave } from './utils/formStorage.js'

const YESNO = ['Yes', 'No']
const TEL_TYPES = ['Mobile', 'Home', 'Work']
const SEX = ['Male', 'Female', 'Other']
const MARITAL = ['Single', 'Married', 'Common-law', 'Divorced', 'Separated', 'Widowed']
const PASSPORT_KIND = ['Ordinary', 'Diplomatic', 'Official', 'Other']
const DOC_TYPES = ['Passport', 'Travel Document', 'Refugee Travel Document', 'Other']

const CANADA_SECTIONS = [
  {
    group: 'Application',
    id: 'app',
    title: 'Application Details',
    instruction: 'Tell us what type of visa or permit you need and why you want to visit Canada:',
    fields: [
      { type: 'select', name: 'applyFor', label: 'I want to apply for', options: ['Visitor visa (TRV)', 'Study permit', 'Work permit', 'eTA', 'Other'], required: true },
      { type: 'textarea', name: 'whyVisa', label: 'Why do you need a visa', required: true },
      { type: 'textarea', name: 'plans', label: "Tell us more about what you'll do in Canada. Include dates" },
      { type: 'date', name: 'enterDate', label: 'When will you enter Canada', required: true },
      { type: 'date', name: 'leaveDate', label: 'When will you leave Canada', required: true },
      { type: 'text', name: 'uci', label: 'UCI (if known)' },
    ]
  },
  {
    group: 'Identity',
    id: 'id',
    title: 'Applicant Identity',
    instruction: 'Provide your personal identification information:',
    fields: [
      { type: 'text', name: 'surname', label: 'Surname or last name', required: true },
      { type: 'text', name: 'given', label: 'Given name or first name', required: true },
      { type: 'date', name: 'dob', label: 'Date of birth', required: true },
      { type: 'select', name: 'sex', label: 'Gender', options: SEX, required: true },
    ]
  },
  {
    group: 'Passport',
    id: 'doc',
    title: 'Travel Document of the Applicant',
    instruction: 'Enter the details from your passport or travel document:',
    fields: [
      { type: 'select', name: 'travellingWith', label: 'What document are you travelling with', options: DOC_TYPES, required: true },
      { type: 'select', name: 'passportKind', label: 'What kind of passport', options: PASSPORT_KIND, required: true },
      { type: 'select', name: 'passportCountryCode', label: 'Country code on your passport', options: COUNTRIES, required: true },
      { type: 'select', name: 'passportNationality', label: "What's the nationality on your passport", options: COUNTRIES, required: true },
      { type: 'text', name: 'passportNumber', label: "What's your passport or travel document number", required: true },
      { type: 'text', name: 'passportNumberConfirm', label: 'Confirm passport or travel document number', required: true },
      { type: 'date', name: 'passportIssue', label: 'Date of issue', required: true },
      { type: 'date', name: 'passportExpiry', label: 'Date of expiry', required: true },
      { type: 'select', name: 'isUSLPR', label: 'Are you a U.S. lawful permanent resident (Green Card)?', options: YESNO, required: true },
      { type: 'select', name: 'heldCdnVisa10y', label: 'Have you held a Canadian visitor visa in the past 10 years', options: YESNO, required: true },
      { type: 'select', name: 'holdUSNIV', label: 'Do you currently hold a valid U.S. non-immigrant visa', options: YESNO, required: true },
      { type: 'select', name: 'travelByAir', label: 'Are you travelling to Canada by air', options: YESNO, required: true },
    ]
  },
  {
    group: 'Citizenship',
    id: 'cit',
    title: 'Citizenship & Birth',
    instruction: 'Provide information about your citizenship and place of birth:',
    fields: [
      { type: 'select', name: 'birthCountry', label: 'Country/territory where you were born', options: COUNTRIES, required: true },
      { type: 'text', name: 'birthCity', label: 'City or town where you were born', required: true },
      { type: 'select', name: 'isMultiCitizen', label: 'Are you a citizen of more than one country or territory', options: YESNO, required: true },
      { type: 'select', name: 'citizenOf', label: 'Which country/territory are you a citizen of', options: COUNTRIES, required: true },
      { type: 'select', name: 'citizenByBirth', label: 'I am a citizen of this country or territory since birth', options: YESNO, required: true },
      { type: 'date', name: 'citizenSince', label: 'Since what date are you a citizen', showIf: { name: 'citizenByBirth', in: ['No'] }, required: true },
    ]
  },
  {
    group: 'National ID',
    id: 'nid',
    title: 'National Identity Document',
    instruction: 'If you have a national identity card, provide the details:',
    fields: [
      { type: 'select', name: 'hasNID', label: 'Do you have a valid national identity document', options: YESNO, required: true },
      { type: 'text', name: 'nidNumber', label: 'Document number', showIf: { name: 'hasNID', in: ['Yes'] }, required: true },
      { type: 'text', name: 'nidNumberConfirm', label: 'Confirm document number', showIf: { name: 'hasNID', in: ['Yes'] }, required: true },
      { type: 'date', name: 'nidIssue', label: 'Date of issue', showIf: { name: 'hasNID', in: ['Yes'] }, required: true },
      { type: 'select', name: 'nidIssuingCountry', label: 'Issuing country/territory', options: COUNTRIES, showIf: { name: 'hasNID', in: ['Yes'] }, required: true },
    ]
  },
  {
    group: 'Names',
    id: 'names',
    title: 'Names Used in the Past',
    instruction: 'Tell us if you have used any other names in the past:',
    fields: [
      { type: 'select', name: 'usedOtherName', label: 'Have you used another name in the past', options: YESNO, required: true },
      { type: 'text', name: 'otherNameType', label: 'What type of name', showIf: { name: 'usedOtherName', in: ['Yes'] }, required: true },
      { type: 'text', name: 'otherSurname', label: 'Surname or last name', showIf: { name: 'usedOtherName', in: ['Yes'] }, required: true },
      { type: 'text', name: 'otherGiven', label: 'Given name or first name', showIf: { name: 'usedOtherName', in: ['Yes'] }, required: true },
    ]
  },
  {
    group: 'Contact',
    id: 'contact',
    title: 'Contact Information',
    instruction: 'Provide your current residential and mailing address:',
    fields: [
      { type: 'select', name: 'resCountry', label: 'Select a country or territory', options: COUNTRIES, required: true },
      { type: 'text', name: 'street', label: 'Street address', required: true },
      { type: 'text', name: 'city', label: 'City or town', required: true },
      { type: 'select', name: 'mailSame', label: 'Is your mailing address the same as residential', options: YESNO, required: true },
      { type: 'select', name: 'resStatus', label: 'What is your status in country of residence', options: ['Citizen', 'Permanent resident', 'Temporary resident', 'Visitor', 'Worker', 'Student', 'Other'], required: true },
      { type: 'date', name: 'resFrom', label: 'From (date)', required: true },
      { type: 'select', name: 'currentResidence', label: 'This is where I currently live', options: YESNO, required: true },
    ]
  },
  {
    group: 'Biometrics',
    id: 'bio',
    title: 'Biometrics (fingerprints and photo)',
    instruction: 'Indicate if you have previously provided biometrics to Canada:',
    fields: [
      { type: 'select', name: 'bioGiven10y', label: 'In the last 10 years, have you provided biometrics?', options: YESNO, required: true },
      { type: 'select', name: 'bioReuse', label: 'Do you wish to give biometrics again or re-use valid biometrics?', options: YESNO, required: true },
    ]
  },
  {
    group: 'Invitation',
    id: 'invite',
    title: 'Invitation',
    instruction: 'If someone invited you to Canada, provide their contact information:',
    fields: [
      { type: 'text', name: 'invSurname', label: 'Surname or last name' },
      { type: 'text', name: 'invGiven', label: 'Given name or first name' },
      { type: 'text', name: 'invRelationship', label: 'Relationship to you' },
      { type: 'text', name: 'invOrg', label: 'Name of organization or conference' },
      { type: 'select', name: 'invCountry', label: 'Country/territory', options: COUNTRIES },
      { type: 'text', name: 'invStreetNo', label: 'Street number' },
      { type: 'text', name: 'invStreetName', label: 'Street name' },
      { type: 'text', name: 'invCity', label: 'City or town' },
      { type: 'text', name: 'invProvince', label: 'Province' },
      { type: 'text', name: 'invPostal', label: 'Postal code' },
      { type: 'select', name: 'invTelType', label: 'Telephone type', options: TEL_TYPES },
      { type: 'select', name: 'invTelCountry', label: 'Telephone country/territory', options: COUNTRIES },
      { type: 'text', name: 'invDial', label: 'Dial code' },
      { type: 'text', name: 'invTel', label: 'Telephone number' },
      { type: 'email', name: 'invEmail', label: 'Email address' },
      { type: 'select', name: 'hasOtherInviter', label: 'Has someone else also invited you', options: YESNO, required: true },
    ]
  },
  {
    group: 'Event',
    id: 'event',
    title: 'Special Event',
    instruction: 'If attending a special event or conference, indicate if you have an event code:',
    fields: [
      { type: 'select', name: 'hasEventCode', label: 'Was your organization or conference given a special event code?', options: YESNO, required: true },
      { type: 'text', name: 'eventCode', label: 'Enter your special event code', showIf: { name: 'hasEventCode', in: ['Yes'] }, required: true },
    ]
  },
  {
    group: 'Finances',
    id: 'fin',
    title: 'Finances',
    instruction: 'Provide information about how you will support yourself financially during your stay in Canada:',
    fields: [
      { type: 'number', name: 'fundsCAD', label: 'How much money do you have for your stay (CAD)', required: true },
      { type: 'select', name: 'otherFunding', label: 'Is someone else giving you money for your stay', options: YESNO, required: true },
      { type: 'text', name: 'fundingPersonName', label: 'Name of person providing funds', showIf: { name: 'otherFunding', in: ['Yes'] }, required: true },
      { type: 'select', name: 'fundingRelationship', label: 'Relationship to you', options: ['Parent', 'Spouse', 'Sibling', 'Friend', 'Relative', 'Employer', 'Organization', 'Other'], showIf: { name: 'otherFunding', in: ['Yes'] }, required: true },
      { type: 'number', name: 'fundingAmount', label: 'Amount they are providing (CAD)', showIf: { name: 'otherFunding', in: ['Yes'] }, required: true },
      { type: 'email', name: 'fundingPersonEmail', label: 'Their email address', showIf: { name: 'otherFunding', in: ['Yes'] } },
      { type: 'tel', name: 'fundingPersonPhone', label: 'Their phone number', showIf: { name: 'otherFunding', in: ['Yes'] } },
      { type: 'textarea', name: 'fundingAdditionalInfo', label: 'Additional information (optional)', showIf: { name: 'otherFunding', in: ['Yes'] } },
    ]
  },
  {
    group: 'Education/Work',
    id: 'edu',
    title: 'Education, Work & Activities',
    instruction: 'Provide details about your education, employment, and work history:',
    fields: [
      { type: 'select', name: 'studiedPostSecondary', label: 'Have you ever studied at a post-secondary school?', options: YESNO, required: true },
      { type: 'text', name: 'schoolName', label: 'School/institution name', showIf: { name: 'studiedPostSecondary', in: ['Yes'] }, required: true },
      { type: 'date', name: 'studyFrom', label: 'From', showIf: { name: 'studiedPostSecondary', in: ['Yes'] }, required: true },
      { type: 'date', name: 'studyTo', label: 'To', showIf: { name: 'studiedPostSecondary', in: ['Yes'] }, required: true },
      { type: 'text', name: 'studyLevel', label: 'Level of study', showIf: { name: 'studiedPostSecondary', in: ['Yes'] } },
      { type: 'text', name: 'fieldOfStudy', label: 'Field of study', showIf: { name: 'studiedPostSecondary', in: ['Yes'] } },
      { type: 'text', name: 'work1Activity', label: 'Work/Activity 1' },
      { type: 'text', name: 'work1JobTitle', label: 'Job title (1)' },
      { type: 'text', name: 'work1Employer', label: 'Company or employer (1)' },
      { type: 'textarea', name: 'work1Duties', label: 'Main duties (1)' },
      { type: 'select', name: 'work1Country', label: 'Country/territory (1)', options: COUNTRIES },
      { type: 'text', name: 'work1Street', label: 'Street address (1)' },
      { type: 'text', name: 'work1City', label: 'City or town (1)' },
      { type: 'date', name: 'work1From', label: 'From (1)' },
      { type: 'date', name: 'work1To', label: 'To (1)' },
      { type: 'text', name: 'work2Activity', label: 'Work/Activity 2' },
      { type: 'text', name: 'work2JobTitle', label: 'Job title (2)' },
      { type: 'text', name: 'work2Employer', label: 'Company or employer (2)' },
      { type: 'textarea', name: 'work2Duties', label: 'Main duties (2)' },
      { type: 'select', name: 'work2Country', label: 'Country/territory (2)', options: COUNTRIES },
      { type: 'text', name: 'work2Street', label: 'Street address (2)' },
      { type: 'text', name: 'work2City', label: 'City or town (2)' },
      { type: 'date', name: 'work2From', label: 'From (2)' },
      { type: 'date', name: 'work2To', label: 'To (2)' },
      { type: 'text', name: 'work3Activity', label: 'Work/Activity 3' },
      { type: 'text', name: 'work3JobTitle', label: 'Job title (3)' },
      { type: 'text', name: 'work3Employer', label: 'Company or employer (3)' },
      { type: 'textarea', name: 'work3Duties', label: 'Main duties (3)' },
      { type: 'select', name: 'work3Country', label: 'Country/territory (3)', options: COUNTRIES },
      { type: 'text', name: 'work3Street', label: 'Street address (3)' },
      { type: 'text', name: 'work3City', label: 'City or town (3)' },
      { type: 'date', name: 'work3From', label: 'From (3)' },
      { type: 'date', name: 'work3To', label: 'To (3)' },
      { type: 'select', name: 'servedMilitary', label: 'Did you serve in any military/civil defence/security/police force?', options: YESNO, required: true },
      { type: 'date', name: 'militaryFrom', label: 'Military service — From', showIf: { name: 'servedMilitary', in: ['Yes'] }, required: true },
      { type: 'date', name: 'militaryTo', label: 'Military service — To', showIf: { name: 'servedMilitary', in: ['Yes'] }, required: true },
    ]
  },
  {
    group: 'Travel History',
    id: 'travel',
    title: 'Travel History',
    instruction: 'Provide information about your travel history and any previous immigration issues:',
    fields: [
      { type: 'select', name: 'traveled5years', label: 'In the past 5 years, ever travelled outside citizenship/residence country?', options: YESNO, required: true },
      { type: 'select', name: 'overstayOrUnauthorized', label: 'Ever overstayed/worked/studied without authorization in Canada?', options: YESNO, required: true },
      { type: 'select', name: 'refusedOrRemoved', label: 'Ever been refused a visa/permit, denied entry, or ordered to leave?', options: YESNO, required: true },
      { type: 'textarea', name: 'refusalDetails', label: 'Details of refusals/denials/removals', showIf: { name: 'refusedOrRemoved', in: ['Yes'] }, required: true },
    ]
  },
  {
    group: 'Criminality',
    id: 'crime',
    title: 'Criminality & Security',
    instruction: 'Answer all questions about criminal history and security concerns truthfully:',
    fields: [
      { type: 'select', name: 'anyCrime', label: 'Have you ever committed any crime (incl. DUI)?', options: YESNO, required: true },
      { type: 'select', name: 'arrestedCrime', label: 'Have you ever been arrested for any criminal offence?', options: YESNO, required: true },
      { type: 'select', name: 'chargedCrime', label: 'Have you ever been charged for any criminal offence?', options: YESNO, required: true },
      { type: 'select', name: 'convictedCrime', label: 'Have you ever been convicted for any criminal offence?', options: YESNO, required: true },
      { type: 'select', name: 'violentOrgAssoc', label: 'Ever associated with group advancing violence/criminal activity?', options: YESNO, required: true },
      { type: 'select', name: 'illTreatment', label: 'Ever witnessed/participated in ill treatment, looting, desecration?', options: YESNO, required: true },
    ]
  },
  {
    group: 'Medical',
    id: 'med',
    title: 'Medical Background',
    instruction: 'Provide information about your medical history and any health conditions:',
    fields: [
      { type: 'select', name: 'irccExam12m', label: 'Medical exam by IRCC panel physician within last 12 months?', options: YESNO, required: true },
      { type: 'select', name: 'tbDiagnosed2y', label: 'In last 2 years, diagnosed with tuberculosis?', options: YESNO, required: true },
      { type: 'select', name: 'tbContact5y', label: 'In last 5 years, close contact with tuberculosis?', options: YESNO, required: true },
      { type: 'select', name: 'dialysis', label: 'Currently receiving dialysis treatment?', options: YESNO, required: true },
      { type: 'select', name: 'drugAlcohol', label: 'Drug/alcohol addiction causing threat/hospitalization?', options: YESNO, required: true },
      { type: 'select', name: 'mentalHealth', label: 'Mental health condition causing threat/hospitalization?', options: YESNO, required: true },
      { type: 'select', name: 'syphilis', label: 'Ever diagnosed with syphilis?', options: YESNO, required: true },
    ]
  },
  {
    group: 'Family',
    id: 'family',
    title: 'Family Information',
    instruction: 'Provide details about your family members including spouse, children, and parents:',
    fields: [
      { type: 'select', name: 'maritalStatus', label: 'Current marital status', options: MARITAL, required: true },
      { type: 'date', name: 'marriageDate', label: 'Date of marriage or start of common-law relationship' },
      { type: 'text', name: 'spouseSurname', label: 'Spouse/common-law partner — Surname' },
      { type: 'text', name: 'spouseGiven', label: 'Spouse/common-law partner — Given name' },
      { type: 'date', name: 'spouseDOB', label: 'Spouse/common-law partner — Date of birth' },
      { type: 'select', name: 'spouseBirthCountry', label: 'Spouse/common-law partner — Country of birth', options: COUNTRIES },
      { type: 'text', name: 'spouseOccupation', label: 'Spouse/common-law partner — Present occupation' },
      { type: 'select', name: 'spouseSameAddress', label: 'Is their address the same as yours', options: YESNO, required: true },
      { type: 'select', name: 'spouseAccompany', label: 'Will spouse/common-law partner accompany you to Canada', options: YESNO, required: true },
      { type: 'select', name: 'hasChildren', label: 'Do you have any biological, adopted or step-children', options: YESNO, required: true },
      { type: 'text', name: 'child1Surname', label: 'Child 1 — Surname', showIf: { name: 'hasChildren', in: ['Yes'] } },
      { type: 'text', name: 'child1Given', label: 'Child 1 — Given name', showIf: { name: 'hasChildren', in: ['Yes'] } },
      { type: 'date', name: 'child1DOB', label: 'Child 1 — Date of birth', showIf: { name: 'hasChildren', in: ['Yes'] } },
      { type: 'select', name: 'child1BirthCountry', label: 'Child 1 — Country of birth', options: COUNTRIES, showIf: { name: 'hasChildren', in: ['Yes'] } },
      { type: 'select', name: 'child1SameAddress', label: 'Child 1 — Same address as you', options: YESNO, showIf: { name: 'hasChildren', in: ['Yes'] } },
      { type: 'text', name: 'child1Street', label: 'Child 1 — Street address', showIf: { name: 'child1SameAddress', in: ['No'] } },
      { type: 'text', name: 'child1City', label: 'Child 1 — City', showIf: { name: 'child1SameAddress', in: ['No'] } },
      { type: 'select', name: 'child1Country', label: 'Child 1 — Country', options: COUNTRIES, showIf: { name: 'child1SameAddress', in: ['No'] } },
      { type: 'select', name: 'child1Accompany', label: 'Child 1 — Will this child accompany you to Canada?', options: YESNO, showIf: { name: 'hasChildren', in: ['Yes'] } },
      { type: 'text', name: 'child2Surname', label: 'Child 2 — Surname', showIf: { name: 'hasChildren', in: ['Yes'] } },
      { type: 'text', name: 'child2Given', label: 'Child 2 — Given name', showIf: { name: 'hasChildren', in: ['Yes'] } },
      { type: 'date', name: 'child2DOB', label: 'Child 2 — Date of birth', showIf: { name: 'hasChildren', in: ['Yes'] } },
      { type: 'select', name: 'child2BirthCountry', label: 'Child 2 — Country of birth', options: COUNTRIES, showIf: { name: 'hasChildren', in: ['Yes'] } },
      { type: 'select', name: 'child2SameAddress', label: 'Child 2 — Same address as you', options: YESNO, showIf: { name: 'hasChildren', in: ['Yes'] } },
      { type: 'text', name: 'child2Street', label: 'Child 2 — Street address', showIf: { name: 'child2SameAddress', in: ['No'] } },
      { type: 'text', name: 'child2City', label: 'Child 2 — City', showIf: { name: 'child2SameAddress', in: ['No'] } },
      { type: 'select', name: 'child2Country', label: 'Child 2 — Country', options: COUNTRIES, showIf: { name: 'child2SameAddress', in: ['No'] } },
      { type: 'select', name: 'child2Accompany', label: 'Child 2 — Will this child accompany you to Canada?', options: YESNO, showIf: { name: 'hasChildren', in: ['Yes'] } },
      { type: 'text', name: 'child3Surname', label: 'Child 3 — Surname', showIf: { name: 'hasChildren', in: ['Yes'] } },
      { type: 'text', name: 'child3Given', label: 'Child 3 — Given name', showIf: { name: 'hasChildren', in: ['Yes'] } },
      { type: 'date', name: 'child3DOB', label: 'Child 3 — Date of birth', showIf: { name: 'hasChildren', in: ['Yes'] } },
      { type: 'select', name: 'child3BirthCountry', label: 'Child 3 — Country of birth', options: COUNTRIES, showIf: { name: 'hasChildren', in: ['Yes'] } },
      { type: 'select', name: 'child3SameAddress', label: 'Child 3 — Same address as you', options: YESNO, showIf: { name: 'hasChildren', in: ['Yes'] } },
      { type: 'text', name: 'child3Street', label: 'Child 3 — Street address', showIf: { name: 'child3SameAddress', in: ['No'] } },
      { type: 'text', name: 'child3City', label: 'Child 3 — City', showIf: { name: 'child3SameAddress', in: ['No'] } },
      { type: 'select', name: 'child3Country', label: 'Child 3 — Country', options: COUNTRIES, showIf: { name: 'child3SameAddress', in: ['No'] } },
      { type: 'select', name: 'child3Accompany', label: 'Child 3 — Will this child accompany you to Canada?', options: YESNO, showIf: { name: 'hasChildren', in: ['Yes'] } },
      { type: 'textarea', name: 'additionalChildren', label: 'Additional children (if more than 3, list details here)', showIf: { name: 'hasChildren', in: ['Yes'] } },
      { type: 'text', name: 'parent1Surname', label: 'Parent 1 — Surname' },
      { type: 'text', name: 'parent1Given', label: 'Parent 1 — Given name' },
      { type: 'text', name: 'parent1Relationship', label: 'Parent 1 — Relationship' },
      { type: 'date', name: 'parent1DOB', label: 'Parent 1 — Date of birth' },
      { type: 'select', name: 'parent1BirthCountry', label: 'Parent 1 — Country of birth', options: COUNTRIES },
      { type: 'text', name: 'parent1Occupation', label: 'Parent 1 — Present occupation' },
      { type: 'select', name: 'parent1SameAddress', label: 'Parent 1 — Same address as you', options: YESNO, required: true },
      { type: 'select', name: 'parent1Country', label: 'Parent 1 — Country', options: COUNTRIES },
      { type: 'text', name: 'parent1Street', label: 'Parent 1 — Street address' },
      { type: 'text', name: 'parent1City', label: 'Parent 1 — City or town' },
      { type: 'select', name: 'parent1Accompany', label: 'Parent 1 — Will this parent come with you to Canada?', options: YESNO, required: true },
      { type: 'text', name: 'parent2Surname', label: 'Parent 2 — Surname' },
      { type: 'text', name: 'parent2Given', label: 'Parent 2 — Given name' },
      { type: 'text', name: 'parent2Relationship', label: 'Parent 2 — Relationship' },
      { type: 'date', name: 'parent2DOB', label: 'Parent 2 — Date of birth' },
      { type: 'select', name: 'parent2Deceased', label: 'Parent 2 — Deceased', options: YESNO, required: true },
      { type: 'date', name: 'parent2DOD', label: 'Parent 2 — Date of death', showIf: { name: 'parent2Deceased', in: ['Yes'] }, required: true },
      { type: 'select', name: 'parent2BirthCountry', label: 'Parent 2 — Country of birth', options: COUNTRIES },
    ]
  },
  {
    group: 'Language',
    id: 'lang',
    title: 'Language & Communication',
    instruction: 'Provide your contact information and language preferences:',
    fields: [
      { type: 'text', name: 'nativeLanguage', label: 'What is your native language or mother tongue' },
      { type: 'select', name: 'canCommunicate', label: 'Can you communicate in English and/or French', options: ['English', 'French', 'Both', 'Neither'], required: true },
      { type: 'select', name: 'contactLanguage', label: 'What language do you want us to use to contact you', options: ['English', 'French'], required: true },
      { type: 'email', name: 'appEmail', label: 'Email address of applicant', required: true },
      { type: 'email', name: 'appEmailConfirm', label: 'Confirm your email address', required: true },
      { type: 'select', name: 'telType', label: 'Telephone type', options: TEL_TYPES, required: true },
      { type: 'select', name: 'telCountry', label: 'Telephone number country/territory', options: COUNTRIES, required: true },
      { type: 'text', name: 'telDial', label: 'Dial code', required: true },
      { type: 'text', name: 'telNumber', label: 'Telephone number', required: true },
    ]
  },
  {
    group: 'Review',
    id: 'review',
    title: 'Review & Submit',
    custom: 'review'
  }
]

function Field({ f, model, onChange, fieldErrors }) {
  const hidden = f.showIf && !f.showIf.in.includes(String(model[f.showIf.name] || ''))
  if (hidden) return null

  const helpText = CANADA_HELP[f.name]
  const err = fieldErrors[f.name] || f.error
  const errorEl = err ? <div className="error">{err}</div> : null

  const handleChange = (value) => {
    let processedValue = value
    if (f.type === 'tel' || f.name === 'telNumber' || f.name === 'invTel') {
      processedValue = formatPhone(value)
    } else if (f.name === 'nidNumber' || f.name === 'nidNumberConfirm') {
      processedValue = formatNIN(value)
    }
    onChange(f.name, processedValue)
  }

  const labelEl = (
    <label htmlFor={f.name}>
      {f.label}
      {f.required && <span className="required-badge">required</span>}
      {helpText && <InfoTooltip text={helpText} />}
    </label>
  )

  const inputProps = {
    id: f.name,
    value: model[f.name] || '',
    onChange: e => handleChange(e.target.value),
    required: f.required
  }

  if (f.type === 'textarea') return <div>{labelEl}<textarea {...inputProps} />{errorEl}</div>
  if (f.type === 'select') return <div>{labelEl}
    <select {...inputProps}>
      <option value="">Select…</option>
      {(f.options || []).map(o => <option key={o} value={o}>{o}</option>)}
    </select>{errorEl}</div>
  if (f.type === 'date') return <div>{labelEl}<input type="date" {...inputProps} />{errorEl}</div>
  if (f.type === 'email') return <div>{labelEl}<input type="email" {...inputProps} />{errorEl}</div>
  if (f.type === 'number') return <div>{labelEl}<input type="number" {...inputProps} />{errorEl}</div>
  if (f.type === 'tel') return <div>{labelEl}<input type="tel" {...inputProps} maxLength="11" placeholder="11 digits" />{errorEl}</div>
  return <div>{labelEl}<input {...inputProps} placeholder={f.placeholder || ''} />{errorEl}</div>
}

export default function CanadaApp() {
  const [idx, setIdx] = useState(0)
  const [model, setModel] = useState({})
  const [fieldErrors, setFieldErrors] = useState({})
  const [showSuccess, setShowSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showResumePrompt, setShowResumePrompt] = useState(false)
  const [navOpen, setNavOpen] = useState(false)

  const groups = useMemo(() => {
    const g = {}
    CANADA_SECTIONS.forEach((s, i) => {
      if (!g[s.group]) g[s.group] = []
      g[s.group].push({ i, title: s.title, id: s.id })
    })
    return g
  }, [])

  const currentGroup = useMemo(() => {
    return CANADA_SECTIONS[idx]?.group || Object.keys(groups)[0]
  }, [idx, groups])

  // Check if a section is completed (all required fields filled)
  function isSectionComplete(sectionIndex) {
    const section = CANADA_SECTIONS[sectionIndex]
    // Don't show completion for review/preview sections
    if (section.custom === 'review' || section.custom === 'preview') return false
    if (!section.fields) return true
    
    for (const f of section.fields) {
      if (f.required) {
        const v = model[f.name]
        const hidden = f.showIf && !f.showIf.in.includes(String(model[f.showIf.name]||''))
        if (!hidden && (!v || String(v).trim()==='')) {
          return false
        }
      }
    }
    return true
  }

  // Check if a group is completed
  function isGroupComplete(groupName) {
    const groupSections = groups[groupName] || []
    return groupSections.every(s => isSectionComplete(s.i))
  }

  // Calculate overall completion stats
  const completionStats = useMemo(() => {
    // Exclude review/preview sections from count
    const sections = CANADA_SECTIONS.filter(s => s.custom !== 'review' && s.custom !== 'preview')
    const total = sections.length
    const completed = CANADA_SECTIONS.filter((s, i) => 
      s.custom !== 'review' && s.custom !== 'preview' && isSectionComplete(i)
    ).length
    const percentage = Math.round((completed / total) * 100)
    return { completed, total, percentage }
  }, [model])

  useEffect(() => {
    const saved = loadFormData('canada')
    if (saved && Object.keys(saved.data).length > 0) {
      setShowResumePrompt(true)
    }
  }, [])

  useEffect(() => {
    const cleanup = setupAutoSave('canada', () => model)
    return cleanup
  }, [model])

  const handleResume = () => {
    const saved = loadFormData('canada')
    if (saved) {
      setModel(saved.data)
      setShowResumePrompt(false)
      alert(`✅ Form restored from ${new Date(saved.timestamp).toLocaleString()}`)
    }
  }

  const handleStartFresh = () => {
    clearFormData('canada')
    setShowResumePrompt(false)
  }

  const handleManualSave = () => {
    const success = saveFormData('canada', model)
    if (success) {
      alert('✅ Form progress saved successfully!')
    } else {
      alert('❌ Failed to save form. Please try again.')
    }
  }

  const onChange = (name, value) => {
    setModel(prev => ({ ...prev, [name]: value }))
    setFieldErrors(prev => ({ ...prev, [name]: undefined }))
    
    const newModel = {...model, [name]: value}
    
    // Additional validation for matching fields
    if (name === 'passportNumberConfirm' || name === 'passportNumber') {
      const passErr = validatePassportMatch(newModel.passportNumber, newModel.passportNumberConfirm)
      if (passErr) {
        setFieldErrors(prev => ({ ...prev, passportNumberConfirm: passErr }))
      } else {
        setFieldErrors(prev => ({ ...prev, passportNumberConfirm: undefined }))
      }
    }
    
    if (name === 'nidNumberConfirm' || name === 'nidNumber') {
      const nidErr = validateNIDMatch(newModel.nidNumber, newModel.nidNumberConfirm)
      if (nidErr) {
        setFieldErrors(prev => ({ ...prev, nidNumberConfirm: nidErr }))
      } else {
        setFieldErrors(prev => ({ ...prev, nidNumberConfirm: undefined }))
      }
    }
    
    // Validate phone confirmations
    if (name === 'telNumber' || name === 'telNumberConfirm') {
      const phoneErr = validatePhoneMatch(newModel.telNumber, newModel.telNumberConfirm)
      if (phoneErr) {
        setFieldErrors(prev => ({ ...prev, telNumberConfirm: phoneErr }))
      } else {
        setFieldErrors(prev => ({ ...prev, telNumberConfirm: undefined }))
      }
    }
  }

  const validateSection = () => {
    const sec = CANADA_SECTIONS[idx]
    if (!sec.fields) return true
    const errors = []
    sec.fields.forEach(f => {
      const hidden = f.showIf && !f.showIf.in.includes(String(model[f.showIf.name] || ''))
      if (!hidden && f.required && !model[f.name]) {
        errors.push(f.name)
      }
    })
    return errors.length === 0
  }

  const handleNext = () => {
    if (!validateSection()) {
      alert('Please fill all required fields')
      return
    }
    if (idx < CANADA_SECTIONS.length - 1) {
      setIdx(idx + 1)
      window.scrollTo(0, 0)
    }
  }

  const handleBack = () => {
    if (idx > 0) setIdx(idx - 1)
    window.scrollTo(0, 0)
  }

  const handleFinalSubmit = async () => {
    setSubmitting(true)
    try {
      const payload = {
        formType: 'canada',
        applicantName: `${model.surname || 'Applicant'}_${model.given || ''}`.trim(),
        createdAt: new Date().toISOString(),
        data: model
      }
      await uploadToGoogleDrive(payload)
      setShowSuccess(true)
    } catch (err) {
      alert(`Submission error: ${err.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  const currentSection = CANADA_SECTIONS[idx]

  if (currentSection.custom === 'review') {
    return (
      <>
        {submitting && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              border: '8px solid #dc2626',
              borderTop: '8px solid transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            <p style={{
              marginTop: '1.5rem',
              fontSize: '1.25rem',
              color: '#fff',
              fontWeight: '600'
            }}>
              Submitting your application...
            </p>
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        )}

        <ReviewPage
          model={model}
          sections={CANADA_SECTIONS}
          onBack={handleBack}
          onSubmit={handleFinalSubmit}
          isSubmitting={submitting}
        />
        <SuccessModal show={showSuccess} formName="Canada Visa Application" onClose={() => setShowSuccess(false)} />
      </>
    )
  }

  const goToGroup = (groupName) => {
    const firstInGroup = groups[groupName]?.[0]?.i
    if (firstInGroup !== undefined) setIdx(firstInGroup)
  }

  function handleNavSelect(i) {
    setIdx(i)
    setNavOpen(false) // Close nav after selection on mobile
  }

  const gridClass = (currentSection.id === 'app' || currentSection.id === 'doc' || currentSection.id === 'id') ? 'grid grid-3' : 'grid grid-2'

  return (
    <>
      {showResumePrompt && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000
        }}>
          <div style={{
            backgroundColor: '#fff',
            padding: '2rem',
            borderRadius: '12px',
            maxWidth: '500px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.3)'
          }}>
            <h2 style={{marginTop: 0}}>Resume Previous Session?</h2>
            <p>We found a saved version of your form. Would you like to continue where you left off?</p>
            <div style={{display: 'flex', gap: '10px', marginTop: '1.5rem'}}>
              <button className="btn primary" onClick={handleResume}>Resume</button>
              <button className="btn" onClick={handleStartFresh}>Start Fresh</button>
            </div>
          </div>
        </div>
      )}

      <header>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button 
              className="hamburger-btn"
              onClick={() => setNavOpen(!navOpen)}
              aria-label="Toggle navigation"
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
            <div>
              <h1>Canada Visa Application</h1>
              <div className="sub">Structured data entry and review for Canada visa applications</div>
            </div>
          </div>
          <div className="progress-badge">
            <div className="progress-text">{completionStats.completed}/{completionStats.total}</div>
            <div className="progress-label">Sections</div>
          </div>
        </div>
      </header>

      <TopTabs 
        groups={groups} 
        currentGroup={currentGroup} 
        goToGroup={goToGroup}
        isGroupComplete={isGroupComplete}
      />

      {navOpen && <div className="nav-overlay" onClick={() => setNavOpen(false)} />}

      <main className="layout">
        <LeftStepper 
          groups={groups} 
          currentIndex={idx} 
          goToIndex={handleNavSelect}
          navOpen={navOpen}
          isSectionComplete={isSectionComplete}
        />

        <div className="formwrap">
          <div className="card">
            <h2>{currentSection.title}</h2>
            {currentSection.instruction && (
              <p className="instruction-text">{currentSection.instruction}</p>
            )}
            {currentSection.fields && (
              <div className={gridClass}>
                {currentSection.fields.map(f => (
                  <Field key={f.name} f={f} model={model} onChange={onChange} fieldErrors={fieldErrors} />
                ))}
              </div>
            )}
          </div>

          <div className="toolbar">
            {idx > 0 && <button className="btn" onClick={handleBack}>Back</button>}
            <button className="btn" onClick={handleManualSave} style={{marginLeft: '10px'}}>💾 Save Progress</button>
            {idx < CANADA_SECTIONS.length - 1 && <button className="btn primary" onClick={handleNext}>Next</button>}
          </div>
        </div>
      </main>
    </>
  )
}
