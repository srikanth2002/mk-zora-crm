"use client";

import { useEffect, useMemo, useState } from "react";

import Sidebar from "../../components/Sidebar";
import Topbar from "../../components/Topbar";
import WorkStatus from "../../components/WorkStatus";
import WorkSubmissionModal from "../../components/WorkSubmissionModal";

import {
  getEmployees,
  getWorks,
  getExtraWorks,
  subscribeToCRMChanges,
  updateWork,
  updateExtraWork,
  verifyEmployeePassword,
} from "../../lib/store";

import type {
  Employee,
  Work,
  ExtraWork,
} from "../../lib/types";

type DashboardFilter =
  | "All"
  | "Pending"
  | "In Progress"
  | "Submitted"
  | "Rework"
  | "Completed"
  | "Overdue";

type PortalItem =
  | {
      type: "work";
      item: Work;
    }
  | {
      type: "extra";
      item: ExtraWork;
    };

const EMPLOYEE_SESSION_KEY = "mkzora_employee_session";

/* =========================================================
   NORMAL WORK HELPERS
========================================================= */

function isFinalWork(status: Work["status"]) {
  return (
    status === "Approved" ||
    status === "Completed" ||
    status === "Cancelled"
  );
}

function isOverdue(work: Work) {
  if (!work.deadline) return false;

  if (isFinalWork(work.status)) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const deadline = new Date(`${work.deadline}T23:59:59`);

  return deadline.getTime() < today.getTime();
}

function isPending(work: Work) {
  if (isOverdue(work)) return false;

  return (
    work.status === "New" ||
    work.status === "Assigned"
  );
}

/* =========================================================
   EXTRA WORK HELPERS
========================================================= */

function isCompletedExtraWork(work: ExtraWork) {
  return work.status === "Completed";
}

function isOverdueExtraWork(work: ExtraWork) {
  if (!work.deadline) return false;

  if (work.status === "Completed") return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const deadline = new Date(`${work.deadline}T23:59:59`);

  return deadline.getTime() < today.getTime();
}

function isPendingExtraWork(work: ExtraWork) {
  if (isOverdueExtraWork(work)) return false;

  return work.status === "Assigned";
}

/* =========================================================
   MAIN PAGE
========================================================= */

