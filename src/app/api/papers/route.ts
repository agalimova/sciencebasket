import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { papers, paperTags, tags } from "@/db/schema";
import { eq, desc, and, sql, like } from "drizzle-orm";
import { FIELD_IDS, type FieldId } from "@/types/fields";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const field = searchParams.get("field") as FieldId | null;
  const search = searchParams.get("q");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "25", 10));

  const conditions = [];
  if (field && FIELD_IDS.includes(field)) {
    conditions.push(eq(papers.fieldId, field));
  }
  if (search) {
    conditions.push(like(papers.title, `%${search}%`));
  }

  const results = await db
    .select()
    .from(papers)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(papers.publishedAt))
    .limit(limit)
    .offset((page - 1) * limit);

  return NextResponse.json({
    papers: results,
    page,
    limit,
    count: results.length,
  });
}
