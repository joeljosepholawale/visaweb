import React, { useState } from 'react'
import './InfoTooltip.css'

export default function InfoTooltip({ text }) {
  const [show, setShow] = useState(false)
  
  if (!text) return null
  
  return (
    <span className="info-tooltip-wrapper">
      <button
        type="button"
        className="info-icon"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
        aria-label="More information"
      >
        ℹ️
      </button>
      {show && (
        <div className="info-tooltip-content">
          {text}
        </div>
      )}
    </span>
  )
}
