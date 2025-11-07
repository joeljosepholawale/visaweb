import React, { useMemo, useState, useEffect } from 'react'
import { LeftStepper, TopTabs } from './components/Stepper.jsx'
import PreviewPage from './components/PreviewPage.jsx'
import { COUNTRIES } from './data/countries.js'
import { REQUIRED as DS160_REQUIRED, SEC_QUESTIONS } from './data/sections.js'
import { SCHENGEN_SECTIONS, SCHENGEN_REQUIRED } from './forms/schengen/sections.js'
import { uploadToGoogleDrive } from './utils/drive.js'

function Field({ f, model, onChange }){
  const hidden = f.showIf && !f.showIf.in.includes(String(model[f.showIf.name] || ''))
  if (hidden) return null

  const err = f.error ? <div className="error">{f.error}</div> : null

  if (f.type === 'textarea') return <div><label htmlFor={f.name}>{f.label}{f.required && ' *'}</label><textarea id={f.name} value={model[f.name]||''} onChange={e=>onChange(f.name, e.target.value)} /></div>
  if (f.type === 'select') return <div><label htmlFor={f.name}>{f.label}{f.required && ' *'}</label>
    <select id={f.name} value={model[f.name]||''} onChange={e=>onChange(f.name, e.target.value)}>
      <option value="">Select…</option>
      {(f.options||[]).map(o => <option key={o} value={o}>{o}</option>)}
    </select>{err}</div>
  if (f.type === 'date') return <div><label htmlFor={f.name}>{f.label}{f.required && ' *'}</label><input type="date" id={f.name} value={model[f.name]||''} onChange={e=>onChange(f.name, e.target.value)} />{err}</div>
  if (f.type === 'email') return <div><label htmlFor={f.name}>{f.label}{f.required && ' *'}</label><input type="email" id={f.name} value={model[f.name]||''} onChange={e=>onChange(f.name, e.target.value)} />{err}</div>
  if (f.type === 'number') return <div><label htmlFor={f.name}>{f.label}{f.required && ' *'}</label><input type="number" id={f.name} value={model[f.name]||''} onChange={e=>onChange(f.name, e.target.value)} />{err}</div>
  if (f.type === 'tel') return <div><label htmlFor={f.name}>{f.label}{f.required && ' *'}</label><input type="tel" id={f.name} value={model[f.name]||''} onChange={e=>onChange(f.name, e.target.value)} />{err}</div>
  return <div><label htmlFor={f.name}>{f.label}{f.required && ' *'}</label><input id={f.name} value={model[f.name]||''} onChange={e=>onChange(f.name, e.target.value)} placeholder={f.placeholder||''}/>{err}</div>
}

