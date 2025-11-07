# Add-on Sections Fix

## Problem
The DS-160 (U.S. form) had "Add-on" sections for Schengen and Canada that shouldn't have been there. These fields should only appear in their respective forms.

## Changes Made

### 1. **Removed from DS-160 Form** ❌
- ❌ Removed "Schengen Add-on" section (EU/EEA/Swiss family fields)
- ❌ Removed "Canada Add-on" section (Gender field)
- ✅ Removed `hasEUFamily` from DS-160 required fields

**Files Modified:**
- `src/App.jsx` (Lines 385-396 removed)
- `src/data/sections.js` (Removed hasEUFamily from REQUIRED array)

---

### 2. **Added to Schengen Form** ✅

**New Section: "EU/EEA/Swiss Family Members"**

Added proper EU family member section with instruction:
> "If you have family members who are citizens of EU/EEA or Switzerland, provide their information:"

**Fields Added:**
1. ✅ **Do you have a family member who is an EU/EEA/Swiss citizen?** (Yes/No) - Required
2. ✅ **Family Member Surname** (shown if Yes)
3. ✅ **Family Member Given Name** (shown if Yes)
4. ✅ **Family Member Date of Birth** (shown if Yes)
5. ✅ **Family Member Nationality** (dropdown: EU countries) (shown if Yes)
6. ✅ **Travel Document Number** (shown if Yes)
7. ✅ **Family Relationship** (dropdown: Spouse, Registered Partner, Child, Grandchild, Dependent Ascendant, Other) (shown if Yes)

**Files Modified:**
- `src/forms/schengen/sections.js` - Added import for COUNTRIES_EU
- `src/forms/schengen/sections.js` - Added new section before Review
- `src/forms/schengen/sections.js` - Added `hasEUFamily` to SCHENGEN_REQUIRED
- `UPDATED_GOOGLE_APPS_SCRIPT.js` - Added EU family section to capture data

---

### 3. **Canada Form - Already Has Gender** ✅

The Canada form already has a proper **Gender** field in the "Applicant Identity" section with appropriate options:
- Male
- Female  
- X/Other

**No changes needed** - this field already exists and works correctly!

**Location:** Line 43 in `src/CanadaApp.jsx`
```javascript
{ type: 'select', name: 'sex', label: 'Gender', options: SEX, required: true }
```

---

## Testing Instructions

### Test Schengen Form - EU Family Section:
1. Navigate to Schengen form
2. Go to "EU/EEA/Swiss Family Members" section
3. Answer "Do you have a family member who is an EU/EEA/Swiss citizen?" → Select **Yes**
4. Verify all conditional fields appear:
   - Family Member Surname
   - Family Member Given Name
   - Family Member Date of Birth
   - Family Member Nationality (EU countries dropdown)
   - Travel Document Number
   - Family Relationship
5. Fill in the fields and submit
6. Check Google Drive output for "EU/EEA/SWISS FAMILY MEMBERS" section

### Test DS-160 Form - Verify Removal:
1. Navigate through entire DS-160 form
2. Confirm no "Schengen Add-on" section exists
3. Confirm no "Canada Add-on" section exists
4. Confirm no EU family fields appear

### Test Canada Form - Verify Gender Exists:
1. Navigate to Canada form → "Applicant Identity" section
2. Verify "Gender" field exists with options: Male, Female, X/Other
3. This should already be working (no changes made)

---

## Summary

✅ **DS-160 (U.S. Form)** - Cleaned up, removed inappropriate add-on sections  
✅ **Schengen Form** - Added proper EU/EEA/Swiss family member section with 7 fields  
✅ **Canada Form** - Already has Gender field, no changes needed  
✅ **Google Apps Script** - Updated to capture EU family data in Schengen output  

All forms now have the correct fields in their proper locations! 🎉

---

## Form-Specific Features

| Feature | DS-160 | Schengen | Canada |
|---------|--------|----------|--------|
| EU Family Member Info | ❌ | ✅ | ❌ |
| Gender Field | ✅ (Sex) | ✅ (Sex) | ✅ (Gender with X/Other) |
| Travel to Schengen | ❌ | ✅ | ❌ |
| U.S. Travel History | ✅ | ❌ | ❌ |
| Security Questions (26) | ✅ | ❌ | ❌ |
