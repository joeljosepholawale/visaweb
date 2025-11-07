import React, { useMemo, useState, useEffect } from 'react'
import { LeftStepper, TopTabs } from './components/Stepper.jsx'
import PreviewPage from './components/PreviewPage.jsx'
import ReviewPage from './components/ReviewPage.jsx'
import SuccessModal from './components/SuccessModal.jsx'
import InfoTooltip from './components/InfoTooltip.jsx'
import { SCHENGEN_SECTIONS, SCHENGEN_REQUIRED } from './forms/schengen/sections.js'
import { SCHENGEN_HELP } from './data/schengenHelpText.js'
import { uploadToGoogleDrive } from './utils/drive.js'
import { validatePhone, validateNIN, validatePhoneMatch, validateNINMatch, formatPhone, formatNIN } from './utils/validation.js'
import { saveFormData, loadFormData, clearFormData, setupAutoSave } from './utils/formStorage.js'

function Field({ f, model, onChange, fieldErrors }){
  const hidden = f.showIf && !f.showIf.in.includes(String(model[f.showIf.name] || ''))
  if (hidden) return null

  const helpText = SCHENGEN_HELP[f.name]
  const err = fieldErrors[f.name] || f.error
  const errorEl = err ? <div className="error">{err}</div> : null

  const handleChange = (value) => {
    let processedValue = value
    if (f.type === 'tel') {
      processedValue = formatPhone(value)
    } else if (f.name === 'nationalIDNumber') {
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
      {(f.options||[]).map(o => <option key={o} value={o}>{o}</option>)}
    </select>{errorEl}</div>
  if (f.type === 'date') return <div>{labelEl}<input type="date" {...inputProps} />{errorEl}</div>
  if (f.type === 'email') return <div>{labelEl}<input type="email" {...inputProps} />{errorEl}</div>
  if (f.type === 'number') return <div>{labelEl}<input type="number" {...inputProps} />{errorEl}</div>
  if (f.type === 'tel') return <div>{labelEl}<input type="tel" {...inputProps} maxLength="11" placeholder="11 digits" />{errorEl}</div>
  return <div>{labelEl}<input {...inputProps} placeholder={f.placeholder||''}/>{errorEl}</div>
}

export default function SchengenApp(){
  const [idx, setIdx] = useState(0)
  const [model, setModel] = useState({})
  const [fieldErrors, setFieldErrors] = useState({})
  const [showSuccess, setShowSuccess] = useState(false)
  const [submissionResult, setSubmissionResult] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showResumePrompt, setShowResumePrompt] = useState(false)
  const [navOpen, setNavOpen] = useState(false)

  const groups = useMemo(() => {
    const g = {}
    SCHENGEN_SECTIONS.forEach((s,i) => {
      if (!g[s.group]) g[s.group] = []
      g[s.group].push({ i, title: s.title, id: s.id })
    })
    return g
  }, [])

  const currentGroup = useMemo(() => {
    return SCHENGEN_SECTIONS[idx]?.group || Object.keys(groups)[0]
  }, [idx, groups])

  // Check if a section is completed (all required fields filled)
  function isSectionComplete(sectionIndex) {
    const section = SCHENGEN_SECTIONS[sectionIndex]
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
    const sections = SCHENGEN_SECTIONS.filter(s => s.custom !== 'review' && s.custom !== 'preview')
    const total = sections.length
    const completed = SCHENGEN_SECTIONS.filter((s, i) => 
      s.custom !== 'review' && s.custom !== 'preview' && isSectionComplete(i)
    ).length
    const percentage = Math.round((completed / total) * 100)
    return { completed, total, percentage }
  }, [model])

  useEffect(() => {
    const saved = loadFormData('schengen')
    if (saved && Object.keys(saved.data).length > 0) {
      setShowResumePrompt(true)
    }
  }, [])

  useEffect(() => {
    const cleanup = setupAutoSave('schengen', () => model)
    return cleanup
  }, [model])

  const handleResume = () => {
    const saved = loadFormData('schengen')
    if (saved) {
      setModel(saved.data)
      setShowResumePrompt(false)
      alert(`✅ Form restored from ${new Date(saved.timestamp).toLocaleString()}`)
    }
  }

  const handleStartFresh = () => {
    clearFormData('schengen')
    setShowResumePrompt(false)
  }

  const handleManualSave = () => {
    const success = saveFormData('schengen', model)
    if (success) {
      alert('✅ Form progress saved successfully!')
    } else {
      alert('❌ Failed to save form. Please try again.')
    }
  }

  const onChange = (name, value) => {
    setModel(prev => ({ ...prev, [name]: value }))
    setFieldErrors(prev => ({ ...prev, [name]: undefined }))
    
    // Real-time validation for confirmation fields
    const newModel = {...model, [name]: value}
    
    // Validate phone confirmations
    if (name === 'phoneConfirm' || name === 'phone') {
      const matchErr = validatePhoneMatch(newModel.phone, newModel.phoneConfirm)
      if (matchErr) {
        setFieldErrors(prev => ({...prev, phoneConfirm: matchErr}))
      } else {
        setFieldErrors(prev => ({...prev, phoneConfirm: undefined}))
      }
    }
    
    // Validate NIN confirmation
    if (name === 'nationalIdNumberConfirm' || name === 'nationalIdNumber') {
      const matchErr = validateNINMatch(newModel.nationalIdNumber, newModel.nationalIdNumberConfirm)
      if (matchErr) {
        setFieldErrors(prev => ({...prev, nationalIdNumberConfirm: matchErr}))
      } else {
        setFieldErrors(prev => ({...prev, nationalIdNumberConfirm: undefined}))
      }
    }
  }

  const validateSection = () => {
    const sec = SCHENGEN_SECTIONS[idx]
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
    if (idx < SCHENGEN_SECTIONS.length - 1) {
      setIdx(idx + 1)
      window.scrollTo(0, 0)
    }
  }

  const handleBack = () => {
    if (idx > 0) setIdx(idx - 1)
    window.scrollTo(0, 0)
  }

  const handleFinalSubmit = async () => {
    setIsSubmitting(true)
    try {
      const payload = {
        formType: 'schengen',
        applicantName: `${model.firstName || ''} ${model.surname || ''}`.trim(),
        createdAt: new Date().toISOString(),
        data: model
      }
      const result = await uploadToGoogleDrive(payload)
      setSubmissionResult(result)
      setIsSubmitting(false)
      setShowSuccess(true)
    } catch (err) {
      setIsSubmitting(false)
      alert(`❌ Submission error: ${err.message}\n\nPlease try again.`)
      console.error('Submit error:', err)
    }
  }

  const handleSuccessClose = () => {
    setShowSuccess(false)
    setSubmissionResult(null)
    setModel({})
    setIdx(0)
  }

  const currentSection = SCHENGEN_SECTIONS[idx]

  if (currentSection.custom === 'preview') {
    return (
      <>
        <SuccessModal 
          show={showSuccess}
          formName="Schengen Visa Application"
          onClose={handleSuccessClose}
        />

        <PreviewPage 
          model={model} 
          sections={SCHENGEN_SECTIONS}
          onBack={handleBack}
          onSubmit={handleFinalSubmit}
          formTitle="Schengen Visa Application"
          isSubmitting={isSubmitting}
        />
      </>
    )
  }

  if (currentSection.custom === 'review') {
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
              border: '8px solid #10b981',
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
          formName="Schengen Visa Application"
          onClose={handleSuccessClose}
        />

        <ReviewPage 
          model={model}
          sections={SCHENGEN_SECTIONS}
          onBack={handleBack}
          onSubmit={handleFinalSubmit}
          isSubmitting={isSubmitting}
        />
      </>
    )
  }

  const gridClass = (currentSection.id === 'applicant' || currentSection.id === 'trip') ? 'grid grid-3' : 'grid grid-2'

  const goToGroup = (groupName) => {
    const firstInGroup = groups[groupName]?.[0]?.i
    if (firstInGroup !== undefined) setIdx(firstInGroup)
  }

  function handleNavSelect(i) {
    setIdx(i)
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
            border: '8px solid #10b981',
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
        formName="Schengen Visa Application"
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
              <h1>Schengen Visa Application</h1>
              <div className="sub">European Union Schengen Area</div>
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
            {idx < SCHENGEN_SECTIONS.length - 1 && (
              <button className="btn primary" onClick={handleNext}>Next</button>
            )}
          </div>
        </div>
      </main>
    </>
  )
}
