import React from 'react'

export default function ReviewPage({ model, sections, onBack, onSubmit, isSubmitting }) {
  const renderValue = (value) => {
    if (value === null || value === undefined || value === '') return <span style={{color: '#9ca3af'}}>Not provided</span>
    if (value === true || value === 'Yes') return <span style={{color: '#059669', fontWeight: '600'}}>Yes</span>
    if (value === false || value === 'No') return <span style={{color: '#dc2626', fontWeight: '600'}}>No</span>
    return value
  }

  const renderSection = (section) => {
    if (!section.fields) return null
    
    const visibleFields = section.fields.filter(f => {
      if (!f.showIf) return true
      return f.showIf.in.includes(String(model[f.showIf.name] || ''))
    })

    if (visibleFields.length === 0) return null

    return (
      <div key={section.id} style={{
        marginBottom: '2rem',
        padding: '1.5rem',
        backgroundColor: '#f9fafb',
        border: '1px solid #e5e7eb',
        borderRadius: '8px'
      }}>
        <h3 style={{
          marginTop: 0,
          marginBottom: '1rem',
          color: '#1f2937',
          fontSize: '1.25rem',
          borderBottom: '2px solid #3b82f6',
          paddingBottom: '0.5rem'
        }}>
          {section.title}
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1rem'
        }}>
          {visibleFields.map(field => (
            <div key={field.name} style={{
              padding: '0.75rem',
              backgroundColor: '#fff',
              borderRadius: '6px',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{
                fontSize: '0.875rem',
                color: '#6b7280',
                marginBottom: '0.25rem',
                fontWeight: '500'
              }}>
                {field.label}
              </div>
              <div style={{
                fontSize: '1rem',
                color: '#111827',
                wordBreak: 'break-word'
              }}>
                {renderValue(model[field.name])}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div style={{maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem'}}>
      <div style={{
        backgroundColor: '#fff',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        padding: '2rem'
      }}>
        <div style={{
          textAlign: 'center',
          marginBottom: '2rem',
          paddingBottom: '1.5rem',
          borderBottom: '3px solid #3b82f6'
        }}>
          <h1 style={{
            fontSize: '2rem',
            color: '#1f2937',
            marginBottom: '0.5rem'
          }}>
            Review Your Application
          </h1>
          <p style={{color: '#6b7280', fontSize: '1rem'}}>
            Please review all information carefully before submitting
          </p>
        </div>

        {sections
          .filter(s => !s.custom && s.fields)
          .map(section => renderSection(section))
        }

        <div style={{
          marginTop: '2rem',
          padding: '1rem',
          backgroundColor: '#fef3c7',
          border: '2px solid #f59e0b',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <strong>⚠️ Important:</strong> By clicking "Submit Application" below, you confirm that all information provided is accurate and complete.
        </div>

        <div style={{
          marginTop: '2rem',
          display: 'flex',
          gap: '1rem',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <button 
            className="btn"
            onClick={onBack}
            style={{minWidth: '150px'}}
            disabled={isSubmitting}
          >
            ← Back to Edit
          </button>
          <button 
            className="btn success"
            onClick={onSubmit}
            style={{minWidth: '150px', fontSize: '1.1rem', padding: '0.75rem 2rem'}}
            disabled={isSubmitting}
          >
            ✓ Submit Application
          </button>
        </div>
      </div>
    </div>
  )
}
