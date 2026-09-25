"use client";

import { useEffect, useState } from "react";
import type {
  Employee,
  Work,
  WorkCategory,
  WorkPriority,
} from "../lib/types";

interface WorkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (work: Work) => void;
  employees: Employee[];
  work?: Work | null;
}

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

export default function WorkModal({
  isOpen,
  onClose,
  onSave,
  employees,
  work,
}: WorkModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] =
    useState<WorkCategory>("Other");
  const [priority, setPriority] =
    useState<WorkPriority>("Medium");
  const [assignedTo, setAssignedTo] = useState("");
  const [startDate, setStartDate] = useState("");
  const [deadline, setDeadline] = useState("");
  const [estimatedHours, setEstimatedHours] = useState("");
  const [tags, setTags] = useState("");

  useEffect(() => {
    if (work) {
      setTitle(work.title);
      setDescription(work.description);
      setCategory(work.category);
      setPriority(work.priority);
      setAssignedTo(work.assignedTo);
      setStartDate(work.startDate);
      setDeadline(work.deadline);
      setEstimatedHours(
        work.estimatedHours?.toString() || ""
      );
      setTags(work.tags?.join(", ") || "");
    } else {
      resetForm();
    }
  }, [work, isOpen]);

  function resetForm() {
    setTitle("");
    setDescription("");
    setCategory("Other");
    setPriority("Medium");
    setAssignedTo("");
    setStartDate("");
    setDeadline("");
    setEstimatedHours("");
    setTags("");
  }

  function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (!title.trim()) {
      alert("Please enter a work title.");
      return;
    }

    if (!assignedTo) {
      alert("Please select an employee.");
      return;
    }

    if (!startDate || !deadline) {
      alert("Please select start date and deadline.");
      return;
    }

    const now = new Date().toISOString();

    const workData: Work = {
      id: work?.id || `WRK-${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      category,
      priority,
      status: work?.status || "Assigned",
      assignedTo,
      assignedBy: work?.assignedBy || "OWNER001",
      startDate,
      deadline,
      createdAt: work?.createdAt || now,
      updatedAt: now,
      estimatedHours: estimatedHours
        ? Number(estimatedHours)
        : undefined,
      actualHours: work?.actualHours,
      tags: tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      attachments: work?.attachments || [],
      submission: work?.submission,
      review: work?.review,
      reworkCount: work?.reworkCount || 0,
      isExtraWork: work?.isExtraWork || false,
    };

    onSave(workData);

    resetForm();
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {work ? "Edit Work" : "Create New Work"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Assign and manage employee work.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="grid gap-5 p-6 md:grid-cols-2">

            {/* Title */}
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Work Title *
              </label>

              <input
                type="text"
                value={title}
                onChange={(e) =>
                  setTitle(e.target.value)
                }
                placeholder="e.g. Instagram Reel for Client"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Description
              </label>

              <textarea
                value={description}
                onChange={(e) =>
                  setDescription(e.target.value)
                }
                placeholder="Describe what needs to be completed..."
                rows={4}
                className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
              />
            </div>

            {/* Employee */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Assign To *
              </label>

              <select
                value={assignedTo}
                onChange={(e) =>
                  setAssignedTo(e.target.value)
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
              >
                <option value="">
                  Select Employee
                </option>

                {employees
                  .filter(
                    (employee) =>
                      employee.status === "Active"
                  )
                  .map((employee) => (
                    <option
                      key={employee.id}
                      value={employee.id}
                    >
                      {employee.name} — {employee.role}
                    </option>
                  ))}
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Category
              </label>

              <select
                value={category}
                onChange={(e) =>
                  setCategory(
                    e.target.value as WorkCategory
                  )
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
              >
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Priority
              </label>

              <select
                value={priority}
                onChange={(e) =>
                  setPriority(
                    e.target.value as WorkPriority
                  )
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
              >
                {priorities.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            {/* Start Date */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Start Date *
              </label>

              <input
                type="date"
                value={startDate}
                onChange={(e) =>
                  setStartDate(e.target.value)
                }
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
              />
            </div>

            {/* Deadline */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Deadline *
              </label>

              <input
                type="date"
                value={deadline}
                onChange={(e) =>
                  setDeadline(e.target.value)
                }
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
              />
            </div>

            {/* Estimated Hours */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Estimated Hours
              </label>

              <input
                type="number"
                min="0"
                step="0.5"
                value={estimatedHours}
                onChange={(e) =>
                  setEstimatedHours(e.target.value)
                }
                placeholder="e.g. 5"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Tags
              </label>

              <input
                type="text"
                value={tags}
                onChange={(e) =>
                  setTags(e.target.value)
                }
                placeholder="Instagram, Client, Urgent"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
              />

              <p className="mt-1 text-xs text-slate-400">
                Separate tags with commas.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
            <button
              type="button"
              onClick={() => {
                resetForm();
                onClose();
              }}
              className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
            >
              {work ? "Update Work" : "Create Work"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}