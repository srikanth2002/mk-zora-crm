"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import OwnerGuard from "@/components/OwnerGuard";
import WorkStatus from "@/components/WorkStatus";

import {
  getEmployees,
  getWorks,
  getExtraWorks,
} from "@/lib/store";

import type {
  Employee,
  Work,
  ExtraWork,
} from "@/lib/types";

export default function DashboardPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [works, setWorks] = useState<Work[]>([]);
  const [extraWorks, setExtraWorks] = useState<ExtraWork[]>([]);
  const [loading, setLoading] = useState(true);

  function loadDashboard() {
    setLoading(true);

    try {
      setEmployees(getEmployees());
      setWorks(getWorks());
      setExtraWorks(getExtraWorks());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();

    const handleStorage = () => {
      loadDashboard();
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("mkzora-data-changed", handleStorage);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("mkzora-data-changed", handleStorage);
    };
  }, []);

  const stats = useMemo(() => {
    const today = new Date();
    const todayString = today.toISOString().slice(0, 10);

    const activeEmployees = employees.filter(
      (employee) => employee.status === "Active"
    );

    const assignedExtraWorks = extraWorks.filter(
      (work) => Boolean(work.assignedTo)
    );

    const allWorkItems = works;

    const todaysWork = allWorkItems.filter((work) => {
      return (
        work.deadline === todayString ||
        work.startDate === todayString
      );
    });

    const newWork = allWorkItems.filter(
      (work) => work.status === "New"
    );

    const inProgress = allWorkItems.filter(
      (work) => work.status === "In Progress"
    );

    const pendingReview = allWorkItems.filter(
      (work) =>
        work.status === "Submitted" ||
        work.status === "Owner Review"
    );

    const completed = allWorkItems.filter(
      (work) =>
        work.status === "Completed" ||
        work.status === "Approved"
    );

    const overdue = allWorkItems.filter((work) => {
      if (!work.deadline) return false;

      return (
        work.deadline < todayString &&
        !["Completed", "Approved", "Cancelled"].includes(
          work.status
        )
      );
    });

    const rework = allWorkItems.filter(
      (work) => work.status === "Rework"
    );

    return {
      totalEmployees: employees.length,
      activeEmployees: activeEmployees.length,
      todaysWork: todaysWork.length,
      newWork: newWork.length,
      inProgress: inProgress.length,
      pendingReview: pendingReview.length,
      completed: completed.length,
      overdue: overdue.length,
      rework: rework.length,
      totalWork:
        allWorkItems.length + assignedExtraWorks.length,
    };
  }, [employees, works, extraWorks]);

  const recentWorks = useMemo(() => {
    return [...works]
      .sort((a, b) => {
        return (
          new Date(b.updatedAt || b.createdAt).getTime() -
          new Date(a.updatedAt || a.createdAt).getTime()
        );
      })
      .slice(0, 6);
  }, [works]);

  const reviewWorks = useMemo(() => {
    return works.filter(
      (work) =>
        work.status === "Submitted" ||
        work.status === "Owner Review"
    );
  }, [works]);

  const employeeWorkCounts = useMemo(() => {
    return employees.map((employee) => {
      const normalWorks = works.filter(
        (work) => work.assignedTo === employee.id
      );

      const employeeExtraWorks = extraWorks.filter(
        (work) => work.assignedTo === employee.id
      );

      return {
        employee,
        count:
          normalWorks.length + employeeExtraWorks.length,
      };
    });
  }, [employees, works, extraWorks]);

  function employeeInitials(name: string) {
    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("");
  }

  function getEmployeeName(employeeId: string) {
    const employee = employees.find(
      (item) => item.id === employeeId
    );

    return employee?.name || "Unassigned";
  }

  if (loading) {
    return (
      <OwnerGuard>
        <div className="min-h-screen bg-slate-50">
          <Sidebar mode="owner" />

          <div className="min-h-screen lg:ml-64">
            <Topbar
              title="Dashboard"
              subtitle="MK ZORA CRM overview"
            />

            <main className="flex min-h-[70vh] items-center justify-center p-4 sm:p-6">
              <div className="rounded-2xl border border-slate-200 bg-white px-6 py-5 text-sm text-slate-500 shadow-sm">
                Loading dashboard...
              </div>
            </main>
          </div>
        </div>
      </OwnerGuard>
    );
  }

  return (
    <OwnerGuard>
      <div className="min-h-screen overflow-x-hidden bg-slate-50">
        <Sidebar mode="owner" />

        <div className="min-h-screen pt-16 lg:ml-64 lg:pt-0">
          <Topbar
            title="Dashboard"
            subtitle="MK ZORA CRM overview"
          />

          <main className="space-y-5 p-4 sm:space-y-6 sm:p-6 lg:p-8">

            {/* OWNER HEADER */}
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                    ZORA TRACK
                  </p>

                  <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                    Owner Dashboard
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Manage your team, assignments and work progress.
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
                    O
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Owner
                    </p>

                    <p className="text-xs text-slate-500">
                      MK ZORA Admin
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* STATS */}
            <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                title="Total Employees"
                value={stats.totalEmployees}
                subtitle={`${stats.activeEmployees} active employees`}
                icon="👥"
              />

              <StatCard
                title="Today's Work"
                value={stats.todaysWork}
                subtitle="Due or starting today"
                icon="📅"
              />

              <StatCard
                title="In Progress"
                value={stats.inProgress}
                subtitle={`${works.filter(
                  (work) => work.status === "Assigned"
                ).length} assigned`}
                icon="⚙️"
              />

              <StatCard
                title="Pending Review"
                value={stats.pendingReview}
                subtitle={`${stats.rework} rework`}
                icon="🔍"
              />

              <StatCard
                title="New Work"
                value={stats.newWork}
                subtitle="Not started"
                icon="🆕"
              />

              <StatCard
                title="Completed"
                value={stats.completed}
                subtitle="Approved / completed"
                icon="✅"
              />

              <StatCard
                title="Overdue"
                value={stats.overdue}
                subtitle="Past deadline"
                icon="⚠️"
              />

              <StatCard
                title="Total Work"
                value={stats.totalWork}
                subtitle="All assignments"
                icon="📋"
              />
            </section>

            {/* RECENT WORK */}
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Recently Assigned Work
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Latest work assignments from the owner.
                  </p>
                </div>

                <Link
                  href="/works"
                  className="inline-flex w-fit items-center rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  View All
                </Link>
              </div>

              {/* DESKTOP TABLE */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[760px] text-left">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                      <th className="px-6 py-3 font-semibold">
                        Work
                      </th>

                      <th className="px-4 py-3 font-semibold">
                        Employee
                      </th>

                      <th className="px-4 py-3 font-semibold">
                        Category
                      </th>

                      <th className="px-4 py-3 font-semibold">
                        Priority
                      </th>

                      <th className="px-4 py-3 font-semibold">
                        Deadline
                      </th>

                      <th className="px-4 py-3 font-semibold">
                        Status
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {recentWorks.map((work) => (
                      <tr
                        key={work.id}
                        className="transition hover:bg-slate-50"
                      >
                        <td className="px-6 py-4">
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900">
                              {work.title}
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              {work.id}
                            </p>
                          </div>
                        </td>

                        <td className="px-4 py-4 text-sm text-slate-600">
                          {getEmployeeName(work.assignedTo)}
                        </td>

                        <td className="px-4 py-4">
                          <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                            {work.category}
                          </span>
                        </td>

                        <td className="px-4 py-4">
                          <PriorityBadge
                            priority={work.priority}
                          />
                        </td>

                        <td className="px-4 py-4 text-sm text-slate-600">
                          {work.deadline || "—"}
                        </td>

                        <td className="px-4 py-4">
                          <WorkStatus status={work.status} />
                        </td>
                      </tr>
                    ))}

                    {recentWorks.length === 0 && (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-6 py-10 text-center text-sm text-slate-400"
                        >
                          No work assigned yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* MOBILE WORK CARDS */}
              <div className="space-y-3 p-4 md:hidden">
                {recentWorks.map((work) => (
                  <div
                    key={work.id}
                    className="rounded-xl border border-slate-200 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="break-words text-sm font-bold text-slate-900">
                          {work.title}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {work.id}
                        </p>
                      </div>

                      <WorkStatus status={work.status} />
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                      <InfoItem
                        label="Employee"
                        value={getEmployeeName(work.assignedTo)}
                      />

                      <InfoItem
                        label="Category"
                        value={work.category}
                      />

                      <InfoItem
                        label="Priority"
                        value={work.priority}
                      />

                      <InfoItem
                        label="Deadline"
                        value={work.deadline || "—"}
                      />
                    </div>
                  </div>
                ))}

                {recentWorks.length === 0 && (
                  <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-400">
                    No work assigned yet.
                  </div>
                )}
              </div>
            </section>

            {/* REVIEW + TEAM */}
            <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">

              {/* REVIEW QUEUE */}
              <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between gap-3 border-b border-slate-200 p-4 sm:p-6">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      Review Queue
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Work waiting for owner review.
                    </p>
                  </div>

                  <Link
                    href="/review"
                    className="shrink-0 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 sm:px-4 sm:text-sm"
                  >
                    Open Review
                  </Link>
                </div>

                <div className="space-y-3 p-4 sm:p-6">
                  {reviewWorks.slice(0, 5).map((work) => (
                    <div
                      key={work.id}
                      className="rounded-xl border border-slate-200 p-4"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <p className="break-words text-sm font-semibold text-slate-900">
                            {work.title}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {getEmployeeName(work.assignedTo)}
                          </p>
                        </div>

                        <div className="shrink-0">
                          <WorkStatus status={work.status} />
                        </div>
                      </div>
                    </div>
                  ))}

                  {reviewWorks.length === 0 && (
                    <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center">
                      <p className="text-sm font-semibold text-slate-600">
                        No pending reviews
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        Submitted work will appear here.
                      </p>
                    </div>
                  )}
                </div>
              </section>

              {/* TEAM OVERVIEW */}
              <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between gap-3 border-b border-slate-200 p-4 sm:p-6">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      Team Overview
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Current employee workload.
                    </p>
                  </div>

                  <Link
                    href="/employees"
                    className="shrink-0 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 sm:px-4 sm:text-sm"
                  >
                    Manage Team
                  </Link>
                </div>

                <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 sm:p-6">
                  {employeeWorkCounts.map(
                    ({ employee, count }) => (
                      <div
                        key={employee.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-4"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700">
                            {employeeInitials(employee.name)}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900">
                              {employee.name}
                            </p>

                            <p className="truncate text-xs text-slate-500">
                              {employee.role}
                            </p>
                          </div>
                        </div>

                        <div className="shrink-0 text-right">
                          <p className="text-lg font-bold text-slate-900">
                            {count}
                          </p>

                          <p className="text-[10px] uppercase tracking-wider text-slate-400">
                            works
                          </p>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </section>
            </section>

            {/* QUICK ACTIONS */}
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 p-4 sm:p-6">
                <h2 className="text-lg font-bold text-slate-900">
                  Quick Actions
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Common CRM actions.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 sm:p-6 lg:grid-cols-4">
                <QuickAction
                  href="/create-work"
                  icon="➕"
                  title="Create Work"
                  description="Assign new work to an employee."
                />

                <QuickAction
                  href="/employees"
                  icon="👤"
                  title="Add Employee"
                  description="Add or manage team members."
                />

                <QuickAction
                  href="/review"
                  icon="🔍"
                  title="Review Work"
                  description="Approve or send work for rework."
                />

                <QuickAction
                  href="/reports"
                  icon="📊"
                  title="Reports"
                  description="View employee and work reports."
                />
              </div>
            </section>

          </main>
        </div>
      </div>
    </OwnerGuard>
  );
}

/* -------------------------------------------------------
   STAT CARD
------------------------------------------------------- */

function StatCard({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string;
  value: number;
  subtitle: string;
  icon: string;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {value}
          </p>

          <p className="mt-1 truncate text-xs text-slate-400">
            {subtitle}
          </p>
        </div>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-lg">
          {icon}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------
   PRIORITY
------------------------------------------------------- */

function PriorityBadge({
  priority,
}: {
  priority: string;
}) {
  const classes: Record<string, string> = {
    Low: "bg-slate-100 text-slate-600",
    Medium: "bg-blue-50 text-blue-700",
    High: "bg-orange-50 text-orange-700",
    Urgent: "bg-red-50 text-red-700",
  };

  return (
    <span
      className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
        classes[priority] || "bg-slate-100 text-slate-600"
      }`}
    >
      {priority}
    </span>
  );
}

/* -------------------------------------------------------
   INFO ITEM
------------------------------------------------------- */

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>

      <p className="mt-1 truncate text-xs font-semibold text-slate-700">
        {value}
      </p>
    </div>
  );
}

/* -------------------------------------------------------
   QUICK ACTION
------------------------------------------------------- */

function QuickAction({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-slate-200 p-4 transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:shadow-sm"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-lg transition group-hover:bg-slate-900 group-hover:text-white">
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-900">
            {title}
          </p>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            {description}
          </p>
        </div>
      </div>
    </Link>
  );
}