# Contributing to ChatGPT Intelligence Monitor

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## Ways to Contribute

### 🐛 Bug Reports

Found a bug? Please [open an issue](https://github.com/Chauhanvijay007/hc-shop/issues) with:

- Clear description of the bug
- Steps to reproduce
- Expected vs actual behavior
- Browser version and OS
- Screenshots if applicable
- Console error messages

### 💡 Feature Requests

Have an idea? We'd love to hear it! Please include:

- Clear description of the feature
- Use case / why it's needed
- Proposed implementation (if you have ideas)
- Examples from other tools (if applicable)

### 🔧 Code Contributions

1. **Fork the Repository**
   ```bash
   git clone https://github.com/Chauhanvijay007/hc-shop.git
   cd hc-shop
   git checkout -b feature/your-feature-name
   ```

2. **Make Your Changes**
   - Follow existing code style
   - Add comments for complex logic
   - Test thoroughly

3. **Test Your Changes**
   - Load extension in Chrome
   - Test with real ChatGPT conversations
   - Check console for errors
   - Verify data export works

4. **Commit Your Changes**
   ```bash
   git add .
   git commit -m "Add feature: description"
   git push origin feature/your-feature-name
   ```

5. **Create Pull Request**
   - Describe your changes
   - Reference any related issues
   - Include screenshots if UI changes

## Development Guidelines

### Code Style

- **JavaScript**: ES6+ syntax
- **Indentation**: 2 spaces
- **Naming**: camelCase for functions/variables
- **Comments**: JSDoc style for functions

Example:
```javascript
/**
 * Parse search query from event data
 * @param {Object} eventData - The event data object
 * @returns {string|null} - Extracted query or null
 */
function extractSearchQuery(eventData) {
  // Implementation
}
```

### File Organization

```
chatgpt-intelligence-extension/
├── manifest.json         # Keep configuration clean
├── background.js         # Background logic only
├── content.js           # Content script - API interception
├── popup.*              # Popup UI and logic
├── lib/                 # Shared libraries
└── dashboard/           # Full dashboard UI
```

### Commit Messages

Follow conventional commits:

```
feat: Add new feature
fix: Fix bug in parser
docs: Update README
style: Format code
refactor: Refactor storage layer
test: Add tests
chore: Update dependencies
```

### Testing Checklist

Before submitting PR:

- [ ] Extension loads without errors
- [ ] Data capture works on ChatGPT
- [ ] Popup displays correctly
- [ ] Dashboard shows data
- [ ] Export JSON works
- [ ] Export CSV works
- [ ] Clear data works
- [ ] No console errors
- [ ] Code is commented
- [ ] README updated (if needed)

## Project Structure

### Key Files

**manifest.json**
- Extension configuration
- Permissions
- Content scripts
- Background worker

**content.js**
- Intercepts fetch() API
- Processes SSE streams
- Extracts events
- Sends to background

**background.js**
- Receives messages from content
- Stores data in Chrome Storage
- Handles export
- Manages statistics

**lib/parser.js**
- Parses event data
- Extracts queries
- Extracts citations
- Classifies events

**popup.html/js**
- Quick stats view
- Recent items
- Export buttons

**dashboard/**
- Full analytics UI
- Tables and charts
- Advanced filtering

## Ideas for Contributions

### High Priority

- [ ] Add Chart.js visualizations
- [ ] Implement real-time updates in dashboard
- [ ] Add more export formats (SQL, XML)
- [ ] Create automated tests
- [ ] Add keyboard shortcuts

### Medium Priority

- [ ] Google Sheets integration
- [ ] Email reports
- [ ] Custom alerts/notifications
- [ ] Advanced search filters
- [ ] Data comparison tools

### Low Priority (Nice to Have)

- [ ] Theme customization
- [ ] Multiple language support
- [ ] API for external tools
- [ ] Browser sync
- [ ] Team collaboration

## Bug Bounty

While we don't have a formal bug bounty program, we greatly appreciate security disclosures:

**For security vulnerabilities:**
1. DO NOT open a public issue
2. Email details to: [your-email@example.com]
3. Include:
   - Description of vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

**For regular bugs:**
- Open a GitHub issue
- Include all relevant details
- We'll acknowledge within 48 hours

## Code of Conduct

### Our Standards

- Be respectful and inclusive
- Welcome newcomers
- Accept constructive criticism
- Focus on what's best for the community
- Show empathy

### Unacceptable Behavior

- Harassment or discrimination
- Trolling or inflammatory comments
- Personal or political attacks
- Publishing others' private info
- Unprofessional conduct

## Questions?

- **General Questions**: [GitHub Discussions](https://github.com/Chauhanvijay007/hc-shop/discussions)
- **Bug Reports**: [GitHub Issues](https://github.com/Chauhanvijay007/hc-shop/issues)
- **Security**: Email [your-email@example.com]

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing!** 🎉

Your efforts help make this tool better for everyone in the SEO and research community.
