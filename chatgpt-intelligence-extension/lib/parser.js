/**
 * ChatGPT Intelligence Monitor - Parser Library
 * Parses ChatGPT API events to extract search queries, citations, and metadata
 */

class ChatGPTParser {
  /**
   * Parse SSE event data
   */
  static parseSSEEvent(eventText) {
    const lines = eventText.trim().split('\n');
    const event = {
      type: null,
      data: null,
      raw: eventText
    };

    for (const line of lines) {
      if (line.startsWith('event:')) {
        event.type = line.substring(6).trim();
      } else if (line.startsWith('data:')) {
        const dataStr = line.substring(5).trim();
        try {
          event.data = JSON.parse(dataStr);
        } catch (e) {
          event.data = dataStr;
        }
      }
    }

    return event;
  }

  /**
   * Detect if event contains a search function call
   */
  static isSearchFunctionCall(eventData) {
    try {
      // Check if this is a delta event with message content
      if (eventData?.v?.message) {
        const content = eventData.v.message.content;
        if (content?.content_type === 'code' && content.text) {
          return content.text.includes('search(');
        }
      }

      // Alternative path for different event structures
      if (eventData?.message?.content) {
        const content = eventData.message.content;
        if (content?.content_type === 'code' && content.text) {
          return content.text.includes('search(');
        }
      }

      return false;
    } catch (e) {
      return false;
    }
  }

