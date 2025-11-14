/**
 * ChatGPT Intelligence Monitor - Dashboard Script
 */

let allSearches = [];
let allCitations = [];

// Load data on page load
document.addEventListener('DOMContentLoaded', async () => {
  await loadAllData();

  // Setup event listeners
  document.getElementById('btn-export-json').addEventListener('click', exportJSON);
  document.getElementById('btn-export-csv').addEventListener('click', exportCSV);
  document.getElementById('btn-refresh').addEventListener('click', loadAllData);
  document.getElementById('btn-clear').addEventListener('click', clearData);

  // Setup filters
  document.getElementById('filter-query').addEventListener('input', filterSearches);
  document.getElementById('filter-domain').addEventListener('input', filterCitations);
  document.getElementById('filter-citation-query').addEventListener('input', filterCitations);
});

/**
 * Load all data
 */
async function loadAllData() {
  await Promise.all([
    loadStatistics(),
    loadSearches(),
    loadCitations()
  ]);

  displayTopDomains();
}

/**
 * Load statistics
 */
async function loadStatistics() {
  try {
    const stats = await chrome.runtime.sendMessage({ type: 'GET_STATISTICS' });

    document.getElementById('stat-events').textContent = stats.events || 0;
    document.getElementById('stat-searches').textContent = stats.searches || 0;
    document.getElementById('stat-citations').textContent = stats.citations || 0;

    // Calculate unique domains
    const uniqueDomains = new Set(allCitations.map(c => c.domain)).size;
    document.getElementById('stat-domains').textContent = uniqueDomains || 0;

  } catch (error) {
    console.error('Error loading statistics:', error);
  }
}

/**
 * Load searches
 */
async function loadSearches() {
  try {
    allSearches = await chrome.runtime.sendMessage({
      type: 'GET_SEARCH_QUERIES',
      limit: 1000
    });

    displaySearches(allSearches);
  } catch (error) {
    console.error('Error loading searches:', error);
    document.getElementById('searches-tbody').innerHTML = '<tr><td colspan="5" class="empty-state">Error loading searches</td></tr>';
  }
}

/**
 * Load citations
 */
async function loadCitations() {
  try {
    allCitations = await chrome.runtime.sendMessage({
      type: 'GET_CITATIONS',
      limit: 5000
    });

    displayCitations(allCitations);
    displayTopDomains();

  } catch (error) {
    console.error('Error loading citations:', error);
    document.getElementById('citations-tbody').innerHTML = '<tr><td colspan="6" class="empty-state">Error loading citations</td></tr>';
  }
}

/**
 * Display searches in table
 */
function displaySearches(searches) {
  const tbody = document.getElementById('searches-tbody');

  if (!searches || searches.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No search queries yet. Start chatting with ChatGPT!</td></tr>';
    return;
  }

  tbody.innerHTML = '';

  for (const search of searches) {
    const row = tbody.insertRow();

    // Time
    const timeCell = row.insertCell();
    timeCell.className = 'time-badge';
    timeCell.textContent = formatDateTime(search.timestamp);

    // Query
    const queryCell = row.insertCell();
    queryCell.className = 'query-text';
    queryCell.textContent = search.query || '(no query)';
    queryCell.title = search.query;

    // Search Type
    const typeCell = row.insertCell();
    const searchType = getSearchType(search.classification);
    typeCell.innerHTML = `<span class="domain-badge">${searchType}</span>`;

    // Confidence
    const confidenceCell = row.insertCell();
    const confidence = getConfidence(search.classification);
    confidenceCell.textContent = confidence;

    // Conversation ID
    const convCell = row.insertCell();
    convCell.textContent = truncate(search.conversationId || '', 20);
    convCell.title = search.conversationId;
  }
}

/**
 * Display citations in table
 */
function displayCitations(citations) {
  const tbody = document.getElementById('citations-tbody');

  if (!citations || citations.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No citations yet</td></tr>';
    return;
  }

  tbody.innerHTML = '';

  for (const citation of citations) {
    const row = tbody.insertRow();

    // Position
    const posCell = row.insertCell();
    posCell.style.textAlign = 'center';
    const posClass = citation.position <= 3 ? 'top-3' : '';
    posCell.innerHTML = `<span class="position-badge ${posClass}">#${citation.position || '?'}</span>`;

    // Domain
    const domainCell = row.insertCell();
    domainCell.innerHTML = `<span class="domain-badge">${escapeHtml(citation.domain || 'unknown')}</span>`;

    // Title
    const titleCell = row.insertCell();
    titleCell.textContent = truncate(citation.title || '(no title)', 60);
    titleCell.title = citation.title;

    // URL
    const urlCell = row.insertCell();
    const urlTrunc = truncate(citation.url || '', 50);
    urlCell.innerHTML = `<a href="${escapeHtml(citation.url)}" target="_blank" class="url-link">${escapeHtml(urlTrunc)}</a>`;

    // Query
    const queryCell = row.insertCell();
    queryCell.textContent = truncate(citation.query || '', 40);
    queryCell.title = citation.query;

    // Time
    const timeCell = row.insertCell();
    timeCell.className = 'time-badge';
    timeCell.textContent = formatDateTime(citation.timestamp);
  }

  // Update unique domains count
  const uniqueDomains = new Set(citations.map(c => c.domain)).size;
  document.getElementById('stat-domains').textContent = uniqueDomains;
}

