import { db } from "@/db";
import { jobs } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { FIELDS, FIELD_IDS, type FieldId } from "@/types/fields";
import { FieldBadge } from "@/components/ui/field-badge";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface JobsPageProps {
  searchParams: Promise<{ field?: string; page?: string }>;
}

const PAGE_SIZE = 25;

export default async function JobsPage({ searchParams }: JobsPageProps) {
  const params = await searchParams;
  const fieldFilter = params.field as FieldId | undefined;
  const pageNum = Math.max(1, parseInt(params.page ?? "1", 10));

  let jobList: {
    id: number;
    title: string;
    company: string;
    location: string | null;
    fieldId: string;
    salaryMin: number | null;
    salaryMax: number | null;
    salaryCurrency: string | null;
    employmentType: string | null;
    seniorityLevel: string | null;
    url: string;
    postedAt: string | null;
    remote: boolean | null;
  }[] = [];

  try {
    const conditions = [eq(jobs.active, true)];
    if (fieldFilter && FIELD_IDS.includes(fieldFilter)) {
      conditions.push(eq(jobs.fieldId, fieldFilter));
    }

    jobList = await db
      .select({
        id: jobs.id,
        title: jobs.title,
        company: jobs.company,
        location: jobs.location,
        fieldId: jobs.fieldId,
        salaryMin: jobs.salaryMin,
        salaryMax: jobs.salaryMax,
        salaryCurrency: jobs.salaryCurrency,
        employmentType: jobs.employmentType,
        seniorityLevel: jobs.seniorityLevel,
        url: jobs.url,
        postedAt: jobs.postedAt,
        remote: jobs.remote,
      })
      .from(jobs)
      .where(and(...conditions))
      .orderBy(desc(jobs.postedAt))
      .limit(PAGE_SIZE)
      .offset((pageNum - 1) * PAGE_SIZE);
  } catch {
    // DB not ready
  }

  function formatSalary(min: number | null, max: number | null, currency: string | null) {
    if (!min && !max) return null;
    const fmt = (n: number) =>
      `${currency ?? "$"}${(n / 1000).toFixed(0)}k`;
    if (min && max) return `${fmt(min)} - ${fmt(max)}`;
    if (min) return `From ${fmt(min)}`;
    return `Up to ${fmt(max!)}`;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Jobs
        </h1>
        <div className="flex gap-2">
          <Link
            href="/jobs"
            className={`px-3 py-1 text-sm rounded-full transition-colors ${
              !fieldFilter
                ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400"
            }`}
          >
            All
          </Link>
          {FIELD_IDS.map((fid) => (
            <Link
              key={fid}
              href={`/jobs?field=${fid}`}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                fieldFilter === fid
                  ? "text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400"
              }`}
              style={
                fieldFilter === fid
                  ? { backgroundColor: FIELDS[fid].color }
                  : undefined
              }
            >
              {FIELDS[fid].name}
            </Link>
          ))}
        </div>
      </div>

      {jobList.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg">No jobs yet.</p>
          <p className="text-sm mt-2">
            Job scraping will be enabled soon. You can also add jobs manually
            via the API.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {jobList.map((job) => {
            const salary = formatSalary(
              job.salaryMin,
              job.salaryMax,
              job.salaryCurrency
            );
            return (
              <a
                key={job.id}
                href={job.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <FieldBadge
                        fieldId={job.fieldId as FieldId}
                        size="sm"
                      />
                      {job.employmentType && (
                        <span className="text-xs text-gray-400">
                          {job.employmentType}
                        </span>
                      )}
                      {job.remote && (
                        <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-0.5 rounded-full">
                          Remote
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {job.title}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {job.company}
                      {job.location && ` · ${job.location}`}
                    </p>
                  </div>
                  {salary && (
                    <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                      {salary}
                    </span>
                  )}
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
