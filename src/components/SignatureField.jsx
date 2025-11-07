import React, { useRef, useEffect } from 'react'
import SignatureCanvas from 'react-signature-canvas'

export default function SignatureField({ value, onChange }){
  const ref = useRef(null)

  function clearSig(){
    ref.current?.clear()
    onChange(null)
  }
  function exportSig(){
    if (!ref.current) return
    const empty = ref.current.isEmpty()
    if (empty) return onChange(null)
    const dataUrl = ref.current.getTrimmedCanvas().toDataURL('image/png')
    onChange(dataUrl)
  }

  useEffect(()=>{
    const node = ref.current
    if (!node) return
    const handler = () => exportSig()
    node.onEnd = handler
    return () => { node.onEnd = null }
  }, [])

  return (
    <div className="signature-box">
      <SignatureCanvas
        ref={ref}
        penColor="#111827"
        canvasProps={{ width: 500, height: 170, style:{ width:'100%', height:'170px', borderRadius: '8px', background:'#fff' } }}
      />
      <div className="signature-actions">
        <button className="btn" type="button" onClick={clearSig}>Clear</button>
        <span className="small">Sign using mouse or touch. <span className="kbd">Tip:</span> write slowly for best quality.</span>
      </div>
      {value && <div style={{marginTop:8}}><span className="badge">Captured</span></div>}
    </div>
  )
}