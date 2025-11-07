# Quick Guide: Update Google Apps Script URL

## ✅ YES - Update Source, Then Build (Correct Way)

### Step-by-Step:

1. **Update the source file:**
   - Open: `src/utils/drive.js`
   - Find line 3
   - Replace with your Google Apps Script deployment URL:
   ```javascript
   const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec'
   ```

2. **Build the project:**
   ```bash
   npm run build
   ```

3. **Upload to cPanel:**
   - Upload everything from `dist` folder
   - Done! The URL is already in the JavaScript files

---

## ❌ NO - Don't Edit Dist Files Manually

**Why?** 
- The dist folder is auto-generated
- Your changes will be lost next time you build
- Hard to find the right file (JavaScript is bundled and minified)

**Always update `src/utils/drive.js` first, then rebuild!**

---

## 📍 Current Script URL Location

File: `src/utils/drive.js` (line 3)

Current value:
```javascript
const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwcgA4aTDi34tGjNnmxQTZyxICC4cKuMHZg1LrvwwTcdKD1YiZ3ftm_a1fYv7qnwBum/exec'
```

If this is already your correct URL, you're good to go!
If not, update it and run `npm run build` again.
