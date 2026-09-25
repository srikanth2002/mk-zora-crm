"use client";

import { useEffect, useMemo, useState } from "react";

import Sidebar from "../../components/Sidebar";
import Topbar from "../../components/Topbar";
import WorkStatus from "../../components/WorkStatus";
import Modal from "../../components/ui/Modal";
import ConfirmModal from "../../components/ui/ConfirmModal";
import OwnerGuard from "../../components/OwnerGuard";

import {
  getEmployees,
  getWorks,
  subscribeToCRMChanges,
  updateWork,
} from "../../lib/store";

import type { Employee, Work } from "../../lib/types";

type ReviewFilter =
  | "All"
  | "Submitted"
  | "Owner Review"
  | "Rework"
  | "Approved";

export default function ReviewPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [works, setWorks] = useState<Work[]>([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<ReviewFilter>("All");

  const [selectedWork, setSelectedWork] =
    useState<Work | null>(null);

  const [confirmAction, setConfirmAction] = useState<
    { type: "approve"; work: Work } | null
  >(null);

  const [reworkWork, setReworkWork] =
    useState<Work | null>(null);

  const [reworkReason, setReworkReason] =
    useState("");

  const [saving, setSaving] = useState(false);

  /* =====================================================
     LOAD CRM DATA
  ===================================================== */

  const loadCRMData = () => {
    setEmployees(getEmployees());
    setWorks(getWorks());
  };

  useEffect(() => {
    loadCRMData();

    const unsubscribe =
      subscribeToCRMChanges(() => {
        loadCRMData();
      });

    return unsubscribe;
  }, []);

  /* =====================================================
     EMPLOYEE HELPERS
  ===================================================== */

  const getEmployeeName = (employeeId: string) => {
    return (
      employees.find(
        (employee) => employee.id === employeeId
      )?.name || "Unknown Employee"
    );
  };

  const getEmployee = (employeeId: string) => {
    return employees.find(
      (employee) => employee.id === employeeId
    );
  };

  /* =====================================================
     REVIEW WORKS
  ===================================================== */

  const reviewWorks = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return works
      .filter((work) => {
        const employeeName = getEmployeeName(
          work.assignedTo
        ).toLowerCase();

        const matchesSearch =
          work.title
            .toLowerCase()
            .includes(searchText) ||
          work.id
            .toLowerCase()
            .includes(searchText) ||
          work.category
            .toLowerCase()
            .includes(searchText) ||
          employeeName.includes(searchText);

        const matchesStatus =
          statusFilter === "All" ||
          work.status === statusFilter;

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        const order: Record<string, number> = {
          "Owner Review": 1,
          Submitted: 2,
          Rework: 3,
          Approved: 4,
        };

        return (
          (order[a.status] ?? 99) -
          (order[b.status] ?? 99)
        );
      });
  }, [
    works,
    employees,
    search,
    statusFilter,
  ]);

  /* =====================================================
     REVIEW COUNTS
  ===================================================== */

  const pendingReview = works.filter(
    (work) =>
      work.status === "Submitted" ||
      work.status === "Owner Review"
  ).length;

  const submitted = works.filter(
    (work) => work.status === "Submitted"
  ).length;

  const ownerReview = works.filter(
    (work) => work.status === "Owner Review"
  ).length;

  const rework = works.filter(
    (work) => work.status === "Rework"
  ).length;

  const approved = works.filter(
    (work) => work.status === "Approved"
  ).length;

  /* =====================================================
     APPROVE
  ===================================================== */

  const handleApprove = (work: Work) => {
    setConfirmAction({
      type: "approve",
      work,
    });
  };

  const executeApprove = () => {
    if (!confirmAction) return;

    setSaving(true);

    updateWork({
      ...confirmAction.work,

      status: "Approved",

      completedAt: new Date()
        .toISOString()
        .split("T")[0],

      updatedAt: new Date().toISOString(),

      review: {
        status: "Approved",
        reviewedAt: new Date().toISOString(),
        reviewedBy: "OWNER001",
        comments: "Work approved by owner.",
      },
    });

    setSaving(false);

    setConfirmAction(null);
    setSelectedWork(null);

    loadCRMData();
  };

  /* =====================================================
     REWORK
  ===================================================== */

  const openRework = (work: Work) => {
    setReworkWork(work);

    setReworkReason(
      work.review?.reworkReason || ""
    );
  };

  const executeRework = () => {
    if (!reworkWork || !reworkReason.trim()) {
      return;
    }

    setSaving(true);

    updateWork({
      ...reworkWork,

      status: "Rework",

      updatedAt: new Date().toISOString(),

      reworkCount:
        (reworkWork.reworkCount || 0) + 1,

      review: {
        status: "Rework",
        reviewedAt: new Date().toISOString(),
        reviewedBy: "OWNER001",
        comments: "Work sent for rework.",
        reworkReason:
          reworkReason.trim(),
      },
    });

    setSaving(false);

    setReworkWork(null);
    setReworkReason("");
    setSelectedWork(null);

    loadCRMData();
  };

  /* =====================================================
     PRIORITY STYLE
  ===================================================== */

  const getPriorityClass = (
    priority: string
  ) => {
    if (priority === "Urgent") {
      return "bg-red-50 text-red-600";
    }

    if (priority === "High") {
      return "bg-orange-50 text-orange-600";
    }

    if (priority === "Medium") {
      return "bg-amber-50 text-amber-600";
    }

    return "bg-slate-100 text-slate-600";
  };

  /* =====================================================
     MAIN PAGE
  ===================================================== */

  return (
    <OwnerGuard>
      <div className="min-h-screen bg-slate-50">

        <Sidebar />

        <div className="ml-64">

          <Topbar
            title="Review Work"
            subtitle="Review submitted employee work"
          />

          <main className="space-y-6 p-6">

            {/* =================================================
                PAGE HEADER
            ================================================= */}

            <section>
              <h1 className="text-2xl font-bold text-slate-900">
                Review Work
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Check submitted work, approve it, or send it
                back for rework.
              </p>
            </section>

            {/* =================================================
                REVIEW STATS
            ================================================= */}

            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">

              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-sm text-slate-500">
                  Pending Review
                </p>

                <p className="mt-2 text-3xl font-bold text-orange-600">
                  {pendingReview}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-sm text-slate-500">
                  Submitted
                </p>

                <p className="mt-2 text-3xl font-bold text-blue-600">
                  {submitted}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-sm text-slate-500">
                  Owner Review
                </p>

                <p className="mt-2 text-3xl font-bold text-violet-600">
                  {ownerReview}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-sm text-slate-500">
                  Rework
                </p>

                <p className="mt-2 text-3xl font-bold text-red-600">
                  {rework}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-sm text-slate-500">
                  Approved
                </p>

                <p className="mt-2 text-3xl font-bold text-emerald-600">
                  {approved}
                </p>
              </div>

            </section>

            {/* =================================================
                SEARCH + FILTER
            ================================================= */}

            <section className="rounded-2xl border border-slate-200 bg-white p-5">

              <div className="grid gap-4 lg:grid-cols-2">

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Search
                  </label>

                  <input
                    value={search}
                    onChange={(event) =>
                      setSearch(event.target.value)
                    }
                    placeholder="Search work, employee or ID..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-900"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Review Status
                  </label>

                  <select
                    value={statusFilter}
                    onChange={(event) =>
                      setStatusFilter(
                        event.target.value as ReviewFilter
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-900"
                  >
                    <option value="All">
                      All
                    </option>

                    <option value="Submitted">
                      Submitted
                    </option>

                    <option value="Owner Review">
                      Owner Review
                    </option>

                    <option value="Rework">
                      Rework
                    </option>

                    <option value="Approved">
                      Approved
                    </option>
                  </select>
                </div>

              </div>

            </section>

            {/* =================================================
                REVIEW QUEUE
            ================================================= */}

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">

              <div className="border-b border-slate-200 px-5 py-4">

                <h2 className="font-bold text-slate-900">
                  Review Queue
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Showing {reviewWorks.length} work item
                  {reviewWorks.length === 1
                    ? ""
                    : "s"}.
                </p>

              </div>

              <div className="overflow-x-auto">

                <table className="w-full min-w-[1050px] text-left">

                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">

                    <tr>

                      <th className="px-5 py-4">
                        Work
                      </th>

                      <th className="px-5 py-4">
                        Employee
                      </th>

                      <th className="px-5 py-4">
                        Priority
                      </th>

                      <th className="px-5 py-4">
                        Deadline
                      </th>

                      <th className="px-5 py-4">
                        Status
                      </th>

                      <th className="px-5 py-4 text-right">
                        Action
                      </th>

                    </tr>

                  </thead>

                  <tbody className="divide-y divide-slate-100">

                    {reviewWorks.length === 0 ? (

                      <tr>

                        <td
                          colSpan={6}
                          className="px-5 py-16 text-center"
                        >

                          <div className="text-4xl">
                            ✓
                          </div>

                          <p className="mt-3 text-sm font-semibold text-slate-700">
                            No review work found
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            Try changing the search or review status.
                          </p>

                        </td>

                      </tr>

                    ) : (

                      reviewWorks.map((work) => {

                        const employee =
                          getEmployee(
                            work.assignedTo
                          );

                        const isPending =
                          work.status === "Submitted" ||
                          work.status === "Owner Review";

                        return (

                          <tr
                            key={work.id}
                            className="transition hover:bg-slate-50"
                          >

                            {/* WORK */}

                            <td className="px-5 py-4">

                              <div className="max-w-[300px]">

                                <p className="truncate text-sm font-semibold text-slate-900">
                                  {work.title}
                                </p>

                                <p className="mt-1 text-xs text-slate-400">
                                  {work.id} ·{" "}
                                  {work.category}
                                </p>

                              </div>

                            </td>

                            {/* EMPLOYEE */}

                            <td className="px-5 py-4">

                              <div className="flex items-center gap-3">

                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                                  {getEmployeeName(
                                    work.assignedTo
                                  )
                                    .charAt(0)
                                    .toUpperCase()}
                                </div>

                                <div>

                                  <p className="text-sm font-medium text-slate-900">
                                    {getEmployeeName(
                                      work.assignedTo
                                    )}
                                  </p>

                                  <p className="text-xs text-slate-400">
                                    {employee?.role ||
                                      "Employee"}
                                  </p>

                                </div>

                              </div>

                            </td>

                            {/* PRIORITY */}

                            <td className="px-5 py-4">

                              <span
                                className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${getPriorityClass(
                                  work.priority
                                )}`}
                              >
                                {work.priority}
                              </span>

                            </td>

                            {/* DEADLINE */}

                            <td className="px-5 py-4 text-xs font-semibold text-slate-600">
                              {work.deadline}
                            </td>

                            {/* STATUS */}

                            <td className="px-5 py-4">
                              <WorkStatus
                                status={work.status}
                              />
                            </td>

                            {/* ACTION */}

                            <td className="px-5 py-4">

                              <div className="flex justify-end gap-2">

                                <button
                                  type="button"
                                  onClick={() =>
                                    setSelectedWork(
                                      work
                                    )
                                  }
                                  className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                                >
                                  View
                                </button>

                                {isPending && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleApprove(
                                          work
                                        )
                                      }
                                      className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                                    >
                                      Approve
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        openRework(
                                          work
                                        )
                                      }
                                      className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100"
                                    >
                                      Rework
                                    </button>
                                  </>
                                )}

                              </div>

                            </td>

                          </tr>

                        );
                      })

                    )}

                  </tbody>

                </table>

              </div>

            </section>

          </main>

        </div>

        {/* =====================================================
            REVIEW DETAILS MODAL
        ===================================================== */}

        <Modal
          isOpen={selectedWork !== null}
          onClose={() =>
            setSelectedWork(null)
          }
          title="Review Work Details"
          size="md"
        >

          {selectedWork && (

            <div className="space-y-5">

              {/* WORK HEADER */}

              <div>

                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Work
                </p>

                <h3 className="mt-1 text-xl font-bold text-slate-900">
                  {selectedWork.title}
                </h3>

                <p className="mt-1 text-xs text-slate-400">
                  {selectedWork.id}
                </p>

              </div>

              {/* WORK INFO */}

              <div className="grid gap-3 sm:grid-cols-2">

                {[
                  [
                    "Employee",
                    getEmployeeName(
                      selectedWork.assignedTo
                    ),
                  ],
                  [
                    "Category",
                    selectedWork.category,
                  ],
                  [
                    "Priority",
                    selectedWork.priority,
                  ],
                  [
                    "Start Date",
                    selectedWork.startDate,
                  ],
                  [
                    "Deadline",
                    selectedWork.deadline,
                  ],
                ].map(
                  ([label, value]) => (

                    <div
                      key={label}
                      className="rounded-xl bg-slate-50 p-4"
                    >

                      <p className="text-xs text-slate-400">
                        {label}
                      </p>

                      <p className="mt-1 text-sm font-semibold text-slate-800">
                        {value}
                      </p>

                    </div>

                  )
                )}

                <div className="rounded-xl bg-slate-50 p-4">

                  <p className="text-xs text-slate-400">
                    Status
                  </p>

                  <div className="mt-2">
                    <WorkStatus
                      status={
                        selectedWork.status
                      }
                    />
                  </div>

                </div>

              </div>

              {/* DESCRIPTION */}

              <div className="rounded-xl border border-slate-200 p-4">

                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Description
                </p>

                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                  {selectedWork.description ||
                    "No description provided."}
                </p>

              </div>

              {/* =================================================
                  EMPLOYEE SUBMISSION
              ================================================= */}

              {selectedWork.submission && (

                <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">

                  <div className="flex items-center justify-between">

                    <p className="text-xs font-bold uppercase tracking-[0.15em] text-blue-600">
                      Employee Submission
                    </p>

                    <span className="rounded-full bg-blue-100 px-3 py-1 text-[11px] font-bold text-blue-700">
                      Submitted
                    </span>

                  </div>

                  {/* SUBMISSION NOTES */}

                  <div className="mt-4 rounded-xl border border-blue-100 bg-white p-4">

                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                      Submission Notes
                    </p>

                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                      {selectedWork.submission
                        .message ||
                        "Submitted without a message."}
                    </p>

                  </div>

                  {/* SUBMITTED TIME */}

                  <div className="mt-3">

                    <p className="text-xs text-slate-400">
                      Submitted At
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-700">
                      {selectedWork.submission
                        .submittedAt}
                    </p>

                  </div>

                  {/* =================================================
                      PROJECT LINKS
                  ================================================= */}

                  {(selectedWork.submission
                    .liveUrl ||
                    selectedWork.submission
                      .githubUrl ||
                    selectedWork.submission
                      .demoUrl) && (

                    <div className="mt-5">

                      <p className="mb-3 text-xs font-bold uppercase tracking-wide text-blue-700">
                        Project Links
                      </p>

                      <div className="grid gap-2">

                        {selectedWork
                          .submission.liveUrl && (

                          <a
                            href={
                              selectedWork
                                .submission
                                .liveUrl
                            }
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-blue-700 transition hover:border-blue-300 hover:bg-blue-50"
                          >

                            <span>
                              🌐 Live Website
                            </span>

                            <span>
                              Open ↗
                            </span>

                          </a>

                        )}

                        {selectedWork
                          .submission
                          .githubUrl && (

                          <a
                            href={
                              selectedWork
                                .submission
                                .githubUrl
                            }
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50"
                          >

                            <span>
                              💻 GitHub
                            </span>

                            <span>
                              Open ↗
                            </span>

                          </a>

                        )}

                        {selectedWork
                          .submission
                          .demoUrl && (

                          <a
                            href={
                              selectedWork
                                .submission
                                .demoUrl
                            }
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-violet-700 transition hover:border-violet-300 hover:bg-violet-50"
                          >

                            <span>
                              🎥 Demo
                            </span>

                            <span>
                              Open ↗
                            </span>

                          </a>

                        )}

                      </div>

                    </div>

                  )}

                  {/* =================================================
                      UPLOADED FILES
                  ================================================= */}

                  {selectedWork.submission
                    .attachments &&
                    selectedWork.submission
                      .attachments.length > 0 && (

                    <div className="mt-5">

                      <div className="mb-3 flex items-center justify-between">

                        <p className="text-xs font-bold uppercase tracking-wide text-blue-700">
                          Uploaded Files
                        </p>

                        <span className="rounded-full bg-white px-3 py-1 text-[11px] font-bold text-slate-500">
                          {
                            selectedWork
                              .submission
                              .attachments
                              .length
                          }{" "}
                          File
                          {selectedWork
                            .submission
                            .attachments
                            .length === 1
                            ? ""
                            : "s"}
                        </span>

                      </div>

                      <div className="space-y-3">

                        {selectedWork.submission.attachments.map(
                          (attachment) => (

                            <div
                              key={
                                attachment.id
                              }
                              className="overflow-hidden rounded-2xl border border-blue-100 bg-white"
                            >

                              {/* IMAGE PREVIEW */}

                              {attachment.type ===
                                "Image" && (

                                <div className="border-b border-slate-100 bg-slate-50 p-3">

                                  <img
                                    src={
                                      attachment.url
                                    }
                                    alt={
                                      attachment.name
                                    }
                                    className="max-h-72 w-full rounded-xl object-contain"
                                  />

                                </div>

                              )}

                              {/* VIDEO PREVIEW */}

                              {attachment.type ===
                                "Video" && (

                                <div className="border-b border-slate-100 bg-black p-2">

                                  <video
                                    src={
                                      attachment.url
                                    }
                                    controls
                                    className="max-h-72 w-full rounded-xl"
                                  />

                                </div>

                              )}

                              {/* DOCUMENT / OTHER FILE */}

                              <div className="flex items-center justify-between gap-3 p-4">

                                <div className="flex min-w-0 items-center gap-3">

                                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-lg">
                                    {attachment.type ===
                                    "Image"
                                      ? "🖼️"
                                      : attachment.type ===
                                        "Video"
                                      ? "🎬"
                                      : attachment.type ===
                                        "Document"
                                      ? "📄"
                                      : attachment.type ===
                                        "Code"
                                      ? "💻"
                                      : attachment.type ===
                                        "Website"
                                      ? "🌐"
                                      : attachment.type ===
                                        "Link"
                                      ? "🔗"
                                      : "📎"}
                                  </div>

                                  <div className="min-w-0">

                                    <p className="truncate text-sm font-semibold text-slate-800">
                                      {
                                        attachment.name
                                      }
                                    </p>

                                    <p className="mt-1 text-xs text-slate-400">
                                      {
                                        attachment.type
                                      }
                                    </p>

                                  </div>

                                </div>

                                <a
                                  href={
                                    attachment.url
                                  }
                                  target="_blank"
                                  rel="noreferrer"
                                  className="shrink-0 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                                >
                                  Open ↗
                                </a>

                              </div>

                            </div>

                          )
                        )}

                      </div>

                    </div>

                  )}

                  {/* =================================================
                      NO FILES / LINKS
                  ================================================= */}

                  {(!selectedWork
                    .submission
                    .attachments ||
                    selectedWork.submission
                      .attachments.length ===
                      0) &&
                    !selectedWork
                      .submission.liveUrl &&
                    !selectedWork
                      .submission.githubUrl &&
                    !selectedWork
                      .submission.demoUrl && (

                      <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white px-4 py-5 text-center">

                        <p className="text-sm font-semibold text-slate-600">
                          No files or project
                          links attached.
                        </p>

                      </div>

                    )}

                </div>

              )}

              {/* =================================================
                  REWORK REASON
              ================================================= */}

              {selectedWork.review
                ?.reworkReason && (

                <div className="rounded-xl border border-red-100 bg-red-50 p-4">

                  <p className="text-xs font-semibold uppercase tracking-wide text-red-500">
                    Rework Reason
                  </p>

                  <p className="mt-2 whitespace-pre-wrap text-sm text-red-700">
                    {
                      selectedWork
                        .review
                        .reworkReason
                    }
                  </p>

                </div>

              )}

              {/* =================================================
                  ACTION BUTTONS
              ================================================= */}

              <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">

                <button
                  type="button"
                  onClick={() =>
                    setSelectedWork(null)
                  }
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Close
                </button>

                {(selectedWork.status ===
                  "Submitted" ||
                  selectedWork.status ===
                    "Owner Review") && (

                  <>

                    <button
                      type="button"
                      onClick={() =>
                        handleApprove(
                          selectedWork
                        )
                      }
                      className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
                    >
                      Approve
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        openRework(
                          selectedWork
                        )
                      }
                      className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
                    >
                      Send Rework
                    </button>

                  </>

                )}

              </div>

            </div>

          )}

        </Modal>

        {/* =====================================================
            APPROVE CONFIRMATION
        ===================================================== */}

        <ConfirmModal
          isOpen={
            confirmAction !== null
          }
          onClose={() => {
            if (!saving) {
              setConfirmAction(null);
            }
          }}
          onConfirm={executeApprove}
          title="Approve Work"
          message={
            confirmAction
              ? `Are you sure you want to approve "${confirmAction.work.title}"? This will move the work to Approved.`
              : ""
          }
          confirmText="Approve Work"
          cancelText="Cancel"
          variant="success"
          loading={saving}
        />

        {/* =====================================================
            REWORK MODAL
        ===================================================== */}

        <Modal
          isOpen={reworkWork !== null}
          onClose={() => {
            if (!saving) {
              setReworkWork(null);
              setReworkReason("");
            }
          }}
          title="Send Work for Rework"
          size="md"
        >

          {reworkWork && (

            <div className="space-y-5">

              <div className="rounded-xl bg-red-50 p-4">

                <p className="text-xs font-semibold uppercase tracking-wide text-red-500">
                  Rework Request
                </p>

                <p className="mt-1 text-sm font-bold text-slate-900">
                  {reworkWork.title}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  {getEmployeeName(
                    reworkWork.assignedTo
                  )}{" "}
                  ·{" "}
                  {reworkWork.id}
                </p>

              </div>

              <div>

                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Rework Reason
                </label>

                <textarea
                  value={reworkReason}
                  onChange={(event) =>
                    setReworkReason(
                      event.target.value
                    )
                  }
                  rows={5}
                  placeholder="Explain clearly what needs to be changed..."
                  className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-red-400"
                />

                {!reworkReason.trim() && (

                  <p className="mt-2 text-xs text-slate-400">
                    A reason is required before
                    sending the work for rework.
                  </p>

                )}

              </div>

              <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">

                <button
                  type="button"
                  disabled={saving}
                  onClick={() => {
                    setReworkWork(null);
                    setReworkReason("");
                  }}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={
                    saving ||
                    !reworkReason.trim()
                  }
                  onClick={
                    executeRework
                  }
                  className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Sending..."
                    : "Send Rework"}
                </button>

              </div>

            </div>

          )}

        </Modal>

      </div>
    </OwnerGuard>
  );
}