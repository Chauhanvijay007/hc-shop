import axios from 'axios'
import { parseStringPromise } from 'xml2js'

export interface SitemapUrl {
  loc: string
  lastmod?: string
  changefreq?: string
  priority?: string
}

export interface SitemapParseResult {
  urls: SitemapUrl[]
  isSitemapIndex: boolean
  childSitemaps: string[]
  totalUrls: number
}

/**
 * Parse XML sitemap and extract URLs
 */
export async function parseSitemap(sitemapUrl: string): Promise<SitemapParseResult> {
  try {
    console.log(`📥 Fetching sitemap: ${sitemapUrl}`)

    // Fetch sitemap content
    const response = await axios.get(sitemapUrl, {
      timeout: 30000, // 30 second timeout
      headers: {
        'User-Agent': 'Indexing-Insight-Bot/1.0',
      },
      maxContentLength: 50 * 1024 * 1024, // 50MB max
    })

    const xmlContent = response.data

    // Parse XML
    const parsed = await parseStringPromise(xmlContent, {
      trim: true,
      explicitArray: false,
    })

    // Check if this is a sitemap index
    if (parsed.sitemapindex) {
      console.log('📑 Sitemap index detected')
      return parseSitemapIndex(parsed.sitemapindex)
    }

    // Regular sitemap
    if (parsed.urlset) {
      console.log('📄 Regular sitemap detected')
      return parseRegularSitemap(parsed.urlset)
    }

    throw new Error('Invalid sitemap format: no urlset or sitemapindex found')
  } catch (error: any) {
    console.error(`❌ Failed to parse sitemap ${sitemapUrl}:`, error.message)
    throw new Error(`Failed to parse sitemap: ${error.message}`)
  }
}

/**
 * Parse sitemap index (contains links to other sitemaps)
 */
function parseSitemapIndex(sitemapindex: any): SitemapParseResult {
  const sitemaps = Array.isArray(sitemapindex.sitemap)
    ? sitemapindex.sitemap
    : [sitemapindex.sitemap]

  const childSitemaps = sitemaps
    .filter((sm: any) => sm && sm.loc)
    .map((sm: any) => sm.loc)

  return {
    urls: [],
    isSitemapIndex: true,
    childSitemaps,
    totalUrls: 0,
  }
}

/**
 * Parse regular sitemap (contains URLs)
 */
function parseRegularSitemap(urlset: any): SitemapParseResult {
  const urlEntries = Array.isArray(urlset.url) ? urlset.url : [urlset.url]

  const urls: SitemapUrl[] = urlEntries
    .filter((entry: any) => entry && entry.loc)
    .map((entry: any) => ({
      loc: entry.loc,
      lastmod: entry.lastmod || undefined,
      changefreq: entry.changefreq || undefined,
      priority: entry.priority || undefined,
    }))

  return {
    urls,
    isSitemapIndex: false,
    childSitemaps: [],
    totalUrls: urls.length,
  }
}

/**
 * Recursively fetch and parse all sitemaps (including sitemap indexes)
 */
export async function fetchAllSitemapUrls(
  sitemapUrl: string,
  maxDepth: number = 3,
  currentDepth: number = 0
): Promise<SitemapUrl[]> {
  if (currentDepth >= maxDepth) {
    console.warn(`⚠️ Max depth ${maxDepth} reached, stopping recursion`)
    return []
  }

  const result = await parseSitemap(sitemapUrl)

  // If it's a sitemap index, recursively fetch child sitemaps
  if (result.isSitemapIndex && result.childSitemaps.length > 0) {
    console.log(`📑 Processing ${result.childSitemaps.length} child sitemaps...`)

    const allUrls: SitemapUrl[] = []

    for (const childSitemapUrl of result.childSitemaps) {
      try {
        const childUrls = await fetchAllSitemapUrls(
          childSitemapUrl,
          maxDepth,
          currentDepth + 1
        )
        allUrls.push(...childUrls)
      } catch (error) {
        console.error(`Failed to fetch child sitemap ${childSitemapUrl}:`, error)
        // Continue with other sitemaps even if one fails
      }
    }

    return allUrls
  }

  // Regular sitemap, return URLs
  return result.urls
}

/**
 * Validate sitemap URL format
 */
export function isValidSitemapUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return (
      (parsed.protocol === 'http:' || parsed.protocol === 'https:') &&
      (url.endsWith('.xml') || url.includes('sitemap'))
    )
  } catch {
    return false
  }
}

/**
 * Extract unique URLs from sitemap results
 */
export function extractUniqueUrls(sitemapUrls: SitemapUrl[]): string[] {
  const uniqueUrls = new Set<string>()

  for (const entry of sitemapUrls) {
    if (entry.loc) {
      uniqueUrls.add(entry.loc)
    }
  }

  return Array.from(uniqueUrls)
}
