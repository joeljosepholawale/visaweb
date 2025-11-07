// Auto-save and resume functionality for forms

const STORAGE_PREFIX = 'visa_form_'
const AUTO_SAVE_INTERVAL = 30000 // 30 seconds

export function saveFormData(formType, data) {
  try {
    const key = `${STORAGE_PREFIX}${formType}`
    const saveData = {
      data,
      timestamp: new Date().toISOString(),
      version: '1.0'
    }
    localStorage.setItem(key, JSON.stringify(saveData))
    return true
  } catch (err) {
    console.error('Failed to save form data:', err)
    return false
  }
}

export function loadFormData(formType) {
  try {
    const key = `${STORAGE_PREFIX}${formType}`
    const saved = localStorage.getItem(key)
    if (!saved) return null
    
    const parsed = JSON.parse(saved)
    return parsed
  } catch (err) {
    console.error('Failed to load form data:', err)
    return null
  }
}

export function clearFormData(formType) {
  try {
    const key = `${STORAGE_PREFIX}${formType}`
    localStorage.removeItem(key)
    return true
  } catch (err) {
    console.error('Failed to clear form data:', err)
    return false
  }
}

export function setupAutoSave(formType, getDataFn, interval = AUTO_SAVE_INTERVAL) {
  const timer = setInterval(() => {
    const data = getDataFn()
    if (data && Object.keys(data).length > 0) {
      saveFormData(formType, data)
    }
  }, interval)
  
  return () => clearInterval(timer)
}
