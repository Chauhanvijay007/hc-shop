# 🚀 Quick Start Guide (5 Minutes)

## Installation Steps

### 1. Verify Files (30 seconds)

Run the validation script:
```bash
cd chatgpt-intelligence-extension
node test-extension.js
```

You should see:
```
✓ Passed: 30
✗ Failed: 0
🎉 All tests passed!
```

### 2. Load Extension in Chrome (2 minutes)

**Step-by-Step:**

1. **Open Chrome Extensions Page**
   - Type in address bar: `chrome://extensions/`
   - Press Enter

2. **Enable Developer Mode**
   - Look for toggle switch in top-right
   - Click to enable "Developer mode"
   - ![Developer Mode Screenshot](https://developer.chrome.com/static/docs/extensions/mv3/getstarted/development-basics/image/extensions-page-e0d64d89a6acf_1920.png)

3. **Load the Extension**
   - Click "Load unpacked" button (top-left)
   - Navigate to: `chatgpt-intelligence-extension` folder
   - Click "Select Folder"

4. **Verify Installation**
   - Extension appears in list ✓
   - No errors shown ✓
   - Icon appears in toolbar ✓

### 3. Test the Extension (2 minutes)

**Open ChatGPT:**
1. Go to [https://chatgpt.com](https://chatgpt.com)
2. Log in to your account

**Ask a Search-Triggering Question:**
```
You: What are the best SEO tools in 2025?
```

**Check Extension:**
1. Click extension icon in toolbar
2. You should see:
   - Events: 50+ (increasing)
   - Searches: 1
   - Citations: 10-15

**Open Dashboard:**
1. Click "Dashboard" button in popup
2. See full analytics:
   - Top Domains table
   - Search Queries table
   - Citations table with positions

### 4. Export Data (30 seconds)

**From Popup:**
- Click "Export JSON" → Downloads `chatgpt-intelligence-export.json`
- Click "Export CSV" → Downloads `chatgpt-intelligence-export.csv`

**From Dashboard:**
- Same export buttons available
- More filtering options before export

## Troubleshooting

### Extension Not Loading

**Error:** "Could not load extension"

**Fix:**
1. Check that you selected the correct folder
2. Verify `manifest.json` exists in the folder
3. Run `node test-extension.js` to check for issues

### No Data Captured

**Problem:** Shows 0 events after ChatGPT conversation

**Fix:**
1. Refresh ChatGPT page
2. Open browser console (F12)
3. Look for `[ChatGPT Intelligence] Monitoring active`
4. If not found, reload extension:
   - Go to `chrome://extensions/`
   - Click reload icon on extension
   - Refresh ChatGPT page

### Icons Not Showing

**Problem:** Extension has no icon

**Solution:**
Icons are already created! If you see placeholder:
1. Go to `chrome://extensions/`
2. Click reload icon
3. Refresh any ChatGPT tabs

## What to Test

### ✅ Checklist

1. **Installation**
   - [ ] Extension loads without errors
   - [ ] Icon appears in toolbar
   - [ ] No red errors in `chrome://extensions/`

2. **Basic Functionality**
   - [ ] ChatGPT page loads normally
   - [ ] Conversations work as expected
   - [ ] Console shows monitoring message

3. **Data Capture**
   - [ ] Event counter increases during conversation
   - [ ] Search queries are captured
   - [ ] Citations appear in dashboard

4. **UI**
   - [ ] Popup opens and shows stats
   - [ ] Dashboard opens in new tab
   - [ ] Tables display data correctly

5. **Export**
   - [ ] JSON export downloads
   - [ ] CSV export downloads
   - [ ] Files contain valid data

6. **Filtering**
   - [ ] Domain filter works
   - [ ] Query filter works
   - [ ] Tables update correctly

## Example Test Queries

Use these to test different features:

### Trigger Simple Search:
```
What are the best marketing automation tools?
How do I improve my website's SEO?
Top 10 productivity apps for 2025
```

### Trigger Multiple Citations:
```
Compare the best CRM software options
What are the differences between SEO tools?
Best practices for content marketing in 2025
```

### Check Classification:
After asking, check popup to see:
- Search probability: Should be >90%
- Search type: "Simple"

## Expected Results

### After One Conversation:

**Stats:**
- Events: 100-200
- Searches: 1-3
- Citations: 10-30
- Domains: 8-15

**Dashboard:**
- Multiple rows in citations table
- Different domains shown
- Position numbers (1, 2, 3, etc.)

### After Export:

**JSON File:**
```json
{
  "exportDate": "2025-11-14T...",
  "statistics": {
    "searches": 3,
    "citations": 25
  },
  "data": {
    "searchQueries": [...],
    "citations": [...]
  }
}
```

**CSV File:**
```
Timestamp,Domain,URL,Title,Position,Query
2025-11-14...,backlinko.com,https://...,SEO Guide,1,best SEO tools
...
```

## Next Steps

After successful testing:

1. **Regular Use**
   - Use ChatGPT normally
   - Extension runs in background
   - Data accumulates automatically

2. **Analysis**
   - Export data weekly
   - Analyze in Excel/Google Sheets
   - Track trends over time

3. **Monitoring**
   - Filter by your domain
   - Check citation position
   - Compare with competitors

4. **Feedback**
   - Report bugs on GitHub
   - Suggest features
   - Share insights

## Performance Tips

### Storage Management:

Data is stored locally in Chrome Storage. To prevent overflow:

1. **Export Regularly**
   - Weekly or monthly
   - Before clearing data

2. **Clear Old Data**
   - Click "Clear Data" in popup
   - Exports data first (recommended)

3. **Monitor Size**
   - Check `chrome://extensions/`
   - View storage usage

### Optimal Usage:

- Extension uses minimal resources
- No impact on ChatGPT performance
- Data processing happens in background
- UI only loads when needed

## Getting Help

### Resources:

- **README.md** - Full documentation
- **INSTALLATION.md** - Detailed install guide
- **EXAMPLE_DATA.md** - Sample data and analysis
- **GitHub Issues** - Report problems

### Support:

If you encounter issues:
1. Run `node test-extension.js`
2. Check browser console for errors
3. Review `INSTALLATION.md` troubleshooting
4. Open GitHub issue with details

---

**Ready to start? Follow steps 1-4 above!** 🎉

The entire process takes less than 5 minutes, and you'll be capturing ChatGPT intelligence data immediately.
