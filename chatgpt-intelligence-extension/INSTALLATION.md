# 📦 Installation Guide

## Quick Start (5 Minutes)

### Step 1: Download the Extension

**Option A: Git Clone**
```bash
git clone https://github.com/Chauhanvijay007/hc-shop.git
cd hc-shop/chatgpt-intelligence-extension
```

**Option B: Download ZIP**
1. Go to the GitHub repository
2. Click "Code" → "Download ZIP"
3. Extract the ZIP file
4. Navigate to `chatgpt-intelligence-extension` folder

### Step 2: Prepare Icons (Optional but Recommended)

The extension needs three icon files. You have two options:

**Option A: Create Simple Icons** (Recommended for testing)

1. Download any 3 square PNG images or create solid color squares
2. Resize them to:
   - 16x16 pixels → Save as `icon16.png`
   - 48x48 pixels → Save as `icon48.png`
   - 128x128 pixels → Save as `icon128.png`
3. Place them in the `icons/` folder

**Option B: Use Online Tools** (For production)

1. Visit [Canva](https://canva.com) or [Figma](https://figma.com)
2. Create a 128x128 design with the color scheme:
   - Gradient from #667eea to #764ba2
   - Add a simple icon (magnifying glass, chart, or eye)
3. Export as PNG in all three sizes
4. Place in `icons/` folder

**Option C: Convert SVG Template**

We've included an SVG template (`icons/icon.svg`). Convert it to PNG:

1. Visit [CloudConvert](https://cloudconvert.com/svg-to-png)
2. Upload `icons/icon.svg`
3. Convert to PNG at 128x128, 48x48, and 16x16
4. Save with correct filenames

### Step 3: Load Extension in Chrome

1. **Open Chrome Extensions Page**
   - Type `chrome://extensions/` in the address bar
   - OR: Menu (⋮) → More Tools → Extensions

2. **Enable Developer Mode**
   - Toggle "Developer mode" switch in the top-right corner
   - ![Developer Mode](https://developer.chrome.com/static/docs/extensions/mv3/getstarted/development-basics/image/extensions-page-e0d64d89a6acf_1920.png)

3. **Load Unpacked Extension**
   - Click "Load unpacked" button
   - Navigate to the `chatgpt-intelligence-extension` folder
   - Click "Select Folder"

4. **Verify Installation**
   - Extension should appear in your extensions list
   - You should see the icon in your Chrome toolbar
   - If icon doesn't appear, click the puzzle piece icon and pin it

### Step 4: Test the Extension

1. **Navigate to ChatGPT**
   - Open [https://chatgpt.com](https://chatgpt.com)
   - Log in to your account

2. **Start a Conversation**
   - Ask ChatGPT a question that will trigger a web search
   - Example: "What are the best SEO tools in 2025?"

3. **Check the Extension**
   - Click the extension icon in your toolbar
   - You should see:
     - Event count increasing
     - Search query captured
     - Citations appearing

4. **Open the Dashboard**
   - Click "Dashboard" button in the popup
   - Explore the full analytics interface
   - Check that data is being captured correctly

## Troubleshooting Installation

### Icons Not Showing

**Problem**: Extension has no icon or shows placeholder

**Solution**:
1. Create or download icon PNG files
2. Ensure they're named exactly: `icon16.png`, `icon48.png`, `icon128.png`
3. Place in the `icons/` folder
4. Reload extension at `chrome://extensions/`

### Extension Not Loading

**Problem**: "Could not load extension" error

**Solution**:
1. Check that you selected the correct folder
2. Verify `manifest.json` exists in the root
3. Check console for specific error messages
4. Ensure all required files are present

### No Data Captured

**Problem**: Extension loads but shows 0 events

**Solution**:
1. Make sure you're on `chatgpt.com`
2. Refresh the ChatGPT page
3. Check browser console (F12) for errors
4. Look for `[ChatGPT Intelligence] Monitoring active` message
5. Try asking ChatGPT a question that triggers search

### Permission Errors

**Problem**: Extension requesting unexpected permissions

**Solution**:
1. Review `manifest.json` permissions
2. All permissions are required for functionality:
   - `storage`: Save data locally
   - `webRequest`: Monitor ChatGPT API
   - `tabs`: Open dashboard
   - `downloads`: Export data

## Advanced Installation

### Installing on Other Browsers

**Microsoft Edge**:
1. Open `edge://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select extension folder

**Brave Browser**:
1. Open `brave://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select extension folder

**Opera**:
1. Open `opera://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select extension folder

### Portable Installation

To make the extension portable across machines:

1. **Zip the Folder**
   ```bash
   cd chatgpt-intelligence-extension
   zip -r ../chatgpt-intelligence.zip .
   ```

2. **Transfer and Extract**
   - Copy ZIP to another machine
   - Extract to desired location
   - Follow installation steps above

### Custom Installation Path

You can install from any location:

```bash
# Move to custom location
mv chatgpt-intelligence-extension ~/my-extensions/

# Load from that location in Chrome
# chrome://extensions/ → Load unpacked → ~/my-extensions/chatgpt-intelligence-extension
```

## Updating the Extension

### Method 1: Reload in Chrome

1. Make changes to extension files
2. Go to `chrome://extensions/`
3. Find "ChatGPT Intelligence Monitor"
4. Click the reload icon (🔄)

### Method 2: Git Pull

```bash
cd chatgpt-intelligence-extension
git pull origin main
# Reload extension in Chrome
```

## Uninstallation

### Remove Extension

1. Go to `chrome://extensions/`
2. Find "ChatGPT Intelligence Monitor"
3. Click "Remove"
4. Confirm removal

### Clear All Data

Before uninstalling, if you want to keep your data:

1. Open extension dashboard
2. Export data as JSON
3. Save file to safe location
4. Then uninstall

**Note**: Uninstalling the extension will delete all captured data!

## System Requirements

### Minimum Requirements
- **Browser**: Chrome 88+ (or Chromium-based browser)
- **OS**: Windows 7+, macOS 10.12+, Linux
- **RAM**: 100MB free
- **Storage**: 50MB free

### Recommended Requirements
- **Browser**: Chrome 120+ (latest version)
- **OS**: Windows 10+, macOS 12+, Ubuntu 20.04+
- **RAM**: 500MB free (for large datasets)
- **Storage**: 500MB free

## Next Steps

After successful installation:

1. ✅ Read the [Usage Guide](README.md#usage-guide)
2. ✅ Explore the [Dashboard Features](README.md#analytics-dashboard)
3. ✅ Try [Exporting Data](README.md#export-data)
4. ✅ Join our community for tips and tricks

## Getting Help

If you encounter any issues:

1. **Check Console Logs**
   - Open ChatGPT
   - Press F12
   - Go to Console tab
   - Look for extension messages

2. **Review Common Issues**
   - See [Troubleshooting](README.md#troubleshooting)

3. **Ask for Help**
   - [GitHub Issues](https://github.com/Chauhanvijay007/hc-shop/issues)
   - Include browser version
   - Include error messages
   - Describe steps to reproduce

---

**Installation complete! Happy monitoring!** 🎉
