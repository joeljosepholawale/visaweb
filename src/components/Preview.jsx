import React from 'react'

export default function Preview({ model, signatureDataUrl }){
  const entries = Object.entries(model).filter(([k,v])=>typeof v==='string' && v.trim()!=='' )

  return (
    <div className="card">
      <h2>Review Your Information</h2>
      <p className="help">Please confirm your entries before submitting. Use Back to edit any section.</p>
      <table className="preview-table">
        <tbody>
          {entries.map(([k,v]) => (
            <tr key={k}>
              <th>{k}</th>
              <td>{v}</td>
            </tr>
          ))}
          {signatureDataUrl && (
            <tr>
              <th>Electronic Signature</th>
              <td><img src={signatureDataUrl} alt="signature" style={{maxWidth:'420px', border:'1px solid #e5e7eb', borderRadius:8}}/></td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}