export default function EmployeePage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [works, setWorks] = useState<Work[]>([]);
  const [extraWorks, setExtraWorks] = useState<ExtraWork[]>([]);

  const [employee, setEmployee] =
    useState<Employee | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [lastUpdated, setLastUpdated] =
    useState<Date | null>(null);

  /* =======================================================
     LOGIN
  ======================================================= */

  const [loginName, setLoginName] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");

  /* =======================================================
     FILTER / SEARCH
  ======================================================= */

  const [search, setSearch] = useState("");

  const [dashboardFilter, setDashboardFilter] =
    useState<DashboardFilter>("All");

  /* =======================================================
     MODALS
  ======================================================= */

  const [viewingWork, setViewingWork] =
    useState<Work | null>(null);

  const [viewingExtraWork, setViewingExtraWork] =
    useState<ExtraWork | null>(null);

  const [submittingWork, setSubmittingWork] =
    useState<Work | null>(null);

  const [saving, setSaving] = useState(false);

  /* =======================================================
     LOAD DATA
  ======================================================= */

  function loadData() {
    const allEmployees = getEmployees();
    const allWorks = getWorks();
    const allExtraWorks = getExtraWorks();

    setEmployees(allEmployees);
    setWorks(allWorks);
    setExtraWorks(allExtraWorks);

    const session = localStorage.getItem(
      EMPLOYEE_SESSION_KEY
    );

    if (session) {
      try {
        const sessionData = JSON.parse(session);

        const currentEmployee =
          allEmployees.find(
            (item) =>
              item.id === sessionData.employeeId
          ) || null;

        setEmployee(currentEmployee);
      } catch {
        localStorage.removeItem(
          EMPLOYEE_SESSION_KEY
        );

        setEmployee(null);
      }
    }

    setLastUpdated(new Date());
    setLoading(false);
  }

  /* =======================================================
     INITIAL LOAD + LIVE CRM UPDATE
  ======================================================= */

  useEffect(() => {
    loadData();

    const unsubscribe =
      subscribeToCRMChanges(() => {
        loadData();
      });

    return unsubscribe;
  }, []);

  /* =======================================================
     MANUAL REFRESH
  ======================================================= */

  function handleRefresh() {
    if (refreshing) return;

    setRefreshing(true);

    setTimeout(() => {
      loadData();
      setRefreshing(false);
    }, 300);
  }

  /* =======================================================
     LOGIN
  ======================================================= */

  function handleLogin() {
    setLoginError("");

    if (!loginName.trim() || !loginPassword) {
      setLoginError(
        "Please enter your employee name and password."
      );
      return;
    }

    const foundEmployee = employees.find(
      (item) =>
        item.name.toLowerCase() ===
          loginName.trim().toLowerCase() &&
        item.status === "Active"
    );

    if (!foundEmployee) {
      setLoginError(
        "Employee not found or employee account is inactive."
      );
      return;
    }

    const valid = verifyEmployeePassword(
      foundEmployee.id,
      loginPassword
    );

    if (!valid) {
      setLoginError("Incorrect password.");
      return;
    }

    localStorage.setItem(
      EMPLOYEE_SESSION_KEY,
      JSON.stringify({
        employeeId: foundEmployee.id,
        name: foundEmployee.name,
        loggedInAt: new Date().toISOString(),
      })
    );

    setEmployee(foundEmployee);
    setLoginPassword("");
    setLoginError("");
  }

  /* =======================================================
     LOGOUT
  ======================================================= */

  function handleLogout() {
    localStorage.removeItem(
      EMPLOYEE_SESSION_KEY
    );

    setEmployee(null);
    setLoginName("");
    setLoginPassword("");
    setDashboardFilter("All");
    setSearch("");
  }

  /* =======================================================
     MY NORMAL WORKS
  ======================================================= */

  const myWorks = useMemo(() => {
    if (!employee) return [];

    return works.filter(
      (work) =>
        work.assignedTo === employee.id
    );
  }, [works, employee]);

  /* =======================================================
     MY EXTRA WORKS
  ======================================================= */

  const myExtraWorks = useMemo(() => {
    if (!employee) return [];

    return extraWorks.filter(
      (work) =>
        work.assignedTo === employee.id
    );
  }, [extraWorks, employee]);

  /* =======================================================
     STATS
  ======================================================= */

  const stats = useMemo(() => {
    const pendingNormal =
      myWorks.filter(isPending).length;

    const pendingExtra =
      myExtraWorks.filter(
        isPendingExtraWork
      ).length;

    const pending =
      pendingNormal + pendingExtra;

    const inProgress =
      myWorks.filter(
        (work) =>
          work.status === "In Progress"
      ).length;

    const submitted =
      myWorks.filter(
        (work) =>
          work.status === "Submitted" ||
          work.status === "Owner Review"
      ).length;

    const rework =
      myWorks.filter(
        (work) =>
          work.status === "Rework"
      ).length;

    const completedNormal =
      myWorks.filter(
        (work) =>
          work.status === "Completed" ||
          work.status === "Approved"
      ).length;

    const completedExtra =
      myExtraWorks.filter(
        isCompletedExtraWork
      ).length;

    const completed =
      completedNormal + completedExtra;

    const overdueNormal =
      myWorks.filter(
        isOverdue
      ).length;

    const overdueExtra =
      myExtraWorks.filter(
        isOverdueExtraWork
      ).length;

    const overdue =
      overdueNormal + overdueExtra;

    return {
      total:
        myWorks.length +
        myExtraWorks.length,
      pending,
      inProgress,
      submitted,
      rework,
      completed,
      overdue,
    };
  }, [myWorks, myExtraWorks]);

  /* =======================================================
     ALL PORTAL ITEMS
  ======================================================= */

  const allPortalItems = useMemo<PortalItem[]>(() => {
    const normalItems: PortalItem[] =
      myWorks.map((item) => ({
        type: "work",
        item,
      }));

    const extraItems: PortalItem[] =
      myExtraWorks.map((item) => ({
        type: "extra",
        item,
      }));

    return [
      ...normalItems,
      ...extraItems,
    ];
  }, [myWorks, myExtraWorks]);

  /* =======================================================
     FILTER ITEMS
  ======================================================= */

  const filteredItems = useMemo(() => {
    const text =
      search.trim().toLowerCase();

    return allPortalItems.filter(
      (portalItem) => {
        let matchesFilter = true;

        if (
          dashboardFilter === "Pending"
        ) {
          if (portalItem.type === "work") {
            matchesFilter =
              isPending(portalItem.item);
          } else {
            matchesFilter =
              isPendingExtraWork(
                portalItem.item
              );
          }
        }

        if (
          dashboardFilter === "In Progress"
        ) {
          matchesFilter =
            portalItem.type === "work" &&
            portalItem.item.status ===
              "In Progress";
        }

        if (
          dashboardFilter === "Submitted"
        ) {
          matchesFilter =
            portalItem.type === "work" &&
            (
              portalItem.item.status ===
                "Submitted" ||
              portalItem.item.status ===
                "Owner Review"
            );
        }

        if (
          dashboardFilter === "Rework"
        ) {
          matchesFilter =
            portalItem.type === "work" &&
            portalItem.item.status ===
              "Rework";
        }

        if (
          dashboardFilter === "Completed"
        ) {
          if (portalItem.type === "work") {
            matchesFilter =
              portalItem.item.status ===
                "Completed" ||
              portalItem.item.status ===
                "Approved";
          } else {
            matchesFilter =
              portalItem.item.status ===
              "Completed";
          }
        }

        if (
          dashboardFilter === "Overdue"
        ) {
          if (portalItem.type === "work") {
            matchesFilter =
              isOverdue(
                portalItem.item
              );
          } else {
            matchesFilter =
              isOverdueExtraWork(
                portalItem.item
              );
          }
        }

        let matchesSearch = true;

        if (text) {
          if (portalItem.type === "work") {
            const work =
              portalItem.item;

            matchesSearch =
              work.title
                .toLowerCase()
                .includes(text) ||
              work.id
                .toLowerCase()
                .includes(text) ||
              work.category
                .toLowerCase()
                .includes(text) ||
              work.description
                .toLowerCase()
                .includes(text);
          } else {
            const extra =
              portalItem.item;

            matchesSearch =
              extra.title
                .toLowerCase()
                .includes(text) ||
              extra.id
                .toLowerCase()
                .includes(text) ||
              extra.description
                .toLowerCase()
                .includes(text) ||
              "extra work".includes(text);
          }
        }

        return (
          matchesFilter &&
          matchesSearch
        );
      }
    );
  }, [
    allPortalItems,
    dashboardFilter,
    search,
  ]);

  /* =======================================================
     START NORMAL WORK
  ======================================================= */

  function handleStartWork(work: Work) {
    setSaving(true);

    const now =
      new Date().toISOString();

    updateWork({
      ...work,
      status: "In Progress",
      updatedAt: now,
    });

    setViewingWork(null);
    setSaving(false);

    loadData();
  }

  /* =======================================================
     SUBMIT NORMAL WORK
  ======================================================= */

  function handleSubmitWork(data: {
    message: string;
    liveUrl?: string;
    githubUrl?: string;
    demoUrl?: string;
    attachments: Work["attachments"];
  }) {
    if (
      !submittingWork ||
      !employee
    ) {
      return;
    }

    setSaving(true);

    const now =
      new Date().toISOString();

    updateWork({
      ...submittingWork,

      status: "Submitted",

      updatedAt: now,

      submission: {
        submittedAt: now,
        submittedBy: employee.id,
        message: data.message,
        attachments:
          data.attachments || [],
        liveUrl: data.liveUrl,
        githubUrl: data.githubUrl,
        demoUrl: data.demoUrl,
      },

      review: {
        status: "Pending",
      },
    });

    setSaving(false);

    setSubmittingWork(null);
    setViewingWork(null);

    loadData();
  }

  /* =======================================================
     COMPLETE EXTRA WORK
  ======================================================= */

  function handleCompleteExtraWork(
    extraWork: ExtraWork
  ) {
    setSaving(true);

    updateExtraWork({
      ...extraWork,
      status: "Completed",
      completedAt:
        new Date().toISOString(),
    });

    setSaving(false);
    setViewingExtraWork(null);

    loadData();
  }

  /* =======================================================
     LOGIN SCREEN
  ======================================================= */

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-sm text-slate-500">
          Loading employee portal...
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
          <div className="text-center">
            <img
              src="/logo.png"
              alt="MK ZORA"
              className="mx-auto mb-5 max-h-24 max-w-[260px] object-contain"
            />

            <div className="mb-2 text-2xl font-bold text-slate-900">
              ZORA TRACK
            </div>

            <p className="text-sm text-slate-500">
              Employee Workspace
            </p>
          </div>

          <div className="mt-8 space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Employee Name
              </label>

              <input
                value={loginName}
                onChange={(event) =>
                  setLoginName(
                    event.target.value
                  )
                }
                placeholder="Enter your name"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Password
              </label>

              <div className="relative">
                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={loginPassword}
                  onChange={(event) =>
                    setLoginPassword(
                      event.target.value
                    )
                  }
                  placeholder="Enter your password"
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter"
                    ) {
                      handleLogin();
                    }
                  }}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-16 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-100"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      (value) => !value
                    )
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500 hover:text-slate-900"
                >
                  {showPassword
                    ? "Hide"
                    : "Show"}
                </button>
              </div>
            </div>

            {loginError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {loginError}
              </div>
            )}

            <button
              type="button"
              onClick={handleLogin}
              className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Employee Login
            </button>

            <p className="text-center text-xs text-slate-400">
              Contact the Owner if you forgot your password.
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* =======================================================
     EMPLOYEE DASHBOARD
  ======================================================= */

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar mode="employee" />

      {/* LEFT SIDEBAR LOGOUT */}
      <div className="fixed bottom-3 left-3 z-[60] w-[232px] rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
            {employee.name
              .charAt(0)
              .toUpperCase()}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-slate-900">
              {employee.name}
            </p>

            <p className="truncate text-[10px] text-slate-400">
              Employee
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="shrink-0 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-[10px] font-bold text-slate-600 hover:bg-slate-50"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="ml-64">
        <Topbar
          title={
            dashboardFilter === "All"
              ? "My Works"
              : dashboardFilter
          }
          subtitle={`Welcome, ${employee.name}`}
        />

        <main className="space-y-6 p-6">
          {/* =================================================
              HEADER
          ================================================= */}

          <section
            id="dashboard"
            className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 lg:flex-row lg:items-center lg:justify-between"
          >
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
                ZORA TRACK
              </p>

              <h1 className="mt-1 text-2xl font-bold text-slate-900">
                Welcome, {employee.name}
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                {employee.role} ·{" "}
                {employee.department}
              </p>

              {lastUpdated && (
                <p className="mt-2 text-[11px] text-slate-400">
                  Last updated:{" "}
                  {lastUpdated.toLocaleTimeString(
                    [],
                    {
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  )}
                </p>
              )}
            </div>

            {/* ONLY REFRESH ON RIGHT */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleRefresh}
                disabled={refreshing}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {refreshing
                  ? "↻ Refreshing..."
                  : "↻ Refresh"}
              </button>
            </div>
          </section>

          {/* =================================================
              7 CARDS
          ================================================= */}

          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
            <StatBox
              label="Total"
              value={stats.total}
              active={
                dashboardFilter === "All"
              }
              onClick={() =>
                setDashboardFilter("All")
              }
            />

            <StatBox
              label="Pending"
              value={stats.pending}
              active={
                dashboardFilter ===
                "Pending"
              }
              onClick={() =>
                setDashboardFilter("Pending")
              }
            />

            <StatBox
              label="In Progress"
              value={stats.inProgress}
              active={
                dashboardFilter ===
                "In Progress"
              }
              onClick={() =>
                setDashboardFilter(
                  "In Progress"
                )
              }
            />

            <StatBox
              label="Submitted"
              value={stats.submitted}
              active={
                dashboardFilter ===
                "Submitted"
              }
              onClick={() =>
                setDashboardFilter(
                  "Submitted"
                )
              }
            />

            <StatBox
              label="Rework"
              value={stats.rework}
              active={
                dashboardFilter ===
                "Rework"
              }
              onClick={() =>
                setDashboardFilter(
                  "Rework"
                )
              }
            />

            <StatBox
              label="Completed"
              value={stats.completed}
              active={
                dashboardFilter ===
                "Completed"
              }
              onClick={() =>
                setDashboardFilter(
                  "Completed"
                )
              }
            />

            <StatBox
              label="Overdue"
              value={stats.overdue}
              danger
              active={
                dashboardFilter ===
                "Overdue"
              }
              onClick={() =>
                setDashboardFilter(
                  "Overdue"
                )
              }
            />
          </section>

          {/* =================================================
              SEARCH
          ================================================= */}

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row">
              <input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search your works..."
                className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-900"
              />

              {dashboardFilter !==
                "All" && (
                <button
                  type="button"
                  onClick={() =>
                    setDashboardFilter(
                      "All"
                    )
                  }
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Clear Filter
                </button>
              )}
            </div>

            {dashboardFilter !==
              "All" && (
              <div className="mt-3 flex items-center justify-between">
                <span className="inline-flex rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white">
                  Showing:{" "}
                  {dashboardFilter}
                </span>

                <span className="text-xs text-slate-400">
                  {filteredItems.length} item
                  {filteredItems.length ===
                  1
                    ? ""
                    : "s"}
                </span>
              </div>
            )}
          </section>

          {/* =================================================
              MY WORKS
          ================================================= */}

          <section
            id="works"
            className="scroll-mt-24 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
          >
            <div className="border-b border-slate-200 px-5 py-5">
              <h2 className="text-lg font-bold text-slate-900">
                {dashboardFilter ===
                "All"
                  ? "My Works"
                  : `${dashboardFilter} Works`}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {dashboardFilter ===
                "All"
                  ? "All work assigned to your employee account."
                  : "Only the selected work category is shown."}
              </p>
            </div>

            {filteredItems.length ===
            0 ? (
              <div className="px-5 py-14 text-center">
                <div className="text-3xl">
                  📋
                </div>

                <p className="mt-3 text-sm font-semibold text-slate-700">
                  No works found
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  No work matches the selected filter.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredItems.map(
                  (portalItem) => {
                    if (
                      portalItem.type ===
                      "work"
                    ) {
                      const work =
                        portalItem.item;

                      return (
                        <div
                          key={`work-${work.id}`}
                          className="flex flex-col gap-4 px-5 py-5 transition hover:bg-slate-50 lg:flex-row lg:items-center lg:justify-between"
                        >
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-semibold text-slate-900">
                                {work.title}
                              </h3>

                              <WorkStatus
                                status={
                                  work.status
                                }
                              />

                              {isOverdue(
                                work
                              ) && (
                                <span className="rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-bold text-red-600">
                                  Overdue
                                </span>
                              )}
                            </div>

                            <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                              {work.description ||
                                "No description provided."}
                            </p>

                            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                              <span>
                                Category:{" "}
                                {work.category}
                              </span>

                              <span>
                                Priority:{" "}
                                {work.priority}
                              </span>

                              <span>
                                Deadline:{" "}
                                {work.deadline ||
                                  "Not set"}
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              setViewingWork(
                                work
                              )
                            }
                            className="shrink-0 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                          >
                            View Work →
                          </button>
                        </div>
                      );
                    }

                    const extra =
                      portalItem.item;

                    return (
                      <div
                        key={`extra-${extra.id}`}
                        className="flex flex-col gap-4 bg-amber-50/30 px-5 py-5 transition hover:bg-amber-50 lg:flex-row lg:items-center lg:justify-between"
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold text-slate-900">
                              {extra.title}
                            </h3>

                            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-700">
                              Extra Work
                            </span>

                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">
                              {extra.status}
                            </span>

                            {isOverdueExtraWork(
                              extra
                            ) && (
                              <span className="rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-bold text-red-600">
                                Overdue
                              </span>
                            )}
                          </div>

                          <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                            {extra.description ||
                              "No description provided."}
                          </p>

                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                            <span>
                              Priority:{" "}
                              {extra.priority}
                            </span>

                            <span>
                              Deadline:{" "}
                              {extra.deadline ||
                                "Not set"}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            setViewingExtraWork(
                              extra
                            )
                          }
                          className="shrink-0 rounded-xl border border-amber-300 bg-amber-50 px-5 py-2.5 text-sm font-semibold text-amber-800 hover:bg-amber-100"
                        >
                          View Extra Work →
                        </button>
                      </div>
                    );
                  }
                )}
              </div>
            )}
          </section>
        </main>
      </div>

      {/* =====================================================
          NORMAL WORK DETAILS
      ===================================================== */}

      {viewingWork && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setViewingWork(null);
            }
          }}
        >
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
                  Work Details
                </p>

                <h2 className="mt-1 text-xl font-bold text-slate-900">
                  {viewingWork.title}
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  {viewingWork.id}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setViewingWork(null)
                }
                className="flex h-9 w-9 items-center justify-center rounded-lg text-xl text-slate-500 hover:bg-slate-100"
              >
                ×
              </button>
            </div>

            <div className="overflow-y-auto px-6 py-6">
              <div className="space-y-5">
                <div className="flex flex-wrap items-center gap-2">
                  <WorkStatus
                    status={
                      viewingWork.status
                    }
                  />

                  {isOverdue(
                    viewingWork
                  ) && (
                    <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-600">
                      Overdue
                    </span>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <InfoBox
                    label="Work ID"
                    value={
                      viewingWork.id
                    }
                  />

                  <InfoBox
                    label="Category"
                    value={
                      viewingWork.category
                    }
                  />

                  <InfoBox
                    label="Priority"
                    value={
                      viewingWork.priority
                    }
                  />

                  <InfoBox
                    label="Deadline"
                    value={
                      viewingWork.deadline ||
                      "Not set"
                    }
                  />
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    Description
                  </p>

                  <p className="mt-2 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                    {viewingWork.description ||
                      "No description provided."}
                  </p>
                </div>

                {viewingWork.submission && (
                  <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
                    <h3 className="font-bold text-blue-900">
                      Submitted Work
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-blue-800">
                      {
                        viewingWork
                          .submission
                          .message
                      }
                    </p>

                    <div className="mt-4 space-y-2">
                      {viewingWork
                        .submission
                        .liveUrl && (
                        <a
                          href={
                            viewingWork
                              .submission
                              .liveUrl
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="block rounded-lg bg-white px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100"
                        >
                          🔗 Live Website →
                        </a>
                      )}

                      {viewingWork
                        .submission
                        .githubUrl && (
                        <a
                          href={
                            viewingWork
                              .submission
                              .githubUrl
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="block rounded-lg bg-white px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100"
                        >
                          💻 GitHub →
                        </a>
                      )}

                      {viewingWork
                        .submission
                        .demoUrl && (
                        <a
                          href={
                            viewingWork
                              .submission
                              .demoUrl
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="block rounded-lg bg-white px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100"
                        >
                          🎬 Demo →
                        </a>
                      )}
                    </div>

                    {viewingWork
                      .submission
                      .attachments &&
                      viewingWork
                        .submission
                        .attachments
                        .length >
                        0 && (
                        <div className="mt-5">
                          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-blue-700">
                            Uploaded Files
                          </p>

                          <div className="space-y-2">
                            {viewingWork
                              .submission
                              .attachments
                              .map(
                                (
                                  attachment
                                ) => (
                                  <a
                                    key={
                                      attachment.id
                                    }
                                    href={
                                      attachment.url
                                    }
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center justify-between rounded-xl border border-blue-200 bg-white px-4 py-3 hover:bg-blue-50"
                                  >
                                    <span className="min-w-0 truncate text-sm font-medium text-slate-700">
                                      📎{" "}
                                      {
                                        attachment.name
                                      }
                                    </span>

                                    <span className="ml-3 shrink-0 text-xs font-bold text-blue-600">
                                      Open
                                    </span>
                                  </a>
                                )
                              )}
                          </div>
                        </div>
                      )}
                  </div>
                )}

                {viewingWork.status ===
                  "Rework" &&
                  viewingWork.review
                    ?.reworkReason && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                      <p className="text-xs font-bold uppercase tracking-wide text-red-600">
                        Rework Reason
                      </p>

                      <p className="mt-2 text-sm leading-6 text-red-800">
                        {
                          viewingWork
                            .review
                            .reworkReason
                        }
                      </p>
                    </div>
                  )}

                {(viewingWork.status ===
                  "New" ||
                  viewingWork.status ===
                    "Assigned") && (
                  <div className="flex justify-end border-t border-slate-200 pt-5">
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() =>
                        handleStartWork(
                          viewingWork
                        )
                      }
                      className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                    >
                      {saving
                        ? "Starting..."
                        : "Start Work"}
                    </button>
                  </div>
                )}

                {(viewingWork.status ===
                  "In Progress" ||
                  viewingWork.status ===
                    "Rework") && (
                  <div className="flex justify-end border-t border-slate-200 pt-5">
                    <button
                      type="button"
                      onClick={() => {
                        setSubmittingWork(
                          viewingWork
                        );

                        setViewingWork(
                          null
                        );
                      }}
                      className="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
                    >
                      Submit Work
                    </button>
                  </div>
                )}

                {(viewingWork.status ===
                  "Submitted" ||
                  viewingWork.status ===
                    "Owner Review") && (
                  <div className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm font-medium text-violet-700">
                    Your work has been submitted and is waiting for Owner Review.
                  </div>
                )}

                {(viewingWork.status ===
                  "Approved" ||
                  viewingWork.status ===
                    "Completed") && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                    This work has been completed successfully.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          EXTRA WORK DETAILS
      ===================================================== */}

      {viewingExtraWork && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setViewingExtraWork(
                null
              );
            }
          }}
        >
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-amber-600">
                  Extra Work
                </p>

                <h2 className="mt-1 text-xl font-bold text-slate-900">
                  {viewingExtraWork.title}
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  {viewingExtraWork.id}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setViewingExtraWork(
                    null
                  )
                }
                className="flex h-9 w-9 items-center justify-center rounded-lg text-xl text-slate-500 hover:bg-slate-100"
              >
                ×
              </button>
            </div>

            <div className="overflow-y-auto px-6 py-6">
              <div className="space-y-5">
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
                    Extra Work
                  </span>

                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                    {viewingExtraWork.status}
                  </span>

                  {isOverdueExtraWork(
                    viewingExtraWork
                  ) && (
                    <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-600">
                      Overdue
                    </span>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <InfoBox
                    label="Work ID"
                    value={
                      viewingExtraWork.id
                    }
                  />

                  <InfoBox
                    label="Priority"
                    value={
                      viewingExtraWork.priority
                    }
                  />

                  <InfoBox
                    label="Status"
                    value={
                      viewingExtraWork.status
                    }
                  />

                  <InfoBox
                    label="Deadline"
                    value={
                      viewingExtraWork.deadline ||
                      "Not set"
                    }
                  />
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    Description
                  </p>

                  <p className="mt-2 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                    {viewingExtraWork.description ||
                      "No description provided."}
                  </p>
                </div>

                {viewingExtraWork.status ===
                  "Assigned" && (
                  <div className="flex justify-end border-t border-slate-200 pt-5">
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() =>
                        handleCompleteExtraWork(
                          viewingExtraWork
                        )
                      }
                      className="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {saving
                        ? "Saving..."
                        : "Mark Completed"}
                    </button>
                  </div>
                )}

                {viewingExtraWork.status ===
                  "Completed" && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                    This extra work has been completed.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          SUBMIT WORK
      ===================================================== */}

      {submittingWork && (
        <WorkSubmissionModal
          work={submittingWork}
          employeeName={
            employee.name
          }
          onClose={() =>
            setSubmittingWork(null)
          }
          onSubmit={
            handleSubmitWork
          }
        />
      )}
    </div>
  );
}

/* =========================================================
   STAT BOX
========================================================= */

function StatBox({
  label,
  value,
  onClick,
  active,
  danger,
}: {
  label: string;
  value: number;
  onClick: () => void;
  active?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-2xl border bg-white p-4 text-left shadow-sm transition",
        "hover:-translate-y-0.5 hover:shadow-md",
        active
          ? "border-slate-900 ring-2 ring-slate-900/10"
          : "border-slate-200",
      ].join(" ")}
    >
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>

      <p
        className={[
          "mt-2 text-2xl font-bold",
          danger && value > 0
            ? "text-red-600"
            : "text-slate-900",
        ].join(" ")}
      >
        {value}
      </p>

      <p className="mt-1 text-[10px] font-medium text-slate-400">
        Click to view
      </p>
    </button>
  );
}

/* =========================================================
   INFO BOX
========================================================= */

function InfoBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold text-slate-800">
        {value}
      </p>
    </div>
  );
}