const DS160_SECTIONS = [
  { group:'Personal', title:'Personal Information 1', id:'pi1', fields:[
    { type:'text', name:'surname', label:'Surname (as in Passport)', required:true },
    { type:'text', name:'givenNames', label:'Given Names (as in Passport)', required:true },
    { type:'text', name:'nativeFullName', label:'Full Name in Native Alphabet' },
    { type:'select', name:'otherNamesUsed', label:'Have you ever used other names?', options:['Yes','No'] },
    { type:'select', name:'sex', label:'Sex', options:['Male','Female','Other'], required:true },
    { type:'select', name:'maritalStatus', label:'Marital Status', options:['Single','Married','Common Law Marriage','Civil Union/Domestic Partnership','Divorced','Legally Separated','Widowed'], required:true },
    { type:'text', name:'nationalID', label:'National Identification Number' },
    { type:'text', name:'usSSN', label:'U.S. Social Security Number' },
    { type:'text', name:'usTaxpayerID', label:'U.S. Taxpayer ID Number' },
  ]},
  { group:'Personal', title:'Personal Information 2', id:'pi2', fields:[
    { type:'date', name:'dob', label:'Date of Birth', required:true },
    { type:'text', name:'birthCity', label:'City of Birth', required:true },
    { type:'text', name:'birthState', label:'State/Province of Birth' },
    { type:'select', name:'birthCountry', label:'Country/Region of Birth', options: COUNTRIES, required:true },
    { type:'select', name:'nationality', label:'Nationality', options: COUNTRIES, required:true },
    { type:'select', name:'otherNationalityYN', label:'Do you hold/have held any other nationality?', options:['Yes','No'] },
    { type:'textarea', name:'languages', label:'Languages You Speak (one per line)' },
  ]},
  { group:'Contact', title:'Address & Contact (Current)', id:'contact1', fields:[
    { type:'text', name:'homeStreet', label:'Home Street Address', required:true },
    { type:'text', name:'homeCity', label:'City', required:true },
    { type:'text', name:'homeState', label:'State/Province' },
    { type:'text', name:'homePostal', label:'Postal Code' },
    { type:'select', name:'homeCountry', label:'Country', options: COUNTRIES, required:true },
    { type:'select', name:'mailingSame', label:'Is your mailing address the same as your home address?', options:['Yes','No'] },
    { type:'textarea', name:'mailingAddress', label:'Mailing Address', showIf:{ name:'mailingSame', in:['No'] } },
    { type:'tel', name:'primaryPhone', label:'Primary Phone Number' },
    { type:'tel', name:'secondaryPhone', label:'Secondary Phone Number' },
    { type:'email', name:'email', label:'Primary Email Address' },
    { type:'email', name:'email2', label:'Other Email Address' },
    { type:'textarea', name:'socialMedia', label:'Social Media (Platform — @username, one per line)' },
  ]},
  { group:'Passport', title:'Passport / Travel Document', id:'passport', fields:[
    { type:'select', name:'passportType', label:'Passport Type', options:['Regular','Official','Diplomatic','Other'] },
    { type:'text', name:'passportNumber', label:'Passport Number', required:true },
    { type:'text', name:'passportBookNumber', label:'Passport Book Number' },
    { type:'select', name:'passportIssuingCountry', label:'Issuing Country/Authority', options: COUNTRIES, required:true },
    { type:'text', name:'passportIssueCity', label:'City of Issuance', required:true },
    { type:'select', name:'passportIssueCountry', label:'Country of Issuance', options: COUNTRIES, required:true },
    { type:'date', name:'passportIssueDate', label:'Issue Date', required:true },
    { type:'date', name:'passportExpiryDate', label:'Expiration Date', required:true },
    { type:'select', name:'otherPassportYN', label:'Do you have other passports/travel documents?', options:['Yes','No'] },
    { type:'textarea', name:'otherPassports', label:'Other Passport/Travel Docs', showIf:{ name:'otherPassportYN', in:['Yes'] } },
    { type:'select', name:'lostStolenYN', label:'Lost or stolen passport before?', options:['Yes','No'] },
    { type:'textarea', name:'lostStolenExplain', label:'Explain lost/stolen', showIf:{ name:'lostStolenYN', in:['Yes'] } },
  ]},
  { group:'Travel', title:'Previous U.S. Travel', id:'travel', fields:[
    { type:'select', name:'beenToUS', label:'Have you ever been to the U.S.?', options:['Yes','No'] },
    { type:'text', name:'lastUSVisitDates', label:'Dates of Last U.S. Visit', showIf:{ name:'beenToUS', in:['Yes'] }, placeholder:'e.g., Jan 2020 - Mar 2020' },
    { type:'select', name:'overstayed', label:'Have you ever overstayed a U.S. visa?', options:['Yes','No'], showIf:{ name:'beenToUS', in:['Yes'] } },
    { type:'select', name:'usVisaIssued', label:'Has a U.S. visa ever been issued to you?', options:['Yes','No'] },
    { type:'text', name:'visaNumber', label:'Most Recent Visa Number', showIf:{ name:'usVisaIssued', in:['Yes'] } },
    { type:'select', name:'visaRefused', label:'Has a U.S. visa ever been refused to you?', options:['Yes','No'] },
    { type:'textarea', name:'visaRefusedExplain', label:'Explain Refusal', showIf:{ name:'visaRefused', in:['Yes'] } },
    { type:'text', name:'i94Number', label:'Most Recent I-94 Number (if known)' },
  ]},
  { group:'US Contact', title:'U.S. Point of Contact', id:'uscontact', fields:[
    { type:'text', name:'usContactName', label:'Contact Person (or Org)' },
    { type:'text', name:'usContactOrg', label:'Organization (if applicable)' },
    { type:'select', name:'usContactRelationship', label:'Relationship to You', options:['Relative','Friend','Business Associate','School Official','Other'] },
    { type:'tel', name:'usContactPhone', label:'Phone Number' },
    { type:'email', name:'usContactEmail', label:'Email' },
    { type:'textarea', name:'usContactAddress', label:'Contact Address' },
  ]},
  { group:'Family', title:'Family (Relatives / Spouse / Children)', id:'family', fields:[
    { type:'text', name:'fatherSurname', label:"Father's Surname" },
    { type:'text', name:'fatherGiven', label:"Father's Given Name" },
    { type:'text', name:'motherSurname', label:"Mother's Surname" },
    { type:'text', name:'motherGiven', label:"Mother's Given Name" },
    { type:'select', name:'hasSpouse', label:'Do you have a spouse?', options:['Yes','No'] },
    { type:'text', name:'spouseName', label:'Spouse Full Name', showIf:{ name:'hasSpouse', in:['Yes'] } },
    { type:'date', name:'spouseDOB', label:"Spouse's Date of Birth", showIf:{ name:'hasSpouse', in:['Yes'] } },
    { type:'select', name:'spouseNationality', label:"Spouse's Nationality", options: COUNTRIES, showIf:{ name:'hasSpouse', in:['Yes'] } },
    { type:'select', name:'hasChildren', label:'Do you have children?', options:['Yes','No'] },
    { type:'textarea', name:'childrenNames', label:'Children Names (one per line)', showIf:{ name:'hasChildren', in:['Yes'] } },
  ]},
  { group:'Work', title:'Work / Education / Training', id:'work', fields:[
    { type:'select', name:'primaryOccupation', label:'Primary Occupation', options:['Student','Employed','Self-Employed','Retired','Unemployed'], required:true },
    { type:'text', name:'currentEmployer', label:'Present Employer or School' },
    { type:'textarea', name:'employerAddress', label:'Employer/School Address' },
    { type:'tel', name:'employerPhone', label:'Employer/School Phone' },
    { type:'text', name:'jobTitle', label:'Job Title/Position' },
    { type:'text', name:'monthlySalary', label:'Monthly Salary (USD)' },
    { type:'date', name:'employmentStartDate', label:'Start Date' },
    { type:'text', name:'previousEmployer', label:'Previous Employer (if recently changed)' },
  ]},
  { group:'Security', title:'Security & Background (26 Questions)', id:'security', fields:[
    ...SEC_QUESTIONS.map((q,i)=>({ type:'select', name:`sec_${i+1}`, label:`${i+1}. ${q}`, options:['Yes','No'], required:true })),
    ...SEC_QUESTIONS.map((q,i)=>({ type:'textarea', name:`sec_${i+1}_explain`, label:`Explain your "Yes" answer`, showIf:{ name:`sec_${i+1}`, in:['Yes'] } }))
  ]},
  { group:'Review', title:'Review & Sign', id:'review', custom:'preview' }
];

