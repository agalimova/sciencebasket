/**
 * Daily arXiv crawler.
 *
 * Fetches recent papers for all 5 fields, deduplicates by arxiv_id,
 * assigns to field based on primary category, and inserts into DB.
 *
 * Usage: npm run crawl
 * Or with env: DAYS_BACK=30 npm run crawl   (for backfilling)
 */

import { db } from "../db";
import { papers, fields as fieldsTable } from "../db/schema";
import { FIELDS, type FieldId, FIELD_IDS } from "../types/fields";
import { fetchRecentPapers, type ArxivPaper } from "../lib/arxiv";
import { eq } from "drizzle-orm";

const DAYS_BACK = parseInt(process.env.DAYS_BACK ?? "7", 10);
const MAX_PER_FIELD = parseInt(process.env.MAX_PER_FIELD ?? "500", 10);

/** Determine which field a paper belongs to based on its primary category. */
function assignField(paper: ArxivPaper): FieldId | null {
  for (const fieldId of FIELD_IDS) {
    const field = FIELDS[fieldId];
    if ((field.arxivCategories as readonly string[]).includes(paper.primaryCategory)) {
      return fieldId;
    }
  }
  // Fallback: check all categories
  for (const fieldId of FIELD_IDS) {
    const field = FIELDS[fieldId];
    for (const cat of paper.categories) {
      if ((field.arxivCategories as readonly string[]).includes(cat)) {
        return fieldId;
      }
    }
  }
  return null;
}

async function ensureFieldsExist() {
  for (const fieldId of FIELD_IDS) {
    const field = FIELDS[fieldId];
    const existing = await db
      .select()
      .from(fieldsTable)
      .where(eq(fieldsTable.id, fieldId))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(fieldsTable).values({
        id: fieldId,
        name: field.name,
        color: field.color,
        description: field.description,
      });
    }
  }
}

async function main() {
  console.log(`\n=== ScienceBasket arXiv Crawler ===`);
  console.log(`Days back: ${DAYS_BACK}, Max per field: ${MAX_PER_FIELD}\n`);

  await ensureFieldsExist();

  // Collect all unique categories across fields
  const allCategories = new Set<string>();
  for (const fieldId of FIELD_IDS) {
    for (const cat of FIELDS[fieldId].arxivCategories) {
      allCategories.add(cat);
    }
  }

  console.log(`Fetching papers from ${allCategories.size} arXiv categories...`);
  const rawPapers = await fetchRecentPapers(
    [...allCategories],
    MAX_PER_FIELD * FIELD_IDS.length,
    DAYS_BACK
  );
  console.log(`Fetched ${rawPapers.length} raw papers from arXiv.\n`);

  // Deduplicate and assign fields
  const seen = new Set<string>();
  let inserted = 0;
  let skipped = 0;
  let noField = 0;

  for (const paper of rawPapers) {
    if (seen.has(paper.arxivId)) {
      skipped++;
      continue;
    }
    seen.add(paper.arxivId);

    const fieldId = assignField(paper);
    if (!fieldId) {
      noField++;
      continue;
    }

    // Upsert: skip if already in DB
    try {
      await db
        .insert(papers)
        .values({
          arxivId: paper.arxivId,
          title: paper.title,
          abstract: paper.abstract,
          authors: JSON.stringify(paper.authors),
          categories: JSON.stringify(paper.categories),
          primaryCategory: paper.primaryCategory,
          fieldId,
          publishedAt: paper.publishedAt,
          updatedAt: paper.updatedAt,
          pdfUrl: paper.pdfUrl,
          absUrl: paper.absUrl,
        })
        .onConflictDoNothing();
      inserted++;
    } catch (err) {
      // Already exists
      skipped++;
    }
  }

  console.log(`Done!`);
  console.log(`  Inserted: ${inserted}`);
  console.log(`  Skipped (duplicate): ${skipped}`);
  console.log(`  Skipped (no field match): ${noField}`);

  // Print per-field counts
  for (const fieldId of FIELD_IDS) {
    const count = await db
      .select()
      .from(papers)
      .where(eq(papers.fieldId, fieldId));
    console.log(`  ${FIELDS[fieldId].name}: ${count.length} papers`);
  }
}

main().catch(console.error);
