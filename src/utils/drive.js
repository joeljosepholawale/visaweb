// Google Drive API configuration
// REPLACE WITH YOUR WEB APP URL FROM STEP 2
// Instructions: See GOOGLE_APPS_SCRIPT_SETUP.md in the project root
const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz6U8yU2euZPFfYhe4ANfbIak3RK1B_LIGHDXKPVK5lGgsfWLE2UJOhma2mQdCMl3o-/exec'

/**
 * Upload DS-160 form data to Google Drive via Google Apps Script
 * You need to deploy a Google Apps Script Web App with doPost function
 */
export async function uploadToGoogleDrive(payload){
  let formPrefix = 'USimmigrant'
  if (payload.formType === 'schengen') formPrefix = 'SCHENGEN'
  else if (payload.formType === 'canada') formPrefix = 'CANADA'
  else if (payload.formType === 'ds160' || payload.formType === 'nonimmigrant') formPrefix = 'DS160'
  
  const fileName = `${formPrefix}_${payload.applicantName || 'Application'}_${new Date().toISOString().split('T')[0]}.json`
  
  const fullPayload = {
    ...payload,
    fileName,
    timestamp: new Date().toISOString()
  }

  try {
    // If you have deployed Google Apps Script, use this:
    if (GOOGLE_APPS_SCRIPT_URL && GOOGLE_APPS_SCRIPT_URL !== 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE'){
      console.log('Uploading to Google Apps Script:', GOOGLE_APPS_SCRIPT_URL);

      const res = await fetch(GOOGLE_APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors', // Google Apps Script requires no-cors
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullPayload)
      })

      console.log('Upload response status:', res.status);
      console.log('Upload completed successfully');

      return {
        success: true,
        fileId: 'uploaded',
        fileName,
        method: 'google-apps-script'
      }
    }
    
    // Fallback: Download as JSON file locally
    const blob = new Blob([JSON.stringify(fullPayload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    a.click()
    URL.revokeObjectURL(url)
    
    return {
      success: true,
      fileId: 'local-download',
      fileName,
      method: 'local-download',
      message: 'File downloaded locally. Configure Google Apps Script to upload to Drive automatically.'
    }
  } catch (err){
    console.error('Upload error:', err)
    throw new Error('Failed to upload to Google Drive: ' + err.message)
  }
}