  /**
   * Extract search query from function call
   */
  static extractSearchQuery(eventData) {
    try {
      let text = null;

      // Try different paths
      if (eventData?.v?.message?.content?.text) {
        text = eventData.v.message.content.text;
      } else if (eventData?.message?.content?.text) {
        text = eventData.message.content.text;
      }

      if (!text) return null;

      // Pattern 1: search("query here")
      let match = text.match(/search\(["'](.+?)["']\)/);
      if (match) return match[1];

      // Pattern 2: search('query here')
      match = text.match(/search\(['"](.+?)['"]\)/);
      if (match) return match[1];

      // Pattern 3: search(query here) without quotes
      match = text.match(/search\((.+?)\)/);
      if (match) return match[1].trim();

      return null;
    } catch (e) {
      console.error('Error extracting search query:', e);
      return null;
    }
  }

  /**
   * Extract search classification metadata
   */
  static extractSearchClassification(eventData) {
    try {
      let metadata = null;

      // Try different paths for metadata
      if (eventData?.v?.message?.metadata) {
        metadata = eventData.v.message.metadata;
      } else if (eventData?.message?.metadata) {
        metadata = eventData.message.metadata;
      }

      if (!metadata?.sonic_classification_result) {
        return null;
      }

      const result = metadata.sonic_classification_result;
      return {
        simpleSearchProb: result.simple_search_prob,
        complexSearchProb: result.complex_search_prob,
        noSearchProb: result.no_search_prob,
        simpleSearchThreshold: result.simple_search_threshold,
        complexSearchThreshold: result.complex_search_threshold,
        noSearchThreshold: result.no_search_threshold,
        classifierConfig: result.classifier_config_name,
        decisionSource: result.decision_source,
        latencyMs: result.latency_ms
      };
    } catch (e) {
      console.error('Error extracting classification:', e);
      return null;
    }
  }

  /**
   * Detect if event contains citations
   */
  static isCitationEvent(eventData) {
    try {
      // Method 1: Check path
      if (eventData?.p === '/message/metadata/search_result_groups') {
        return true;
      }

      // Method 2: Check if value contains search_result_group
      if (eventData?.v && Array.isArray(eventData.v)) {
        return eventData.v.some(item => item?.type === 'search_result_group');
      }

      // Method 3: Check nested structure
      if (eventData?.message?.metadata?.search_result_groups) {
        return true;
      }

      return false;
    } catch (e) {
      return false;
    }
  }

  /**
   * Extract citation data
   */
  static extractCitations(eventData) {
    try {
      const citations = [];
      let groups = [];

      // Try different paths
      if (eventData?.v && Array.isArray(eventData.v)) {
        groups = eventData.v;
      } else if (eventData?.message?.metadata?.search_result_groups) {
        groups = eventData.message.metadata.search_result_groups;
      }

      let position = 1;

      for (const group of groups) {
        if (group?.type === 'search_result_group') {
          const domain = group.domain;

          for (const entry of group.entries || []) {
            if (entry?.type === 'search_result') {
              citations.push({
                domain: domain,
                url: entry.url,
                title: entry.title,
                snippet: entry.snippet,
                refId: entry.ref_id,
                position: position++
              });
            }
          }
        }
      }

      return citations;
    } catch (e) {
      console.error('Error extracting citations:', e);
      return [];
    }
  }

  /**
   * Extract conversation ID
   */
  static extractConversationId(eventData) {
    try {
      // Try different paths
      if (eventData?.conversation_id) {
        return eventData.conversation_id;
      }
      if (eventData?.v?.conversation_id) {
        return eventData.v.conversation_id;
      }
      if (eventData?.message?.metadata?.conversation_id) {
        return eventData.message.metadata.conversation_id;
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  /**
   * Extract message ID
   */
  static extractMessageId(eventData) {
    try {
      if (eventData?.v?.message?.id) {
        return eventData.v.message.id;
      }
      if (eventData?.message?.id) {
        return eventData.message.id;
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  /**
   * Extract server metadata
   */
  static extractServerMetadata(eventData) {
    try {
      if (eventData?.v?.type === 'server_ste_metadata') {
        return {
          conduitPrewarmed: eventData.v.metadata?.conduit_prewarmed,
          fastConvo: eventData.v.metadata?.fast_convo,
          warmupState: eventData.v.metadata?.warmup_state,
          isFirstTurn: eventData.v.metadata?.is_first_turn,
          modelSlug: eventData.v.metadata?.model_slug,
          isSearch: eventData.v.metadata?.is_search,
          didPromptContainImage: eventData.v.metadata?.did_prompt_contain_image,
          messageId: eventData.v.metadata?.message_id,
          requestId: eventData.v.metadata?.request_id
        };
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  /**
   * Extract title generation
   */
  static extractTitleGeneration(eventData) {
    try {
      if (eventData?.v?.type === 'title_generation') {
        return {
          title: eventData.v.title,
          conversationId: eventData.v.conversation_id
        };
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  /**
   * Classify event type
   */
  static classifyEventType(eventData) {
    if (this.isSearchFunctionCall(eventData)) {
      return 'search_query';
    }
    if (this.isCitationEvent(eventData)) {
      return 'citation';
    }
    if (this.extractServerMetadata(eventData)) {
      return 'server_metadata';
    }
    if (this.extractTitleGeneration(eventData)) {
      return 'title_generation';
    }

    // Check for content
    if (eventData?.v?.message?.content?.parts) {
      return 'content';
    }

    return 'other';
  }

  /**
   * Extract user message
   */
  static extractUserMessage(eventData) {
    try {
      if (eventData?.v?.message?.author?.role === 'user') {
        return {
          messageId: eventData.v.message.id,
          content: eventData.v.message.content?.parts?.join('') || '',
          timestamp: eventData.v.message.create_time,
          metadata: eventData.v.message.metadata
        };
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  /**
   * Extract assistant message
   */
  static extractAssistantMessage(eventData) {
    try {
      if (eventData?.v?.message?.author?.role === 'assistant') {
        return {
          messageId: eventData.v.message.id,
          content: eventData.v.message.content?.parts?.join('') || '',
          contentType: eventData.v.message.content?.content_type,
          timestamp: eventData.v.message.create_time,
          metadata: eventData.v.message.metadata
        };
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  /**
   * Extract tool response
   */
  static extractToolResponse(eventData) {
    try {
      if (eventData?.v?.message?.author?.role === 'tool') {
        return {
          messageId: eventData.v.message.id,
          toolName: eventData.v.message.author.name,
          content: eventData.v.message.content?.parts?.join('') || '',
          metadata: eventData.v.message.author.metadata,
          timestamp: eventData.v.message.create_time
        };
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  /**
   * Parse complete event with all extractors
   */
  static parseEvent(eventData) {
    const parsed = {
      eventType: this.classifyEventType(eventData),
      conversationId: this.extractConversationId(eventData),
      messageId: this.extractMessageId(eventData),
      timestamp: Date.now(),
      data: {}
    };

    // Extract based on event type
    if (parsed.eventType === 'search_query') {
      parsed.data.query = this.extractSearchQuery(eventData);
      parsed.data.classification = this.extractSearchClassification(eventData);
    }

    if (parsed.eventType === 'citation') {
      parsed.data.citations = this.extractCitations(eventData);
    }

    if (parsed.eventType === 'server_metadata') {
      parsed.data.serverMetadata = this.extractServerMetadata(eventData);
    }

    if (parsed.eventType === 'title_generation') {
      parsed.data.titleGeneration = this.extractTitleGeneration(eventData);
    }

    // Extract messages
    const userMsg = this.extractUserMessage(eventData);
    if (userMsg) {
      parsed.data.userMessage = userMsg;
    }

    const assistantMsg = this.extractAssistantMessage(eventData);
    if (assistantMsg) {
      parsed.data.assistantMessage = assistantMsg;
    }

    const toolMsg = this.extractToolResponse(eventData);
    if (toolMsg) {
      parsed.data.toolResponse = toolMsg;
    }

    return parsed;
  }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ChatGPTParser;
}
