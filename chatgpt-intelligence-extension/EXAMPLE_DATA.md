# Example Captured Data

This document shows examples of the data captured by the extension.

## Search Query Example

```json
{
  "timestamp": 1731575387000,
  "query": "best SEO tools for 2025",
  "conversationId": "6916c164-2d4c-832c-a770-403e79c95551",
  "messageId": "c017a42f-c419-416b-ba1e-819188e03902",
  "classification": {
    "simpleSearchProb": 0.9942951285278151,
    "complexSearchProb": 0.0016373352150678118,
    "noSearchProb": 0.004067536257117091,
    "simpleSearchThreshold": 0,
    "complexSearchThreshold": 0.4,
    "noSearchThreshold": 0.12,
    "classifierConfig": "sonic_classifier_3cls_ev3",
    "decisionSource": "classifier",
    "latencyMs": 76.93
  }
}
```

## Citation Example

```json
{
  "timestamp": 1731575390000,
  "conversationId": "6916c164-2d4c-832c-a770-403e79c95551",
  "query": "best SEO tools for 2025",
  "domain": "backlinko.com",
  "url": "https://backlinko.com/best-free-seo-tools",
  "title": "12 Best SEO Tools for 2025",
  "snippet": "12 Best SEO Tools for 2025 · 1. Semrush · 2. SEOGets · 3. Ahrefs...",
  "refId": {
    "ref": 1,
    "spanId": "span-xyz"
  },
  "position": 1
}
```

## Full Export Example (JSON)

```json
{
  "exportDate": "2025-11-14T10:30:00.000Z",
  "version": "1.0.0",
  "statistics": {
    "events": 177,
    "searches": 12,
    "citations": 35
  },
  "data": {
    "searchQueries": [
      {
        "timestamp": 1731575387000,
        "query": "best SEO tools for 2025",
        "conversationId": "6916c164-2d4c-832c-a770-403e79c95551",
        "classification": {
          "simpleSearchProb": 0.994,
          "complexSearchProb": 0.002,
          "noSearchProb": 0.004
        }
      },
      {
        "timestamp": 1731575400000,
        "query": "how to do keyword research",
        "conversationId": "6916c164-2d4c-832c-a770-403e79c95552",
        "classification": {
          "simpleSearchProb": 0.987,
          "complexSearchProb": 0.008,
          "noSearchProb": 0.005
        }
      }
    ],
    "citations": [
      {
        "timestamp": 1731575390000,
        "domain": "backlinko.com",
        "url": "https://backlinko.com/best-free-seo-tools",
        "title": "12 Best SEO Tools for 2025",
        "position": 1,
        "query": "best SEO tools for 2025"
      },
      {
        "timestamp": 1731575391000,
        "domain": "semrush.com",
        "url": "https://www.semrush.com/blog/seo-tools/",
        "title": "25 Best SEO Tools (Free & Paid)",
        "position": 2,
        "query": "best SEO tools for 2025"
      },
      {
        "timestamp": 1731575392000,
        "domain": "ahrefs.com",
        "url": "https://ahrefs.com/blog/free-seo-tools/",
        "title": "18 Best Free SEO Tools",
        "position": 3,
        "query": "best SEO tools for 2025"
      }
    ]
  }
}
```

## CSV Export Example

### Citations CSV

```csv
Timestamp,Domain,URL,Title,Position,Query,Conversation ID
2025-11-14T10:29:50.000Z,backlinko.com,https://backlinko.com/best-free-seo-tools,12 Best SEO Tools for 2025,1,best SEO tools for 2025,6916c164-2d4c-832c-a770-403e79c95551
2025-11-14T10:29:51.000Z,semrush.com,https://www.semrush.com/blog/seo-tools/,25 Best SEO Tools (Free & Paid),2,best SEO tools for 2025,6916c164-2d4c-832c-a770-403e79c95551
2025-11-14T10:29:52.000Z,ahrefs.com,https://ahrefs.com/blog/free-seo-tools/,18 Best Free SEO Tools,3,best SEO tools for 2025,6916c164-2d4c-832c-a770-403e79c95551
```

### Search Queries CSV

```csv
Timestamp,Query,Conversation ID,Search Type
2025-11-14T10:29:47.000Z,best SEO tools for 2025,6916c164-2d4c-832c-a770-403e79c95551,simple
2025-11-14T10:30:00.000Z,how to do keyword research,6916c164-2d4c-832c-a770-403e79c95552,simple
```

