import React from 'react'
import { SEC_QUESTIONS } from '../data/sections.js'

export default function PreviewPage({ model = {}, signatureDataUrl, onBack, onSubmit, isSubmitting }){
  const renderValue = (value) => {
    if (!value) return <span style={{color: '#9ca3af', fontStyle: 'italic'}}>Not provided</span>
    if (Array.isArray(value)) {
      return value.filter(item => item && item.trim()).map((item, i) => <div key={i}>• {item}</div>)
    }
    if (typeof value === 'string' && value.includes('\n')){
      return value.split('\n').map((line, i) => <div key={i}>{line || <br/>}</div>)
    }
    return value
  }

  // Group data by section titles - comprehensive field list
  const sectionGroups = [
    { title: 'Personal Information', fields: ['surname', 'givenNames', 'nativeFullName', 'otherNamesUsed', 'sex', 'maritalStatus', 'nationalID', 'usSSN', 'usTaxpayerID', 'dob', 'birthCity', 'birthState', 'birthCountry', 'nationality', 'otherNationalityYN', 'hasTelecode', 'permanentResident', 'languages'] },
    { title: 'Contact Information', fields: ['homeStreet', 'homeCity', 'homeState', 'homePostal', 'homeCountry', 'mailingSame', 'mailingAddress', 'primaryPhone', 'secondaryPhone', 'email', 'email2', 'socialMedia'] },
    { title: 'Passport Information', fields: ['passportType', 'passportNumber', 'passportBookNumber', 'passportIssuingCountry', 'passportIssueCity', 'passportIssueCountry', 'passportIssueDate', 'passportExpiryDate', 'otherPassportYN', 'otherPassports', 'lostStolenYN', 'lostStolenExplain'] },
    { title: 'Travel Information', fields: ['purposeOfTrip', 'purposeDetails', 'specifyPurpose', 'hasSpecificPlans', 'arriveDate', 'arriveFlight', 'arriveCity', 'departDate', 'departFlight', 'departCity', 'visitLocations', 'estArriveDate', 'stayValue', 'stayUnit', 'usStayStreet1', 'usStayStreet2', 'usStayCity', 'usStayState', 'usStayZip', 'tripPayer', 'payerSurname', 'payerGiven', 'payerPhone', 'payerEmail', 'payerRelationship', 'payerAddrSame'] },
    { title: 'Accompanying Travelers', fields: ['hasCompanions', 'companionSurname', 'companionGivenName', 'companionRelationship', 'companionDOB', 'companionNationality', 'companionPassportNumber', 'asGroup', 'groupName'] },
    { title: 'Previous U.S. Travel', fields: ['beenToUS', 'lastVisitDates', 'prevStayLength', 'overstayedUS', 'usVisaIssued', 'lastVisaIssueDate', 'visaNumber', 'visaNumberUnknown', 'sameVisaType', 'sameCountryApply', 'tenPrinted', 'visaLostStolen', 'visaLostYear', 'visaLostExplain', 'visaCancelled', 'visaCancelledExplain', 'usVisaRefused', 'usVisaRefusedExplain', 'hasUSDL', 'usdlNumber', 'usdlState', 'usdlUnknown', 'uscisPetition', 'uscisPetitionExplain'] },
    { title: 'U.S. Point of Contact', fields: ['usContactName', 'usContactOrg', 'usContactRelationship', 'usContactPhone', 'usContactEmail', 'usPOCStreet', 'usPOCCity', 'usPOCState', 'usPOCZip'] },
    { title: 'Family Information', fields: ['fatherSurname', 'fatherGiven', 'fatherDOB', 'fatherDOBUnknown', 'fatherInUS', 'motherSurname', 'motherGiven', 'motherDOB', 'motherDOBUnknown', 'motherInUS', 'hasImmediateRelativesUS', 'immediateRelativeSurname', 'immediateRelativeGivenName', 'immediateRelativeRelationship', 'immediateRelativeStatus', 'immediateRelativeStreet', 'immediateRelativeCity', 'immediateRelativeState', 'immediateRelativeZip', 'immediateRelativePhone', 'hasOtherRelativesUS', 'otherRelativeSurname', 'otherRelativeGivenName', 'otherRelativeRelationship', 'otherRelativeStatus', 'otherRelativeStreet', 'otherRelativeCity', 'otherRelativeState', 'otherRelativeZip', 'otherRelativePhone', 'hasSpouse', 'spouseName', 'spouseDOB', 'spouseNationality', 'spouseBirthCity', 'spouseBirthCountry', 'spouseAddressKind', 'spouseAddressOther', 'hasChildren', 'childrenNames'] },
    { title: 'Present Work Information', fields: ['occupation', 'employerName', 'empStreet1', 'empStreet2', 'empCity', 'empState', 'empZip', 'empCountry', 'empPhone', 'empStartDate', 'monthlyIncome', 'duties'] },
    { title: 'Previous Work Information', fields: ['hasPreviousWork', 'prevEmployerName', 'prevJobTitle', 'prevEmpStreet', 'prevEmpCity', 'prevEmpState', 'prevEmpZip', 'prevEmpCountry', 'prevEmpPhone', 'prevEmpStartDate', 'prevEmpEndDate', 'prevDuties', 'prevSupervisorSurname', 'prevSupervisorGivenName', 'prevSupervisorPhone'] },
    { title: 'Additional Work & Activities', fields: ['clanTribe', 'clanTribeName', 'languages', 'traveled5y', 'traveled5yDetails', 'orgMembership', 'orgMembershipExplain', 'specialSkills', 'specialSkillsExplain', 'servedMilitary', 'milFrom', 'milTo', 'paramilitaryAssoc', 'paramilitaryExplain'] },
    { title: 'Education', fields: ['studiedSecondaryUp', 'schoolName', 'schoolStreet', 'schoolCity', 'schoolState', 'schoolPostal', 'schoolCountry', 'courseOfStudy', 'schoolStartDate', 'schoolEndDate'] },
    { title: 'Contact/Communication', fields: ['otherPhones5y', 'otherPhones5yDetails'] },
    { title: 'Schengen Add-on', fields: ['hasEUFamily', 'euFamilySurname', 'euFamilyGiven', 'euFamilyDOB', 'euFamilyNationality', 'euFamilyDocNo', 'euFamilyRelationship'] },
    { title: 'Canada Add-on', fields: ['genderCA'] }
  ]

  // Process data using useMemo to avoid re-render issues
  const groupedData = React.useMemo(() => {
    const data = {}
    
    sectionGroups.forEach(section => {
      section.fields.forEach(fieldName => {
        if (model[fieldName]){
          if (!data[section.title]) data[section.title] = []
          data[section.title].push({
            label: fieldName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
            value: model[fieldName]
          })
        }
      })
    })

    // Add ALL security questions (both Yes and No answers)
    const securityAnswers = []
    if (SEC_QUESTIONS && Array.isArray(SEC_QUESTIONS)) {
      for (let i = 1; i <= SEC_QUESTIONS.length; i++){
        const answer = model[`secQ${i}`]
        if (answer){
          const item = {
            label: SEC_QUESTIONS[i-1],
            value: answer
          }
          if (answer === 'Yes' && model[`secQ${i}Explain`]){
            item.value = `Yes - ${model[`secQ${i}Explain`]}`
          }
          securityAnswers.push(item)
        }
      }
      if (securityAnswers.length > 0){
        data['Security & Background'] = securityAnswers
      }
    }
    
    return data
  }, [model])

  return (
    <div className="preview-page">
      <header>
        <h1>DS-160 Form Preview</h1>
        <div className="sub">Review all information before final submission</div>
      </header>

      <main className="preview-main">
        <div className="preview-container">
          {Object.keys(groupedData).length === 0 ? (
            <div style={{textAlign: 'center', padding: '3rem'}}>
              <h2 style={{color: '#64748b', marginBottom: '1rem'}}>No Data to Display</h2>
              <p style={{color: '#94a3b8', marginBottom: '2rem'}}>The form appears to be empty. Please go back and fill out the form.</p>
              <button className="btn" onClick={onBack}>← Back to Form</button>
            </div>
          ) : (
            Object.entries(groupedData).map(([sectionTitle, fields]) => (
              <div key={sectionTitle} className="preview-section">
                <h2>{sectionTitle}</h2>
                <div className="preview-grid">
                  {fields.map((field, idx) => (
                    <div key={idx} className="preview-item">
                      <div className="preview-label">{field.label}</div>
                      <div className="preview-value">{renderValue(field.value)}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}

          {Object.keys(groupedData).length > 0 && (
            <>
              {signatureDataUrl && (
                <div className="preview-section">
                  <h2>Electronic Signature</h2>
                  <div className="signature-preview">
                    <img src={signatureDataUrl} alt="Signature" />
                  </div>
                </div>
              )}

              <div className="preview-actions">
                <button className="btn" onClick={onBack} disabled={isSubmitting}>← Back to Edit</button>
                <button className="btn success" onClick={onSubmit} disabled={isSubmitting}>Submit Application</button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
