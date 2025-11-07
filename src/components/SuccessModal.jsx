import React from 'react'

export default function SuccessModal({ show, onClose, formName = 'Application' }) {
  if (!show) return null

  const gradient = 'linear-gradient(135deg, #10b981 0%, #059669 100%)'

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      animation: 'fadeIn 0.3s ease-out'
    }}>
      <div style={{
        background: '#fff',
        borderRadius: '24px',
        maxWidth: '500px',
        width: '90%',
        padding: '3rem 2rem',
        textAlign: 'center',
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.3)',
        animation: 'slideUp 0.4s ease-out',
        position: 'relative'
      }}>
        {/* Success Icon */}
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: gradient,
          margin: '0 auto 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'scaleIn 0.5s ease-out 0.2s backwards'
        }}>
          <svg 
            width="40" 
            height="40" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="white" 
            strokeWidth="3" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        {/* Title */}
        <h2 style={{
          fontSize: '1.75rem',
          fontWeight: '700',
          color: '#1f2937',
          marginBottom: '0.75rem',
          animation: 'fadeIn 0.5s ease-out 0.3s backwards'
        }}>
          Submission Successful!
        </h2>

        {/* Subtitle */}
        <p style={{
          fontSize: '1rem',
          color: '#6b7280',
          marginBottom: '2rem',
          lineHeight: '1.6',
          animation: 'fadeIn 0.5s ease-out 0.4s backwards'
        }}>
          Your <strong>{formName}</strong> has been successfully submitted and saved.
        </p>

        {/* Success Message */}
        <div style={{
          fontSize: '0.9rem',
          color: '#6b7280',
          lineHeight: '1.6',
          marginBottom: '2rem',
          animation: 'fadeIn 0.5s ease-out 0.6s backwards'
        }}>
          <p style={{ margin: '0.5rem 0' }}>
            ✓ Your application has been securely saved
          </p>
          <p style={{ margin: '0.5rem 0' }}>
            ✓ All attachments have been uploaded
          </p>
          <p style={{ margin: '0.5rem 0' }}>
            ✓ You will be contacted regarding next steps
          </p>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            background: gradient,
            color: '#fff',
            border: 'none',
            borderRadius: '12px',
            padding: '1rem 3rem',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            transition: 'all 0.2s ease',
            animation: 'fadeIn 0.5s ease-out 0.7s backwards',
            fontFamily: 'inherit'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-2px)'
            e.target.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.2)'
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)'
            e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)'
          }}
        >
          Close
        </button>

        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes scaleIn {
            from {
              opacity: 0;
              transform: scale(0);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
        `}</style>
      </div>
    </div>
  )
}