## Use Case Examples

### 1. Track Your Domain

**Goal**: See how often "yourdomain.com" is cited by ChatGPT

**Steps**:
1. Open dashboard
2. Filter citations by domain: "yourdomain.com"
3. Analyze results:
   - Total citations
   - Average position
   - Which queries trigger citations
   - Trends over time

**Example Results**:
```
Domain: yourdomain.com
Total Citations: 15
Average Position: 3.2
Top Triggering Query: "marketing automation tools"
Date Range: Last 30 days
```

### 2. Competitive Analysis

**Goal**: Compare your domain vs competitors

**Steps**:
1. Export data as CSV
2. Import to Excel/Google Sheets
3. Create pivot table by domain
4. Analyze citation frequency and position

**Example Analysis**:
```
Domain              Citations  Avg Position
competitor1.com     45         2.1
yourdomain.com      32         3.4
competitor2.com     28         4.2
```

### 3. Content Strategy

**Goal**: Identify what content ChatGPT recommends

**Steps**:
1. Review search queries
2. Look for patterns in queries
3. Check which URLs get cited
4. Identify content gaps

**Example Insights**:
```
Trending Topics:
- "AI SEO tools" (12 queries)
- "keyword research" (8 queries)
- "link building" (6 queries)

Most Cited Content Types:
- Listicles ("12 Best...", "Top 10...")
- How-to guides
- Tool comparisons
```

### 4. Search Pattern Analysis

**Goal**: Understand when ChatGPT searches vs uses knowledge

**Steps**:
1. Review classification data
2. Identify high-confidence searches (>95%)
3. Find patterns in query structure

**Example Patterns**:
```
High Search Probability (>95%):
- "best [topic] in [year]"
- "top [number] [topic]"
- "how to [action] in [year]"
- "[topic] tools"

Low Search Probability (<10%):
- "what is [concept]"
- "explain [topic]"
- General knowledge questions
```

## Data Analysis Tips

### Using Excel/Google Sheets

1. **Import CSV**
   - File → Import → Upload CSV
   - Select delimiter: comma

2. **Create Pivot Table**
   - Select data range
   - Insert → Pivot Table
   - Rows: Domain
   - Values: Count of citations

3. **Visualize**
   - Insert → Chart
   - Choose bar or line chart
   - Customize colors and labels

### Using SQL (Advanced)

For very large datasets, export and import to SQLite:

```sql
-- Create tables
CREATE TABLE citations (
  id INTEGER PRIMARY KEY,
  timestamp DATETIME,
  domain TEXT,
  url TEXT,
  title TEXT,
  position INTEGER,
  query TEXT
);

-- Analyze top domains
SELECT domain, COUNT(*) as citation_count
FROM citations
GROUP BY domain
ORDER BY citation_count DESC
LIMIT 10;

-- Average position by domain
SELECT domain, AVG(position) as avg_position
FROM citations
GROUP BY domain
ORDER BY avg_position ASC;

-- Citations over time
SELECT DATE(timestamp) as date, COUNT(*) as daily_citations
FROM citations
GROUP BY date
ORDER BY date DESC;
```

### Using Python (Advanced)

```python
import json
import pandas as pd

# Load exported JSON
with open('export.json') as f:
    data = json.load(f)

# Convert to DataFrame
citations_df = pd.DataFrame(data['data']['citations'])

# Analyze
top_domains = citations_df['domain'].value_counts()
print("Top 10 Domains:")
print(top_domains.head(10))

# Average position by domain
avg_position = citations_df.groupby('domain')['position'].mean()
print("\nAverage Position by Domain:")
print(avg_position.sort_values())

# Plot
import matplotlib.pyplot as plt
top_domains.head(10).plot(kind='bar')
plt.title('Top 10 Cited Domains')
plt.xlabel('Domain')
plt.ylabel('Citations')
plt.show()
```

## Privacy Note

All data is stored locally in your browser. Nothing is sent to external servers. You have full control over your data.

To clear all data:
1. Open extension popup
2. Click "Clear Data"
3. Confirm deletion

Or manually:
1. Go to `chrome://extensions/`
2. Find extension → Details
3. Site Settings → Clear Storage
