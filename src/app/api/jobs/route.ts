import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { jobs } from "@/db/schema";
import { eq, desc, and, like } from "drizzle-orm";
import { FIELD_IDS, type FieldId } from "@/types/fields";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const field = searchParams.get("field") as FieldId | null;
  const search = searchParams.get("q");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "25", 10));

  const conditions = [eq(jobs.active, true)];
  if (field && FIELD_IDS.includes(field)) {
    conditions.push(eq(jobs.fieldId, field));
  }
  if (search) {
    conditions.push(like(jobs.title, `%${search}%`));
  }

  const results = await db
    .select()
    .from(jobs)
    .where(and(...conditions))
    .orderBy(desc(jobs.postedAt))
    .limit(limit)
    .offset((page - 1) * limit);

  return NextResponse.json({
    jobs: results,
    page,
    limit,
    count: results.length,
  });
}
