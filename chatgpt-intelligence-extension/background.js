/**
 * ChatGPT Intelligence Monitor - Background Service Worker
 * Handles data processing and storage
 */

// Import storage library (for service worker, we'll use chrome.storage)
let db = null;
let eventCount = 0;
let searchCount = 0;
let citationCount = 0;

// Initialize on install
chrome.runtime.onInstalled.addListener(() => {
  console.log('[ChatGPT Intelligence] Extension installed');
  initializeStorage();
});

// Initialize storage
async function initializeStorage() {
  try {
    // Initialize counters
    const result = await chrome.storage.local.get(['eventCount', 'searchCount', 'citationCount']);
    eventCount = result.eventCount || 0;
    searchCount = result.searchCount || 0;
    citationCount = result.citationCount || 0;

    console.log('[ChatGPT Intelligence] Storage initialized');
  } catch (error) {
    console.error('[ChatGPT Intelligence] Storage init error:', error);
  }
}

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[ChatGPT Intelligence] Received message:', message.type);

  switch (message.type) {
    case 'CHATGPT_EVENT':
      handleChatGPTEvent(message);
      break;

    case 'SEARCH_QUERY_DETECTED':
      handleSearchQuery(message);
      break;

    case 'CITATIONS_DETECTED':
      handleCitations(message);
      break;

    case 'TITLE_GENERATED':
      handleTitleGeneration(message);
      break;

    case 'GET_STATISTICS':
      getStatistics().then(sendResponse);
      return true; // Will respond asynchronously

    case 'GET_SEARCH_QUERIES':
      getSearchQueries(message.limit).then(sendResponse);
      return true;

    case 'GET_CITATIONS':
      getCitations(message.limit).then(sendResponse);
      return true;

    case 'EXPORT_DATA':
      exportData(message.format).then(sendResponse);
      return true;

    case 'CLEAR_DATA':
      clearAllData().then(sendResponse);
      return true;
  }

  return false;
});

/**
 * Handle ChatGPT event
 */
async function handleChatGPTEvent(message) {
  try {
    eventCount++;

    // Store in chrome.storage
    const eventKey = `event_${Date.now()}_${eventCount}`;
    const eventData = {
      timestamp: message.timestamp,
      eventType: message.eventType,
      conversationId: extractConversationId(message.eventData),
      data: message.eventData,
      counter: message.counter
    };

    // Store event (keep last 1000 events)
    await chrome.storage.local.set({ [eventKey]: eventData });

    // Update counter
    await chrome.storage.local.set({ eventCount });

    // Clean old events (optional, to prevent storage overflow)
    cleanOldEvents();

  } catch (error) {
    console.error('[ChatGPT Intelligence] Error handling event:', error);
  }
}

/**
 * Handle search query detection
 */
async function handleSearchQuery(message) {
  try {
    searchCount++;

    const queryKey = `search_${Date.now()}_${searchCount}`;
    const queryData = {
      timestamp: message.timestamp,
      query: message.query,
      conversationId: message.conversationId,
      messageId: message.messageId,
      classification: message.classification
    };

    await chrome.storage.local.set({ [queryKey]: queryData });
    await chrome.storage.local.set({ searchCount });

    console.log('[ChatGPT Intelligence] Search query stored:', message.query);

    // Update badge
    updateBadge();

  } catch (error) {
    console.error('[ChatGPT Intelligence] Error storing search:', error);
  }
}

/**
 * Handle citations detection
 */
async function handleCitations(message) {
  try {
    const citations = message.citations || [];

    for (const citation of citations) {
      citationCount++;

      const citationKey = `citation_${Date.now()}_${citationCount}`;
      const citationData = {
        timestamp: message.timestamp,
        conversationId: message.conversationId,
        query: message.query,
        ...citation
      };

      await chrome.storage.local.set({ [citationKey]: citationData });
    }

    await chrome.storage.local.set({ citationCount });

    console.log('[ChatGPT Intelligence] Citations stored:', citations.length);

    // Update badge
    updateBadge();

  } catch (error) {
    console.error('[ChatGPT Intelligence] Error storing citations:', error);
  }
}

/**
 * Handle title generation
 */
async function handleTitleGeneration(message) {
  try {
    const titleKey = `conversation_${message.conversationId}`;
    const convData = {
      conversationId: message.conversationId,
      title: message.title,
      timestamp: message.timestamp,
      lastUpdated: Date.now()
    };

    await chrome.storage.local.set({ [titleKey]: convData });

    console.log('[ChatGPT Intelligence] Conversation title stored:', message.title);

  } catch (error) {
    console.error('[ChatGPT Intelligence] Error storing title:', error);
  }
}

/**
 * Get statistics
 */
async function getStatistics() {
  try {
    const result = await chrome.storage.local.get(['eventCount', 'searchCount', 'citationCount']);

    return {
      events: result.eventCount || 0,
      searches: result.searchCount || 0,
      citations: result.citationCount || 0
    };
  } catch (error) {
    console.error('[ChatGPT Intelligence] Error getting stats:', error);
    return { events: 0, searches: 0, citations: 0 };
  }
}

