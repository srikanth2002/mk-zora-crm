"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import StatCard from "../components/StatCard";
import WorkStatus from "../components/WorkStatus";

import {
  getEmployees,
  getWorks,
  subscribeToCRMChanges,
} from "../lib/store";

import type {
  Employee,
  Work,
  DashboardStats,
} from "../lib/types";

export default function DashboardPage() {
  const router = useRouter();

  const [ownerChecking, setOwnerChecking] = useState(true);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [works, setWorks] = useState<Work[]>([]);

  useEffect(() => {
    const ownerSession = localStorage.getItem(
      "mkzora_owner_session"
    );

    if (!ownerSession) {
      router.replace("/owner");
      return;
    }

    setOwnerChecking(false);
  }, [router]);

  const loadCRMData = () => {
    setEmployees(getEmployees());
    setWorks(getWorks());
  };

  useEffect(() => {
    if (ownerChecking) return;

    loadCRMData();

    const unsubscribe =
      subscribeToCRMChanges(() => {
        loadCRMData();
      });

    return unsubscribe;
  }, [ownerChecking]);

  const today = new Date()
    .toISOString()
    .split("T")[0];

  const activeEmployees = useMemo(
    () =>
      employees.filter(
        (employee) => employee.status === "Active"
      ),
    [employees]
  );

  const stats: DashboardStats = useMemo(() => {
    const todaysWork = works.filter(
      (work) =>
        work.startDate === today ||
        work.deadline === today
    ).length;

    const newWork = works.filter(
      (work) => work.status === "New"
    ).length;

    const assignedWork = works.filter(
      (work) => work.status === "Assigned"
    ).length;

    const inProgress = works.filter(
      (work) => work.status === "In Progress"
    ).length;

    const pendingReview = works.filter(
      (work) => work.status === "Owner Review"
    ).length;

    const completed = works.filter(
      (work) =>
        work.status === "Completed" ||
        work.status === "Approved"
    ).length;

    const rework = works.filter(
      (work) => work.status === "Rework"
    ).length;

    const overdue = works.filter((work) => {
      return (
        work.deadline < today &&
        work.status !== "Completed" &&
        work.status !== "Approved" &&
        work.status !== "Cancelled"
      );
    }).length;

    return {
      totalEmployees: employees.length,
      activeEmployees: activeEmployees.length,
      todaysWork,
      newWork,
      assignedWork,
      inProgress,
      pendingReview,
      completed,
      overdue,
      rework,
    };
  }, [employees, activeEmployees, today, works]);

  const recentWorks = useMemo(() => {
    return [...works]
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() -
          new Date(a.updatedAt).getTime()
      )
      .slice(0, 8);
  }, [works]);

  const reviewWorks = useMemo(() => {
    return works
      .filter(
        (work) =>
          work.status === "Owner Review"
      )
      .slice(0, 5);
  }, [works]);

  const getEmployeeName = (
    employeeId: string
  ) => {
    const employee = employees.find(
      (item) => item.id === employeeId
    );

    return employee?.name || "Unknown Employee";
  };

  const getEmployeeWorkCount = (
    employeeId: string
  ) => {
    return works.filter(
      (work) => work.assignedTo === employeeId
    ).length;
  };

  if (ownerChecking) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />
          <p className="mt-4 text-sm text-slate-500">
            Checking owner access...
          </p>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />

      <main className="ml-64 min-h-screen">
        <Topbar
          title="Dashboard"
          subtitle="MK ZORA CRM overview"
        />

        <div className="space-y-6 p-6">

          {/* Main Stats */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

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
              subtitle={`${stats.assignedWork} assigned`}
              icon="⚙️"
            />

            <StatCard
              title="Pending Review"
              value={stats.pendingReview}
              subtitle={`${stats.rework} rework`}
              icon="🔍"
            />

          </div>

          {/* Secondary Stats */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

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
              value={works.length}
              subtitle="All assignments"
              icon="📋"
            />

          </div>

          {/* Recently Assigned Work */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">

              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Recently Assigned Work
                </h2>

                <p className="text-sm text-slate-500">
                  Latest work assignments from the owner.
                </p>
              </div>

              <Link
                href="/works"
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
              >
                View All
              </Link>

            </div>

            <div className="overflow-x-auto">

              {recentWorks.length === 0 ? (
                <div className="px-6 py-12 text-center text-sm text-slate-500">
                  No work assignments found.
                </div>
              ) : (
                <table className="w-full min-w-[850px]">

                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">

                      <th className="px-6 py-3">
                        Work
                      </th>

                      <th className="px-6 py-3">
                        Employee
                      </th>

                      <th className="px-6 py-3">
                        Category
                      </th>

                      <th className="px-6 py-3">
                        Priority
                      </th>

                      <th className="px-6 py-3">
                        Deadline
                      </th>

                      <th className="px-6 py-3">
                        Status
                      </th>

                    </tr>
                  </thead>

                  <tbody>

                    {recentWorks.map((work) => (
                      <tr
                        key={work.id}
                        className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                      >

                        <td className="px-6 py-4">

                          <p className="font-medium text-slate-900">
                            {work.title}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            {work.id}
                          </p>

                        </td>

                        <td className="px-6 py-4 text-sm text-slate-700">
                          {getEmployeeName(
                            work.assignedTo
                          )}
                        </td>

                        <td className="px-6 py-4">

                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                            {work.category}
                          </span>

                        </td>

                        <td className="px-6 py-4">

                          <span
                            className={
                              work.priority ===
                              "Urgent"
                                ? "rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700"
                                : work.priority ===
                                  "High"
                                ? "rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700"
                                : "rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
                            }
                          >
                            {work.priority}
                          </span>

                        </td>

                        <td className="px-6 py-4 text-sm text-slate-600">
                          {work.deadline}
                        </td>

                        <td className="px-6 py-4">
                          <WorkStatus
                            status={work.status}
                          />
                        </td>

                      </tr>
                    ))}

                  </tbody>

                </table>
              )}

            </div>
          </section>

          {/* Bottom Sections */}
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">

            {/* Review Queue */}
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">

                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Review Queue
                  </h2>

                  <p className="text-sm text-slate-500">
                    Work waiting for owner review.
                  </p>
                </div>

                <Link
                  href="/review"
                  className="text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  Open Review
                </Link>

              </div>

              <div className="divide-y divide-slate-100">

                {reviewWorks.length === 0 ? (
                  <div className="px-6 py-10 text-center text-sm text-slate-500">
                    No work waiting for review.
                  </div>
                ) : (
                  reviewWorks.map((work) => (
                    <div
                      key={work.id}
                      className="flex items-center justify-between px-6 py-4"
                    >

                      <div>
                        <p className="font-medium text-slate-900">
                          {work.title}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {getEmployeeName(
                            work.assignedTo
                          )}
                        </p>
                      </div>

                      <WorkStatus
                        status={work.status}
                      />

                    </div>
                  ))
                )}

              </div>
            </section>

            {/* Team Overview */}
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">

                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Team Overview
                  </h2>

                  <p className="text-sm text-slate-500">
                    Current employee workload.
                  </p>
                </div>

                <Link
                  href="/employees"
                  className="text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  Manage Team
                </Link>

              </div>

              <div className="divide-y divide-slate-100">

                {activeEmployees.length === 0 ? (
                  <div className="px-6 py-10 text-center text-sm text-slate-500">
                    No active employees.
                  </div>
                ) : (
                  activeEmployees
                    .slice(0, 6)
                    .map((employee) => (
                      <div
                        key={employee.id}
                        className="flex items-center justify-between px-6 py-4"
                      >

                        <div className="flex items-center gap-3">

                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700">
                            {employee.name
                              .split(" ")
                              .map(
                                (name) =>
                                  name[0]
                              )
                              .join("")
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>

                          <div>

                            <p className="font-medium text-slate-900">
                              {employee.name}
                            </p>

                            <p className="text-xs text-slate-500">
                              {employee.role}
                            </p>

                          </div>

                        </div>

                        <div className="text-right">

                          <p className="font-semibold text-slate-900">
                            {getEmployeeWorkCount(
                              employee.id
                            )}
                          </p>

                          <p className="text-xs text-slate-500">
                            works
                          </p>

                        </div>

                      </div>
                    ))
                )}

              </div>
            </section>

          </div>

          {/* Quick Actions */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <h2 className="text-lg font-semibold text-slate-900">
              Quick Actions
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Common CRM actions.
            </p>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">

              <Link
                href="/create-work"
                className="rounded-xl border border-slate-200 p-4 transition hover:border-slate-400 hover:bg-slate-50"
              >
                <div className="text-2xl">
                  ➕
                </div>

                <p className="mt-2 font-semibold text-slate-900">
                  Create Work
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Assign new work to an employee.
                </p>
              </Link>

              <Link
                href="/employees"
                className="rounded-xl border border-slate-200 p-4 transition hover:border-slate-400 hover:bg-slate-50"
              >
                <div className="text-2xl">
                  👤
                </div>

                <p className="mt-2 font-semibold text-slate-900">
                  Add Employee
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Add or manage team members.
                </p>
              </Link>

              <Link
                href="/review"
                className="rounded-xl border border-slate-200 p-4 transition hover:border-slate-400 hover:bg-slate-50"
              >
                <div className="text-2xl">
                  🔍
                </div>

                <p className="mt-2 font-semibold text-slate-900">
                  Review Work
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Approve or send work for rework.
                </p>
              </Link>

              <Link
                href="/reports"
                className="rounded-xl border border-slate-200 p-4 transition hover:border-slate-400 hover:bg-slate-50"
              >
                <div className="text-2xl">
                  📊
                </div>

                <p className="mt-2 font-semibold text-slate-900">
                  Reports
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  View employee and work reports.
                </p>
              </Link>

            </div>
          </section>

        </div>
      </main>
    </div>
  );
}