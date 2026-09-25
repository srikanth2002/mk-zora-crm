"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type SidebarMode = "owner" | "employee";

type SidebarProps = {
  mode?: SidebarMode;
  onLogout?: () => void;
};

const ownerMenuItems = [
  { label: "Dashboard", href: "/", icon: "⌂" },
  { label: "Employees", href: "/employees", icon: "♙" },
  { label: "All Works", href: "/works", icon: "▤" },
  { label: "Create Work", href: "/create-work", icon: "＋" },
  { label: "Review Queue", href: "/review", icon: "✓" },
  { label: "Extra Work", href: "/extra-work", icon: "ϟ" },
  { label: "Reports", href: "/reports", icon: "▥" },
  { label: "Settings", href: "/settings", icon: "⚙" },
];

const employeeMenuItems = [
  { label: "My Dashboard", href: "/employee#dashboard", icon: "⌂" },
];

export default function Sidebar({
  mode = "owner",
  onLogout,
}: SidebarProps) {
  const pathname = usePathname();

  const menuItems =
    mode === "employee" ? employeeMenuItems : ownerMenuItems;

  function isActive(href: string) {
    if (mode === "employee") {
      return pathname === "/employee";
    }

    if (href === "/") {
      return pathname === "/";
    }

    return pathname === href;
  }

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-slate-200 bg-white">
      {/* BRAND */}
      <div className="flex h-24 items-center border-b border-slate-200 px-5">
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="MK ZORA"
            className="h-12 w-auto object-contain"
          />

          <div className="min-w-0">
            <p className="text-lg font-bold tracking-tight text-slate-900">
              ZORA TRACK
            </p>

            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
              {mode === "owner"
                ? "Work Management"
                : "Employee Workspace"}
            </p>
          </div>
        </div>
      </div>

      {/* MENU */}
      <div className="flex-1 overflow-y-auto px-3 py-5">
        <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
          {mode === "owner" ? "Main Menu" : "Employee Menu"}
        </p>

        <nav className="space-y-1">
          {menuItems.map((item) => {
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition",
                  active
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                ].join(" ")}
              >
                <span
                  className={[
                    "flex h-6 w-6 items-center justify-center rounded-lg text-xs",
                    active
                      ? "bg-white/10 text-white"
                      : "bg-slate-100 text-slate-500",
                  ].join(" ")}
                >
                  {item.icon}
                </span>

                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* BOTTOM AREA */}
      <div className="border-t border-slate-200 p-3">
        {mode === "employee" ? (
          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-sm">
              ↪
            </span>

            <span>Logout</span>
          </button>
        ) : (
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
              O
            </div>

            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-slate-900">
                Owner
              </p>

              <p className="truncate text-[10px] text-slate-400">
                MK ZORA Admin
              </p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}