import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { papers, fields as fieldsTable } from "@/db/schema";
import { FIELDS, type FieldId, FIELD_IDS } from "@/types/fields";
import { fetchRecentPapers, type ArxivPaper } from "@/lib/arxiv";
import { eq } from "drizzle-orm";

export const maxDuration = 300; // 5 min max (Vercel Pro), 60s on free tier
export const dynamic = "force-dynamic";

function assignField(paper: ArxivPaper): FieldId | null {
  for (const fieldId of FIELD_IDS) {
    const field = FIELDS[fieldId];
    if (
      (field.arxivCategories as readonly string[]).includes(
        paper.primaryCategory
      )
    ) {
      return fieldId;
    }
  }
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

export async function GET(request: NextRequest) {
  // Verify cron secret — Vercel sets this header automatically for cron jobs
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();

  try {
    await ensureFieldsExist();

    // Collect categories
    const allCategories = new Set<string>();
    for (const fieldId of FIELD_IDS) {
      for (const cat of FIELDS[fieldId].arxivCategories) {
        allCategories.add(cat);
      }
    }

    // Fetch last 2 days (overlap ensures we don't miss anything)
    const rawPapers = await fetchRecentPapers([...allCategories], 2500, 2);

    const seen = new Set<string>();
    let inserted = 0;
    let skipped = 0;
    let noField = 0;
    const perField: Record<string, number> = {};

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
        perField[fieldId] = (perField[fieldId] ?? 0) + 1;
      } catch {
        skipped++;
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    return NextResponse.json({
      ok: true,
      fetched: rawPapers.length,
      inserted,
      skipped,
      noField,
      perField,
      durationSeconds: parseFloat(duration),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}
