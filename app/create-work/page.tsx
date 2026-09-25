"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import Sidebar from "../../components/Sidebar";
import Topbar from "../../components/Topbar";
import OwnerGuard from "../../components/OwnerGuard";

import {
  addWork,
  getEmployees,
  getWorks,
  subscribeToCRMChanges,
} from "../../lib/store";

import type {
  Employee,
  Work,
  WorkCategory,
  WorkPriority,
} from "../../lib/types";

const categories: WorkCategory[] = [
  "Video",
  "Website",
  "Coding",
  "Design",
  "Social Media",
  "Content",
  "Marketing",
  "Client Work",
  "Extra Work",
  "Other",
];

const priorities: WorkPriority[] = [
  "Low",
  "Medium",
  "High",
  "Urgent",
];

export default function CreateWorkPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [works, setWorks] = useState<Work[]>([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [category, setCategory] =
    useState<WorkCategory>("Other");
  const [priority, setPriority] =
    useState<WorkPriority>("Medium");

  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [deadline, setDeadline] = useState("");
  const [estimatedHours, setEstimatedHours] = useState("");
  const [tags, setTags] = useState("");
  const [message, setMessage] = useState("");

  /* ==========================================
     LOAD CENTRAL CRM DATA
  ========================================== */

  function loadCRMData() {
    setEmployees(getEmployees());
    setWorks(getWorks());
  }

  useEffect(() => {
    loadCRMData();

    const unsubscribe = subscribeToCRMChanges(() => {
      loadCRMData();
    });

    return unsubscribe;
  }, []);

  /* ==========================================
     ACTIVE EMPLOYEES
  ========================================== */

  const activeEmployees = useMemo(() => {
    return employees.filter(
      (employee) => employee.status === "Active"
    );
  }, [employees]);

  /* ==========================================
     RECENT WORKS
  ========================================== */

  const recentWorks = useMemo(() => {
    return [...works]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime()
      )
      .slice(0, 6);
  }, [works]);

  /* ==========================================
     CREATE WORK
  ========================================== */

  function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setMessage("");

    if (!title.trim()) {
      setMessage("Please enter a work title.");
      return;
    }

    if (!assignedTo) {
      setMessage("Please select an employee.");
      return;
    }

    if (!deadline) {
      setMessage("Please select a deadline.");
      return;
    }

    const selectedEmployee = employees.find(
      (employee) => employee.id === assignedTo
    );

    if (!selectedEmployee) {
      setMessage(
        "Selected employee is no longer available."
      );
      return;
    }

    const now = new Date().toISOString();

    const newWork: Work = {
      id: `WRK${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      category,
      priority,
      status: "Assigned",
      assignedTo,
      assignedBy: "OWNER001",
      startDate,
      deadline,
      createdAt: now,
      updatedAt: now,
      estimatedHours: estimatedHours
        ? Number(estimatedHours)
        : undefined,
      tags: tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      attachments: [],
      reworkCount: 0,
    };

    addWork(newWork);

    loadCRMData();

    /* CLEAR FORM */

    setTitle("");
    setDescription("");
    setAssignedTo("");
    setCategory("Other");
    setPriority("Medium");

    setStartDate(
      new Date().toISOString().split("T")[0]
    );

    setDeadline("");
    setEstimatedHours("");
    setTags("");

    setMessage("Work assigned successfully.");
  }

  /* ==========================================
     CLEAR FORM
  ========================================== */

  function clearForm() {
    setTitle("");
    setDescription("");
    setAssignedTo("");
    setCategory("Other");
    setPriority("Medium");

    setStartDate(
      new Date().toISOString().split("T")[0]
    );

    setDeadline("");
    setEstimatedHours("");
    setTags("");
    setMessage("");
  }

  /* ==========================================
     EMPLOYEE NAME
  ========================================== */

  function getEmployeeName(employeeId: string) {
    return (
      employees.find(
        (employee) => employee.id === employeeId
      )?.name ?? "Unknown Employee"
    );
  }

  /* ==========================================
     PRIORITY STYLE
  ========================================== */

  function priorityClass(
    priorityValue: WorkPriority
  ) {
    switch (priorityValue) {
      case "Urgent":
        return "bg-red-50 text-red-600 border-red-200";

      case "High":
        return "bg-orange-50 text-orange-600 border-orange-200";

      case "Medium":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";

      default:
        return "bg-slate-50 text-slate-600 border-slate-200";
    }
  }

  /* ==========================================
     PAGE
  ========================================== */

  return (
    <OwnerGuard>
      <div className="min-h-screen bg-[#f8fafc] text-slate-900">

        {/* FIXED SIDEBAR */}

        <Sidebar />

        {/* MAIN AREA */}

        <main className="ml-64 min-h-screen">

          <Topbar />

          <div className="p-6">

            {/* PAGE HEADER */}

            <div className="mb-6">
              <h1 className="text-2xl font-bold text-slate-900">
                Create Work
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Assign new work to your team members.
              </p>
            </div>

            {/* MAIN CONTENT */}

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">

              {/* ======================================
                  FORM
              ====================================== */}

              <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">

                <div className="border-b border-slate-200 px-6 py-5">
                  <h2 className="text-lg font-bold text-slate-900">
                    Work Details
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Enter the work information and assign it
                    to an active employee.
                  </p>
                </div>

                <form
                  onSubmit={handleSubmit}
                  className="space-y-6 p-6"
                >

                  {/* TITLE */}

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Work Title
                    </label>

                    <input
                      type="text"
                      value={title}
                      onChange={(event) =>
                        setTitle(event.target.value)
                      }
                      placeholder="Example: Instagram Reel Product Launch"
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                    />
                  </div>

                  {/* DESCRIPTION */}

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Description
                    </label>

                    <textarea
                      value={description}
                      onChange={(event) =>
                        setDescription(event.target.value)
                      }
                      placeholder="Describe the work requirements..."
                      rows={5}
                      className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                    />
                  </div>

                  {/* CATEGORY + PRIORITY */}

                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Category
                      </label>

                      <select
                        value={category}
                        onChange={(event) =>
                          setCategory(
                            event.target.value as WorkCategory
                          )
                        }
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500"
                      >
                        {categories.map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Priority
                      </label>

                      <select
                        value={priority}
                        onChange={(event) =>
                          setPriority(
                            event.target.value as WorkPriority
                          )
                        }
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500"
                      >
                        {priorities.map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </select>
                    </div>

                  </div>

                  {/* EMPLOYEE */}

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Assign To
                    </label>

                    <select
                      value={assignedTo}
                      onChange={(event) =>
                        setAssignedTo(event.target.value)
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500"
                    >
                      <option value="">
                        Select active employee
                      </option>

                      {activeEmployees.map((employee) => (
                        <option
                          key={employee.id}
                          value={employee.id}
                        >
                          {employee.name} — {employee.role}
                        </option>
                      ))}
                    </select>

                    {activeEmployees.length === 0 && (
                      <p className="mt-2 text-xs text-red-500">
                        No active employees available.
                      </p>
                    )}
                  </div>

                  {/* DATES */}

                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Start Date
                      </label>

                      <input
                        type="date"
                        value={startDate}
                        onChange={(event) =>
                          setStartDate(event.target.value)
                        }
                        className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Deadline
                      </label>

                      <input
                        type="date"
                        value={deadline}
                        min={startDate}
                        onChange={(event) =>
                          setDeadline(event.target.value)
                        }
                        className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
                      />
                    </div>

                  </div>

                  {/* HOURS */}

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Estimated Hours
                    </label>

                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={estimatedHours}
                      onChange={(event) =>
                        setEstimatedHours(
                          event.target.value
                        )
                      }
                      placeholder="Example: 4"
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
                    />
                  </div>

                  {/* TAGS */}

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Tags
                    </label>

                    <input
                      type="text"
                      value={tags}
                      onChange={(event) =>
                        setTags(event.target.value)
                      }
                      placeholder="Instagram, Campaign, September"
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
                    />

                    <p className="mt-1 text-xs text-slate-400">
                      Separate multiple tags using commas.
                    </p>
                  </div>

                  {/* MESSAGE */}

                  {message && (
                    <div
                      className={`rounded-xl border px-4 py-3 text-sm font-medium ${
                        message.includes("successfully")
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-red-200 bg-red-50 text-red-600"
                      }`}
                    >
                      {message}
                    </div>
                  )}

                  {/* ACTIONS */}

                  <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">

                    <button
                      type="button"
                      onClick={clearForm}
                      className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Clear
                    </button>

                    <button
                      type="submit"
                      className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
                    >
                      Assign Work
                    </button>

                  </div>

                </form>
              </section>

              {/* ======================================
                  RIGHT SIDE
              ====================================== */}

              <aside className="space-y-6">

                {/* ASSIGNMENT PREVIEW */}

                <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">

                  <div className="border-b border-slate-200 px-5 py-4">
                    <h2 className="font-bold text-slate-900">
                      Assignment Preview
                    </h2>

                    <p className="mt-1 text-xs text-slate-500">
                      Review before assigning.
                    </p>
                  </div>

                  <div className="space-y-4 p-5">

                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Work
                      </p>

                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {title.trim() || "Untitled Work"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Employee
                      </p>

                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {assignedTo
                          ? getEmployeeName(assignedTo)
                          : "Not assigned"}
                      </p>
                    </div>

                    <div className="flex items-center justify-between">

                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                          Category
                        </p>

                        <p className="mt-1 text-sm text-slate-700">
                          {category}
                        </p>
                      </div>

                      <span
                        className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${priorityClass(
                          priority
                        )}`}
                      >
                        {priority}
                      </span>

                    </div>

                    <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">

                      <div>
                        <p className="text-xs text-slate-400">
                          Start
                        </p>

                        <p className="mt-1 text-sm font-medium text-slate-700">
                          {startDate || "—"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-400">
                          Deadline
                        </p>

                        <p className="mt-1 text-sm font-medium text-slate-700">
                          {deadline || "—"}
                        </p>
                      </div>

                    </div>

                  </div>
                </section>

                {/* RECENT WORKS */}

                <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">

                  <div className="border-b border-slate-200 px-5 py-4">

                    <h2 className="font-bold text-slate-900">
                      Recent Work
                    </h2>

                    <p className="mt-1 text-xs text-slate-500">
                      Latest assignments from CRM.
                    </p>

                  </div>

                  <div className="divide-y divide-slate-100">

                    {recentWorks.length === 0 ? (
                      <div className="p-6 text-center">

                        <div className="text-3xl">
                          📋
                        </div>

                        <p className="mt-2 text-sm font-medium text-slate-600">
                          No work created yet
                        </p>

                      </div>
                    ) : (
                      recentWorks.map((work) => (
                        <div
                          key={work.id}
                          className="px-5 py-4"
                        >

                          <div className="flex items-start justify-between gap-3">

                            <div className="min-w-0">

                              <p className="truncate text-sm font-semibold text-slate-800">
                                {work.title}
                              </p>

                              <p className="mt-1 text-xs text-slate-400">
                                {getEmployeeName(
                                  work.assignedTo
                                )}
                              </p>

                            </div>

                            <span
                              className={`shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-semibold ${priorityClass(
                                work.priority
                              )}`}
                            >
                              {work.priority}
                            </span>

                          </div>

                          <div className="mt-3 flex items-center justify-between">

                            <span className="text-xs text-slate-400">
                              {work.category}
                            </span>

                            <span className="text-xs font-medium text-slate-500">
                              {work.status}
                            </span>

                          </div>

                        </div>
                      ))
                    )}

                  </div>

                </section>

              </aside>

            </div>

          </div>

        </main>

      </div>
    </OwnerGuard>
  );
}