"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { getEmployees } from "@/lib/store";
import type { Employee } from "@/lib/types";

type TopbarProps = {
  title?: string;
  subtitle?: string;
};

export default function Topbar({
  title,
  subtitle,
}: TopbarProps) {
  const pathname = usePathname();

  const [employee, setEmployee] = useState<Employee | null>(null);

  const isEmployeePage = pathname === "/employee";

  useEffect(() => {
    if (!isEmployeePage) {
      setEmployee(null);
      return;
    }

    try {
      const session = localStorage.getItem(
        "mkzora_employee_session"
      );

      if (!session) {
        setEmployee(null);
        return;
      }

      let parsed: any = null;

      try {
        parsed = JSON.parse(session);
      } catch {
        parsed = session;
      }

      const employees = getEmployees();

      const employeeId =
        typeof parsed === "object"
          ? parsed?.employeeId || parsed?.id
          : parsed;

      const employeeName =
        typeof parsed === "object"
          ? parsed?.name || parsed?.employeeName
          : null;

      let currentEmployee: Employee | undefined;

      if (employeeId) {
        currentEmployee = employees.find(
          (emp) => emp.id === employeeId
        );
      }

      if (!currentEmployee && employeeName) {
        currentEmployee = employees.find(
          (emp) =>
            emp.name.toLowerCase() ===
            String(employeeName).toLowerCase()
        );
      }

      if (currentEmployee) {
        setEmployee(currentEmployee);
      } else if (employeeName) {
        setEmployee({
          id: "",
          name: employeeName,
          role: "Employee",
          department: "",
          phone: "",
          email: "",
          joiningDate: "",
          status: "Active",
          createdAt: "",
        });
      } else {
        setEmployee(null);
      }
    } catch {
      setEmployee(null);
    }
  }, [isEmployeePage]);

  const pageTitles: Record<string, string> = {
    "/": "Dashboard",
    "/employees": "Employees",
    "/works": "All Works",
    "/create-work": "Create Work",
    "/review": "Review Queue",
    "/employee": "My Works",
    "/extra-work": "Extra Work",
    "/reports": "Reports",
    "/settings": "Settings",
  };

  const pageSubtitles: Record<string, string> = {
    "/": "Overview of your team and work",
    "/employees": "Manage your team members",
    "/works": "Track and manage all assigned work",
    "/create-work": "Create and assign new work",
    "/review": "Review submitted work",
    "/employee": "Work assigned to you",
    "/extra-work": "Manage additional work requests",
    "/reports": "View work and team reports",
    "/settings": "Manage CRM settings",
  };

  const currentTitle =
    title ||
    pageTitles[pathname] ||
    "ZORA TRACK";

  const currentSubtitle =
    subtitle ||
    pageSubtitles[pathname] ||
    "Work. People. Progress. — All in One Place.";

  const displayName = isEmployeePage
    ? employee?.name || "Employee"
    : "Owner";

  const displayRole = isEmployeePage
    ? employee?.role || "ZORA TRACK Employee"
    : "MK ZORA Admin";

  const displayInitial = isEmployeePage
    ? employee?.name?.charAt(0).toUpperCase() || "E"
    : "O";

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="flex h-20 items-center justify-between px-6">

        {/* LEFT */}
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="truncate text-2xl font-bold tracking-tight text-slate-900">
              {currentTitle}
            </h1>

            <span className="hidden rounded-full bg-slate-100 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-slate-500 sm:inline-flex">
              ZORA TRACK
            </span>
          </div>

          <p className="mt-1 truncate text-sm text-slate-500">
            {currentSubtitle}
          </p>
        </div>

        {/* RIGHT USER */}
        <div className="flex shrink-0 items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold text-slate-900">
              {displayName}
            </p>

            <p className="mt-0.5 text-xs text-slate-500">
              {displayRole}
            </p>
          </div>

          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white shadow-sm">
            {displayInitial}
          </div>
        </div>

      </div>
    </header>
  );
}