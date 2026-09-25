"use client";

import { useEffect, useState } from "react";

import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import OwnerGuard from "@/components/OwnerGuard";

const DEFAULT_EMPLOYEE_PASSWORD = "MKZora@123";

export default function SettingsPage() {
  const [companyName, setCompanyName] = useState("MK ZORA");
  const [productName, setProductName] = useState("ZORA TRACK");
  const [ownerEmail, setOwnerEmail] = useState("owner@mkzora.com");
  const [defaultPassword, setDefaultPassword] = useState(
    DEFAULT_EMPLOYEE_PASSWORD
  );

  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const savedSettings = localStorage.getItem(
      "mkzora_settings"
    );

    if (!savedSettings) return;

    try {
      const settings = JSON.parse(savedSettings);

      if (settings.companyName) {
        setCompanyName(settings.companyName);
      }

      if (settings.productName) {
        setProductName(settings.productName);
      }

      if (settings.ownerEmail) {
        setOwnerEmail(settings.ownerEmail);
      }

      if (settings.defaultPassword) {
        setDefaultPassword(settings.defaultPassword);
      }
    } catch {
      // Ignore invalid saved settings
    }
  }, []);

  function saveSettings() {
    const settings = {
      companyName,
      productName,
      ownerEmail,
      defaultPassword,
    };

    localStorage.setItem(
      "mkzora_settings",
      JSON.stringify(settings)
    );

    window.dispatchEvent(
      new Event("mkzora-data-changed")
    );

    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 2500);
  }

  function resetSettings() {
    setCompanyName("MK ZORA");
    setProductName("ZORA TRACK");
    setOwnerEmail("owner@mkzora.com");
    setDefaultPassword(DEFAULT_EMPLOYEE_PASSWORD);

    localStorage.removeItem("mkzora_settings");

    setSaved(false);
  }

  return (
    <OwnerGuard>
      <div className="min-h-screen bg-slate-50">
        <Sidebar mode="owner" />

        <main className="ml-64 min-h-screen">
          <Topbar
            title="Settings"
            subtitle="Manage ZORA TRACK CRM configuration"
          />

          <div className="p-6">

            {/* PAGE HEADER */}
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-900">
                CRM Settings
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Manage basic company and system configuration.
              </p>
            </div>

            <div className="grid gap-6 xl:grid-cols-3">

              {/* GENERAL SETTINGS */}
              <section className="xl:col-span-2 rounded-2xl border border-slate-200 bg-white shadow-sm">

                <div className="border-b border-slate-200 px-6 py-5">
                  <h3 className="text-lg font-bold text-slate-900">
                    General Information
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Basic branding and owner information used by the CRM.
                  </p>
                </div>

                <div className="space-y-5 p-6">

                  {/* COMPANY */}
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Company Name
                    </label>

                    <input
                      value={companyName}
                      onChange={(event) =>
                        setCompanyName(event.target.value)
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                    />
                  </div>

                  {/* PRODUCT */}
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Product Name
                    </label>

                    <input
                      value={productName}
                      onChange={(event) =>
                        setProductName(event.target.value)
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                    />
                  </div>

                  {/* OWNER EMAIL */}
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Owner Email
                    </label>

                    <input
                      type="email"
                      value={ownerEmail}
                      onChange={(event) =>
                        setOwnerEmail(event.target.value)
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                    />
                  </div>

                  {/* DEFAULT PASSWORD */}
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Default Employee Password
                    </label>

                    <input
                      type="text"
                      value={defaultPassword}
                      onChange={(event) =>
                        setDefaultPassword(event.target.value)
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-mono text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                    />

                    <p className="mt-2 text-xs text-slate-400">
                      Used when a new employee is created without
                      setting a custom password.
                    </p>
                  </div>

                  {/* ACTIONS */}
                  <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-5">

                    <button
                      type="button"
                      onClick={saveSettings}
                      className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
                    >
                      Save Changes
                    </button>

                    <button
                      type="button"
                      onClick={resetSettings}
                      className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                    >
                      Reset
                    </button>

                    {saved && (
                      <span className="text-sm font-semibold text-emerald-600">
                        ✓ Settings saved
                      </span>
                    )}

                  </div>

                </div>
              </section>

              {/* SYSTEM INFORMATION */}
              <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">

                <div className="border-b border-slate-200 px-6 py-5">
                  <h3 className="text-lg font-bold text-slate-900">
                    System Information
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Current CRM configuration.
                  </p>
                </div>

                <div className="divide-y divide-slate-100">

                  <InfoRow
                    label="Company"
                    value={companyName}
                  />

                  <InfoRow
                    label="Product"
                    value={productName}
                  />

                  <InfoRow
                    label="Access"
                    value="Owner"
                  />

                  <InfoRow
                    label="Storage"
                    value="Browser Local Storage"
                  />

                  <InfoRow
                    label="Environment"
                    value="V1"
                  />

                </div>

              </section>

            </div>

            {/* BRANDING PREVIEW */}
            <section className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">

              <div className="border-b border-slate-200 px-6 py-5">

                <h3 className="text-lg font-bold text-slate-900">
                  Branding Preview
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Preview how the current CRM identity appears.
                </p>

              </div>

              <div className="p-6">

                <div className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:flex-row sm:items-center">

                  <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-sm">

                    <img
                      src="/logo.png"
                      alt="MK ZORA"
                      className="h-12 w-auto object-contain"
                    />

                  </div>

                  <div>
                    <p className="text-xl font-bold tracking-tight text-slate-900">
                      {productName}
                    </p>

                    <p className="mt-1 text-sm font-medium text-slate-600">
                      {companyName}
                    </p>

                    <p className="mt-2 text-xs text-slate-400">
                      Work. People. Progress. — All in One Place.
                    </p>
                  </div>

                </div>

              </div>

            </section>

            {/* SECURITY NOTE */}
            <section className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">

              <div className="flex gap-3">

                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-sm font-bold text-amber-700">
                  !
                </div>

                <div>

                  <h3 className="text-sm font-bold text-amber-900">
                    V1 Security Note
                  </h3>

                  <p className="mt-1 text-sm leading-6 text-amber-800">
                    This V1 CRM stores settings and employee
                    credentials in browser local storage. For a
                    production deployment, move authentication,
                    passwords, database storage, and permissions to
                    a secure backend.
                  </p>

                </div>

              </div>

            </section>

          </div>
        </main>
      </div>
    </OwnerGuard>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-6 py-4">

      <span className="text-sm font-medium text-slate-500">
        {label}
      </span>

      <span className="text-right text-sm font-semibold text-slate-900">
        {value}
      </span>

    </div>
  );
}