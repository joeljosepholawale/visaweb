import React, { useState } from 'react'

export default function PhotoUpload({ model, onChange }){
  const [preview, setPreview] = useState(model.photoDataURL || null)

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (JPG, PNG, etc.)')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const dataURL = event.target.result
      setPreview(dataURL)
      onChange('photoDataURL', dataURL)
      onChange('photoFileName', file.name)
    }
    reader.readAsDataURL(file)
  }

  const handleRemove = () => {
    setPreview(null)
    onChange('photoDataURL', '')
    onChange('photoFileName', '')
  }

  return (
    <div style={{maxWidth: '600px'}}>
      <h3>Passport Photo Upload</h3>
      <p style={{marginBottom: '1.5rem', color: '#6b7280'}}>
        Please upload a recent passport-style photograph. Requirements:
      </p>
      <ul style={{marginBottom: '1.5rem', paddingLeft: '1.5rem', color: '#6b7280'}}>
        <li>Taken within the last 6 months</li>
        <li>White or light-colored background</li>
        <li>Full face view, looking directly at camera</li>
        <li>No glasses, hats, or head coverings (except religious)</li>
        <li>File format: JPG, PNG (max 5MB)</li>
      </ul>

      {preview ? (
        <div style={{textAlign: 'center'}}>
          <div style={{
            display: 'inline-block',
            border: '2px solid #e5e7eb',
            borderRadius: '8px',
            padding: '1rem',
            backgroundColor: '#f9fafb'
          }}>
            <img 
              src={preview} 
              alt="Passport photo preview" 
              style={{
                maxWidth: '300px',
                maxHeight: '400px',
                borderRadius: '4px',
                display: 'block'
              }}
            />
          </div>
          <div style={{marginTop: '1rem'}}>
            <button 
              type="button"
              className="btn" 
              onClick={handleRemove}
              style={{marginRight: '0.5rem'}}
            >
              Remove Photo
            </button>
            <label className="btn primary" style={{cursor: 'pointer'}}>
              Change Photo
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleFileChange}
                style={{display: 'none'}}
              />
            </label>
          </div>
        </div>
      ) : (
        <div style={{textAlign: 'center'}}>
          <label 
            className="btn primary" 
            style={{
              cursor: 'pointer',
              display: 'inline-block',
              padding: '1rem 2rem',
              fontSize: '1.1rem'
            }}
          >
            📷 Upload Photo
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleFileChange}
              style={{display: 'none'}}
            />
          </label>
        </div>
      )}
    </div>
  )
}
