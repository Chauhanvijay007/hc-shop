/**
 * ChatGPT Intelligence Monitor - Popup Script
 */

// Load statistics on popup open
document.addEventListener('DOMContentLoaded', async () => {
  await loadStatistics();
  await loadRecentSearches();
  await loadRecentCitations();

  // Setup event listeners
  document.getElementById('btn-dashboard').addEventListener('click', openDashboard);
  document.getElementById('btn-export').addEventListener('click', exportJSON);
  document.getElementById('btn-export-csv').addEventListener('click', exportCSV);
  document.getElementById('btn-clear').addEventListener('click', clearData);
});

/**
 * Load statistics
 */
async function loadStatistics() {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_STATISTICS' });

    document.getElementById('stat-events').textContent = response.events || 0;
    document.getElementById('stat-searches').textContent = response.searches || 0;
    document.getElementById('stat-citations').textContent = response.citations || 0;
  } catch (error) {
    console.error('Error loading statistics:', error);
  }
}

/**
 * Load recent searches
 */
async function loadRecentSearches() {
  try {
    const searches = await chrome.runtime.sendMessage({
      type: 'GET_SEARCH_QUERIES',
      limit: 3
    });

    const container = document.getElementById('recent-searches');

    if (!searches || searches.length === 0) {
      container.innerHTML = '<div class="empty-state">No searches yet. Start chatting with ChatGPT!</div>';
      return;
    }

    container.innerHTML = '';

    for (const search of searches) {
      const item = document.createElement('div');
      item.className = 'recent-item';

      const timeAgo = getTimeAgo(search.timestamp);
      const query = truncate(search.query, 60);

      item.innerHTML = `
        <div class="query-text">${escapeHtml(query)}</div>
        <div class="time-label">${timeAgo}</div>
      `;

      container.appendChild(item);
    }
  } catch (error) {
    console.error('Error loading searches:', error);
    document.getElementById('recent-searches').innerHTML = '<div class="empty-state">Error loading searches</div>';
  }
}

/**
 * Load recent citations
 */
async function loadRecentCitations() {
  try {
    const citations = await chrome.runtime.sendMessage({
      type: 'GET_CITATIONS',
      limit: 5
    });

    const container = document.getElementById('recent-citations');

    if (!citations || citations.length === 0) {
      container.innerHTML = '<div class="empty-state">No citations yet</div>';
      return;
    }

    container.innerHTML = '';

    for (const citation of citations) {
      const item = document.createElement('div');
      item.className = 'recent-item citation-item';

      item.innerHTML = `
        <div class="citation-domain">${escapeHtml(citation.domain)}</div>
        <div class="citation-position">#${citation.position}</div>
      `;

      container.appendChild(item);
    }
  } catch (error) {
    console.error('Error loading citations:', error);
    document.getElementById('recent-citations').innerHTML = '<div class="empty-state">Error loading citations</div>';
  }
}

/**
 * Open dashboard
 */
function openDashboard() {
  chrome.tabs.create({
    url: chrome.runtime.getURL('dashboard/dashboard.html')
  });
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
  if (!confirm('Are you sure you want to clear all data? This cannot be undone.')) {
    return;
  }

  try {
    const result = await chrome.runtime.sendMessage({ type: 'CLEAR_DATA' });

    if (result.success) {
      // Reload UI
      await loadStatistics();
      await loadRecentSearches();
      await loadRecentCitations();

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

  chrome.downloads.download({
    url: url,
    filename: filename,
    saveAs: true
  });
}

/**
 * Get time ago string
 */
function getTimeAgo(timestamp) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
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