export default function AppRouter(){
  const [formType, setFormType] = useState('ds160')
  const [idx, setIdx] = useState(0)
  const [model, setModel] = useState({})
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const type = params.get('form')
    if (type === 'schengen') {
      setFormType('schengen')
      document.title = 'Schengen Visa Application'
    } else {
      setFormType('ds160')
      document.title = 'DS-160 Form'
    }
  }, [])

  const SECTIONS = formType === 'schengen' ? SCHENGEN_SECTIONS : DS160_SECTIONS
  const REQUIRED = formType === 'schengen' ? SCHENGEN_REQUIRED : DS160_REQUIRED
  const formTitle = formType === 'schengen' ? 'Schengen Visa Application' : 'DS-160 — U.S. Nonimmigrant Visa'
  const formSubtitle = formType === 'schengen' ? 'European Union Schengen Area' : 'Online Nonimmigrant Visa Application'

  const groups = useMemo(() => {
    const g = {}
    SECTIONS.forEach((s,i) => {
      if (!g[s.group]) g[s.group] = []
      g[s.group].push({ i, title: s.title, id: s.id })
    })
    return g
  }, [SECTIONS])

  const onChange = (name, value) => {
    setModel(prev => ({ ...prev, [name]: value }))
  }

  const validateSection = () => {
    const sec = SECTIONS[idx]
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
    if (idx < SECTIONS.length - 1) {
      setIdx(idx + 1)
      window.scrollTo(0, 0)
    }
  }

  const handleBack = () => {
    if (idx > 0) setIdx(idx - 1)
    window.scrollTo(0, 0)
  }

  const handleFinalSubmit = async () => {
    try {
      const payload = {
        formType,
        createdAt: new Date().toISOString(),
        data: model
      }
      const result = await uploadToGoogleDrive(payload, `${formType}-submission.json`)
      alert(`Form submitted successfully! File ID: ${result.fileId || result.id}`)
    } catch (err) {
      alert(`Submission error: ${err.message}`)
    }
  }

  const currentSection = SECTIONS[idx]

  if (currentSection.custom === 'preview') {
    return <PreviewPage 
      model={model} 
      sections={SECTIONS}
      onBack={handleBack}
      onSubmit={handleFinalSubmit}
      formTitle={formTitle}
    />
  }

  const gridClass = (currentSection.id === 'pi1' || currentSection.id === 'applicant' || currentSection.id === 'trip') ? 'grid grid-3' : 'grid grid-2'

  return (
    <>
      <header>
        <h1>{formTitle}</h1>
        <div className="sub">{formSubtitle}</div>
      </header>

      <TopTabs groups={groups} sections={SECTIONS} idx={idx} setIdx={setIdx} />

      <main className="layout">
        <LeftStepper groups={groups} sections={SECTIONS} idx={idx} setIdx={setIdx} />

        <div className="formwrap">
          <div className="card">
            <h2>{currentSection.title}</h2>
            {currentSection.fields && (
              <div className={gridClass}>
                {currentSection.fields.map(f => (
                  <Field key={f.name} f={f} model={model} onChange={onChange} />
                ))}
              </div>
            )}
          </div>

          <div className="toolbar">
            {idx > 0 && <button className="btn" onClick={handleBack}>Back</button>}
            {idx < SECTIONS.length - 1 && <button className="btn primary" onClick={handleNext}>Next</button>}
          </div>
        </div>
      </main>
    </>
  )
}
