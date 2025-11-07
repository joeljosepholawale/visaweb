import React, { useRef, useState, useEffect } from 'react'

export default function SignaturePage({ model, onChange }){
  const canvasRef = useRef(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(!!model.signatureDataURL)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.strokeStyle = '#000'

    if (model.signatureDataURL) {
      const img = new Image()
      img.onload = () => {
        ctx.drawImage(img, 0, 0)
      }
      img.src = model.signatureDataURL
    }
  }, [])

  const getCoordinates = (e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    
    let clientX, clientY
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }
    
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    }
  }

  const startDrawing = (e) => {
    e.preventDefault()
    const { x, y } = getCoordinates(e)
    
    const ctx = canvasRef.current.getContext('2d')
    ctx.beginPath()
    ctx.moveTo(x, y)
    setIsDrawing(true)
  }

  const draw = (e) => {
    if (!isDrawing) return
    e.preventDefault()
    
    const { x, y } = getCoordinates(e)
    const ctx = canvasRef.current.getContext('2d')
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const stopDrawing = () => {
    if (isDrawing) {
      const canvas = canvasRef.current
      const dataURL = canvas.toDataURL('image/png')
      onChange('signatureDataURL', dataURL)
      setHasSignature(true)
    }
    setIsDrawing(false)
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    onChange('signatureDataURL', '')
    setHasSignature(false)
  }

  return (
    <div>
      <h3>Declaration</h3>
      <div style={{
        padding: '1.5rem',
        backgroundColor: '#f9fafb',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        marginBottom: '1.5rem',
        maxHeight: '400px',
        overflowY: 'auto'
      }}>
        <p style={{marginBottom: '1rem', lineHeight: '1.6', fontSize: '0.95rem'}}>
          I am aware of and consent to the following: the collection of the data required by this application form and the taking of my photograph and, if applicable, 
          the taking of fingerprints, are mandatory for the examination of the visa application; and any personal data concerning me which appear on the visa 
          application form, as well as my fingerprints and my photograph will be supplied to the relevant authorities of the Member States and processed by those 
          authorities, for the purposes of a decision on my visa application.
        </p>
        <p style={{marginBottom: '1rem', lineHeight: '1.6', fontSize: '0.95rem'}}>
          Such data as well as data concerning the decision taken on my application or a decision whether to annul, revoke or extend a visa issued will be 
          entered into, and stored in the Visa Information System (VIS) for a maximum period of five years, during which it will be accessible to the visa 
          authorities and the authorities competent for carrying out checks on visas at external borders and within the Member States, immigration and asylum 
          authorities in the Member States for the purposes of verifying whether the conditions for the legal entry into, stay and residence on the territory of the 
          Member States are fulfilled, of identifying persons who do not or who no longer fulfil these conditions, of examining an asylum application and of 
          determining responsibility for such examination. Under certain conditions the data will be also available to designated authorities of the Member States 
          and to Europol for the purpose of the prevention, detection and investigation of terrorist offences and of other serious criminal offences. The authority of 
          the Member State responsible for processing the data is the Danish Immigration Service, Ryesgade 53, DK-2100 Copenhagen Ø, Denmark, e-mail: 
          us@us.dk.
        </p>
        <p style={{marginBottom: '1rem', lineHeight: '1.6', fontSize: '0.95rem'}}>
          I am aware that I have the right to obtain in any of the Member States notification of the data relating to me recorded in the VIS and of the Member State 
          which transmitted the data, and to request that data relating to me which are inaccurate be corrected and that data relating to me processed unlawfully 
          be deleted. At my express request, the authority examining my application will inform me of the manner in which I may exercise my right to check the 
          personal data concerning me and have them corrected or deleted, including the related remedies according to the national law of the State concerned. 
          The national supervisory authority of that Member State (the Danish Data Protection Agency, Borgergade 28, 5, DK-1300 Copenhagen K, Denmark, email: dt@datatilsynet.dk) will hear claims concerning the protection of personal data.
        </p>
        <p style={{marginBottom: '1rem', lineHeight: '1.6', fontSize: '0.95rem', fontWeight: '600'}}>
          I declare that to the best of my knowledge all particulars supplied by me are correct and complete. I am aware that any false statements will lead to my 
          application being rejected or to the annulment of a visa already granted and may also render me liable to prosecution under the law of the Member 
          State which deals with the application.
        </p>
        <p style={{lineHeight: '1.6', fontSize: '0.95rem'}}>
          I undertake to leave the territory of the Member States before the expiry of the visa, if granted. I have been informed that possession of a visa is only 
          one of the prerequisites for entry into the European territory of the Member States. The mere fact that a visa has been granted to me does not mean 
          that I will be entitled to compensation if I fail to comply with the relevant provisions of Article 5(1) of Regulation (EC) No 562/2006 (Schengen Borders 
          Code) and I am therefore refused entry. The prerequisites for entry will be checked again on entry into the European territory of the Member States.
        </p>
      </div>

      <div className="grid grid-2" style={{marginBottom: '2rem'}}>
        <div>
          <label htmlFor="signaturePlace">Place *</label>
          <input 
            id="signaturePlace"
            type="text" 
            value={model.signaturePlace || ''} 
            onChange={(e) => onChange('signaturePlace', e.target.value)}
            placeholder="City, Country"
            required
          />
        </div>
        <div>
          <label htmlFor="signatureDate">Date *</label>
          <input 
            id="signatureDate"
            type="date" 
            value={model.signatureDate || ''} 
            onChange={(e) => onChange('signatureDate', e.target.value)}
            required
          />
        </div>
      </div>

      <div style={{marginBottom: '1.5rem'}}>
        <label htmlFor="isMinor">Is applicant a minor (under 18)?</label>
        <select 
          id="isMinor"
          value={model.isMinor || 'No'} 
          onChange={(e) => onChange('isMinor', e.target.value)}
        >
          <option value="No">No</option>
          <option value="Yes">Yes</option>
        </select>
      </div>

      <div style={{marginBottom: '2rem'}}>
        <label style={{fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.5rem', display: 'block'}}>
          {model.isMinor === 'Yes' 
            ? 'Signature of Parental Authority / Legal Guardian *' 
            : 'Signature of Applicant *'}
        </label>
        <p style={{color: '#6b7280', marginBottom: '1rem'}}>
          Please sign in the box below using your mouse or touchscreen
        </p>
        <div style={{
          border: '2px solid #d1d5db',
          borderRadius: '8px',
          backgroundColor: '#fff',
          maxWidth: '100%',
          overflow: 'hidden'
        }}>
          <canvas
            ref={canvasRef}
            width={600}
            height={200}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            style={{
              cursor: 'crosshair',
              display: 'block',
              touchAction: 'none',
              width: '100%',
              maxWidth: '600px',
              height: 'auto'
            }}
          />
        </div>
        <div style={{marginTop: '1rem'}}>
          <button 
            type="button"
            className="btn" 
            onClick={clearSignature}
          >
            Clear Signature
          </button>
          {!hasSignature && (
            <span style={{marginLeft: '1rem', color: '#dc2626', fontWeight: '600'}}>
              * Signature is required
            </span>
          )}
        </div>
      </div>

      {model.isMinor === 'Yes' && (
        <div style={{
          padding: '1rem',
          backgroundColor: '#fef3c7',
          border: '1px solid #fbbf24',
          borderRadius: '8px',
          marginTop: '1rem'
        }}>
          <strong>Note:</strong> For applicants under 18 years of age, the signature must be provided by 
          a parent or legal guardian. Supporting documentation proving guardianship may be required.
        </div>
      )}
    </div>
  )
}