/**
 * Get search queries
 */
async function getSearchQueries(limit = 100) {
  try {
    const allData = await chrome.storage.local.get(null);
    const searches = [];

    for (const [key, value] of Object.entries(allData)) {
      if (key.startsWith('search_')) {
        searches.push(value);
      }
    }

    // Sort by timestamp (newest first)
    searches.sort((a, b) => b.timestamp - a.timestamp);

    return searches.slice(0, limit);
  } catch (error) {
    console.error('[ChatGPT Intelligence] Error getting searches:', error);
    return [];
  }
}

/**
 * Get citations
 */
async function getCitations(limit = 500) {
  try {
    const allData = await chrome.storage.local.get(null);
    const citations = [];

    for (const [key, value] of Object.entries(allData)) {
      if (key.startsWith('citation_')) {
        citations.push(value);
      }
    }

    // Sort by timestamp (newest first)
    citations.sort((a, b) => b.timestamp - a.timestamp);

    return citations.slice(0, limit);
  } catch (error) {
    console.error('[ChatGPT Intelligence] Error getting citations:', error);
    return [];
  }
}

/**
 * Export data
 */
async function exportData(format = 'json') {
  try {
    const searches = await getSearchQueries(10000);
    const citations = await getCitations(10000);
    const stats = await getStatistics();

    const exportData = {
      exportDate: new Date().toISOString(),
      version: '1.0.0',
      statistics: stats,
      data: {
        searchQueries: searches,
        citations: citations
      }
    };

    if (format === 'json') {
      return JSON.stringify(exportData, null, 2);
    } else if (format === 'csv') {
      return convertToCSV(exportData);
    }

    return exportData;
  } catch (error) {
    console.error('[ChatGPT Intelligence] Error exporting data:', error);
    return null;
  }
}

/**
 * Convert data to CSV format
 */
function convertToCSV(data) {
  const csvLines = [];

  // Citations CSV
  csvLines.push('=== CITATIONS ===');
  csvLines.push('Timestamp,Domain,URL,Title,Position,Query,Conversation ID');

  for (const citation of data.data.citations) {
    const line = [
      new Date(citation.timestamp).toISOString(),
      citation.domain || '',
      citation.url || '',
      (citation.title || '').replace(/,/g, ';'),
      citation.position || '',
      (citation.query || '').replace(/,/g, ';'),
      citation.conversationId || ''
    ].join(',');
    csvLines.push(line);
  }

  csvLines.push('');
  csvLines.push('=== SEARCH QUERIES ===');
  csvLines.push('Timestamp,Query,Conversation ID,Search Type');

  for (const query of data.data.searchQueries) {
    const searchType = query.classification?.simpleSearchProb > 0.5 ? 'simple' : 'complex';
    const line = [
      new Date(query.timestamp).toISOString(),
      (query.query || '').replace(/,/g, ';'),
      query.conversationId || '',
      searchType
    ].join(',');
    csvLines.push(line);
  }

  return csvLines.join('\n');
}

/**
 * Clear all data
 */
async function clearAllData() {
  try {
    await chrome.storage.local.clear();
    eventCount = 0;
    searchCount = 0;
    citationCount = 0;

    await chrome.storage.local.set({
      eventCount: 0,
      searchCount: 0,
      citationCount: 0
    });

    console.log('[ChatGPT Intelligence] All data cleared');
    return { success: true };
  } catch (error) {
    console.error('[ChatGPT Intelligence] Error clearing data:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Clean old events to prevent storage overflow
 */
async function cleanOldEvents() {
  try {
    const allData = await chrome.storage.local.get(null);
    const events = [];

    for (const [key, value] of Object.entries(allData)) {
      if (key.startsWith('event_')) {
        events.push({ key, timestamp: value.timestamp });
      }
    }

    // Keep only last 1000 events
    if (events.length > 1000) {
      events.sort((a, b) => a.timestamp - b.timestamp);
      const toDelete = events.slice(0, events.length - 1000);

      for (const event of toDelete) {
        await chrome.storage.local.remove(event.key);
      }

      console.log('[ChatGPT Intelligence] Cleaned old events:', toDelete.length);
    }
  } catch (error) {
    console.error('[ChatGPT Intelligence] Error cleaning events:', error);
  }
}

/**
 * Update extension badge
 */
function updateBadge() {
  chrome.action.setBadgeText({ text: searchCount.toString() });
  chrome.action.setBadgeBackgroundColor({ color: '#4CAF50' });
}

/**
 * Extract conversation ID from event data
 */
function extractConversationId(eventData) {
  try {
    if (eventData?.conversation_id) return eventData.conversation_id;
    if (eventData?.v?.conversation_id) return eventData.v.conversation_id;
    return null;
  } catch (e) {
    return null;
  }
}

// Initialize on startup
initializeStorage();

console.log('[ChatGPT Intelligence] Background service worker loaded');
