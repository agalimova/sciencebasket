import { FIELDS, FIELD_IDS } from "@/types/fields";

export default function SalaryPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        Salary Insights
      </h1>
      <p className="text-gray-600 dark:text-gray-400">
        Salary data will be populated as jobs are crawled. Check back soon for
        median salaries, ranges by field, seniority, and location.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {FIELD_IDS.map((fid) => {
          const field = FIELDS[fid];
          return (
            <div
              key={fid}
              className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5"
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: field.color }}
                />
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {field.name}
                </h3>
              </div>
              <p className="text-2xl font-bold text-gray-400">—</p>
              <p className="text-xs text-gray-400 mt-1">
                Median salary (coming soon)
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