/**
 * Display top domains
 */
function displayTopDomains() {
  const container = document.getElementById('top-domains');

  if (!allCitations || allCitations.length === 0) {
    container.innerHTML = '<div class="empty-state">No citation data yet</div>';
    return;
  }

  // Count citations per domain
  const domainCounts = {};
  for (const citation of allCitations) {
    const domain = citation.domain || 'unknown';
    domainCounts[domain] = (domainCounts[domain] || 0) + 1;
  }

  // Sort by count
  const sorted = Object.entries(domainCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12); // Top 12

  container.innerHTML = '';

  for (const [domain, count] of sorted) {
    const card = document.createElement('div');
    card.className = 'domain-card';
    card.innerHTML = `
      <div class="domain-name">${escapeHtml(domain)}</div>
      <div class="domain-count">${count}</div>
      <div class="domain-label">Citations</div>
    `;
    container.appendChild(card);
  }
}

/**
 * Filter searches
 */
function filterSearches() {
  const query = document.getElementById('filter-query').value.toLowerCase();

  const filtered = allSearches.filter(search => {
    return search.query?.toLowerCase().includes(query);
  });

  displaySearches(filtered);
}

/**
 * Filter citations
 */
function filterCitations() {
  const domain = document.getElementById('filter-domain').value.toLowerCase();
  const query = document.getElementById('filter-citation-query').value.toLowerCase();

  const filtered = allCitations.filter(citation => {
    const domainMatch = !domain || citation.domain?.toLowerCase().includes(domain);
    const queryMatch = !query || citation.query?.toLowerCase().includes(query);
    return domainMatch && queryMatch;
  });

  displayCitations(filtered);
}

/**
 * Export as JSON
 */
async function exportJSON() {
  try {
    const data = await chrome.runtime.sendMessage({
      type: 'EXPORT_DATA',
      format: 'json'
    });

    if (data) {
      downloadFile(data, 'chatgpt-intelligence-export.json', 'application/json');
    }
  } catch (error) {
    console.error('Error exporting JSON:', error);
    alert('Error exporting data. Please try again.');
  }
}

/**
 * Export as CSV
 */
async function exportCSV() {
  try {
    const data = await chrome.runtime.sendMessage({
      type: 'EXPORT_DATA',
      format: 'csv'
    });

    if (data) {
      downloadFile(data, 'chatgpt-intelligence-export.csv', 'text/csv');
    }
  } catch (error) {
    console.error('Error exporting CSV:', error);
    alert('Error exporting data. Please try again.');
  }
}

/**
 * Clear all data
 */
async function clearData() {
  if (!confirm('Are you sure you want to clear ALL data? This cannot be undone.')) {
    return;
  }

  try {
    const result = await chrome.runtime.sendMessage({ type: 'CLEAR_DATA' });

    if (result.success) {
      await loadAllData();
      alert('Data cleared successfully!');
    } else {
      alert('Error clearing data. Please try again.');
    }
  } catch (error) {
    console.error('Error clearing data:', error);
    alert('Error clearing data. Please try again.');
  }
}

/**
 * Download file
 */
function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Format date time
 */
function formatDateTime(timestamp) {
  if (!timestamp) return 'N/A';
  const date = new Date(timestamp);
  return date.toLocaleString();
}

/**
 * Get search type from classification
 */
function getSearchType(classification) {
  if (!classification) return 'Unknown';

  if (classification.simpleSearchProb > 0.5) return 'Simple';
  if (classification.complexSearchProb > 0.5) return 'Complex';
  return 'No Search';
}

/**
 * Get confidence from classification
 */
function getConfidence(classification) {
  if (!classification) return 'N/A';

  const maxProb = Math.max(
    classification.simpleSearchProb || 0,
    classification.complexSearchProb || 0,
    classification.noSearchProb || 0
  );

  return `${(maxProb * 100).toFixed(1)}%`;
}

/**
 * Truncate text
 */
function truncate(text, maxLength) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Escape HTML
 */
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
