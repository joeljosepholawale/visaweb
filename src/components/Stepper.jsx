import React, { useState } from 'react'

export function LeftStepper({ groups, currentIndex, goToIndex, navOpen = false, isSectionComplete = () => false }){
  const [expandedGroups, setExpandedGroups] = useState(() => {
    // Initially expand all groups
    return Object.keys(groups).reduce((acc, key) => ({ ...acc, [key]: true }), {})
  })

  const toggleGroup = (groupName) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }))
  }

  return (
    <nav className={`steplist ${navOpen ? 'nav-open' : ''}`}>
      <button
        onClick={() => window.location.href = '/index.html'}
        style={{
          width: '100%',
          padding: '12px',
          marginBottom: '16px',
          background: 'linear-gradient(135deg, #0b3d91 0%, #08326f 100%)',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: '600',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          transition: 'all 0.2s ease',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}
        onMouseEnter={(e) => {
          e.target.style.transform = 'translateY(-2px)'
          e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)'
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'translateY(0)'
          e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)'
        }}
      >
        <span style={{ fontSize: '16px' }}>←</span>
        <span>Back to Home</span>
      </button>
      <h3>Sections</h3>
      <div>
        {Object.entries(groups).map(([g, items]) => (
          <div className="group" key={g}>
            <div 
              className="group-title collapsible" 
              onClick={() => toggleGroup(g)}
              style={{ cursor: 'pointer', userSelect: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <span>{g}</span>
              <span style={{ fontSize: '14px', fontWeight: 'bold', transition: 'transform 0.2s', transform: expandedGroups[g] ? 'rotate(90deg)' : 'rotate(0deg)' }}>›</span>
            </div>
            <div 
              className="group-items"
              style={{
                maxHeight: expandedGroups[g] ? '1000px' : '0',
                overflow: 'hidden',
                transition: 'max-height 0.3s ease'
              }}
            >
              {items.map(it => (
                <button 
                  key={it.i} 
                  className={currentIndex===it.i?'active':''} 
                  onClick={(e)=>{e.preventDefault();goToIndex(it.i)}}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <span>{it.title}</span>
                  {isSectionComplete(it.i) && (
                    <span className="complete-check" title="Section completed">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </nav>
  )
}

export function TopTabs({ groups, currentGroup, goToGroup, isGroupComplete = () => false }){
  return (
    <div className="top-tabs"><div className="wrap">
      {Object.keys(groups).map(g => (
        <button 
          key={g} 
          className={`tab ${currentGroup===g?'active':''} ${isGroupComplete(g)?'completed':''}`} 
          onClick={(e)=>{e.preventDefault();goToGroup(g)}}
        >
          {g}
          {isGroupComplete(g) && <span className="tab-check">✓</span>}
        </button>
      ))}
    </div></div>
  )
}
