# Deployment Guide for cPanel

## ✅ To Answer Your Questions:

### 1. Will refresh cause 404 errors?
**NO** - Your app won't show 404 errors because:
- Each form has its own HTML file (index.html, onlineapplication.html, schengen.html)
- No client-side routing that needs special server configuration
- The .htaccess file is included for optimization

### 2. Do I need to edit dist after building?
**NO** - Once you update the Google Apps Script URL in `src/utils/drive.js` and run `npm run build`:
- The URL gets bundled into the JavaScript files automatically
- You don't need to edit anything in the `dist` folder
- Just upload the entire `dist` folder contents as-is

---

## 📋 Pre-Upload Checklist

### Step 1: Update Google Apps Script URL
1. Deploy your Google Apps Script from `UPDATED_GOOGLE_APPS_SCRIPT.js`
2. Copy the deployment URL
3. Open `src/utils/drive.js`
4. Replace line 3 with your URL:
   ```javascript
   const GOOGLE_APPS_SCRIPT_URL = 'YOUR_DEPLOYMENT_URL_HERE'
   ```

### Step 2: Build the Project
```bash
npm run build
```

### Step 3: Verify Build
Check that these files exist in the `dist` folder:
- ✓ index.html (homepage)
- ✓ onlineapplication.html (Nonimmigrant form)
- ✓ schengen.html (Schengen form)
- ✓ assets/ folder (CSS and JS files)
- ✓ .htaccess (performance optimization)

---

## 🚀 Upload to cPanel

### Method 1: File Manager (Recommended)
1. Login to your cPanel
2. Open **File Manager**
3. Navigate to `public_html` (or your domain's root directory)
4. Click **Upload** button
5. Select ALL files from your `dist` folder:
   - index.html
   - onlineapplication.html
   - schengen.html
   - assets/ (entire folder)
   - .htaccess
6. Wait for upload to complete
7. Done! Visit your domain to test

### Method 2: FTP Client (FileZilla)
1. Open FileZilla or any FTP client
2. Connect using your cPanel FTP credentials:
   - Host: your-domain.com or ftp.your-domain.com
   - Username: your cPanel username
   - Password: your cPanel password
   - Port: 21
3. Navigate to `public_html` on the server
4. Drag all files from `dist` folder to the server
5. Done! Visit your domain to test

---

## 🔗 Your Site URLs

After upload, your forms will be accessible at:
- Homepage: `https://your-domain.com/`
- Nonimmigrant Form: `https://your-domain.com/onlineapplication.html`
- Schengen Form: `https://your-domain.com/schengen.html`

---

## ⚙️ What Each File Does

| File | Purpose |
|------|---------|
| `index.html` | Homepage with form selection buttons |
| `onlineapplication.html` | U.S. Nonimmigrant Visa application form |
| `schengen.html` | Schengen Visa application form |
| `assets/*.css` | Styling for all pages |
| `assets/*.js` | Form logic and Google Drive integration |
| `.htaccess` | Server configuration for performance & security |

---

## 🧪 Testing After Upload

1. **Test Homepage**
   - Visit your domain
   - Check if both buttons appear
   - Click each button to verify forms load

2. **Test Form Submission**
   - Fill out a test form
   - Submit and verify Google Drive receives the data
   - Check that success modal appears
   - Verify no console errors (F12 → Console)

3. **Test Refresh**
   - While on any page, press F5 or Ctrl+R
   - Page should reload without 404 error

---

## 🛠️ Troubleshooting

### Forms not loading CSS/JS
**Solution:** Check file paths in browser console (F12). If files aren't found, ensure the `assets` folder uploaded correctly.

### Google Drive submission not working
**Solution:** 
1. Verify your Google Apps Script is deployed as "Web app"
2. Check the deployment URL is correct in `src/utils/drive.js`
3. Rebuild: `npm run build`
4. Re-upload dist folder

### 500 Internal Server Error
**Solution:** The `.htaccess` file might have issues. Try removing it or contact hosting support.

---

## 🔄 Making Updates Later

When you need to update the forms:

1. Make changes in the `src` folder
2. Run `npm run build`
3. Upload the new `dist` folder contents to cPanel
4. That's it! Changes are live.

**Pro Tip:** Keep a backup of your `dist` folder before uploading.

---

## 📧 Support

If submissions aren't working, check:
1. Google Apps Script deployment settings
2. Browser console for JavaScript errors
3. Network tab (F12) to see if API calls are being made

Your build is ready in: `/c:/Projects/Rwebform/reactwebform/dist/`
