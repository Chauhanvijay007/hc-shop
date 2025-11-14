/**
 * ChatGPT Intelligence Monitor - Content Script
 * Intercepts ChatGPT API calls and captures SSE events
 */

(function() {
  'use strict';

  console.log('[ChatGPT Intelligence] Content script loaded');

  // Storage for current conversation context
  let currentConversationId = null;
  let currentQuery = null;
  let eventCounter = 0;

  /**
   * Intercept fetch API to capture ChatGPT responses
   */
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    const [resource, config] = args;

    // Call original fetch
    const response = await originalFetch.apply(this, args);

    // Check if this is a ChatGPT API call
    if (typeof resource === 'string' &&
        (resource.includes('backend-api/f/conversation') ||
         resource.includes('backend-api/conversation'))) {

      console.log('[ChatGPT Intelligence] Captured ChatGPT API call:', resource);

      // Clone response so we can read it
      const clonedResponse = response.clone();

      // Process SSE stream
      processSSEStream(clonedResponse);
    }

    return response;
  };

  /**
   * Process Server-Sent Events stream
   */
  async function processSSEStream(response) {
    try {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process complete events
        const events = buffer.split('\n\n');
        buffer = events.pop(); // Keep incomplete event in buffer

        for (const eventText of events) {
          if (eventText.trim()) {
            processEvent(eventText);
          }
        }
      }
    } catch (error) {
      console.error('[ChatGPT Intelligence] Error processing stream:', error);
    }
  }

  /**
   * Process individual event
   */
  function processEvent(eventText) {
    try {
      eventCounter++;

      // Parse event
      const lines = eventText.trim().split('\n');
      let eventType = null;
      let eventData = null;

      for (const line of lines) {
        if (line.startsWith('event:')) {
          eventType = line.substring(6).trim();
        } else if (line.startsWith('data:')) {
          const dataStr = line.substring(5).trim();
          try {
            eventData = JSON.parse(dataStr);
          } catch (e) {
            eventData = dataStr;
          }
        }
      }

      if (!eventData) return;

      // Send to background script for processing
      chrome.runtime.sendMessage({
        type: 'CHATGPT_EVENT',
        eventType: eventType,
        eventData: eventData,
        eventText: eventText,
        timestamp: Date.now(),
        counter: eventCounter
      });

      // Extract conversation ID
      extractConversationId(eventData);

      // Detect search query
      detectSearchQuery(eventData);

      // Detect citations
      detectCitations(eventData);

      // Detect title generation
      detectTitleGeneration(eventData);

    } catch (error) {
      console.error('[ChatGPT Intelligence] Error processing event:', error);
    }
  }

  /**
   * Extract conversation ID from event
   */
  function extractConversationId(eventData) {
    try {
      let convId = null;

      if (eventData?.conversation_id) {
        convId = eventData.conversation_id;
      } else if (eventData?.v?.conversation_id) {
        convId = eventData.v.conversation_id;
      }

      if (convId && convId !== currentConversationId) {
        currentConversationId = convId;
        console.log('[ChatGPT Intelligence] New conversation:', convId);
      }
    } catch (e) {
      // Ignore
    }
  }

  /**
   * Detect search query
   */
  function detectSearchQuery(eventData) {
    try {
      // Check if this is a search function call
      let text = null;

      if (eventData?.v?.message?.content?.content_type === 'code') {
        text = eventData.v.message.content.text;
      }

      if (text && text.includes('search(')) {
        const match = text.match(/search\(["'](.+?)["']\)/);
        if (match) {
          currentQuery = match[1];
          console.log('[ChatGPT Intelligence] Search query detected:', currentQuery);

          // Extract classification if available
          const classification = eventData?.v?.message?.metadata?.sonic_classification_result;

          chrome.runtime.sendMessage({
            type: 'SEARCH_QUERY_DETECTED',
            query: currentQuery,
            conversationId: currentConversationId,
            messageId: eventData?.v?.message?.id,
            classification: classification,
            timestamp: Date.now()
          });
        }
      }
    } catch (e) {
      console.error('[ChatGPT Intelligence] Error detecting search:', e);
    }
  }

  /**
   * Detect citations
   */
  function detectCitations(eventData) {
    try {
      // Check if this event contains citations
      if (eventData?.p === '/message/metadata/search_result_groups' &&
          eventData?.v && Array.isArray(eventData.v)) {

        const citations = [];
        let position = 1;

        for (const group of eventData.v) {
          if (group?.type === 'search_result_group') {
            for (const entry of group.entries || []) {
              citations.push({
                domain: group.domain,
                url: entry.url,
                title: entry.title,
                snippet: entry.snippet,
                refId: entry.ref_id,
                position: position++
              });
            }
          }
        }

        console.log('[ChatGPT Intelligence] Citations detected:', citations.length);

        chrome.runtime.sendMessage({
          type: 'CITATIONS_DETECTED',
          citations: citations,
          conversationId: currentConversationId,
          query: currentQuery,
          timestamp: Date.now()
        });
      }
    } catch (e) {
      console.error('[ChatGPT Intelligence] Error detecting citations:', e);
    }
  }

  /**
   * Detect title generation
   */
  function detectTitleGeneration(eventData) {
    try {
      if (eventData?.v?.type === 'title_generation') {
        console.log('[ChatGPT Intelligence] Title generated:', eventData.v.title);

        chrome.runtime.sendMessage({
          type: 'TITLE_GENERATED',
          title: eventData.v.title,
          conversationId: eventData.v.conversation_id,
          timestamp: Date.now()
        });
      }
    } catch (e) {
      // Ignore
    }
  }

  /**
   * Monitor URL changes for new conversations
   */
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;

      // Reset conversation context on navigation
      if (!url.includes('/c/')) {
        currentConversationId = null;
        currentQuery = null;
        eventCounter = 0;
        console.log('[ChatGPT Intelligence] Navigation detected, context reset');
      }
    }
  }).observe(document, { subtree: true, childList: true });

  console.log('[ChatGPT Intelligence] Monitoring active');
})();
