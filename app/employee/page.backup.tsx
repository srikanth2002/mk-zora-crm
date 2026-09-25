"use client";

import { useEffect, useMemo, useState } from "react";

import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import Modal from "@/components/ui/Modal";
import WorkStatus from "@/components/WorkStatus";

import {
  getEmployees,
  getWorks,
  updateWork,
  subscribeToCRMChanges,
} from "@/lib/store";

import type {
  Employee,
  Work,
  WorkStatus as WorkStatusType,
} from "@/lib/types";

const EMPLOYEE_SESSION_KEY = "mkzora_employee_session";

const WORK_STATUSES: WorkStatusType[] = [
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

function formatDate(date?: string) {
  if (!date) return "-";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function isOverdue(work: Work) {
  if (!work.deadline) return false;

  if (
    work.status === "Completed" ||
    work.status === "Approved" ||
    work.status === "Cancelled"
  ) {
    return false;
  }

  return work.deadline < getToday();
}

export default function EmployeePortalPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [works, setWorks] = useState<Work[]>([]);

  const [employeeName, setEmployeeName] = useState("");
  const [selectedEmployeeId, setSelectedEmployeeId] =
    useState("");

  const [loggedIn, setLoggedIn] = useState(false);

  const [loginError, setLoginError] = useState("");

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] =
    useState<"All" | WorkStatusType>("All");

  const [viewingWork, setViewingWork] =
    useState<Work | null>(null);

  const [submissionMessage, setSubmissionMessage] =
    useState("");

  const [liveUrl, setLiveUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [demoUrl, setDemoUrl] = useState("");

  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function loadData() {
    setEmployees(getEmployees());
    setWorks(getWorks());
  }

  useEffect(() => {
    loadData();

    const savedEmployeeId = localStorage.getItem(
      EMPLOYEE_SESSION_KEY
    );

    if (savedEmployeeId) {
      setSelectedEmployeeId(savedEmployeeId);
      setLoggedIn(true);
    }

    const unsubscribe =
      subscribeToCRMChanges(loadData);

    return unsubscribe;
  }, []);

  const currentEmployee = useMemo(() => {
    return employees.find(
      (employee) =>
        employee.id === selectedEmployeeId
    );
  }, [employees, selectedEmployeeId]);

  const myWorks = useMemo(() => {
    if (!selectedEmployeeId) return [];

    return works.filter(
      (work) =>
        work.assignedTo === selectedEmployeeId
    );
  }, [works, selectedEmployeeId]);

  const filteredWorks = useMemo(() => {
    const query = search.trim().toLowerCase();

    return myWorks.filter((work) => {
      const matchesSearch =
        !query ||
        work.title.toLowerCase().includes(query) ||
        work.description.toLowerCase().includes(query) ||
        work.category.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "All" ||
        work.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [myWorks, search, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: myWorks.length,

      pending: myWorks.filter(
        (work) =>
          work.status === "New" ||
          work.status === "Assigned"
      ).length,

      inProgress: myWorks.filter(
        (work) =>
          work.status === "In Progress"
      ).length,

      submitted: myWorks.filter(
        (work) =>
          work.status === "Submitted" ||
          work.status === "Owner Review"
      ).length,

      rework: myWorks.filter(
        (work) =>
          work.status === "Rework"
      ).length,

      completed: myWorks.filter(
        (work) =>
          work.status === "Approved" ||
          work.status === "Completed"
      ).length,

      overdue: myWorks.filter(
        (work) => isOverdue(work)
      ).length,
    };
  }, [myWorks]);

  function handleLogin() {
    const typedName = employeeName
      .trim()
      .toLowerCase();

    if (!typedName) {
      setLoginError(
        "Please enter your employee name."
      );
      return;
    }

    const employee = employees.find(
      (item) =>
        item.status === "Active" &&
        item.name.trim().toLowerCase() === typedName
    );

    if (!employee) {
      setLoginError(
        "Active employee not found. Please check your name."
      );
      return;
    }

    localStorage.setItem(
      EMPLOYEE_SESSION_KEY,
      employee.id
    );

    setSelectedEmployeeId(employee.id);
    setLoggedIn(true);
    setLoginError("");
  }

  function handleLogout() {
    localStorage.removeItem(
      EMPLOYEE_SESSION_KEY
    );

    setLoggedIn(false);
    setSelectedEmployeeId("");
    setEmployeeName("");
    setViewingWork(null);
  }

  function openWork(work: Work) {
    setViewingWork(work);

    setSubmissionMessage(
      work.submission?.message || ""
    );

    setLiveUrl(
      work.submission?.liveUrl || ""
    );

    setGithubUrl(
      work.submission?.githubUrl || ""
    );

    setDemoUrl(
      work.submission?.demoUrl || ""
    );

    setSubmitError("");
  }

  function closeWork() {
    setViewingWork(null);
    setSubmitError("");
  }

  function startWork() {
    if (!viewingWork) return;

    if (
      viewingWork.status !== "New" &&
      viewingWork.status !== "Assigned" &&
      viewingWork.status !== "Rework"
    ) {
      return;
    }

    const updatedWork: Work = {
      ...viewingWork,
      status: "In Progress",
      updatedAt: new Date().toISOString(),
    };

    updateWork(updatedWork);

    setViewingWork(updatedWork);
  }

  function submitWork() {
    if (!viewingWork || !currentEmployee) {
      return;
    }

    if (!submissionMessage.trim()) {
      setSubmitError(
        "Please add a completion message."
      );
      return;
    }

    if (
      !liveUrl.trim() &&
      !githubUrl.trim() &&
      !demoUrl.trim()
    ) {
      setSubmitError(
        "Please provide at least one work link."
      );
      return;
    }

    setSubmitting(true);
    setSubmitError("");

    const now = new Date().toISOString();

    const updatedWork: Work = {
      ...viewingWork,

      status: "Owner Review",

      updatedAt: now,

      submission: {
        submittedAt: now,
        submittedBy: currentEmployee.id,
        message: submissionMessage.trim(),
        attachments:
          viewingWork.submission?.attachments || [],
        liveUrl: liveUrl.trim() || undefined,
        githubUrl:
          githubUrl.trim() || undefined,
        demoUrl:
          demoUrl.trim() || undefined,
      },

      review: {
        status: "Pending",
      },
    };

    updateWork(updatedWork);

    setViewingWork(updatedWork);
    setSubmitting(false);
  }

  /* =====================================================
     LOGIN SCREEN
  ===================================================== */

  if (!loggedIn) {
    return (
      <div className="min-h-screen bg-slate-100">
        <Sidebar />

        <main className="ml-64 min-h-screen">
          <Topbar
            title="Employee Portal"
            subtitle="Employee login and work management"
          />

          <div className="flex min-h-[calc(100vh-80px)] items-center justify-center p-6">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">

              <div className="mb-8 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 text-xl font-bold text-white">
                  MZ
                </div>

                <h2 className="text-2xl font-bold text-slate-900">
                  Employee Login
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  Enter your employee name to access
                  your work dashboard.
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Employee Name
                </label>

                <input
                  type="text"
                  value={employeeName}
                  onChange={(event) => {
                    setEmployeeName(
                      event.target.value
                    );
                    setLoginError("");
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      handleLogin();
                    }
                  }}
                  placeholder="Enter your full name"
                  autoComplete="off"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              {loginError && (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {loginError}
                </div>
              )}

              <button
                type="button"
                onClick={handleLogin}
                disabled={!employeeName.trim()}
                className="mt-6 w-full rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Login to Employee Portal
              </button>

              <p className="mt-4 text-center text-xs text-slate-400">
                Enter the employee name exactly as
                registered in MK ZORA CRM.
              </p>

            </div>
          </div>
        </main>
      </div>
    );
  }

  /* =====================================================
     EMPLOYEE DASHBOARD
  ===================================================== */

  return (
    <div className="min-h-screen bg-slate-100">
      <Sidebar />

      <main className="ml-64 min-h-screen">
        <Topbar
          title="Employee Portal"
          subtitle={
            currentEmployee
              ? `Welcome, ${currentEmployee.name}`
              : "My work dashboard"
          }
        />

        <div className="space-y-6 p-6">

          {/* Employee Header */}
          <section className="rounded-2xl bg-slate-900 p-6 text-white shadow-lg">
            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">

              <div>
                <p className="text-sm text-slate-300">
                  Employee Workspace
                </p>

                <h2 className="mt-1 text-2xl font-bold">
                  {currentEmployee?.name}
                </h2>

                <p className="mt-1 text-sm text-slate-300">
                  {currentEmployee?.role} ·{" "}
                  {currentEmployee?.department}
                </p>

                <p className="mt-2 text-xs text-slate-400">
                  Employee ID:{" "}
                  {currentEmployee?.id}
                </p>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/15"
              >
                Logout
              </button>

            </div>
          </section>

          {/* Stats */}
          <section className="grid grid-cols-2 gap-4 lg:grid-cols-7">

            <StatBox
              label="Total"
              value={stats.total}
            />

            <StatBox
              label="Pending"
              value={stats.pending}
            />

            <StatBox
              label="In Progress"
              value={stats.inProgress}
            />

            <StatBox
              label="Submitted"
              value={stats.submitted}
            />

            <StatBox
              label="Rework"
              value={stats.rework}
            />

            <StatBox
              label="Completed"
              value={stats.completed}
            />

            <StatBox
              label="Overdue"
              value={stats.overdue}
              danger={stats.overdue > 0}
            />

          </section>

          {/* Filters */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex flex-col gap-4 lg:flex-row">

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search your works..."
                className="flex-1 rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
              />

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value as
                      | "All"
                      | WorkStatusType
                  )
                }
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-900"
              >
                <option value="All">
                  All Status
                </option>

                {WORK_STATUSES.map((status) => (
                  <option
                    key={status}
                    value={status}
                  >
                    {status}
                  </option>
                ))}
              </select>

            </div>
          </section>

          {/* My Works */}
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="border-b border-slate-200 px-6 py-5">
              <h3 className="text-lg font-bold text-slate-900">
                My Works
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Works assigned to your employee account.
              </p>
            </div>

            {filteredWorks.length === 0 ? (
              <div className="px-6 py-16 text-center">

                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-xl text-slate-400">
                  —
                </div>

                <h4 className="font-semibold text-slate-900">
                  No works found
                </h4>

                <p className="mt-1 text-sm text-slate-500">
                  You currently have no works matching
                  this filter.
                </p>

              </div>
            ) : (
              <div className="divide-y divide-slate-100">

                {filteredWorks.map((work) => (
                  <button
                    key={work.id}
                    type="button"
                    onClick={() =>
                      openWork(work)
                    }
                    className="w-full px-6 py-5 text-left transition hover:bg-slate-50"
                  >

                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                      <div className="min-w-0">

                        <div className="flex flex-wrap items-center gap-2">

                          <h4 className="font-semibold text-slate-900">
                            {work.title}
                          </h4>

                          <WorkStatus
                            status={work.status}
                          />

                        </div>

                        <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                          {work.description}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">

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
                            {formatDate(
                              work.deadline
                            )}
                          </span>

                          {isOverdue(work) && (
                            <span className="font-semibold text-red-600">
                              Overdue
                            </span>
                          )}

                        </div>

                      </div>

                      <div className="shrink-0 text-sm font-semibold text-slate-700">
                        View Work →
                      </div>

                    </div>

                  </button>
                ))}

              </div>
            )}

          </section>

        </div>
      </main>

      {/* Work Details Modal */}
      <Modal
        isOpen={Boolean(viewingWork)}
        onClose={closeWork}
        title={
          viewingWork?.title ||
          "Work Details"
        }
      >
        {viewingWork && (
          <div className="space-y-6">

            {/* Status */}
            <div className="flex flex-wrap items-center gap-2">

              <WorkStatus
                status={viewingWork.status}
              />

              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                {viewingWork.priority}
              </span>

              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                {viewingWork.category}
              </span>

            </div>

            {/* Description */}
            <div>
              <h4 className="text-sm font-semibold text-slate-500">
                Description
              </h4>

              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                {viewingWork.description}
              </p>
            </div>

            {/* Dates */}
            <div className="grid gap-4 sm:grid-cols-2">

              <InfoBox
                label="Start Date"
                value={formatDate(
                  viewingWork.startDate
                )}
              />

              <InfoBox
                label="Deadline"
                value={formatDate(
                  viewingWork.deadline
                )}
                danger={isOverdue(
                  viewingWork
                )}
              />

            </div>

            {/* Rework */}
            {viewingWork.review?.reworkReason && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">

                <p className="text-xs font-bold uppercase tracking-wide text-amber-700">
                  Rework Instructions
                </p>

                <p className="mt-2 whitespace-pre-wrap text-sm text-amber-900">
                  {
                    viewingWork.review
                      .reworkReason
                  }
                </p>

              </div>
            )}

            {/* Previous Submission */}
            {viewingWork.submission && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">

                <h4 className="font-semibold text-slate-900">
                  Latest Submission
                </h4>

                <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">
                  {
                    viewingWork.submission
                      .message
                  }
                </p>

                <div className="mt-4 space-y-2 text-sm">

                  {viewingWork.submission
                    .liveUrl && (
                    <a
                      href={
                        viewingWork
                          .submission
                          .liveUrl
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="block font-semibold text-blue-600 hover:underline"
                    >
                      Open Live URL →
                    </a>
                  )}

                  {viewingWork.submission
                    .githubUrl && (
                    <a
                      href={
                        viewingWork
                          .submission
                          .githubUrl
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="block font-semibold text-blue-600 hover:underline"
                    >
                      Open GitHub →
                    </a>
                  )}

                  {viewingWork.submission
                    .demoUrl && (
                    <a
                      href={
                        viewingWork
                          .submission
                          .demoUrl
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="block font-semibold text-blue-600 hover:underline"
                    >
                      Open Demo →
                    </a>
                  )}

                </div>

              </div>
            )}

            {/* Start Work */}
            {(viewingWork.status === "New" ||
              viewingWork.status === "Assigned" ||
              viewingWork.status === "Rework") && (
              <button
                type="button"
                onClick={startWork}
                className="w-full rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Start / Continue Work
              </button>
            )}

            {/* Submit Work */}
            {viewingWork.status === "In Progress" && (
              <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">

                <div>
                  <h4 className="font-bold text-slate-900">
                    Submit Completed Work
                  </h4>

                  <p className="mt-1 text-sm text-slate-500">
                    Add your completion message and
                    at least one work link.
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Completion Message
                  </label>

                  <textarea
                    value={submissionMessage}
                    onChange={(event) =>
                      setSubmissionMessage(
                        event.target.value
                      )
                    }
                    rows={4}
                    placeholder="Explain what you completed..."
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                  />
                </div>

                <div className="grid gap-4">

                  <InputField
                    label="Live / Published URL"
                    value={liveUrl}
                    onChange={setLiveUrl}
                    placeholder="https://..."
                  />

                  <InputField
                    label="GitHub URL"
                    value={githubUrl}
                    onChange={setGithubUrl}
                    placeholder="https://github.com/..."
                  />

                  <InputField
                    label="Demo URL"
                    value={demoUrl}
                    onChange={setDemoUrl}
                    placeholder="https://..."
                  />

                </div>

                {submitError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    {submitError}
                  </div>
                )}

                <button
                  type="button"
                  onClick={submitWork}
                  disabled={submitting}
                  className="w-full rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {submitting
                    ? "Submitting..."
                    : "Submit Work for Owner Review"}
                </button>

              </div>
            )}

            {/* Owner Review */}
            {viewingWork.status ===
              "Owner Review" && (
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">

                <p className="font-semibold text-blue-900">
                  Work submitted successfully.
                </p>

                <p className="mt-1 text-sm text-blue-700">
                  Your work is waiting for Owner
                  Review.
                </p>

              </div>
            )}

            {/* Approved */}
            {viewingWork.status === "Approved" && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">

                <p className="font-semibold text-emerald-900">
                  Work approved.
                </p>

                <p className="mt-1 text-sm text-emerald-700">
                  This work has been approved by
                  the Owner.
                </p>

              </div>
            )}

            {/* Completed */}
            {viewingWork.status === "Completed" && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">

                <p className="font-semibold text-emerald-900">
                  Work completed.
                </p>

              </div>
            )}

          </div>
        )}
      </Modal>
    </div>
  );
}

/* =====================================================
   SMALL COMPONENTS
===================================================== */

function StatBox({
  label,
  value,
  danger = false,
}: {
  label: string;
  value: number;
  danger?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p
        className={`mt-2 text-2xl font-bold ${
          danger
            ? "text-red-600"
            : "text-slate-900"
        }`}
      >
        {value}
      </p>

    </div>
  );
}

function InfoBox({
  label,
  value,
  danger = false,
}: {
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">

      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p
        className={`mt-1 text-sm font-semibold ${
          danger
            ? "text-red-600"
            : "text-slate-900"
        }`}
      >
        {value}
      </p>

    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div>

      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </label>

      <input
        type="url"
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
      />

    </div>
  );
}