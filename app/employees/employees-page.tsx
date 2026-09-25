"use client";

import { useEffect, useMemo, useState } from "react";

import Sidebar from "../../components/Sidebar";
import Topbar from "../../components/Topbar";
import EmployeeModal from "../../components/EmployeeModal";
import ConfirmModal from "../../components/ui/ConfirmModal";

import {
  getEmployees,
  getWorks,
  subscribeToCRMChanges,
  addEmployee,
  updateEmployee,
  deactivateEmployee,
  activateEmployee,
  permanentlyDeleteEmployee,
} from "../../lib/store";

import type {
  Employee,
  Work,
} from "../../lib/types";

export default function EmployeesPage() {
  const [employees, setEmployees] =
    useState<Employee[]>([]);

  const [works, setWorks] =
    useState<Work[]>([]);

  const [showModal, setShowModal] =
    useState(false);

  const [editingEmployee, setEditingEmployee] =
    useState<Employee | null>(null);

  const [confirmAction, setConfirmAction] = useState<{
    type: "deactivate" | "delete";
    employee: Employee;
  } | null>(null);

  const [search, setSearch] =
    useState("");

  const [departmentFilter, setDepartmentFilter] =
    useState("All");

  const [statusFilter, setStatusFilter] =
    useState("All");

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
     AUTO GENERATE EMPLOYEE ID
  ===================================================== */

  const generateEmployeeId = (
    currentEmployees: Employee[]
  ) => {
    let highestNumber = 0;

    currentEmployees.forEach(
      (employee) => {
        const match =
          employee.id.match(
            /^EMP(\d+)$/
          );

        if (!match) {
          return;
        }

        const number =
          Number(match[1]);

        if (
          Number.isFinite(number) &&
          number > highestNumber
        ) {
          highestNumber = number;
        }
      }
    );

    const nextNumber =
      highestNumber + 1;

    return `EMP${String(
      nextNumber
    ).padStart(3, "0")}`;
  };

  /* =====================================================
     DEPARTMENTS
  ===================================================== */

  const departments = useMemo(() => {
    return [
      "All",
      ...Array.from(
        new Set(
          employees.map(
            (employee) =>
              employee.department
          )
        )
      ),
    ];
  }, [employees]);

  /* =====================================================
     FILTER EMPLOYEES
  ===================================================== */

  const filteredEmployees =
    useMemo(() => {
      return employees.filter(
        (employee) => {
          const searchText =
            search.toLowerCase();

          const matchesSearch =
            employee.name
              .toLowerCase()
              .includes(searchText) ||
            employee.role
              .toLowerCase()
              .includes(searchText) ||
            employee.email
              .toLowerCase()
              .includes(searchText) ||
            employee.phone.includes(
              search
            );

          const matchesDepartment =
            departmentFilter ===
              "All" ||
            employee.department ===
              departmentFilter;

          const matchesStatus =
            statusFilter ===
              "All" ||
            employee.status ===
              statusFilter;

          return (
            matchesSearch &&
            matchesDepartment &&
            matchesStatus
          );
        }
      );
    }, [
      employees,
      search,
      departmentFilter,
      statusFilter,
    ]);

  /* =====================================================
     SUMMARY
  ===================================================== */

  const activeEmployees =
    employees.filter(
      (employee) =>
        employee.status ===
        "Active"
    ).length;

  const inactiveEmployees =
    employees.filter(
      (employee) =>
        employee.status ===
        "Inactive"
    ).length;

  /* =====================================================
     WORK COUNT
  ===================================================== */

  const getWorkCount = (
    employeeId: string
  ) => {
    return works.filter(
      (work) =>
        work.assignedTo ===
        employeeId
    ).length;
  };

  /* =====================================================
     SAVE EMPLOYEE
  ===================================================== */

  const handleSaveEmployee = (
    employeeData: Employee
  ) => {
    if (editingEmployee) {
      /*
       * EDIT
       *
       * Existing employee ID must
       * NEVER change.
       */

      updateEmployee({
        ...employeeData,
        id: editingEmployee.id,
      });
    } else {
      /*
       * NEW EMPLOYEE
       *
       * Employee ID is generated
       * automatically.
       */

      const currentEmployees =
        getEmployees();

      const newEmployeeId =
        generateEmployeeId(
          currentEmployees
        );

      const newEmployee: Employee = {
        ...employeeData,
        id: newEmployeeId,
      };

      addEmployee(
        newEmployee
      );
    }

    loadCRMData();

    setShowModal(false);
    setEditingEmployee(null);
  };

  /* =====================================================
     EDIT
  ===================================================== */

  const handleEdit = (
    employee: Employee
  ) => {
    setEditingEmployee(
      employee
    );

    setShowModal(true);
  };

  /* =====================================================
     DEACTIVATE
  ===================================================== */

  const handleDeactivate = (employee: Employee) => {
    setConfirmAction({
      type: "deactivate",
      employee,
    });
  };

  /* =====================================================
     ACTIVATE
  ===================================================== */

  const handleActivate = (
    employee: Employee
  ) => {
    activateEmployee(
      employee.id
    );

    loadCRMData();
  };

  /* =====================================================
     PERMANENT DELETE
  ===================================================== */

  const handlePermanentDelete = (employee: Employee) => {
    setConfirmAction({
      type: "delete",
      employee,
    });
  };

  const executeConfirmAction = () => {
    if (!confirmAction) return;

    if (confirmAction.type === "deactivate") {
      deactivateEmployee(confirmAction.employee.id);
    } else {
      permanentlyDeleteEmployee(confirmAction.employee.id);
    }

    loadCRMData();
    setConfirmAction(null);
  };

  /* =====================================================
     ADD
  ===================================================== */

  const handleAdd = () => {
    setEditingEmployee(
      null
    );

    setShowModal(true);
  };

  /* =====================================================
     UI
  ===================================================== */

  return (
    <div className="min-h-screen bg-slate-50">

      <Sidebar />

      <main className="ml-64 min-h-screen">

        <Topbar
          title="Employees"
          subtitle="Manage your CRM team members"
        />

        <div className="p-6">

          {/* HEADER */}

          <div className="mb-6 flex items-center justify-between">

            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Employees
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Manage active, inactive and historical team members.
              </p>
            </div>

            <button
              onClick={handleAdd}
              className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              + Add Employee
            </button>

          </div>

          {/* SUMMARY CARDS */}

          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">
                Total Employees
              </p>

              <p className="mt-2 text-3xl font-bold text-slate-900">
                {employees.length}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">
                Active
              </p>

              <p className="mt-2 text-3xl font-bold text-emerald-600">
                {activeEmployees}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">
                Inactive
              </p>

              <p className="mt-2 text-3xl font-bold text-slate-500">
                {inactiveEmployees}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">
                Departments
              </p>

              <p className="mt-2 text-3xl font-bold text-blue-600">
                {departments.length - 1}
              </p>
            </div>

          </div>

          {/* FILTERS */}

          <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">

              <input
                type="text"
                placeholder="Search employee, role, email..."
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
                className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-slate-500"
              />

              <select
                value={
                  departmentFilter
                }
                onChange={(e) =>
                  setDepartmentFilter(
                    e.target.value
                  )
                }
                className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-slate-500"
              >
                {departments.map(
                  (department) => (
                    <option
                      key={
                        department
                      }
                      value={
                        department
                      }
                    >
                      {department}
                    </option>
                  )
                )}
              </select>

              <select
                value={
                  statusFilter
                }
                onChange={(e) =>
                  setStatusFilter(
                    e.target.value
                  )
                }
                className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-slate-500"
              >
                <option value="All">
                  All Status
                </option>

                <option value="Active">
                  Active
                </option>

                <option value="Inactive">
                  Inactive
                </option>
              </select>

            </div>

          </div>

          {/* EMPLOYEE TABLE */}

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

            <div className="overflow-x-auto">

              <table className="w-full min-w-[1150px]">

                <thead className="border-b border-slate-200 bg-slate-50">

                  <tr>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Employee
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Role
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Department
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Contact
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Joining Date
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Works
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Status
                    </th>

                    <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Actions
                    </th>

                  </tr>

                </thead>

                <tbody className="divide-y divide-slate-100">

                  {filteredEmployees.length === 0 ? (

                    <tr>

                      <td
                        colSpan={8}
                        className="px-5 py-12 text-center text-sm text-slate-500"
                      >
                        No employees found.
                      </td>

                    </tr>

                  ) : (

                    filteredEmployees.map(
                      (employee) => (

                        <tr
                          key={
                            employee.id
                          }
                          className="transition hover:bg-slate-50"
                        >

                          {/* EMPLOYEE */}

                          <td className="px-5 py-4">

                            <div className="flex items-center gap-3">

                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
                                {employee.name
                                  .charAt(
                                    0
                                  )
                                  .toUpperCase()}
                              </div>

                              <div>

                                <p className="font-semibold text-slate-900">
                                  {
                                    employee.name
                                  }
                                </p>

                                <p className="text-xs text-slate-500">
                                  {
                                    employee.id
                                  }
                                </p>

                              </div>

                            </div>

                          </td>

                          {/* ROLE */}

                          <td className="px-5 py-4 text-sm text-slate-700">
                            {
                              employee.role
                            }
                          </td>

                          {/* DEPARTMENT */}

                          <td className="px-5 py-4 text-sm text-slate-700">
                            {
                              employee.department
                            }
                          </td>

                          {/* CONTACT */}

                          <td className="px-5 py-4">

                            <p className="text-sm text-slate-700">
                              {
                                employee.phone
                              }
                            </p>

                            <p className="text-xs text-slate-500">
                              {
                                employee.email
                              }
                            </p>

                          </td>

                          {/* JOINING DATE */}

                          <td className="px-5 py-4 text-sm text-slate-700">
                            {
                              employee.joiningDate
                            }
                          </td>

                          {/* WORK COUNT */}

                          <td className="px-5 py-4 text-sm font-semibold text-slate-700">
                            {getWorkCount(
                              employee.id
                            )}
                          </td>

                          {/* STATUS */}

                          <td className="px-5 py-4">

                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                                employee.status ===
                                "Active"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {
                                employee.status
                              }
                            </span>

                          </td>

                          {/* ACTIONS */}

                          <td className="px-5 py-4">

                            <div className="flex justify-end gap-2">

                              <button
                                onClick={() =>
                                  handleEdit(
                                    employee
                                  )
                                }
                                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                              >
                                Edit
                              </button>

                              {employee.status ===
                              "Active" ? (

                                <button
                                  onClick={() =>
                                    handleDeactivate(
                                      employee
                                    )
                                  }
                                  className="rounded-lg border border-amber-200 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-50"
                                >
                                  Deactivate
                                </button>

                              ) : (

                                <button
                                  onClick={() =>
                                    handleActivate(
                                      employee
                                    )
                                  }
                                  className="rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                                >
                                  Activate
                                </button>

                              )}

                              <button
                                onClick={() =>
                                  handlePermanentDelete(
                                    employee
                                  )
                                }
                                className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                              >
                                Permanent Delete
                              </button>

                            </div>

                          </td>

                        </tr>

                      )
                    )

                  )}

                </tbody>

              </table>

            </div>

          </div>

        </div>

      </main>

      {/* EMPLOYEE MODAL */}

      {showModal && (

        <EmployeeModal
          isOpen={
            showModal
          }
          employee={
            editingEmployee
          }
          onClose={() => {
            setShowModal(false);
            setEditingEmployee(
              null
            );
          }}
          onSave={
            handleSaveEmployee
          }
        />

      )}

      <ConfirmModal
        isOpen={confirmAction !== null}
        onClose={() => setConfirmAction(null)}
        onConfirm={executeConfirmAction}
        title={
          confirmAction?.type === "delete"
            ? "Permanently Delete Employee?"
            : "Deactivate Employee?"
        }
        message={
          confirmAction?.type === "delete"
            ? `This will permanently delete ${confirmAction.employee.name} (${confirmAction.employee.id}) and ${getWorkCount(confirmAction.employee.id)} assigned work/project record(s). This action cannot be undone.`
            : `${confirmAction?.employee.name} will become inactive. Their previous works and project history will remain visible in the CRM.`
        }
        confirmText={
          confirmAction?.type === "delete"
            ? "Delete Permanently"
            : "Deactivate"
        }
        variant={
          confirmAction?.type === "delete"
            ? "danger"
            : "warning"
        }
      />

    </div>
  );
}