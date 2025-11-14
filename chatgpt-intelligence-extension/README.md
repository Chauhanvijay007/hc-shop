# 🔬 ChatGPT Intelligence Monitor

**The Ultimate Chrome Extension for ChatGPT Reverse Engineering & SEO Competitive Intelligence**

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Chrome](https://img.shields.io/badge/chrome-extension-yellow)

## 🎯 Overview

ChatGPT Intelligence Monitor is a powerful Chrome extension that intercepts and analyzes ChatGPT API calls in real-time, providing unprecedented insights into:

- **Search Query Detection**: Capture every web search query ChatGPT performs
- **Citation Tracking**: Monitor which websites ChatGPT cites and in what order
- **Competitive Intelligence**: Understand which domains dominate ChatGPT's citations
- **Search Classification**: See how ChatGPT decides when to search vs. use its knowledge
- **SEO Insights**: Track your domain's presence in ChatGPT citations

## ✨ Features

### 🔍 Real-Time Monitoring
- **API Interception**: Captures all ChatGPT Server-Sent Events (SSE) streams
- **Event Parsing**: Extracts search queries, citations, and metadata
- **Delta Encoding Support**: Handles ChatGPT's delta encoding format
- **Live Updates**: See data as conversations happen

### 📊 Analytics Dashboard
- **Statistics Overview**: Total events, searches, and citations
- **Top Domains**: See which websites ChatGPT cites most frequently
- **Search History**: Complete log of all search queries
- **Citation Analysis**: Position tracking, domain analysis, and trends
- **Filtering & Search**: Find specific queries or citations instantly

### 💾 Data Export
- **JSON Export**: Complete data dump for custom analysis
- **CSV Export**: Spreadsheet-ready format for Excel/Google Sheets
- **Persistent Storage**: All data saved locally using Chrome Storage API
- **Bulk Operations**: Export thousands of events at once

### 🎨 Beautiful UI
- **Modern Design**: Gradient purple theme inspired by ChatGPT
- **Responsive Layout**: Works on all screen sizes
- **Dark Mode**: Easy on the eyes for long monitoring sessions
- **Interactive Tables**: Sort, filter, and search through data

## 🚀 Installation

### Method 1: Load Unpacked (Developer Mode)

1. **Download the Extension**
   ```bash
   git clone https://github.com/YOUR_USERNAME/hc-shop.git
   cd hc-shop/chatgpt-intelligence-extension
   ```

2. **Prepare Icons** (Optional)
   - Add icon files to the `icons/` directory:
     - `icon16.png` (16x16)
     - `icon48.png` (48x48)
     - `icon128.png` (128x128)
   - Or use the provided SVG template to create PNGs

3. **Load in Chrome**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (top right toggle)
   - Click "Load unpacked"
   - Select the `chatgpt-intelligence-extension` folder
   - Extension should now appear in your toolbar!

4. **Start Monitoring**
   - Navigate to [ChatGPT](https://chatgpt.com)
   - Start a conversation
   - Click the extension icon to see captured data

### Method 2: Chrome Web Store (Coming Soon)

*Extension will be published to Chrome Web Store after initial testing phase.*

## 📖 Usage Guide

### Basic Usage

1. **Start Chatting**
   - Open ChatGPT and start a conversation
   - The extension automatically monitors all API calls

2. **View Quick Stats**
   - Click the extension icon in your toolbar
   - See recent searches and citations
   - View total event counts

3. **Open Dashboard**
   - Click "Dashboard" in the popup
   - Explore full analytics and data tables
   - Use filters to find specific information

### Advanced Features

#### Search Query Analysis

Monitor what queries trigger ChatGPT's web search:

```
Example captured query:
"help me find best SEO tools"

Classification:
- Simple Search: 99.4%
- Complex Search: 0.16%
- No Search: 0.4%

Decision: SIMPLE SEARCH TRIGGERED
```

#### Citation Tracking

See exactly which websites ChatGPT cites:

```
Position #1: backlinko.com
Title: "12 Best SEO Tools for 2025"
URL: https://backlinko.com/best-free-seo-tools

Position #2: semrush.com
...
```

#### Domain Intelligence

Track your domain (or competitors):

1. Use the domain filter in the dashboard
2. Enter your domain (e.g., "yourdomain.com")
3. See all citations for that domain
4. Analyze position trends

### Export Data

#### JSON Export
```json
{
  "exportDate": "2025-11-14T...",
  "version": "1.0.0",
  "statistics": {
    "events": 177,
    "searches": 12,
    "citations": 35
  },
  "data": {
    "searchQueries": [...],
    "citations": [...]
  }
}
```

#### CSV Export
Perfect for Excel or Google Sheets:
```csv
Timestamp,Domain,URL,Title,Position,Query
2025-11-14...,backlinko.com,https://...,12 Best SEO Tools,1,best SEO tools
```

## 🏗️ Architecture

### File Structure

```
chatgpt-intelligence-extension/
├── manifest.json              # Extension configuration
├── background.js              # Service worker (data processing)
├── content.js                 # Content script (API interception)
├── popup.html                 # Popup UI
├── popup.js                   # Popup logic
├── lib/
│   ├── storage.js            # IndexedDB wrapper (legacy)
│   └── parser.js             # Event parsing library
├── dashboard/
│   ├── dashboard.html        # Full analytics dashboard
│   └── dashboard.js          # Dashboard logic
├── icons/
│   ├── icon16.png           # Extension icons
│   ├── icon48.png
│   ├── icon128.png
│   └── icon.svg             # SVG template
└── README.md                 # This file
```

### Technology Stack

- **Manifest V3**: Latest Chrome extension standard
- **Vanilla JavaScript**: No frameworks, pure performance
- **Chrome Storage API**: Persistent local storage
- **Server-Sent Events**: Real-time stream processing
- **Delta Encoding**: ChatGPT's event format

### How It Works

1. **Injection Phase**
   - `content.js` loads on all `chatgpt.com` pages
   - Intercepts the native `fetch()` API

2. **Capture Phase**
   - Monitors requests to `backend-api/f/conversation`
   - Clones response streams to avoid disruption
   - Processes Server-Sent Events (SSE)

3. **Parsing Phase**
   - Extracts event type and data from SSE format
   - Uses `parser.js` to identify search queries and citations
   - Classifies events (search, citation, metadata, etc.)

4. **Storage Phase**
   - Sends parsed data to `background.js`
   - Stores in Chrome Storage API
   - Maintains counters and indexes

5. **Display Phase**
   - Popup shows quick stats and recent items
   - Dashboard provides full analytics
   - Export functions generate JSON/CSV

## 🔬 ChatGPT API Insights

### Discovered Endpoints

```
Primary API:
https://chatgpt.com/backend-api/f/conversation

Supporting APIs:
https://ab.chatgpt.com/v1/rgstr         # Analytics
https://chatgpt.com/ces/v1/t            # Event system
```

### Event Stream Format

```
event: delta_encoding
v1

event: delta
data: {"p": "/path", "o": "append", "v": {...}}
```

### Search Detection Pattern

```javascript
// ChatGPT generates search function calls:
{
  "content_type": "code",
  "text": "search(\"your query here\")"
}

// With classification metadata:
{
  "sonic_classification_result": {
    "simple_search_prob": 0.994,
    "decision_source": "classifier"
  }
}
```

### Citation Structure

```javascript
{
  "p": "/message/metadata/search_result_groups",
  "v": [{
    "type": "search_result_group",
    "domain": "example.com",
    "entries": [{
      "url": "https://...",
      "title": "Page Title",
      "snippet": "Preview text...",
      "ref_id": { "ref": 1 }
    }]
  }]
}
```

## 📈 Use Cases

### 1. SEO Competitive Intelligence

**Track your domain's ChatGPT presence:**
- Monitor citation frequency
- Analyze position trends
- Compare against competitors
- Identify content gaps

### 2. Content Strategy

**Understand what ChatGPT recommends:**
- See which topics trigger searches
- Identify top-cited content types
- Discover citation patterns
- Optimize for AI recommendations

### 3. Research & Analysis

**Study ChatGPT's behavior:**
- Search vs. knowledge decisions
- Citation preferences
- Query classification patterns
- Model updates over time

### 4. Domain Monitoring

**Watch competitors:**
- Track their citation frequency
- See which queries trigger their mentions
- Analyze their position rankings
- Benchmark against industry leaders

## 🛠️ Development

### Local Development

```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/hc-shop.git
cd hc-shop/chatgpt-intelligence-extension

# Make changes to any files
# Test by reloading extension in chrome://extensions/
```

### Debugging

1. **Content Script Logs**
   - Open ChatGPT
   - Right-click → Inspect
   - Console tab → Filter: `[ChatGPT Intelligence]`

2. **Background Script Logs**
   - Go to `chrome://extensions/`
   - Find extension → "Inspect views: service worker"
   - Console tab

3. **Storage Inspection**
   - Background script console
   - Run: `chrome.storage.local.get(null, console.log)`

### Building

No build process required! This is pure vanilla JavaScript.

To package for distribution:
```bash
# Zip the directory
zip -r chatgpt-intelligence.zip chatgpt-intelligence-extension/
```

## 🔒 Privacy & Security

### Data Storage

- **100% Local**: All data stored in Chrome's local storage
- **No External Servers**: No data sent anywhere
- **No Tracking**: No analytics or telemetry
- **User Control**: Clear all data anytime

### Permissions

```json
{
  "storage": "Store captured data locally",
  "webRequest": "Monitor ChatGPT API calls",
  "tabs": "Open dashboard in new tab",
  "downloads": "Export data as files"
}
```

### Security Practices

- No `eval()` or unsafe code execution
- CSP-compliant (Content Security Policy)
- Minimal permissions
- Open source and auditable

## 🐛 Troubleshooting

### Extension Not Capturing Data

1. **Check ChatGPT URL**
   - Must be on `chatgpt.com`
   - Extension only works on ChatGPT website

2. **Reload Extension**
   - Go to `chrome://extensions/`
   - Click reload button on extension

3. **Check Console**
   - Look for `[ChatGPT Intelligence] Monitoring active`
   - Check for any error messages

### Dashboard Shows No Data

1. **Verify Data Capture**
   - Check popup first (should show counts)
   - Ensure you've had conversations

2. **Clear and Retry**
   - Clear all data
   - Have a fresh conversation
   - Check popup counts update

### Export Not Working

1. **Check Download Permissions**
   - Ensure extension has download permission
   - Check Chrome's download settings

2. **Try Different Format**
   - If JSON fails, try CSV
   - Smaller datasets export faster

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### Ideas for Contributions

- [ ] Add chart visualizations (Chart.js)
- [ ] Implement SQL export format
- [ ] Add Google Sheets integration
- [ ] Create trend analysis features
- [ ] Add notification system
- [ ] Build API for external tools

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- Built with insights from real ChatGPT API analysis
- Inspired by the need for SEO competitive intelligence
- Community feedback and testing

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/YOUR_USERNAME/hc-shop/issues)
- **Discussions**: [GitHub Discussions](https://github.com/YOUR_USERNAME/hc-shop/discussions)
- **Email**: your.email@example.com

## 🚀 Roadmap

### Version 1.1 (Next Release)
- [ ] Chart visualizations
- [ ] Advanced filtering
- [ ] Export templates
- [ ] Batch analysis tools

### Version 1.2 (Future)
- [ ] Google Sheets integration
- [ ] Automated reports
- [ ] Email notifications
- [ ] Team collaboration features

### Version 2.0 (Vision)
- [ ] Multi-AI support (Claude, Gemini, etc.)
- [ ] Predictive analytics
- [ ] API access
- [ ] Enterprise features

---

**Made with ❤️ for the SEO and Research community**

*Star this repo if you find it useful!*
