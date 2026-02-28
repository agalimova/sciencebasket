/**
 * arXiv API client.
 *
 * Uses the arXiv Atom feed API (https://info.arxiv.org/help/api/basics.html)
 * to fetch papers by category. The OAI-PMH endpoint is for bulk harvesting;
 * the Atom API is simpler for daily pulls of recent papers.
 */

const ARXIV_API = "https://export.arxiv.org/api/query";
const RESULTS_PER_PAGE = 100;
const REQUEST_DELAY_MS = 3000; // arXiv asks for 3s between requests

export interface ArxivPaper {
  arxivId: string;
  title: string;
  abstract: string;
  authors: string[];
  categories: string[];
  primaryCategory: string;
  publishedAt: string;
  updatedAt: string;
  pdfUrl: string;
  absUrl: string;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Strip arXiv version suffix: "2301.12345v2" -> "2301.12345" */
function normalizeArxivId(rawId: string): string {
  return rawId.replace(/v\d+$/, "");
}

/** Parse one Atom <entry> element into an ArxivPaper. */
function parseEntry(entry: string): ArxivPaper | null {
  const get = (tag: string): string => {
    const match = entry.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`));
    return match ? match[1].trim() : "";
  };

  const getAttr = (tag: string, attr: string): string => {
    const match = entry.match(new RegExp(`<${tag}[^>]*${attr}="([^"]*)"[^>]*/>`));
    if (match) return match[1];
    const match2 = entry.match(new RegExp(`<${tag}[^>]*${attr}="([^"]*)"[^>]*>`));
    return match2 ? match2[1] : "";
  };

  const rawId = get("id");
  if (!rawId) return null;

  const arxivId = normalizeArxivId(rawId.replace("http://arxiv.org/abs/", ""));
  const title = get("title").replace(/\s+/g, " ");
  const abstract = get("summary").replace(/\s+/g, " ");

  // Authors
  const authorMatches = [...entry.matchAll(/<author>\s*<name>([^<]+)<\/name>/g)];
  const authors = authorMatches.map((m) => m[1].trim());

  // Categories
  const catMatches = [...entry.matchAll(/<category[^>]*term="([^"]+)"/g)];
  const categories = catMatches.map((m) => m[1]);

  const primaryCategory =
    getAttr("arxiv:primary_category", "term") || categories[0] || "";

  const publishedAt = get("published");
  const updatedAt = get("updated");

  // Links
  let pdfUrl = "";
  let absUrl = "";
  const linkMatches = [...entry.matchAll(/<link[^>]*\/>/g)];
  for (const lm of linkMatches) {
    const link = lm[0];
    if (link.includes('title="pdf"')) {
      const href = link.match(/href="([^"]+)"/);
      if (href) pdfUrl = href[1];
    } else if (link.includes('type="text/html"')) {
      const href = link.match(/href="([^"]+)"/);
      if (href) absUrl = href[1];
    }
  }
  if (!absUrl) absUrl = `https://arxiv.org/abs/${arxivId}`;
  if (!pdfUrl) pdfUrl = `https://arxiv.org/pdf/${arxivId}`;

  if (!title || !abstract) return null;

  return {
    arxivId,
    title,
    abstract,
    authors,
    categories,
    primaryCategory,
    publishedAt,
    updatedAt,
    pdfUrl,
    absUrl,
  };
}

/**
 * Fetch recent papers from arXiv for a set of categories.
 *
 * @param categories arXiv category codes, e.g. ["cs.LG", "stat.ML"]
 * @param maxResults maximum papers to fetch (across all pages)
 * @param daysBack how many days back to search (default 7)
 */
export async function fetchRecentPapers(
  categories: string[],
  maxResults = 500,
  daysBack = 7
): Promise<ArxivPaper[]> {
  const catQuery = categories.map((c) => `cat:${c}`).join("+OR+");
  const results: ArxivPaper[] = [];
  let start = 0;

  while (start < maxResults) {
    const batchSize = Math.min(RESULTS_PER_PAGE, maxResults - start);
    const url =
      `${ARXIV_API}?search_query=${catQuery}` +
      `&start=${start}&max_results=${batchSize}` +
      `&sortBy=submittedDate&sortOrder=descending`;

    console.log(`  Fetching arXiv batch: start=${start}, max=${batchSize}`);
    const resp = await fetch(url);
    if (!resp.ok) {
      console.error(`  arXiv API error: ${resp.status} ${resp.statusText}`);
      break;
    }

    const xml = await resp.text();

    // Split entries
    const entries = xml.split("<entry>").slice(1); // first element is header
    if (entries.length === 0) break;

    for (const raw of entries) {
      const paper = parseEntry("<entry>" + raw);
      if (!paper) continue;

      // Filter by date
      const pubDate = new Date(paper.publishedAt);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - daysBack);
      if (pubDate < cutoff) continue;

      results.push(paper);
    }

    start += batchSize;
    if (entries.length < batchSize) break; // no more results

    await sleep(REQUEST_DELAY_MS);
  }

  return results;
}
