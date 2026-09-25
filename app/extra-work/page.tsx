"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import OwnerGuard from "@/components/OwnerGuard";
import {
  addExtraWork,
  getExtraWorks,
  getEmployees,
  removeExtraWork,
  updateExtraWork,
} from "@/lib/store";
import type {
  Employee,
  ExtraWork,
  WorkPriority,
} from "@/lib/types";

export default function ExtraWorkPage() {
  const [extraWorks, setExtraWorks] = useState<ExtraWork[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [showForm, setShowForm] = useState(false);

  const [assignWork, setAssignWork] = useState<ExtraWork | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState("");

  const [confirmAction, setConfirmAction] = useState<{
    type: "approve" | "reject";
    work: ExtraWork;
  } | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<WorkPriority>("Medium");
  const [deadline, setDeadline] = useState("");

  function loadData() {
    setExtraWorks(getExtraWorks());
    setEmployees(getEmployees());
  }

  useEffect(() => {
    loadData();
  }, []);

  function resetForm() {
    setTitle("");
    setDescription("");
    setPriority("Medium");
    setDeadline("");
  }

  function handleCreateRequest(e: React.FormEvent) {
    e.preventDefault();

    if (!title.trim() || !description.trim()) return;

    const now = new Date().toISOString();

    const newExtraWork: ExtraWork = {
      id: `EXW${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      requestedBy: "OWNER001",
      requestedAt: now,
      status: "Requested",
      priority,
      deadline: deadline || undefined,
    };

    addExtraWork(newExtraWork);
    loadData();
    resetForm();
    setShowForm(false);
  }

  function handleApprove(work: ExtraWork) {
    updateExtraWork({
      ...work,
      status: "Approved",
      approvedAt: new Date().toISOString(),
    });

    loadData();
    setConfirmAction(null);
  }

  function handleReject(work: ExtraWork) {
    updateExtraWork({
      ...work,
      status: "Rejected",
    });

    loadData();
    setConfirmAction(null);
  }

  function handleAssign() {
    if (!assignWork || !selectedEmployee) return;

    updateExtraWork({
      ...assignWork,
      status: "Assigned",
      assignedTo: selectedEmployee,
    });

    loadData();
    setAssignWork(null);
    setSelectedEmployee("");
  }

  function handleDelete(id: string) {
    const confirmed = window.confirm(
      "Are you sure you want to remove this extra work request?"
    );

    if (!confirmed) return;

    removeExtraWork(id);
    loadData();
  }

  function getStatusClass(status: ExtraWork["status"]) {
    switch (status) {
      case "Requested":
        return "bg-yellow-100 text-yellow-700";
      case "Approved":
        return "bg-blue-100 text-blue-700";
      case "Rejected":
        return "bg-red-100 text-red-700";
      case "Assigned":
        return "bg-purple-100 text-purple-700";
      case "Completed":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  }

  function getPriorityClass(value: WorkPriority) {
    switch (value) {
      case "Urgent":
        return "text-red-600";
      case "High":
        return "text-orange-600";
      case "Medium":
        return "text-yellow-600";
      case "Low":
        return "text-green-600";
      default:
        return "text-gray-600";
    }
  }

  const activeEmployees = employees.filter(
    (employee) => employee.status === "Active"
  );

  const pendingCount = extraWorks.filter(
    (item) => item.status === "Requested"
  ).length;

  const approvedCount = extraWorks.filter(
    (item) => item.status === "Approved"
  ).length;

  const assignedCount = extraWorks.filter(
    (item) => item.status === "Assigned"
  ).length;

  return (
    <OwnerGuard>
      <div className="min-h-screen bg-gray-50">
        <Sidebar />

        <div className="ml-64">
          <Topbar />

          <main className="p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Extra Work
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                  Manage additional work requests, assignments and completion.
                </p>
              </div>

              <button
                onClick={() => setShowForm(true)}
                className="rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
              >
                + Request Extra Work
              </button>
            </div>

            <div className="mb-6 grid grid-cols-3 gap-4">
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Pending
                </p>

                <p className="mt-2 text-2xl font-bold text-gray-900">
                  {pendingCount}
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Approved
                </p>

                <p className="mt-2 text-2xl font-bold text-gray-900">
                  {approvedCount}
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Assigned
                </p>

                <p className="mt-2 text-2xl font-bold text-gray-900">
                  {assignedCount}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  Extra Work Requests
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Track additional work from request to completion.
                </p>
              </div>

              {extraWorks.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 p-10 text-center">
                  <p className="text-sm font-medium text-gray-600">
                    No extra work requests yet
                  </p>

                  <p className="mt-1 text-xs text-gray-400">
                    Click “Request Extra Work” to create a new request.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {extraWorks.map((work) => (
                    <div
                      key={work.id}
                      className="rounded-xl border border-gray-200 p-5"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold text-gray-900">
                              {work.title}
                            </h3>

                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClass(
                                work.status
                              )}`}
                            >
                              {work.status}
                            </span>
                          </div>

                          <p className="mt-2 text-sm text-gray-600">
                            {work.description}
                          </p>

                          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs text-gray-500">
                            <span>
                              Priority:{" "}
                              <strong
                                className={getPriorityClass(work.priority)}
                              >
                                {work.priority}
                              </strong>
                            </span>

                            <span>
                              Requested:{" "}
                              {new Date(
                                work.requestedAt
                              ).toLocaleDateString()}
                            </span>

                            {work.deadline && (
                              <span>
                                Deadline:{" "}
                                {new Date(
                                  work.deadline
                                ).toLocaleDateString()}
                              </span>
                            )}

                            {work.assignedTo && (
                              <span>
                                Assigned To:{" "}
                                <strong className="text-gray-700">
                                  {work.assignedTo}
                                </strong>
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex shrink-0 gap-2">
                          {work.status === "Requested" && (
                            <>
                              <button
                                onClick={() =>
                                  setConfirmAction({
                                    type: "approve",
                                    work,
                                  })
                                }
                                className="rounded-lg bg-green-600 px-3 py-2 text-xs font-medium text-white hover:bg-green-700"
                              >
                                Approve
                              </button>

                              <button
                                onClick={() =>
                                  setConfirmAction({
                                    type: "reject",
                                    work,
                                  })
                                }
                                className="rounded-lg bg-red-600 px-3 py-2 text-xs font-medium text-white hover:bg-red-700"
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {work.status === "Approved" && (
                            <button
                              onClick={() => {
                                setAssignWork(work);
                                setSelectedEmployee("");
                              }}
                              className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700"
                            >
                              Assign Employee
                            </button>
                          )}

                          <button
                            onClick={() => handleDelete(work.id)}
                            className="rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {showForm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
                  <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">
                        Request Extra Work
                      </h2>

                      <p className="text-xs text-gray-500">
                        Create a new additional work request.
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        resetForm();
                        setShowForm(false);
                      }}
                      className="text-xl text-gray-400 hover:text-gray-700"
                    >
                      ×
                    </button>
                  </div>

                  <form
                    onSubmit={handleCreateRequest}
                    className="space-y-4 p-6"
                  >
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Work Title
                      </label>

                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Enter extra work title"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-black"
                        required
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Description
                      </label>

                      <textarea
                        rows={4}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe the extra work..."
                        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-black"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                          Priority
                        </label>

                        <select
                          value={priority}
                          onChange={(e) =>
                            setPriority(e.target.value as WorkPriority)
                          }
                          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-black"
                        >
                          <option value="Low">Low</option>
                          <option value="Medium">Medium</option>
                          <option value="High">High</option>
                          <option value="Urgent">Urgent</option>
                        </select>
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                          Deadline
                        </label>

                        <input
                          type="date"
                          value={deadline}
                          onChange={(e) => setDeadline(e.target.value)}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-black"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          resetForm();
                          setShowForm(false);
                        }}
                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>

                      <button
                        type="submit"
                        className="rounded-lg bg-black px-5 py-2 text-sm font-medium text-white hover:bg-gray-800"
                      >
                        Create Request
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {assignWork && (
              <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
                <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
                  <div className="border-b border-gray-200 px-6 py-4">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Assign Employee
                    </h2>

                    <p className="mt-1 text-xs text-gray-500">
                      Assign “{assignWork.title}” to an active employee.
                    </p>
                  </div>

                  <div className="p-6">
                    {activeEmployees.length === 0 ? (
                      <div className="rounded-lg bg-yellow-50 p-4 text-sm text-yellow-700">
                        No active employees available for assignment.
                      </div>
                    ) : (
                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          Select Employee
                        </label>

                        <select
                          value={selectedEmployee}
                          onChange={(e) =>
                            setSelectedEmployee(e.target.value)
                          }
                          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-black"
                        >
                          <option value="">Select employee</option>

                          {activeEmployees.map((employee) => (
                            <option
                              key={employee.id}
                              value={employee.id}
                            >
                              {employee.name} — {employee.role}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="mt-6 flex justify-end gap-3">
                      <button
                        onClick={() => {
                          setAssignWork(null);
                          setSelectedEmployee("");
                        }}
                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>

                      <button
                        onClick={handleAssign}
                        disabled={!selectedEmployee}
                        className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Assign
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {confirmAction && (
              <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
                <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
                  <div className="p-6">
                    <h2 className="text-lg font-semibold text-gray-900">
                      {confirmAction.type === "approve"
                        ? "Approve Extra Work?"
                        : "Reject Extra Work?"}
                    </h2>

                    <p className="mt-2 text-sm text-gray-500">
                      {confirmAction.type === "approve"
                        ? `Are you sure you want to approve "${confirmAction.work.title}"?`
                        : `Are you sure you want to reject "${confirmAction.work.title}"?`}
                    </p>

                    <div className="mt-6 flex justify-end gap-3">
                      <button
                        onClick={() => setConfirmAction(null)}
                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>

                      <button
                        onClick={() =>
                          confirmAction.type === "approve"
                            ? handleApprove(confirmAction.work)
                            : handleReject(confirmAction.work)
                        }
                        className={`rounded-lg px-5 py-2 text-sm font-medium text-white ${
                          confirmAction.type === "approve"
                            ? "bg-green-600 hover:bg-green-700"
                            : "bg-red-600 hover:bg-red-700"
                        }`}
                      >
                        {confirmAction.type === "approve"
                          ? "Approve"
                          : "Reject"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </OwnerGuard>
  );
}