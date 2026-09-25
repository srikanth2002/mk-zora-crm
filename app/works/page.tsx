"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import Sidebar from "../../components/Sidebar";
import Topbar from "../../components/Topbar";
import WorkStatus from "../../components/WorkStatus";
import Modal from "../../components/ui/Modal";
import OwnerGuard from "../../components/OwnerGuard";

import {
  getEmployees,
  getWorks,
  subscribeToCRMChanges,
} from "../../lib/store";

import type {
  Employee,
  Work,
  WorkPriority,
  WorkStatus as WorkStatusType,
} from "../../lib/types";

const statusOptions: Array<"All" | WorkStatusType> = [
  "All",
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

const priorityOptions: Array<
  "All" | WorkPriority
> = [
  "All",
  "Low",
  "Medium",
  "High",
  "Urgent",
];

export default function WorksPage() {
  const [employees, setEmployees] =
    useState<Employee[]>([]);

  const [works, setWorks] =
    useState<Work[]>([]);

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState<"All" | WorkStatusType>("All");

  const [priorityFilter, setPriorityFilter] =
    useState<"All" | WorkPriority>("All");

  const [employeeFilter, setEmployeeFilter] =
    useState("All");

  const [viewingWork, setViewingWork] =
    useState<Work | null>(null);

  /* =====================================================
     LOAD CENTRAL CRM DATA
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
     EMPLOYEE LOOKUP
  ===================================================== */

  const getEmployeeName = (
    employeeId: string
  ) => {
    return (
      employees.find(
        (employee) =>
          employee.id === employeeId
      )?.name ||
      "Unknown Employee"
    );
  };

  const getEmployee = (
    employeeId: string
  ) => {
    return employees.find(
      (employee) =>
        employee.id === employeeId
    );
  };

  /* =====================================================
     FILTER WORKS
  ===================================================== */

  const filteredWorks =
    useMemo(() => {
      const searchText =
        search.trim().toLowerCase();

      return works.filter((work) => {
        const employee =
          employees.find(
            (item) =>
              item.id ===
              work.assignedTo
          );

        const employeeName =
          employee?.name || "";

        const matchesSearch =
          work.title
            .toLowerCase()
            .includes(searchText) ||
          work.category
            .toLowerCase()
            .includes(searchText) ||
          employeeName
            .toLowerCase()
            .includes(searchText) ||
          work.id
            .toLowerCase()
            .includes(searchText);

        const matchesStatus =
          statusFilter === "All" ||
          work.status === statusFilter;

        const matchesPriority =
          priorityFilter === "All" ||
          work.priority ===
            priorityFilter;

        const matchesEmployee =
          employeeFilter === "All" ||
          work.assignedTo ===
            employeeFilter;

        return (
          matchesSearch &&
          matchesStatus &&
          matchesPriority &&
          matchesEmployee
        );
      });
    }, [
      works,
      employees,
      search,
      statusFilter,
      priorityFilter,
      employeeFilter,
    ]);

  /* =====================================================
     SUMMARY
  ===================================================== */

  const totalWorks =
    works.length;

  const activeWorks =
    works.filter(
      (work) =>
        work.status === "New" ||
        work.status === "Assigned" ||
        work.status === "In Progress"
    ).length;

  const reviewWorks =
    works.filter(
      (work) =>
        work.status === "Submitted" ||
        work.status === "Owner Review"
    ).length;

  const reworkWorks =
    works.filter(
      (work) =>
        work.status === "Rework"
    ).length;

  /* =====================================================
     PRIORITY STYLE
  ===================================================== */

  function getPriorityClass(
    priority: string
  ) {
    if (priority === "Urgent") {
      return "text-red-600 bg-red-50";
    }

    if (priority === "High") {
      return "text-orange-600 bg-orange-50";
    }

    if (priority === "Medium") {
      return "text-amber-600 bg-amber-50";
    }

    return "text-slate-600 bg-slate-100";
  }

  /* =====================================================
     VIEW WORK
  ===================================================== */

  function handleViewWork(work: Work) {
    setViewingWork(work);
  }

  /* =====================================================
     UI
  ===================================================== */

  return (
   <OwnerGuard>
    <div className="min-h-screen bg-slate-50">
      <Sidebar />

      <div className="ml-64">
        <Topbar
          title="All Works"
          subtitle="Manage your team and work"
        />

        <main className="space-y-6 p-6">

          {/* PAGE HEADER */}

          <section className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                All Works
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                View and manage all employee work assignments.
              </p>
            </div>

            <Link
              href="/create-work"
              className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
            >
              ＋ Create New Work
            </Link>

          </section>

          {/* SUMMARY */}

          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-sm text-slate-500">
                Total Works
              </p>

              <p className="mt-2 text-3xl font-bold text-slate-900">
                {totalWorks}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-sm text-slate-500">
                Active Works
              </p>

              <p className="mt-2 text-3xl font-bold text-blue-600">
                {activeWorks}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-sm text-slate-500">
                Pending Review
              </p>

              <p className="mt-2 text-3xl font-bold text-orange-600">
                {reviewWorks}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-sm text-slate-500">
                Rework
              </p>

              <p className="mt-2 text-3xl font-bold text-red-600">
                {reworkWorks}
              </p>
            </div>

          </section>

          {/* FILTERS */}

          <section className="rounded-2xl border border-slate-200 bg-white p-5">

            <div className="grid gap-4 lg:grid-cols-4">

              {/* SEARCH */}

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Search
                </label>

                <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3">

                  <span className="mr-2 text-slate-400">
                    ⌕
                  </span>

                  <input
                    type="text"
                    value={search}
                    onChange={(e) =>
                      setSearch(
                        e.target.value
                      )
                    }
                    placeholder="Search work..."
                    className="w-full bg-transparent py-3 text-sm outline-none"
                  />

                </div>
              </div>

              {/* STATUS */}

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Status
                </label>

                <select
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(
                      e.target.value as
                        | "All"
                        | WorkStatusType
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-slate-900"
                >
                  {statusOptions.map(
                    (status) => (
                      <option
                        key={status}
                        value={status}
                      >
                        {status}
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* PRIORITY */}

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Priority
                </label>

                <select
                  value={
                    priorityFilter
                  }
                  onChange={(e) =>
                    setPriorityFilter(
                      e.target.value as
                        | "All"
                        | WorkPriority
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-slate-900"
                >
                  {priorityOptions.map(
                    (priority) => (
                      <option
                        key={priority}
                        value={priority}
                      >
                        {priority ===
                        "All"
                          ? "All Priorities"
                          : priority}
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* EMPLOYEE */}

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Employee
                </label>

                <select
                  value={
                    employeeFilter
                  }
                  onChange={(e) =>
                    setEmployeeFilter(
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-slate-900"
                >
                  <option value="All">
                    All Employees
                  </option>

                  {employees.map(
                    (employee) => (
                      <option
                        key={employee.id}
                        value={employee.id}
                      >
                        {employee.name}
                        {employee.status ===
                        "Inactive"
                          ? " (Inactive)"
                          : ""}
                      </option>
                    )
                  )}
                </select>
              </div>

            </div>

          </section>

          {/* WORK LIST */}

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">

            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">

              <div>
                <h2 className="font-bold text-slate-900">
                  Work List
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Showing{" "}
                  {filteredWorks.length}{" "}
                  of{" "}
                  {totalWorks}{" "}
                  works
                </p>
              </div>

            </div>

            <div className="overflow-x-auto">

              <table className="w-full min-w-[1000px] text-left">

                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">

                  <tr>

                    <th className="px-5 py-4">
                      Work
                    </th>

                    <th className="px-5 py-4">
                      Employee
                    </th>

                    <th className="px-5 py-4">
                      Category
                    </th>

                    <th className="px-5 py-4">
                      Priority
                    </th>

                    <th className="px-5 py-4">
                      Start
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

                  {filteredWorks.length ===
                  0 ? (

                    <tr>

                      <td
                        colSpan={8}
                        className="px-5 py-16 text-center"
                      >
                        <div className="text-4xl">
                          📋
                        </div>

                        <p className="mt-3 text-sm font-semibold text-slate-700">
                          No works found
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          Try changing your search or filters.
                        </p>

                      </td>

                    </tr>

                  ) : (

                    filteredWorks.map(
                      (work) => {

                        const employee =
                          getEmployee(
                            work.assignedTo
                          );

                        const employeeName =
                          employee?.name ||
                          "Unknown Employee";

                        return (
                          <tr
                            key={
                              work.id
                            }
                            className="transition hover:bg-slate-50"
                          >

                            {/* WORK */}

                            <td className="px-5 py-4">

                              <div className="max-w-[250px]">

                                <p className="truncate text-sm font-semibold text-slate-900">
                                  {
                                    work.title
                                  }
                                </p>

                                <p className="mt-1 truncate text-xs text-slate-400">
                                  {
                                    work.id
                                  }
                                </p>

                              </div>

                            </td>

                            {/* EMPLOYEE */}

                            <td className="px-5 py-4">

                              <div className="flex items-center gap-3">

                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                                  {employeeName
                                    .charAt(
                                      0
                                    )
                                    .toUpperCase()}
                                </div>

                                <div>

                                  <p className="text-sm font-medium text-slate-900">
                                    {
                                      employeeName
                                    }
                                  </p>

                                  <p className="text-xs text-slate-400">
                                    {employee?.status ===
                                    "Inactive"
                                      ? "Inactive Employee"
                                      : "Assigned Employee"}
                                  </p>

                                </div>

                              </div>

                            </td>

                            {/* CATEGORY */}

                            <td className="px-5 py-4">

                              <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
                                {
                                  work.category
                                }
                              </span>

                            </td>

                            {/* PRIORITY */}

                            <td className="px-5 py-4">

                              <span
                                className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${getPriorityClass(
                                  work.priority
                                )}`}
                              >
                                {
                                  work.priority
                                }
                              </span>

                            </td>

                            {/* START */}

                            <td className="px-5 py-4 text-xs font-medium text-slate-600">
                              {
                                work.startDate
                              }
                            </td>

                            {/* DEADLINE */}

                            <td className="px-5 py-4">

                              <span
                                className={`text-xs font-semibold ${
                                  work.deadline <
                                    new Date()
                                      .toISOString()
                                      .split(
                                        "T"
                                      )[0] &&
                                  work.status !==
                                    "Approved" &&
                                  work.status !==
                                    "Completed"
                                    ? "text-red-600"
                                    : "text-slate-600"
                                }`}
                              >
                                {
                                  work.deadline
                                }
                              </span>

                            </td>

                            {/* STATUS */}

                            <td className="px-5 py-4">

                              <WorkStatus
                                status={
                                  work.status
                                }
                              />

                            </td>

                            {/* ACTION */}

                            <td className="px-5 py-4 text-right">

                              <button
                                type="button"
                                onClick={() =>
                                  handleViewWork(
                                    work
                                  )
                                }
                                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                              >
                                View
                              </button>

                            </td>

                          </tr>
                        );
                      }
                    )

                  )}

                </tbody>

              </table>

            </div>

          </section>


          <Modal
            isOpen={viewingWork !== null}
            onClose={() => setViewingWork(null)}
            title="Work Details"
            size="lg"
          >
            {viewingWork && (
              <div className="space-y-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Work</p>
                  <h3 className="mt-1 text-xl font-bold text-slate-900">{viewingWork.title}</h3>
                  <p className="mt-1 text-xs text-slate-400">{viewingWork.id}</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-400">Employee</p><p className="mt-1 font-semibold text-slate-900">{getEmployeeName(viewingWork.assignedTo)}</p></div>
                  <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-400">Category</p><p className="mt-1 font-semibold text-slate-900">{viewingWork.category}</p></div>
                  <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-400">Priority</p><p className="mt-1 font-semibold text-slate-900">{viewingWork.priority}</p></div>
                  <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-400">Status</p><div className="mt-2"><WorkStatus status={viewingWork.status} /></div></div>
                  <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-400">Start Date</p><p className="mt-1 font-semibold text-slate-900">{viewingWork.startDate}</p></div>
                  <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-400">Deadline</p><p className="mt-1 font-semibold text-slate-900">{viewingWork.deadline}</p></div>
                </div>
                <div className="rounded-xl border border-slate-200 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Description</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{viewingWork.description || "No description provided."}</p></div>
                <div className="flex justify-end border-t border-slate-200 pt-4"><button type="button" onClick={() => setViewingWork(null)} className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">Close</button></div>
              </div>
            )}
          </Modal>
        </main>

      </div>

    </div>
  </OwnerGuard>
  );
}