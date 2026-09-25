import type { WorkStatus as WorkStatusType } from "../lib/types";

interface WorkStatusProps {
  status: WorkStatusType;
}

const statusConfig: Record<
  WorkStatusType,
  {
    label: string;
    className: string;
  }
> = {
  New: {
    label: "New",
    className: "bg-slate-100 text-slate-700",
  },
  Assigned: {
    label: "Assigned",
    className: "bg-blue-100 text-blue-700",
  },
  "In Progress": {
    label: "In Progress",
    className: "bg-amber-100 text-amber-700",
  },
  Submitted: {
    label: "Submitted",
    className: "bg-purple-100 text-purple-700",
  },
  "Owner Review": {
    label: "Owner Review",
    className: "bg-orange-100 text-orange-700",
  },
  Rework: {
    label: "Rework",
    className: "bg-red-100 text-red-700",
  },
  Approved: {
    label: "Approved",
    className: "bg-emerald-100 text-emerald-700",
  },
  Completed: {
    label: "Completed",
    className: "bg-green-100 text-green-700",
  },
  Cancelled: {
    label: "Cancelled",
    className: "bg-gray-100 text-gray-500",
  },
};

export default function WorkStatus({
  status,
}: WorkStatusProps) {
  const config = statusConfig[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${config.className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {config.label}
    </span>
  );
}