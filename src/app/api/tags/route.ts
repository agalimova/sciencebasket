import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { tags } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { FIELD_IDS, type FieldId } from "@/types/fields";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const field = searchParams.get("field") as FieldId | null;

  let results;
  if (field && FIELD_IDS.includes(field)) {
    results = await db
      .select()
      .from(tags)
      .where(eq(tags.fieldId, field))
      .orderBy(desc(tags.paperCount));
  } else {
    results = await db
      .select()
      .from(tags)
      .orderBy(desc(tags.paperCount));
  }

  return NextResponse.json({ tags: results, count: results.length });
}
