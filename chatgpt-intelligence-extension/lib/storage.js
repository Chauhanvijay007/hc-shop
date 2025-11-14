/**
 * ChatGPT Intelligence Monitor - Storage Layer
 * IndexedDB wrapper for efficient data storage
 */

class ChatGPTStorage {
  constructor() {
    this.dbName = 'ChatGPTIntelligence';
    this.version = 1;
    this.db = null;
  }

  /**
   * Initialize database
   */
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Store for all events
        if (!db.objectStoreNames.contains('events')) {
          const eventsStore = db.createObjectStore('events', {
            keyPath: 'id',
            autoIncrement: true
          });
          eventsStore.createIndex('timestamp', 'timestamp', { unique: false });
          eventsStore.createIndex('conversationId', 'conversationId', { unique: false });
          eventsStore.createIndex('eventType', 'eventType', { unique: false });
        }

        // Store for search queries
        if (!db.objectStoreNames.contains('searchQueries')) {
          const searchStore = db.createObjectStore('searchQueries', {
            keyPath: 'id',
            autoIncrement: true
          });
          searchStore.createIndex('timestamp', 'timestamp', { unique: false });
          searchStore.createIndex('query', 'query', { unique: false });
          searchStore.createIndex('conversationId', 'conversationId', { unique: false });
        }

        // Store for citations
        if (!db.objectStoreNames.contains('citations')) {
          const citationsStore = db.createObjectStore('citations', {
            keyPath: 'id',
            autoIncrement: true
          });
          citationsStore.createIndex('timestamp', 'timestamp', { unique: false });
          citationsStore.createIndex('domain', 'domain', { unique: false });
          citationsStore.createIndex('url', 'url', { unique: false });
          citationsStore.createIndex('conversationId', 'conversationId', { unique: false });
          citationsStore.createIndex('query', 'query', { unique: false });
        }

        // Store for conversations
        if (!db.objectStoreNames.contains('conversations')) {
          const conversationsStore = db.createObjectStore('conversations', {
            keyPath: 'conversationId'
          });
          conversationsStore.createIndex('timestamp', 'timestamp', { unique: false });
          conversationsStore.createIndex('title', 'title', { unique: false });
        }

