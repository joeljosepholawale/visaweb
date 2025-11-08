import React, { useMemo, useState, useEffect } from 'react'
import { LeftStepper, TopTabs } from './components/Stepper.jsx'
import PreviewPage from './components/PreviewPage.jsx'
import SuccessModal from './components/SuccessModal.jsx'
import InfoTooltip from './components/InfoTooltip.jsx'
import { COUNTRIES, COUNTRIES_EU, USA_STATES, OCCUPATIONS } from './data/countries.js'
import { REQUIRED, SEC_QUESTIONS } from './data/sections.js'
import { DS160_HELP } from './data/helpText.js'
import { uploadToGoogleDrive } from './utils/drive.js'
import { validatePhone, validateNIN, validatePhoneMatch, validateNINMatch, formatPhone, formatNIN } from './utils/validation.js'
import { saveFormData, loadFormData, clearFormData, setupAutoSave } from './utils/formStorage.js'

function Field({ f, model, onChange, fieldErrors }){
  const hidden = f.showIf && !f.showIf.in.includes(String(model[f.showIf.name] || ''))
  if (hidden) return null

  const helpText = DS160_HELP[f.name]
  const err = fieldErrors[f.name] || f.error
  const errorEl = err ? <div className="error">{err}</div> : null

  const handleChange = (value) => {
    let processedValue = value
    
    // Apply validation and formatting
    if (f.type === 'tel') {
      processedValue = formatPhone(value)
    } else if (f.name === 'nationalID') {
      processedValue = formatNIN(value)
    }
    
    onChange(f.name, processedValue)
  }

  // Instructional text (no input field)
  if (f.type === 'instruction') {
    const isMainHeading = f.name.includes('Instruction') && !f.name.includes('Sub')
    return (
      <div style={{ 
        marginTop: isMainHeading ? '0px' : '0px', 
        marginBottom: isMainHeading ? '6px' : '4px', 
        fontWeight: isMainHeading ? '700' : '600',
        color: isMainHeading ? '#0b3d91' : '#334155',
        fontSize: isMainHeading ? '15px' : '14px',
        borderLeft: isMainHeading ? '4px solid #0b3d91' : 'none',
        paddingLeft: isMainHeading ? '12px' : '2px'
      }}>
        {f.label}
      </div>
    )
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

  if (f.type === 'radio') {
    return (
      <div style={{ marginBottom: '0px' }}>
        <div style={{ marginBottom: '6px', fontWeight: '600', fontSize: '14px', color: '#1e293b', lineHeight: '1.5' }}>
          {f.label}
          {f.required && <span className="required-badge">required</span>}
          {helpText && <InfoTooltip text={helpText} />}
        </div>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          {(f.options||[]).map(opt => (
            <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', color: '#334155' }}>
              <input
                type="radio"
                name={f.name}
                value={opt}
                checked={model[f.name] === opt}
                onChange={e => handleChange(e.target.value)}
                required={f.required}
                style={{ width: '18px', height: '18px', accentColor: '#0b3d91' }}
              />
              <span>{opt}</span>
            </label>
          ))}
        </div>
        {errorEl}
      </div>
    )
  }

  if (f.type === 'textarea') return <div>{labelEl}<textarea {...inputProps} />{errorEl}</div>
  if (f.type === 'select') return <div>{labelEl}
    <select {...inputProps}>
      <option value="">Select…</option>
      {(f.options||[]).map(o => <option key={o} value={o}>{o}</option>)}
    </select>{errorEl}</div>
  if (f.type === 'date') return <div>{labelEl}<input type="date" {...inputProps} />{errorEl}</div>
  if (f.type === 'email') return <div>{labelEl}<input type="email" {...inputProps} />{errorEl}</div>
  if (f.type === 'number') return <div>{labelEl}<input type="number" {...inputProps} />{errorEl}</div>
  if (f.type === 'tel') return <div>{labelEl}<input type="tel" {...inputProps} maxLength="11" placeholder="11 digits" />{errorEl}</div>
  if (f.type === 'checkbox') {
    return (
      <div style={{ marginBottom: '0px' }}>
        <label htmlFor={f.name} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', color: '#334155' }}>
          <input
            type="checkbox"
            id={f.name}
            checked={model[f.name] || false}
            onChange={e => handleChange(e.target.checked)}
            style={{ width: '16px', height: '16px', accentColor: '#0b3d91' }}
          />
          <span>{f.label}</span>
        </label>
        {errorEl}
      </div>
    )
  }

  if (f.type === 'header') {
    return (
      <div style={{
        marginTop: '16px',
        marginBottom: '8px',
        fontWeight: '700',
        fontSize: '16px',
        color: '#0b3d91',
        borderBottom: '2px solid #e8f0ff',
        paddingBottom: '4px'
      }}>
        {f.label}
      </div>
    )
  }

  if (f.type === 'repeat') {
    const items = model[f.name] || []
    return (
      <div>
        <div style={{ marginBottom: '6px', fontWeight: '600', fontSize: '14px', color: '#1e293b' }}>
          {f.label}
        </div>
        {items.map((item, index) => (
          <div key={index} style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
            <input
              type="text"
              value={item}
              onChange={e => {
                const newItems = [...items]
                newItems[index] = e.target.value
                handleChange(f.name, newItems)
              }}
              style={{ flex: 1, border: '2px solid #e2e8f0', borderRadius: '8px', padding: '11px 14px', fontSize: '14px' }}
              placeholder={`Item ${index + 1}`}
            />
            <button
              type="button"
              onClick={() => {
                const newItems = items.filter((_, i) => i !== index)
                handleChange(f.name, newItems)
              }}
              style={{
                padding: '8px 12px',
                border: 'none',
                borderRadius: '6px',
                background: '#dc2626',
                color: 'white',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => {
            const newItems = [...items, '']
            handleChange(f.name, newItems)
          }}
          style={{
            padding: '8px 16px',
            border: 'none',
            borderRadius: '6px',
            background: '#0b3d91',
            color: 'white',
            cursor: 'pointer',
            fontSize: '14px',
            marginTop: '8px'
          }}
        >
          Add Another
        </button>
      </div>
    )
  }
  return <div>{labelEl}<input {...inputProps} placeholder={f.placeholder||''}/>{errorEl}</div>
}

const SECTIONS = [
  { group:'Personal', title:'Personal Information 1', id:'pi1', instruction:'Provide your personal information exactly as it appears on your passport or travel document:', fields:[
    { type:'text', name:'surname', label:'Surname (as in Passport)', required:true },
    { type:'text', name:'givenNames', label:'Given Names (as in Passport)', required:true },
    { type:'text', name:'nativeFullName', label:'Full Name in Native Alphabet' },
    { type:'radio', name:'otherNamesUsed', label:'Have you ever used other names?', options:['Yes','No'], required:true },
    { type:'select', name:'sex', label:'Sex', options:['Male','Female','Other'], required:true },
    { type:'select', name:'maritalStatus', label:'Marital Status', options:['Single','Married','Common Law Marriage','Civil Union/Domestic Partnership','Divorced','Legally Separated','Widowed'], required:true },
    { type:'text', name:'nationalID', label:'National Identification Number' },
    { type:'text', name:'usSSN', label:'U.S. Social Security Number' },
    { type:'text', name:'usTaxpayerID', label:'U.S. Taxpayer ID Number' },
  ]},
  { group:'Personal', title:'Personal Information 2', id:'pi2', instruction:'Provide additional personal details including date and place of birth:', fields:[
    { type:'date', name:'dob', label:'Date of Birth', required:true },
    { type:'text', name:'birthCity', label:'City of Birth', required:true },
    { type:'text', name:'birthState', label:'State/Province of Birth' },
    { type:'select', name:'birthCountry', label:'Country/Region of Birth', options: COUNTRIES, required:true },
    { type:'select', name:'nationality', label:'Nationality', options: COUNTRIES, required:true },
    { type:'radio', name:'otherNationalityYN', label:'Do you hold/have held any other nationality?', options:['Yes','No'], required:true },
    { type:'radio', name:'hasTelecode', label:'Do you have a telecode that represents your name?', options:['Yes','No'], required:true },
    { type:'radio', name:'permanentResident', label:'Are you a permanent resident of a country/region other than your country/region of origin (nationality)?', options:['Yes','No'], required:true },
    { type:'textarea', name:'languages', label:'Languages You Speak (one per line)' },
  ]},
  { group:'Contact', title:'Address & Contact (Current)', id:'contact1', instruction:'Provide your current residential address and contact information:', fields:[
    { type:'text', name:'homeStreet', label:'Home Street Address', required:true },
    { type:'text', name:'homeCity', label:'City', required:true },
    { type:'text', name:'homeState', label:'State/Province', required:true },
    { type:'text', name:'homePostal', label:'Postal Code', required:true },
    { type:'select', name:'homeCountry', label:'Country', options: COUNTRIES, required:true },
    { type:'radio', name:'mailingSame', label:'Is your mailing address the same as your home address?', options:['Yes','No'], required:true },
    { type:'textarea', name:'mailingAddress', label:'Mailing Address', showIf:{ name:'mailingSame', in:['No'] }, required:true },
    { type:'tel', name:'primaryPhone', label:'Primary Phone Number', required:true },
    { type:'tel', name:'primaryPhoneConfirm', label:'Confirm Primary Phone Number', required:true },
    { type:'tel', name:'secondaryPhone', label:'Secondary Phone Number' },
    { type:'email', name:'email', label:'Primary Email Address', required:true },
    { type:'email', name:'email2', label:'Other Email Address' },
    { type:'textarea', name:'socialMedia', label:'Social Media (Platform — @username, one per line)' },
  ]},
  { group:'Passport', title:'Passport / Travel Document', id:'passport', instruction:'Enter your passport or travel document details as they appear on the document:', fields:[
    { type:'select', name:'passportType', label:'Passport Type', options:['Regular','Official','Diplomatic','Other'], required:true },
    { type:'text', name:'passportNumber', label:'Passport Number', required:true },
    { type:'text', name:'passportBookNumber', label:'Passport Book Number' },
    { type:'select', name:'passportIssuingCountry', label:'Issuing Country/Authority', options: COUNTRIES, required:true },
    { type:'text', name:'passportIssueCity', label:'City of Issuance', required:true },
    { type:'select', name:'passportIssueCountry', label:'Country of Issuance', options: COUNTRIES, required:true },
    { type:'date', name:'passportIssueDate', label:'Issue Date', required:true },
    { type:'date', name:'passportExpiryDate', label:'Expiration Date', required:true },
    { type:'radio', name:'otherPassportYN', label:'Do you have other passports/travel documents?', options:['Yes','No'], required:true },
    { type:'textarea', name:'otherPassports', label:'Other Passport/Travel Docs', showIf:{ name:'otherPassportYN', in:['Yes'] }, required:true },
    { type:'radio', name:'lostStolenYN', label:'Lost or stolen passport before?', options:['Yes','No'], required:true },
    { type:'textarea', name:'lostStolenExplain', label:'Explain lost/stolen', showIf:{ name:'lostStolenYN', in:['Yes'] }, required:true },
  ]},
  { group:'Travel', title:'Travel Information', id:'travel', instruction:'Provide a complete itinerary for your travel to the U.S.:', fields:[
  { type:'select', name:'purposeOfTrip', label:'Purpose of trip to the USA?', options:['Business/Conference','Tourism/Vacation','Medical Treatment','Study','Work','Visit Family/Friends','Transit','Other'], required:true },
  { type:'textarea', name:'purposeDetails', label:'Please explain' },
  { type:'radio', name:'hasSpecificPlans', label:'Have you made specific travel plans?', options:['Yes','No'], required:true },
  { type:'date', name:'arriveDate', label:'Date of Arrival in U.S.', showIf:{ name:'hasSpecificPlans', in:['Yes'] }, required:true },
  { type:'text', name:'arriveFlight', label:'Arrival Flight (if known)', showIf:{ name:'hasSpecificPlans', in:['Yes'] } },
  { type:'text', name:'arriveCity', label:'Arrival City', showIf:{ name:'hasSpecificPlans', in:['Yes'] } },
  { type:'date', name:'departDate', label:'Date of Departure from U.S.', showIf:{ name:'hasSpecificPlans', in:['Yes'] }, required:true },
  { type:'text', name:'departFlight', label:'Departure Flight (if known)', showIf:{ name:'hasSpecificPlans', in:['Yes'] } },
  { type:'text', name:'departCity', label:'Departure City', showIf:{ name:'hasSpecificPlans', in:['Yes'] } },
  { type:'textarea', name:'visitLocations', label:'Locations you plan to visit', showIf:{ name:'hasSpecificPlans', in:['Yes'] } },
  { type:'date', name:'estArriveDate', label:'Intended Date of Arrival', showIf:{ name:'hasSpecificPlans', in:['No'] }, required:true },
  { type:'number', name:'stayValue', label:'Intended Length of Stay - Value', showIf:{ name:'hasSpecificPlans', in:['No'] }, required:true, min:1 },
  { type:'select', name:'stayUnit', label:'Intended Length of Stay - Unit', showIf:{ name:'hasSpecificPlans', in:['No'] }, options:['DAY(S)', 'WEEK(S)', 'MONTH(S)'], required:true },
  { type:'text', name:'usStayStreet1', label:'Street Address (Line 1)', showIf:{ name:'hasSpecificPlans', in:['No'] }, required:true },
  { type:'text', name:'usStayStreet2', label:'Street Address (Line 2)', showIf:{ name:'hasSpecificPlans', in:['No'] } },
  { type:'text', name:'usStayCity', label:'City', showIf:{ name:'hasSpecificPlans', in:['No'] }, required:true },
  { type:'select', name:'usStayState', label:'State', options: USA_STATES, showIf:{ name:'hasSpecificPlans', in:['No'] }, required:true },
  { type:'text', name:'usStayZip', label:'ZIP Code', showIf:{ name:'hasSpecificPlans', in:['No'] }, required:true, pattern:'^\d{5}(-\d{4})?$' },
  { type:'select', name:'tripPayer', label:'Person/Entity Paying for Your Trip', options:['SELF', 'OTHER PERSON', 'PRESENT EMPLOYER', 'EMPLOYER IN THE U.S.', 'OTHER COMPANY/ORGANIZATION'], required:true },
  { type:'text', name:'payerSurname', label:'Surnames of Person Paying for Trip', showIf:{ name:'tripPayer', in:['OTHER PERSON', 'PRESENT EMPLOYER', 'EMPLOYER IN THE U.S.', 'OTHER COMPANY/ORGANIZATION'] } },
  { type:'text', name:'payerGiven', label:'Given Names of Person Paying for Trip', showIf:{ name:'tripPayer', in:['OTHER PERSON', 'PRESENT EMPLOYER', 'EMPLOYER IN THE U.S.', 'OTHER COMPANY/ORGANIZATION'] } },
  { type:'tel', name:'payerPhone', label:'Telephone Number', showIf:{ name:'tripPayer', in:['OTHER PERSON', 'PRESENT EMPLOYER', 'EMPLOYER IN THE U.S.', 'OTHER COMPANY/ORGANIZATION'] } },
  { type:'email', name:'payerEmail', label:'Email Address', showIf:{ name:'tripPayer', in:['OTHER PERSON', 'PRESENT EMPLOYER', 'EMPLOYER IN THE U.S.', 'OTHER COMPANY/ORGANIZATION'] } },
  { type:'select', name:'payerRelationship', label:'Relationship to You', options:['SPOUSE','PARENT','SIBLING','FRIEND','OTHER'], showIf:{ name:'tripPayer', in:['OTHER PERSON'] } },
  // { type:'radio', name:'payerAddrSame', label:\"Is the payer\\'s address the same as your Home or Mailing Address?\\\", options:['Yes','No'], showIf:{ name:'tripPayer', in:['OTHER PERSON','PRESENT EMPLOYER','EMPLOYER IN THE U.S.','OTHER COMPANY/ORGANIZATION'] } },
  ]},
  { group:'Travel', title:'Accompanying Travelers', id:'companions', instruction:'Indicate if you are traveling with others or as part of a group:', fields:[
  { type:'radio', name:'hasCompanions', label:'Are there other persons traveling with you?', options:['Yes','No'], required:true },
  { type:'text', name:'companionSurname', label:'Companion Surname', showIf:{ name:'hasCompanions', in:['Yes'] } },
  { type:'text', name:'companionGivenName', label:'Companion Given Name', showIf:{ name:'hasCompanions', in:['Yes'] } },
  { type:'select', name:'companionRelationship', label:'Relationship to You', options:['Spouse','Child','Parent','Sibling','Friend','Colleague','Other'], showIf:{ name:'hasCompanions', in:['Yes'] } },
  { type:'date', name:'companionDOB', label:'Companion Date of Birth', showIf:{ name:'hasCompanions', in:['Yes'] } },
  { type:'select', name:'companionNationality', label:'Companion Nationality', options: COUNTRIES, showIf:{ name:'hasCompanions', in:['Yes'] } },
  { type:'text', name:'companionPassportNumber', label:'Companion Passport Number', showIf:{ name:'hasCompanions', in:['Yes'] } },
  { type:'radio', name:'asGroup', label:'Are you traveling as part of a group or organization?', options:['Yes','No'], required:true },
  { type:'text', name:'groupName', label:'Group Name', showIf:{ name:'asGroup', in:['Yes'] } },
  ]},
  { group:'Travel', title:'Previous U.S. Travel', id:'prev-us-travel', instruction:'Provide information about your previous travel to the United States:', fields:[
    { type:'radio', name:'beenToUS', label:'Have you ever been to the U.S.?', options:['Yes','No'], required:true },
    { type:'text', name:'lastVisitDates', label:'Dates of Last U.S. Visit', showIf:{ name:'beenToUS', in:['Yes'] }, required:true },
    { type:'text', name:'prevStayLength', label:'Length of stay in the U.S. (if visited)', showIf:{ name:'beenToUS', in:['Yes'] } },
    { type:'radio', name:'overstayedUS', label:'Have you ever overstayed a U.S. visa?', options:['Yes','No'], required:true },
    { type:'radio', name:'usVisaIssued', label:'Have you ever been issued a U.S. Visa?', options:['Yes','No'], required:true },
    { type:'date', name:'lastVisaIssueDate', label:'Date Last Visa Was Issued', showIf:{ name:'usVisaIssued', in:['Yes'] } },
    { type:'text', name:'visaNumber', label:'Visa Number', showIf:{ name:'usVisaIssued', in:['Yes'] } },
    { type:'checkbox', name:'visaNumberUnknown', label:'Do Not Know (Visa Number)', showIf:{ name:'usVisaIssued', in:['Yes'] } },
    { type:'radio', name:'sameVisaType', label:'Are you applying for the same type of visa?', options:['Yes','No'], showIf:{ name:'usVisaIssued', in:['Yes'] } },
    { type:'radio', name:'sameCountryApply', label:'Are you applying in the same country where the visa was issued?', options:['Yes','No'], showIf:{ name:'usVisaIssued', in:['Yes'] } },
    { type:'radio', name:'tenPrinted', label:'Have you been ten-printed?', options:['Yes','No'], showIf:{ name:'usVisaIssued', in:['Yes'] } },
    { type:'radio', name:'visaLostStolen', label:'Has your U.S. Visa ever been lost or stolen?', options:['Yes','No'], showIf:{ name:'usVisaIssued', in:['Yes'] } },
    { type:'number', name:'visaLostYear', label:'Enter year visa was lost or stolen', showIf:{ name:'visaLostStolen', in:['Yes'] }, min:1900, max:2100 },
    { type:'textarea', name:'visaLostExplain', label:'Explain', showIf:{ name:'visaLostStolen', in:['Yes'] } },
    { type:'radio', name:'visaCancelled', label:'Has your U.S. Visa ever been cancelled or revoked?', options:['Yes','No'], showIf:{ name:'usVisaIssued', in:['Yes'] } },
    { type:'textarea', name:'visaCancelledExplain', label:'Explain', showIf:{ name:'visaCancelled', in:['Yes'] } },
    { type:'radio', name:'usVisaRefused', label:'Have you ever been refused a U.S. Visa or refused admission?', options:['Yes','No'], required:true },
    { type:'textarea', name:'usVisaRefusedExplain', label:'Explain', showIf:{ name:'usVisaRefused', in:['Yes'] }, required:true },
    { type:'radio', name:'hasUSDL', label:'Do you or did you ever hold a U.S. Drivers License?', options:['Yes','No'], required:true },
    { type:'text', name:'usdlNumber', label:'Drivers License Number', showIf:{ name:'hasUSDL', in:['Yes'] } },
    { type:'select', name:'usdlState', label:'State of Drivers License', options: USA_STATES, showIf:{ name:'hasUSDL', in:['Yes'] } },
    { type:'checkbox', name:'usdlUnknown', label:'Do Not Know (Drivers License)', showIf:{ name:'hasUSDL', in:['Yes'] } },
    { type:'radio', name:'uscisPetition', label:'Has anyone ever filed an immigrant petition on your behalf with USCIS?', options:['Yes','No'], required:true },
    { type:'textarea', name:'uscisPetitionExplain', label:'Explain', showIf:{ name:'uscisPetition', in:['Yes'] }, required:true },
  ]},
  { group:'US Contact', title:'U.S. Point of Contact', id:'uscontact', instruction:'Provide contact information for a person or organization in the United States:', fields:[
  { type:'text', name:'usContactName', label:'Contact Person (or Org)', required:true },
  { type:'text', name:'usContactOrg', label:'Organization (if applicable)' },
  { type:'select', name:'usContactRelationship', label:'Relationship to You', options:['Relative','Friend','Business Associate','School Official','Other'], required:true },
  { type:'tel', name:'usContactPhone', label:'Phone Number', required:true },
  { type:'email', name:'usContactEmail', label:'Email', required:true },
  { type:'text', name:'usPOCStreet', label:'Street', required:true },
    { type:'text', name:'usPOCCity', label:'City', required:true },
    { type:'select', name:'usPOCState', label:'State', options: USA_STATES, required:true },
    { type:'text', name:'usPOCZip', label:'ZIP', pattern:'^\d{5}(-\d{4})?$', required:true },
  ]},
  { group:'Family', title:'Family Information', id:'family', instruction:'Provide information about your immediate family members:', fields:[
  { type:'text', name:'fatherSurname', label:'Father - Surname', required:true },
  { type:'text', name:'fatherGiven', label:'Father - Given Name', required:true },
  { type:'date', name:'fatherDOB', label:'Father - Date of Birth' },
  { type:'checkbox', name:'fatherDOBUnknown', label:'Father - Do Not Know (Date of Birth)' },
  { type:'radio', name:'fatherInUS', label:'Is your father in the U.S.?', options:['Yes','No'], required:true },
  { type:'text', name:'motherSurname', label:'Mother - Surname', required:true },
  { type:'text', name:'motherGiven', label:'Mother - Given Name', required:true },
  { type:'date', name:'motherDOB', label:'Mother - Date of Birth' },
  { type:'checkbox', name:'motherDOBUnknown', label:'Mother - Do Not Know (Date of Birth)' },
  { type:'radio', name:'motherInUS', label:'Is your mother in the U.S.?', options:['Yes','No'], required:true },
    { type:'radio', name:'hasImmediateRelativesUS', label:'Any immediate relatives in the U.S. (not including parents)?', options:['Yes','No'], required:true },
    { type:'text', name:'immediateRelativeSurname', label:'Immediate Relative - Surname', showIf:{ name:'hasImmediateRelativesUS', in:['Yes'] } },
    { type:'text', name:'immediateRelativeGivenName', label:'Immediate Relative - Given Name', showIf:{ name:'hasImmediateRelativesUS', in:['Yes'] } },
    { type:'select', name:'immediateRelativeRelationship', label:'Relationship', options:['Spouse','Child','Sibling','Other'], showIf:{ name:'hasImmediateRelativesUS', in:['Yes'] } },
    { type:'select', name:'immediateRelativeStatus', label:'U.S. Status', options:['U.S. Citizen','Lawful Permanent Resident','Other'], showIf:{ name:'hasImmediateRelativesUS', in:['Yes'] } },
    { type:'text', name:'immediateRelativeStreet', label:'Street Address', showIf:{ name:'hasImmediateRelativesUS', in:['Yes'] } },
    { type:'text', name:'immediateRelativeCity', label:'City', showIf:{ name:'hasImmediateRelativesUS', in:['Yes'] } },
    { type:'select', name:'immediateRelativeState', label:'State', options: USA_STATES, showIf:{ name:'hasImmediateRelativesUS', in:['Yes'] } },
    { type:'text', name:'immediateRelativeZip', label:'ZIP Code', showIf:{ name:'hasImmediateRelativesUS', in:['Yes'] }, pattern:'^\d{5}(-\d{4})?$' },
    { type:'tel', name:'immediateRelativePhone', label:'Phone Number', showIf:{ name:'hasImmediateRelativesUS', in:['Yes'] } },
    { type:'radio', name:'hasOtherRelativesUS', label:'Any other relatives in the U.S.?', options:['Yes','No'], required:true },
    { type:'text', name:'otherRelativeSurname', label:'Other Relative - Surname', showIf:{ name:'hasOtherRelativesUS', in:['Yes'] } },
    { type:'text', name:'otherRelativeGivenName', label:'Other Relative - Given Name', showIf:{ name:'hasOtherRelativesUS', in:['Yes'] } },
    { type:'text', name:'otherRelativeRelationship', label:'Relationship', showIf:{ name:'hasOtherRelativesUS', in:['Yes'] } },
    { type:'select', name:'otherRelativeStatus', label:'U.S. Status', options:['U.S. Citizen','Lawful Permanent Resident','Other'], showIf:{ name:'hasOtherRelativesUS', in:['Yes'] } },
    { type:'text', name:'otherRelativeStreet', label:'Street Address', showIf:{ name:'hasOtherRelativesUS', in:['Yes'] } },
    { type:'text', name:'otherRelativeCity', label:'City', showIf:{ name:'hasOtherRelativesUS', in:['Yes'] } },
    { type:'select', name:'otherRelativeState', label:'State', options: USA_STATES, showIf:{ name:'hasOtherRelativesUS', in:['Yes'] } },
    { type:'text', name:'otherRelativeZip', label:'ZIP Code', showIf:{ name:'hasOtherRelativesUS', in:['Yes'] }, pattern:'^\d{5}(-\d{4})?$' },
    { type:'tel', name:'otherRelativePhone', label:'Phone Number', showIf:{ name:'hasOtherRelativesUS', in:['Yes'] } },
    { type:'radio', name:'hasSpouse', label:'Do you have a spouse?', options:['Yes','No'], required:true },
    { type:'text', name:'spouseName', label:'Spouse Full Name', showIf:{ name:'hasSpouse', in:['Yes'] } },
    { type:'date', name:'spouseDOB', label:'Spouse DOB', showIf:{ name:'hasSpouse', in:['Yes'] } },
    { type:'select', name:'spouseNationality', label:'Spouse Nationality', options: COUNTRIES, showIf:{ name:'hasSpouse', in:['Yes'] } },
    { type:'text', name:'spouseBirthCity', label:'Spouse Place of Birth - City', showIf:{ name:'hasSpouse', in:['Yes'] } },
    { type:'select', name:'spouseBirthCountry', label:'Spouse Place of Birth - Country/Region', options: COUNTRIES, showIf:{ name:'hasSpouse', in:['Yes'] } },
    { type:'select', name:'spouseAddressKind', label:'Spouse Address', options:['SAME AS HOME ADDRESS', 'SAME AS MAILING ADDRESS', 'SAME AS U.S. CONTACT ADDRESS', 'DO NOT KNOW', 'OTHER (SPECIFY)'], showIf:{ name:'hasSpouse', in:['Yes'] } },
    { type:'textarea', name:'spouseAddressOther', label:'Specify Address', showIf:{ name:'spouseAddressKind', in:['OTHER (SPECIFY)'] } },
    { type:'radio', name:'hasChildren', label:'Any children?', options:['Yes','No'], required:true },
    { type:'textarea', name:'childrenNames', label:'Children — Full Name(s), DOB, Country (one per line)', showIf:{ name:'hasChildren', in:['Yes'] } },
  ]},
  { group:'Work/Education', title:'Present Work Information', id:'work-present', instruction:'Provide details about your current employment or educational institution:', fields:[
  { type:'select', name:'occupation', label:'Primary Occupation', options: OCCUPATIONS, required:true },
  { type:'text', name:'employerName', label:'Present Employer or School Name', required:true },
  { type:'text', name:'empStreet1', label:'Street Address (Line 1)', required:true },
  { type:'text', name:'empStreet2', label:'Street Address (Line 2) (Optional)' },
  { type:'text', name:'empCity', label:'City', required:true },
    { type:'text', name:'empState', label:'State/Province', required:true },
    { type:'text', name:'empZip', label:'Postal/ZIP Code', required:true },
    { type:'select', name:'empCountry', label:'Country/Region', options: COUNTRIES, required:true },
    { type:'tel', name:'empPhone', label:'Phone Number', required:true },
    { type:'date', name:'empStartDate', label:'Start Date', required:true },
    { type:'number', name:'monthlyIncome', label:'Monthly Income (Local Currency)', required:true },
    { type:'textarea', name:'duties', label:'Briefly describe your duties', required:true },
  ]},
  { group:'Work/Education', title:'Previous Work Information', id:'work-previous', instruction:'Provide information about your previous employment history:', fields:[
    { type:'radio', name:'hasPreviousWork', label:'Do you have previous work experience?', options:['Yes','No'], required:true },
    { type:'text', name:'prevEmployerName', label:'Previous Employer Name', showIf:{ name:'hasPreviousWork', in:['Yes'] } },
    { type:'text', name:'prevJobTitle', label:'Job Title', showIf:{ name:'hasPreviousWork', in:['Yes'] } },
    { type:'text', name:'prevEmpStreet', label:'Street Address', showIf:{ name:'hasPreviousWork', in:['Yes'] } },
    { type:'text', name:'prevEmpCity', label:'City', showIf:{ name:'hasPreviousWork', in:['Yes'] } },
    { type:'text', name:'prevEmpState', label:'State/Province', showIf:{ name:'hasPreviousWork', in:['Yes'] } },
    { type:'text', name:'prevEmpZip', label:'Postal/ZIP Code', showIf:{ name:'hasPreviousWork', in:['Yes'] } },
    { type:'select', name:'prevEmpCountry', label:'Country/Region', options: COUNTRIES, showIf:{ name:'hasPreviousWork', in:['Yes'] } },
    { type:'tel', name:'prevEmpPhone', label:'Employer Phone Number', showIf:{ name:'hasPreviousWork', in:['Yes'] } },
    { type:'date', name:'prevEmpStartDate', label:'Start Date', showIf:{ name:'hasPreviousWork', in:['Yes'] } },
    { type:'date', name:'prevEmpEndDate', label:'End Date', showIf:{ name:'hasPreviousWork', in:['Yes'] } },
    { type:'textarea', name:'prevDuties', label:'Job Duties', showIf:{ name:'hasPreviousWork', in:['Yes'] } },
    { type:'text', name:'prevSupervisorSurname', label:'Supervisor Surname', showIf:{ name:'hasPreviousWork', in:['Yes'] } },
    { type:'text', name:'prevSupervisorGivenName', label:'Supervisor Given Name', showIf:{ name:'hasPreviousWork', in:['Yes'] } },
    { type:'tel', name:'prevSupervisorPhone', label:'Supervisor Phone Number', showIf:{ name:'hasPreviousWork', in:['Yes'] } },
  ]},
  { group:'Work/Education', title:'Additional Information', id:'work-additional', instruction:'Provide additional work and activity information:', fields:[
    { type:'radio', name:'clanTribe', label:'Do you belong to a clan or tribe?', options:['Yes','No'], required:true },
    { type:'textarea', name:'clanTribeName', label:'Clan or Tribe Name', showIf:{ name:'clanTribe', in:['Yes'] }, required:true },
    { type:'textarea', name:'languages', label:'Languages you speak', required:true },
    { type:'radio', name:'traveled5y', label:'Traveled to any countries/regions within the last 5 years?', options:['Yes','No'], required:true },
    { type:'textarea', name:'traveled5yDetails', label:'Travel details', showIf:{ name:'traveled5y', in:['Yes'] }, required:true },
    { type:'radio', name:'orgMembership', label:'Belonged to or worked for any professional/social/charitable org?', options:['Yes','No'], required:true },
    { type:'textarea', name:'orgMembershipExplain', label:'Explain', showIf:{ name:'orgMembership', in:['Yes'] }, required:true },
    { type:'radio', name:'specialSkills', label:'Specialized skills/training (firearms/explosives/nuclear/biological/chemical)?', options:['Yes','No'], required:true },
    { type:'textarea', name:'specialSkillsExplain', label:'Explain', showIf:{ name:'specialSkills', in:['Yes'] }, required:true },
    { type:'radio', name:'servedMilitary', label:'Have you ever served in the military?', options:['Yes','No'], required:true },
    { type:'date', name:'milFrom', label:'Military Service From', showIf:{ name:'servedMilitary', in:['Yes'] }, required:true },
    { type:'date', name:'milTo', label:'Military Service To', showIf:{ name:'servedMilitary', in:['Yes'] }, required:true },
    { type:'radio', name:'paramilitaryAssoc', label:'Member/associated with paramilitary/vigilante/rebel/guerrilla/insurgent group?', options:['Yes','No'], required:true },
    { type:'textarea', name:'paramilitaryExplain', label:'Explain', showIf:{ name:'paramilitaryAssoc', in:['Yes'] }, required:true },
  ]},
  { group:'Work/Education', title:'Previous Education', id:'education', instruction:'Indicate your educational background:', fields:[
    { type:'radio', name:'studiedSecondaryUp', label:'Have you attended any educational institutions at secondary level or above?', options:['Yes','No'], required:true },
    { type:'text', name:'schoolName', label:'Name of Institution', showIf:{ name:'studiedSecondaryUp', in:['Yes'] }, required:true },
    { type:'text', name:'schoolStreet', label:'Street Address', showIf:{ name:'studiedSecondaryUp', in:['Yes'] } },
    { type:'text', name:'schoolCity', label:'City', showIf:{ name:'studiedSecondaryUp', in:['Yes'] } },
    { type:'text', name:'schoolState', label:'State/Province', showIf:{ name:'studiedSecondaryUp', in:['Yes'] } },
    { type:'text', name:'schoolPostal', label:'Postal Code', showIf:{ name:'studiedSecondaryUp', in:['Yes'] } },
    { type:'select', name:'schoolCountry', label:'Country', options: COUNTRIES, showIf:{ name:'studiedSecondaryUp', in:['Yes'] } },
    { type:'text', name:'courseOfStudy', label:'Course of Study', showIf:{ name:'studiedSecondaryUp', in:['Yes'] } },
    { type:'date', name:'schoolStartDate', label:'Date of Attendance From', showIf:{ name:'studiedSecondaryUp', in:['Yes'] } },
    { type:'date', name:'schoolEndDate', label:'Date of Attendance To', showIf:{ name:'studiedSecondaryUp', in:['Yes'] } },
  ]},
  { group:'Additional Contact', title:'Contact / Communication', id:'contact-comm', instruction:'Provide additional contact details from the past five years:', fields:[
  { type:'radio', name:'otherPhones5y', label:'Have you used any other phone numbers in the last five years?', options:['Yes','No'], required:true },
  { type:'textarea', name:'otherPhones5yDetails', label:'List other phone numbers', showIf:{ name:'otherPhones5y', in:['Yes'] }, required:true },
  ]},
  { group:'Security', title:'Security & Background', id:'security', instruction:'Answer all security and background questions truthfully. Select "Yes" or "No" for each question:', custom:'security' },
]

function validate(model){
  const errors = {}
  for (const k of REQUIRED){
    if (!model[k] || String(model[k]).trim()===''){
      errors[k] = 'This field is required.'
    }
  }
  for (const eKey of ['email','email2','usContactEmail','payerEmail']){
  const v = model[eKey]
  if (v && !/^([^\s@]+)@([^\s@]+)\.([^\s@]+)$/.test(v)) errors[eKey] = 'Enter a valid email.'
  }
  
  // Phone validation
  const phoneFields = ['primaryPhone', 'secondaryPhone', 'usContactPhone', 'empPhone', 'payerPhone', 'immediateRelativePhone', 'otherRelativePhone', 'prevEmpPhone', 'prevSupervisorPhone']
  phoneFields.forEach(field => {
  const phoneErr = validatePhone(model[field])
  if (phoneErr) errors[field] = phoneErr
  })
  
  // NIN validation
  if (model.nationalID) {
    const ninErr = validateNIN(model.nationalID)
    if (ninErr) errors.nationalID = ninErr
  }
  
  return errors
}

export default function App(){
  const [model, setModel] = useState({})
  const [idx, setIdx] = useState(0)
  const [errors, setErrors] = useState({})
  const [showPreview, setShowPreview] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [submissionResult, setSubmissionResult] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showResumePrompt, setShowResumePrompt] = useState(false)
  const [navOpen, setNavOpen] = useState(false)

  // Load saved data on mount
  useEffect(() => {
    const saved = loadFormData('ds160')
    if (saved && Object.keys(saved.data).length > 0) {
      setShowResumePrompt(true)
    }
  }, [])

  // Auto-save form data
  useEffect(() => {
    const cleanup = setupAutoSave('ds160', () => model)
    return cleanup
  }, [model])

  const handleResume = () => {
    const saved = loadFormData('ds160')
    if (saved) {
      setModel(saved.data)
      setShowResumePrompt(false)
      alert(`✅ Form restored from ${new Date(saved.timestamp).toLocaleString()}`)
    }
  }

  const handleStartFresh = () => {
    clearFormData('ds160')
    setShowResumePrompt(false)
  }

  const handleManualSave = () => {
    const success = saveFormData('ds160', model)
    if (success) {
      alert('✅ Form progress saved successfully!')
    } else {
      alert('❌ Failed to save form. Please try again.')
    }
  }

  function onChange(name, value){
    setModel(m => ({...m, [name]: value}))
    setErrors(e => ({...e, [name]: undefined}))
    
    // Real-time validation for confirmation fields
    const newModel = {...model, [name]: value}
    
    // Validate phone confirmations
    if (name === 'primaryPhoneConfirm' || name === 'primaryPhone') {
      const matchErr = validatePhoneMatch(newModel.primaryPhone, newModel.primaryPhoneConfirm)
      if (matchErr) {
        setErrors(e => ({...e, primaryPhoneConfirm: matchErr}))
      }
    }
    
    if (name === 'secondaryPhoneConfirm' || name === 'secondaryPhone') {
      const matchErr = validatePhoneMatch(newModel.secondaryPhone, newModel.secondaryPhoneConfirm)
      if (matchErr) {
        setErrors(e => ({...e, secondaryPhoneConfirm: matchErr}))
      } else {
        setErrors(e => ({...e, secondaryPhoneConfirm: undefined}))
      }
    }
    
    // Validate NIN confirmation
    if (name === 'nationalIDConfirm' || name === 'nationalID') {
      const matchErr = validateNINMatch(newModel.nationalID, newModel.nationalIDConfirm)
      if (matchErr) {
        setErrors(e => ({...e, nationalIDConfirm: matchErr}))
      } else {
        setErrors(e => ({...e, nationalIDConfirm: undefined}))
      }
    }
  }

  const groups = useMemo(()=>{
    const g = {}
    SECTIONS.forEach((s,i)=>{
      (g[s.group] = g[s.group] || []).push({ i, title: s.title })
    })
    return g
  }, [])

  // Check if a section is completed (all required fields filled)
  function isSectionComplete(sectionIndex) {
    const section = SECTIONS[sectionIndex]
    
    // Special handling for Security & Background section
    if (section.custom === 'security') {
      // Check if all security questions are answered
      for (let i = 1; i <= SEC_QUESTIONS.length; i++) {
        const answer = model[`secQ${i}`]
        if (!answer || answer === '') {
          return false
        }
        // If answered Yes, explanation is required
        if (answer === 'Yes') {
          const explanation = model[`secQ${i}Explain`]
          if (!explanation || String(explanation).trim() === '') {
            return false
          }
        }
      }
      return true
    }
    
    if (!section.fields) return false // Sections without fields are not complete
    
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

  // Check if a group is completed (all sections in group completed)
  function isGroupComplete(groupName) {
    const groupSections = groups[groupName] || []
    return groupSections.every(s => isSectionComplete(s.i))
  }

  // Calculate overall completion stats
  const completionStats = useMemo(() => {
    const total = SECTIONS.length
    const completed = SECTIONS.filter((_, i) => isSectionComplete(i)).length
    const percentage = Math.round((completed / total) * 100)
    return { completed, total, percentage }
  }, [model]) // Recalculate when model changes

  const current = SECTIONS[idx]
  const currentGroup = current.group

  function goToIndex(i){ setIdx(i) }
  function goToGroup(group){ const first = groups[group][0].i; setIdx(first) }

  function next(){
    if (!sectionOk()) return
    setIdx(i => Math.min(SECTIONS.length-1, i+1))
  }
  function prev(){
    setIdx(i => Math.max(0, i-1))
  }

  function sectionOk(){
    const e = {...errors}
    const section = SECTIONS[idx]
    if (section.fields){
      for (const f of section.fields){
        if (f.required){
          const v = model[f.name]
          const hidden = f.showIf && !f.showIf.in.includes(String(model[f.showIf.name]||''))
          if (!hidden && (!v || String(v).trim()==='')){
            e[f.name] = 'This field is required.'
          }
        }
      }
    }
    setErrors(e)
    const bad = Object.values(e).some(Boolean)
    return !bad
  }

  function goToPreview(){
    const e = validate(model)
    setErrors(e)
    if (Object.keys(e).length){ 
      const missingFields = Object.keys(e).join(', ')
      alert(`Please fix validation errors before previewing.\n\nMissing required fields: ${missingFields}`); 
      return 
    }
    setShowPreview(true)
  }

  async function handleFinalSubmit(){
    const payload = {
      formType: 'ds160',
      createdAt: new Date().toISOString(),
      applicantName: `${model.givenNames || ''} ${model.surname || ''}`.trim(),
      data: model
    }

    setIsSubmitting(true)
    try {
      const res = await uploadToGoogleDrive(payload)
      setSubmissionResult(res)
      setIsSubmitting(false)
      setShowSuccess(true)
      setShowPreview(false)
    } catch (err){
      setIsSubmitting(false)
      alert('❌ Submission error: ' + err.message + '\n\nPlease try again or contact support.')
      console.error('Submit error:', err)
    }
  }

  function handleSuccessClose(){
    setShowSuccess(false)
    setSubmissionResult(null)
    setModel({})
    setIdx(0)
  }

  if (showPreview){
    return (
      <>
        {isSubmitting && (
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
              border: '8px solid #3b82f6',
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

        <SuccessModal 
          show={showSuccess}
          formName="DS-160 Visa Application"
          onClose={handleSuccessClose}
        />

        <PreviewPage 
          model={model} 
          onBack={() => setShowPreview(false)} 
          onSubmit={handleFinalSubmit}
          isSubmitting={isSubmitting}
        />
      </>
    )
  }

  function handleNavSelect(i) {
    goToIndex(i)
    setNavOpen(false) // Close nav after selection on mobile
  }

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

      {isSubmitting && (
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
            border: '8px solid #3b82f6',
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

      <SuccessModal 
        show={showSuccess}
        formName="DS-160 Visa Application"
        onClose={handleSuccessClose}
      />

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
              <h1>Applicant Data Capture Form</h1>
              <div className="sub">Fill, review, and sign your travel visa details</div>
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
            <h2>{current.title}</h2>
            {current.instruction && (
              <p className="instruction-text">{current.instruction}</p>
            )}

            {current.custom === 'security' && (
              <div className="grid grid-2">
                {SEC_QUESTIONS.map((q, i) => (
                  <React.Fragment key={i}>
                    <div>
                      <label htmlFor={'secQ'+(i+1)}>
                        {q}
                        <span className="required-badge">required</span>
                      </label>
                      <select id={'secQ'+(i+1)} value={model['secQ'+(i+1)]||''} onChange={e=>onChange('secQ'+(i+1), e.target.value)} required>
                        <option value="">Select…</option><option>No</option><option>Yes</option>
                      </select>
                    </div>
                    {model['secQ'+(i+1)]==='Yes' && (
                      <div>
                        <label htmlFor={'secQ'+(i+1)+'Explain'}>
                          Explain
                          <span className="required-badge">required</span>
                        </label>
                        <textarea id={'secQ'+(i+1)+'Explain'} value={model['secQ'+(i+1)+'Explain']||''} onChange={e=>onChange('secQ'+(i+1)+'Explain', e.target.value)} required/>
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            )}

            {!current.custom && (
              <div className={current.id==='pi1' || current.id==='pi2' ? 'grid grid-3' : 'grid grid-2'} style={{ marginTop: '4px' }}>
                {(current.fields||[]).map(f => {
                  const isInstruction = f.type === 'instruction'
                  const isRadio = f.type === 'radio'
                  const isTextarea = f.type === 'textarea'
                  const spanFull = isInstruction || isRadio || isTextarea
                  
                  return (
                    <div 
                      key={f.name} 
                      style={{ 
                        gridColumn: spanFull ? '1 / -1' : 'auto',
                        marginBottom: '0'
                      }}
                    >
                      <Field f={f} model={model} onChange={onChange} fieldErrors={errors} />
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="toolbar">
            <button className="btn" onClick={(e)=>{e.preventDefault();prev()}} disabled={idx===0}>Back</button>
            <button className="btn" onClick={(e)=>{e.preventDefault();handleManualSave()}} style={{marginLeft: '10px'}}>💾 Save Progress</button>
            {idx < SECTIONS.length-1 ? (
              <button className="btn primary" onClick={(e)=>{e.preventDefault();next()}}>Next</button>
            ) : (
              <button className="btn success" onClick={(e)=>{e.preventDefault();goToPreview()}}>Review & Submit</button>
            )}
          </div>
        </div>
      </main>
    </>
  )
}