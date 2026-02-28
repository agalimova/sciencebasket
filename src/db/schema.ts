import { sql } from "drizzle-orm";
import {
  sqliteTable,
  text,
  integer,
  real,
  index,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

// ---------------------------------------------------------------------------
// Core domain tables
// ---------------------------------------------------------------------------

/** Scientific fields (comp-bio, ml-ai, quantum, climate-tech, robotics) */
export const fields = sqliteTable("fields", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  color: text("color").notNull(),
  description: text("description"),
});

/** Tag ontology — skills, topics, techniques. Shared across papers and jobs. */
export const tags = sqliteTable(
  "tags",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    fieldId: text("field_id")
      .notNull()
      .references(() => fields.id),
    category: text("category"), // e.g. "technique", "tool", "concept", "organism"
    parentId: integer("parent_id"), // self-reference for hierarchy
    paperCount: integer("paper_count").default(0),
    jobCount: integer("job_count").default(0),
  },
  (t) => [
    uniqueIndex("tags_slug_field_idx").on(t.slug, t.fieldId),
    index("tags_field_idx").on(t.fieldId),
  ]
);

// ---------------------------------------------------------------------------
// Papers (from arXiv)
// ---------------------------------------------------------------------------

export const papers = sqliteTable(
  "papers",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    arxivId: text("arxiv_id").notNull().unique(),
    title: text("title").notNull(),
    abstract: text("abstract").notNull(),
    authors: text("authors").notNull(), // JSON array of author names
    categories: text("categories").notNull(), // JSON array of arXiv categories
    primaryCategory: text("primary_category").notNull(),
    fieldId: text("field_id")
      .notNull()
      .references(() => fields.id),
    publishedAt: text("published_at").notNull(),
    updatedAt: text("updated_at"),
    pdfUrl: text("pdf_url"),
    absUrl: text("abs_url"),
    crawledAt: text("crawled_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (t) => [
    index("papers_field_idx").on(t.fieldId),
    index("papers_published_idx").on(t.publishedAt),
    index("papers_primary_cat_idx").on(t.primaryCategory),
  ]
);

/** Many-to-many: papers <-> tags */
export const paperTags = sqliteTable(
  "paper_tags",
  {
    paperId: integer("paper_id")
      .notNull()
      .references(() => papers.id, { onDelete: "cascade" }),
    tagId: integer("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
    confidence: real("confidence").default(1.0), // LLM extraction confidence
  },
  (t) => [
    uniqueIndex("paper_tags_pk").on(t.paperId, t.tagId),
    index("paper_tags_tag_idx").on(t.tagId),
  ]
);

// ---------------------------------------------------------------------------
// Authors
// ---------------------------------------------------------------------------

export const authors = sqliteTable(
  "authors",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    normalizedName: text("normalized_name").notNull(),
    affiliations: text("affiliations"), // JSON array
    paperCount: integer("paper_count").default(0),
  },
  (t) => [
    index("authors_norm_name_idx").on(t.normalizedName),
  ]
);

/** Many-to-many: papers <-> authors */
export const paperAuthors = sqliteTable(
  "paper_authors",
  {
    paperId: integer("paper_id")
      .notNull()
      .references(() => papers.id, { onDelete: "cascade" }),
    authorId: integer("author_id")
      .notNull()
      .references(() => authors.id, { onDelete: "cascade" }),
    position: integer("position").notNull(), // 0-indexed author position
  },
  (t) => [
    uniqueIndex("paper_authors_pk").on(t.paperId, t.authorId),
  ]
);

// ---------------------------------------------------------------------------
// Jobs
// ---------------------------------------------------------------------------

export const jobs = sqliteTable(
  "jobs",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    externalId: text("external_id"), // ID from source job board
    source: text("source").notNull(), // "adzuna", "linkedin", "manual"
    title: text("title").notNull(),
    company: text("company").notNull(),
    location: text("location"),
    country: text("country"),
    region: text("region"),
    remote: integer("remote", { mode: "boolean" }).default(false),
    fieldId: text("field_id")
      .notNull()
      .references(() => fields.id),
    description: text("description"),
    salaryMin: real("salary_min"),
    salaryMax: real("salary_max"),
    salaryCurrency: text("salary_currency").default("USD"),
    employmentType: text("employment_type"), // full-time, part-time, contract, internship
    seniorityLevel: text("seniority_level"), // intern, junior, mid, senior, lead, exec
    url: text("url").notNull(),
    postedAt: text("posted_at"),
    expiresAt: text("expires_at"),
    crawledAt: text("crawled_at")
      .notNull()
      .default(sql`(datetime('now'))`),
    active: integer("active", { mode: "boolean" }).default(true),
  },
  (t) => [
    index("jobs_field_idx").on(t.fieldId),
    index("jobs_posted_idx").on(t.postedAt),
    index("jobs_company_idx").on(t.company),
    index("jobs_active_idx").on(t.active),
  ]
);

/** Many-to-many: jobs <-> tags */
export const jobTags = sqliteTable(
  "job_tags",
  {
    jobId: integer("job_id")
      .notNull()
      .references(() => jobs.id, { onDelete: "cascade" }),
    tagId: integer("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
    confidence: real("confidence").default(1.0),
  },
  (t) => [
    uniqueIndex("job_tags_pk").on(t.jobId, t.tagId),
    index("job_tags_tag_idx").on(t.tagId),
  ]
);
