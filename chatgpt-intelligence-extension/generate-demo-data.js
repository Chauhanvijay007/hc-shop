#!/usr/bin/env node
/**
 * Generate demo data for testing the extension
 * This simulates what the extension would capture
 */

const fs = require('fs');

console.log('🎲 Generating demo data...\n');

// Sample search queries
const sampleQueries = [
  {
    query: "best SEO tools for 2025",
    timestamp: Date.now() - 3600000,
    conversationId: "conv-001",
    messageId: "msg-001",
    classification: {
      simpleSearchProb: 0.994,
      complexSearchProb: 0.002,
      noSearchProb: 0.004,
      decisionSource: "classifier"
    }
  },
  {
    query: "how to improve website speed",
    timestamp: Date.now() - 7200000,
    conversationId: "conv-002",
    messageId: "msg-002",
    classification: {
      simpleSearchProb: 0.987,
      complexSearchProb: 0.008,
      noSearchProb: 0.005,
      decisionSource: "classifier"
    }
  },
  {
    query: "top content marketing strategies",
    timestamp: Date.now() - 10800000,
    conversationId: "conv-003",
    messageId: "msg-003",
    classification: {
      simpleSearchProb: 0.992,
      complexSearchProb: 0.003,
      noSearchProb: 0.005,
      decisionSource: "classifier"
    }
  }
];

// Sample citations
const sampleCitations = [
  // Query 1 citations
  {
    timestamp: Date.now() - 3600000,
    conversationId: "conv-001",
    query: "best SEO tools for 2025",
    domain: "backlinko.com",
    url: "https://backlinko.com/best-free-seo-tools",
    title: "12 Best SEO Tools for 2025",
    snippet: "Comprehensive guide to the best SEO tools...",
    position: 1
  },
  {
    timestamp: Date.now() - 3600000,
    conversationId: "conv-001",
    query: "best SEO tools for 2025",
    domain: "semrush.com",
    url: "https://www.semrush.com/blog/seo-tools/",
    title: "25 Best SEO Tools (Free & Paid)",
    snippet: "A complete list of SEO tools for every need...",
    position: 2
  },
  {
    timestamp: Date.now() - 3600000,
    conversationId: "conv-001",
    query: "best SEO tools for 2025",
    domain: "ahrefs.com",
    url: "https://ahrefs.com/blog/free-seo-tools/",
    title: "18 Best Free SEO Tools",
    snippet: "Our favorite free SEO tools that actually work...",
    position: 3
  },
  {
    timestamp: Date.now() - 3600000,
    conversationId: "conv-001",
    query: "best SEO tools for 2025",
    domain: "moz.com",
    url: "https://moz.com/blog/seo-tools",
    title: "The Ultimate Guide to SEO Tools",
    snippet: "Everything you need to know about SEO tools...",
    position: 4
  },
  {
    timestamp: Date.now() - 3600000,
    conversationId: "conv-001",
    query: "best SEO tools for 2025",
    domain: "hubspot.com",
    url: "https://www.hubspot.com/marketing/seo-tools",
    title: "16 Free SEO Tools",
    snippet: "Free SEO tools to improve your marketing...",
    position: 5
  },

  // Query 2 citations
  {
    timestamp: Date.now() - 7200000,
    conversationId: "conv-002",
    query: "how to improve website speed",
    domain: "web.dev",
    url: "https://web.dev/fast/",
    title: "Fast load times",
    snippet: "Techniques to make your website faster...",
    position: 1
  },
  {
    timestamp: Date.now() - 7200000,
    conversationId: "conv-002",
    query: "how to improve website speed",
    domain: "gtmetrix.com",
    url: "https://gtmetrix.com/blog/",
    title: "7 Ways to Improve Website Speed",
    snippet: "Proven methods to boost website performance...",
    position: 2
  },
  {
    timestamp: Date.now() - 7200000,
    conversationId: "conv-002",
    query: "how to improve website speed",
    domain: "cloudflare.com",
    url: "https://www.cloudflare.com/learning/performance/",
    title: "Website Performance Optimization",
    snippet: "Learn how to optimize website performance...",
    position: 3
  },

  // Query 3 citations
  {
    timestamp: Date.now() - 10800000,
    conversationId: "conv-003",
    query: "top content marketing strategies",
    domain: "contentmarketinginstitute.com",
    url: "https://contentmarketinginstitute.com/articles/",
    title: "Content Marketing Strategy Guide",
    snippet: "The ultimate guide to content marketing...",
    position: 1
  },
  {
    timestamp: Date.now() - 10800000,
    conversationId: "conv-003",
    query: "top content marketing strategies",
    domain: "hubspot.com",
    url: "https://www.hubspot.com/content-marketing",
    title: "Content Marketing: The Complete Guide",
    snippet: "Everything you need for successful content marketing...",
    position: 2
  },
  {
    timestamp: Date.now() - 10800000,
    conversationId: "conv-003",
    query: "top content marketing strategies",
    domain: "neilpatel.com",
    url: "https://neilpatel.com/blog/content-marketing-strategies/",
    title: "11 Content Marketing Strategies",
    snippet: "Proven content marketing strategies that work...",
    position: 3
  }
];

// Generate export format
const exportData = {
  exportDate: new Date().toISOString(),
  version: "1.0.0",
  statistics: {
    events: 177,
    searches: sampleQueries.length,
    citations: sampleCitations.length
  },
  data: {
    searchQueries: sampleQueries,
    citations: sampleCitations
  }
};

// Save JSON
fs.writeFileSync('demo-data.json', JSON.stringify(exportData, null, 2));
console.log('✓ Created demo-data.json');

// Generate CSV
const csvLines = [];

// Citations CSV
csvLines.push('=== CITATIONS ===');
csvLines.push('Timestamp,Domain,URL,Title,Position,Query,Conversation ID');

for (const citation of sampleCitations) {
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
csvLines.push('Timestamp,Query,Conversation ID,Search Type,Confidence');

for (const query of sampleQueries) {
  const searchType = query.classification.simpleSearchProb > 0.5 ? 'simple' : 'complex';
  const confidence = (query.classification.simpleSearchProb * 100).toFixed(1) + '%';
  const line = [
    new Date(query.timestamp).toISOString(),
    (query.query || '').replace(/,/g, ';'),
    query.conversationId || '',
    searchType,
    confidence
  ].join(',');
  csvLines.push(line);
}

fs.writeFileSync('demo-data.csv', csvLines.join('\n'));
console.log('✓ Created demo-data.csv');

// Generate summary
console.log('\n📊 Demo Data Summary:');
console.log('─'.repeat(50));
console.log(`Search Queries: ${sampleQueries.length}`);
console.log(`Citations: ${sampleCitations.length}`);
console.log(`Unique Domains: ${new Set(sampleCitations.map(c => c.domain)).size}`);
console.log(`Unique Conversations: ${new Set(sampleQueries.map(q => q.conversationId)).size}`);
console.log('─'.repeat(50));

console.log('\n📁 Files created:');
console.log('  • demo-data.json - Full export format');
console.log('  • demo-data.csv  - CSV format for Excel');

console.log('\n💡 Usage:');
console.log('  1. Import demo-data.csv into Excel/Google Sheets');
console.log('  2. Create pivot tables and charts');
console.log('  3. Practice analysis techniques');

console.log('\n✅ Demo data generation complete!\n');
