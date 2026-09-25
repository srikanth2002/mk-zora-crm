"use client";

import { useEffect, useMemo, useState } from "react";

import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import OwnerGuard from "@/components/OwnerGuard";

import { getEmployees, getWorks } from "@/lib/store";
import type {
  Employee,
  Work,
  WorkCategory,
  WorkPriority,
  WorkStatus,
} from "@/lib/types";

export default function ReportsPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [works, setWorks] = useState<Work[]>([]);

  useEffect(() => {
    const loadData = () => {
      setEmployees(getEmployees());
      setWorks(getWorks());
    };

    loadData();

    window.addEventListener("storage", loadData);
    window.addEventListener("mkzora-data-changed", loadData);

    return () => {
      window.removeEventListener("storage", loadData);
      window.removeEventListener("mkzora-data-changed", loadData);
    };
  }, []);

  const today = new Date();
  today.setHours(23, 59, 59, 999);

  const stats = useMemo(() => {
    const activeEmployees = employees.filter(
      (employee) => employee.status === "Active"
    ).length;

    const completed = works.filter(
      (work) =>
        work.status === "Completed" ||
        work.status === "Approved"
    ).length;

    const pendingReview = works.filter(
      (work) =>
        work.status === "Submitted" ||
        work.status === "Owner Review"
    ).length;

    const inProgress = works.filter(
      (work) =>
        work.status === "In Progress"
    ).length;

    const rework = works.filter(
      (work) =>
        work.status === "Rework"
    ).length;

    const overdue = works.filter((work) => {
      if (!work.deadline) return false;

      if (
        work.status === "Completed" ||
        work.status === "Approved" ||
        work.status === "Cancelled"
      ) {
        return false;
      }

      const deadline = new Date(work.deadline);

      if (Number.isNaN(deadline.getTime())) {
        return false;
      }

      deadline.setHours(23, 59, 59, 999);

      return deadline < today;
    }).length;

    return {
      employees: employees.length,
      activeEmployees,
      works: works.length,
      completed,
      pendingReview,
      inProgress,
      rework,
      overdue,
    };
  }, [employees, works]);

  const categoryReport = useMemo(() => {
    const counts = new Map<string, number>();

    works.forEach((work) => {
      counts.set(
        work.category,
        (counts.get(work.category) || 0) + 1
      );
    });

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([category, count]) => ({
        category: category as WorkCategory,
        count,
      }));
  }, [works]);

  const priorityReport = useMemo(() => {
    const priorities: WorkPriority[] = [
      "Urgent",
      "High",
      "Medium",
      "Low",
    ];

    return priorities.map((priority) => ({
      priority,
      count: works.filter(
        (work) => work.priority === priority
      ).length,
    }));
  }, [works]);

  const statusReport = useMemo(() => {
    const statuses: WorkStatus[] = [
      "New",
      "Assigned",
      "In Progress",
      "Submitted",
      "Owner Review",
      "Rework",
      "Approved",
      "Completed",
      "Cancelled",
    ];

    return statuses
      .map((status) => ({
        status,
        count: works.filter(
          (work) => work.status === status
        ).length,
      }))
      .filter((item) => item.count > 0);
  }, [works]);

  const employeeReport = useMemo(() => {
    return employees
      .map((employee) => {
        const employeeWorks = works.filter(
          (work) => work.assignedTo === employee.id
        );

        const completed = employeeWorks.filter(
          (work) =>
            work.status === "Completed" ||
            work.status === "Approved"
        ).length;

        const pending = employeeWorks.filter(
          (work) =>
            work.status !== "Completed" &&
            work.status !== "Approved" &&
            work.status !== "Cancelled"
        ).length;

        return {
          employee,
          total: employeeWorks.length,
          completed,
          pending,
        };
      })
      .sort((a, b) => b.total - a.total);
  }, [employees, works]);

  const maxCategoryCount =
    categoryReport.length > 0
      ? Math.max(...categoryReport.map((item) => item.count))
      : 1;

  return (
    <OwnerGuard>
      <div className="min-h-screen bg-slate-50">
        <Sidebar mode="owner" />

        <main className="ml-64 min-h-screen">
          <Topbar
            title="Reports"
            subtitle="Work and team performance overview"
          />

          <div className="p-6">

            {/* SUMMARY */}
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

              <ReportCard
                label="Total Employees"
                value={stats.employees}
                description={`${stats.activeEmployees} active employees`}
                icon="♙"
              />

              <ReportCard
                label="Total Works"
                value={stats.works}
                description="All work records"
                icon="▤"
              />

              <ReportCard
                label="Completed"
                value={stats.completed}
                description="Approved or completed"
                icon="✓"
              />

              <ReportCard
                label="Overdue"
                value={stats.overdue}
                description="Past deadline"
                icon="!"
              />

            </section>

            {/* WORK STATUS */}
            <section className="mt-6 grid gap-6 xl:grid-cols-2">

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                <div className="mb-5">
                  <h2 className="text-lg font-bold text-slate-900">
                    Work Status
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Current distribution of all works
                  </p>
                </div>

                <div className="space-y-4">

                  {statusReport.length === 0 ? (
                    <EmptyState text="No work data available." />
                  ) : (
                    statusReport.map((item) => (
                      <div key={item.status}>

                        <div className="mb-1 flex items-center justify-between">

                          <span className="text-sm font-medium text-slate-700">
                            {item.status}
                          </span>

                          <span className="text-sm font-bold text-slate-900">
                            {item.count}
                          </span>

                        </div>

                        <div className="h-2 overflow-hidden rounded-full bg-slate-100">

                          <div
                            className="h-full rounded-full bg-slate-900"
                            style={{
                              width: `${Math.max(
                                8,
                                (item.count / stats.works) * 100
                              )}%`,
                            }}
                          />

                        </div>

                      </div>
                    ))
                  )}

                </div>
              </div>

              {/* QUICK METRICS */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                <div className="mb-5">
                  <h2 className="text-lg font-bold text-slate-900">
                    Work Metrics
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Important workflow numbers
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">

                  <MetricBox
                    label="In Progress"
                    value={stats.inProgress}
                  />

                  <MetricBox
                    label="Pending Review"
                    value={stats.pendingReview}
                  />

                  <MetricBox
                    label="Rework"
                    value={stats.rework}
                  />

                  <MetricBox
                    label="Overdue"
                    value={stats.overdue}
                  />

                </div>

              </div>

            </section>

            {/* CATEGORY + PRIORITY */}
            <section className="mt-6 grid gap-6 xl:grid-cols-2">

              {/* CATEGORY */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                <div className="mb-5">
                  <h2 className="text-lg font-bold text-slate-900">
                    Work by Category
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Distribution across work categories
                  </p>
                </div>

                {categoryReport.length === 0 ? (
                  <EmptyState text="No category data available." />
                ) : (
                  <div className="space-y-4">

                    {categoryReport.map((item) => (
                      <div key={item.category}>

                        <div className="mb-1 flex items-center justify-between">

                          <span className="text-sm font-medium text-slate-700">
                            {item.category}
                          </span>

                          <span className="text-sm font-bold text-slate-900">
                            {item.count}
                          </span>

                        </div>

                        <div className="h-2 overflow-hidden rounded-full bg-slate-100">

                          <div
                            className="h-full rounded-full bg-slate-700"
                            style={{
                              width: `${Math.max(
                                8,
                                (item.count /
                                  maxCategoryCount) *
                                  100
                              )}%`,
                            }}
                          />

                        </div>

                      </div>
                    ))}

                  </div>
                )}

              </div>

              {/* PRIORITY */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                <div className="mb-5">
                  <h2 className="text-lg font-bold text-slate-900">
                    Work by Priority
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Current priority distribution
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">

                  {priorityReport.map((item) => (
                    <div
                      key={item.priority}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                    >

                      <div className="flex items-center justify-between">

                        <span className="text-sm font-medium text-slate-600">
                          {item.priority}
                        </span>

                        <span className="text-xl font-bold text-slate-900">
                          {item.count}
                        </span>

                      </div>

                    </div>
                  ))}

                </div>

              </div>

            </section>

            {/* EMPLOYEE PERFORMANCE */}
            <section className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">

              <div className="border-b border-slate-200 px-6 py-5">

                <h2 className="text-lg font-bold text-slate-900">
                  Employee Workload
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Assigned work distribution by employee
                </p>

              </div>

              <div className="overflow-x-auto">

                {employeeReport.length === 0 ? (
                  <div className="p-6">
                    <EmptyState text="No employee data available." />
                  </div>
                ) : (
                  <table className="w-full min-w-[700px]">

                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50">

                        <th className="px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                          Employee
                        </th>

                        <th className="px-6 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-slate-500">
                          Status
                        </th>

                        <th className="px-6 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-slate-500">
                          Total
                        </th>

                        <th className="px-6 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-slate-500">
                          Completed
                        </th>

                        <th className="px-6 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-slate-500">
                          Pending
                        </th>

                      </tr>
                    </thead>

                    <tbody>

                      {employeeReport.map((item) => (
                        <tr
                          key={item.employee.id}
                          className="border-b border-slate-100 last:border-b-0"
                        >

                          <td className="px-6 py-4">

                            <div className="flex items-center gap-3">

                              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                                {item.employee.name
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>

                              <div>

                                <p className="text-sm font-semibold text-slate-900">
                                  {item.employee.name}
                                </p>

                                <p className="text-xs text-slate-500">
                                  {item.employee.role}
                                </p>

                              </div>

                            </div>

                          </td>

                          <td className="px-6 py-4 text-center">

                            <span
                              className={[
                                "inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold",
                                item.employee.status === "Active"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-slate-100 text-slate-500",
                              ].join(" ")}
                            >
                              {item.employee.status}
                            </span>

                          </td>

                          <td className="px-6 py-4 text-center text-sm font-bold text-slate-900">
                            {item.total}
                          </td>

                          <td className="px-6 py-4 text-center text-sm font-semibold text-emerald-600">
                            {item.completed}
                          </td>

                          <td className="px-6 py-4 text-center text-sm font-semibold text-amber-600">
                            {item.pending}
                          </td>

                        </tr>
                      ))}

                    </tbody>

                  </table>
                )}

              </div>

            </section>

          </div>
        </main>
      </div>
    </OwnerGuard>
  );
}

function ReportCard({
  label,
  value,
  description,
  icon,
}: {
  label: string;
  value: number;
  description: string;
  icon: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

      <div className="flex items-start justify-between">

        <div>

          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {label}
          </p>

          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {description}
          </p>

        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white">
          {icon}
        </div>

      </div>

    </div>
  );
}

function MetricBox({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">

      <p className="text-xs font-semibold text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-2xl font-bold text-slate-900">
        {value}
      </p>

    </div>
  );
}

function EmptyState({
  text,
}: {
  text: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center text-sm text-slate-500">
      {text}
    </div>
  );
}