        // Store for metadata
        if (!db.objectStoreNames.contains('metadata')) {
          const metadataStore = db.createObjectStore('metadata', {
            keyPath: 'id',
            autoIncrement: true
          });
          metadataStore.createIndex('timestamp', 'timestamp', { unique: false });
          metadataStore.createIndex('type', 'type', { unique: false });
          metadataStore.createIndex('conversationId', 'conversationId', { unique: false });
        }
      };
    });
  }

  /**
   * Store event
   */
  async storeEvent(eventData) {
    const transaction = this.db.transaction(['events'], 'readwrite');
    const store = transaction.objectStore('events');

    const event = {
      timestamp: Date.now(),
      eventType: eventData.eventType || 'other',
      conversationId: eventData.conversationId,
      data: eventData.data,
      raw: eventData.raw
    };

    return new Promise((resolve, reject) => {
      const request = store.add(event);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Store search query
   */
  async storeSearchQuery(queryData) {
    const transaction = this.db.transaction(['searchQueries'], 'readwrite');
    const store = transaction.objectStore('searchQueries');

    const query = {
      timestamp: Date.now(),
      query: queryData.query,
      conversationId: queryData.conversationId,
      messageId: queryData.messageId,
      classification: queryData.classification,
      searchType: queryData.searchType || 'simple'
    };

    return new Promise((resolve, reject) => {
      const request = store.add(query);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Store citation
   */
  async storeCitation(citationData) {
    const transaction = this.db.transaction(['citations'], 'readwrite');
    const store = transaction.objectStore('citations');

    const citation = {
      timestamp: Date.now(),
      conversationId: citationData.conversationId,
      query: citationData.query,
      domain: citationData.domain,
      url: citationData.url,
      title: citationData.title,
      snippet: citationData.snippet,
      refId: citationData.refId,
      position: citationData.position
    };

    return new Promise((resolve, reject) => {
      const request = store.add(citation);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Store conversation metadata
   */
  async storeConversation(conversationData) {
    const transaction = this.db.transaction(['conversations'], 'readwrite');
    const store = transaction.objectStore('conversations');

    const conversation = {
      conversationId: conversationData.conversationId,
      timestamp: Date.now(),
      title: conversationData.title,
      modelSlug: conversationData.modelSlug,
      isSearch: conversationData.isSearch || false,
      metadata: conversationData.metadata
    };

    return new Promise((resolve, reject) => {
      const request = store.put(conversation); // Use put to update if exists
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all search queries
   */
  async getAllSearchQueries(limit = 100) {
    const transaction = this.db.transaction(['searchQueries'], 'readonly');
    const store = transaction.objectStore('searchQueries');
    const index = store.index('timestamp');

    return new Promise((resolve, reject) => {
      const request = index.openCursor(null, 'prev');
      const results = [];
      let count = 0;

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor && count < limit) {
          results.push(cursor.value);
          count++;
          cursor.continue();
        } else {
          resolve(results);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all citations
   */
  async getAllCitations(limit = 500) {
    const transaction = this.db.transaction(['citations'], 'readonly');
    const store = transaction.objectStore('citations');
    const index = store.index('timestamp');

    return new Promise((resolve, reject) => {
      const request = index.openCursor(null, 'prev');
      const results = [];
      let count = 0;

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor && count < limit) {
          results.push(cursor.value);
          count++;
          cursor.continue();
        } else {
          resolve(results);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get citations by domain
   */
  async getCitationsByDomain(domain) {
    const transaction = this.db.transaction(['citations'], 'readonly');
    const store = transaction.objectStore('citations');
    const index = store.index('domain');

    return new Promise((resolve, reject) => {
      const request = index.getAll(domain);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get statistics
   */
  async getStatistics() {
    const transaction = this.db.transaction([
      'events',
      'searchQueries',
      'citations',
      'conversations'
    ], 'readonly');

    const counts = {};
    const stores = ['events', 'searchQueries', 'citations', 'conversations'];

    const promises = stores.map(storeName => {
      return new Promise((resolve, reject) => {
        const request = transaction.objectStore(storeName).count();
        request.onsuccess = () => {
          counts[storeName] = request.result;
          resolve();
        };
        request.onerror = () => reject(request.error);
      });
    });

    await Promise.all(promises);
    return counts;
  }

  /**
   * Export all data
   */
  async exportAllData() {
    const [events, queries, citations, conversations] = await Promise.all([
      this.getAllEvents(10000),
      this.getAllSearchQueries(10000),
      this.getAllCitations(10000),
      this.getAllConversations(10000)
    ]);

    return {
      exportDate: new Date().toISOString(),
      version: '1.0.0',
      data: {
        events,
        searchQueries: queries,
        citations,
        conversations
      },
      statistics: await this.getStatistics()
    };
  }

  async getAllEvents(limit = 1000) {
    const transaction = this.db.transaction(['events'], 'readonly');
    const store = transaction.objectStore('events');
    const index = store.index('timestamp');

    return new Promise((resolve, reject) => {
      const request = index.openCursor(null, 'prev');
      const results = [];
      let count = 0;

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor && count < limit) {
          results.push(cursor.value);
          count++;
          cursor.continue();
        } else {
          resolve(results);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getAllConversations(limit = 1000) {
    const transaction = this.db.transaction(['conversations'], 'readonly');
    const store = transaction.objectStore('conversations');
    const index = store.index('timestamp');

    return new Promise((resolve, reject) => {
      const request = index.openCursor(null, 'prev');
      const results = [];
      let count = 0;

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor && count < limit) {
          results.push(cursor.value);
          count++;
          cursor.continue();
        } else {
          resolve(results);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Clear all data
   */
  async clearAllData() {
    const stores = ['events', 'searchQueries', 'citations', 'conversations', 'metadata'];
    const transaction = this.db.transaction(stores, 'readwrite');

    const promises = stores.map(storeName => {
      return new Promise((resolve, reject) => {
        const request = transaction.objectStore(storeName).clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    });

    return Promise.all(promises);
  }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ChatGPTStorage;
}
