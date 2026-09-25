"use client";

import type {
  Employee,
  EmployeeStatus,
  Work,
  ExtraWork,
} from "./types";

import {
  demoEmployees,
  demoWorks,
  demoExtraWorks,
} from "./data";

const EMPLOYEES_KEY = "mkzora_employees";
const WORKS_KEY = "mkzora_works";
const EXTRA_WORK_KEY = "mkzora_extra_work";

/*
  V1 DEFAULT PASSWORD

  Existing employees without a password
  will receive this temporary password.

  Employee can later change it through
  Forgot Password / Owner Reset flow.
*/
export const DEFAULT_EMPLOYEE_PASSWORD =
  "MKZora@123";

/* =====================================================
   SAFE STORAGE HELPERS
===================================================== */

function readStorage<T>(
  key: string,
  fallback: T
): T {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const saved =
      localStorage.getItem(key);

    if (!saved) {
      return fallback;
    }

    return JSON.parse(saved) as T;
  } catch (error) {
    console.error(
      `Failed to read ${key}:`,
      error
    );

    return fallback;
  }
}

function writeStorage<T>(
  key: string,
  data: T
) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.setItem(
      key,
      JSON.stringify(data)
    );

    window.dispatchEvent(
      new CustomEvent(
        "mkzora-data-changed",
        {
          detail: {
            key,
          },
        }
      )
    );
  } catch (error) {
    console.error(
      `Failed to save ${key}:`,
      error
    );
  }
}

/* =====================================================
   EMPLOYEE PASSWORD MIGRATION
===================================================== */

function migrateEmployeePasswords() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const saved =
      localStorage.getItem(
        EMPLOYEES_KEY
      );

    if (!saved) {
      return;
    }

    const employees =
      JSON.parse(saved) as Employee[];

    let changed = false;

    const migratedEmployees =
      employees.map((employee) => {
        if (
          employee.password &&
          employee.password.trim()
        ) {
          return employee;
        }

        changed = true;

        return {
          ...employee,
          password:
            DEFAULT_EMPLOYEE_PASSWORD,
          passwordUpdatedAt:
            new Date().toISOString(),
        };
      });

    if (changed) {
      localStorage.setItem(
        EMPLOYEES_KEY,
        JSON.stringify(
          migratedEmployees
        )
      );
    }
  } catch (error) {
    console.error(
      "Failed to migrate employee passwords:",
      error
    );
  }
}

/* =====================================================
   INITIAL CRM DATA
===================================================== */

function initializeCRMData() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const employeesSaved =
      localStorage.getItem(
        EMPLOYEES_KEY
      );

    const worksSaved =
      localStorage.getItem(
        WORKS_KEY
      );

    const extraWorksSaved =
      localStorage.getItem(
        EXTRA_WORK_KEY
      );

    /*
      Demo data is created only when
      the corresponding storage key
      does not exist.
    */

    if (!employeesSaved) {
      const employeesWithPassword =
        demoEmployees.map(
          (employee) => ({
            ...employee,
            password:
              employee.password ||
              DEFAULT_EMPLOYEE_PASSWORD,
            passwordUpdatedAt:
              employee.passwordUpdatedAt ||
              new Date().toISOString(),
          })
        );

      localStorage.setItem(
        EMPLOYEES_KEY,
        JSON.stringify(
          employeesWithPassword
        )
      );
    }

    if (!worksSaved) {
      localStorage.setItem(
        WORKS_KEY,
        JSON.stringify(
          demoWorks
        )
      );
    }

    if (!extraWorksSaved) {
      localStorage.setItem(
        EXTRA_WORK_KEY,
        JSON.stringify(
          demoExtraWorks
        )
      );
    }

    /*
      Existing localStorage employees
      receive a password without
      replacing any other employee data.
    */

    migrateEmployeePasswords();
  } catch (error) {
    console.error(
      "Failed to initialize CRM data:",
      error
    );
  }
}

/* =====================================================
   EMPLOYEES
===================================================== */

export function getEmployees(): Employee[] {
  initializeCRMData();

  return readStorage<Employee[]>(
    EMPLOYEES_KEY,
    []
  );
}

export function saveEmployees(
  employees: Employee[]
) {
  writeStorage(
    EMPLOYEES_KEY,
    employees
  );
}

export function addEmployee(
  employee: Employee
) {
  const employees =
    getEmployees();

  const alreadyExists =
    employees.some(
      (item) =>
        item.id === employee.id
    );

  if (alreadyExists) {
    console.warn(
      `Employee ${employee.id} already exists.`
    );

    return;
  }

  const employeeWithPassword: Employee =
    {
      ...employee,

      password:
        employee.password?.trim() ||
        DEFAULT_EMPLOYEE_PASSWORD,

      passwordUpdatedAt:
        employee.passwordUpdatedAt ||
        new Date().toISOString(),
    };

  saveEmployees([
    ...employees,
    employeeWithPassword,
  ]);
}

export function updateEmployee(
  updatedEmployee: Employee
) {
  const employees =
    getEmployees();

  const existingEmployee =
    employees.find(
      (employee) =>
        employee.id ===
        updatedEmployee.id
    );

  const updated =
    employees.map(
      (employee) => {
        if (
          employee.id !==
          updatedEmployee.id
        ) {
          return employee;
        }

        return {
          ...updatedEmployee,

          /*
            Preserve existing password
            if the edit form does not
            provide one.
          */
          password:
            updatedEmployee.password?.trim() ||
            existingEmployee?.password ||
            DEFAULT_EMPLOYEE_PASSWORD,

          passwordUpdatedAt:
            updatedEmployee.passwordUpdatedAt ||
            existingEmployee?.passwordUpdatedAt ||
            new Date().toISOString(),
        };
      }
    );

  saveEmployees(updated);
}

/* =====================================================
   PASSWORD AUTHENTICATION
===================================================== */

export function verifyEmployeePassword(
  employeeId: string,
  password: string
): boolean {
  const employees =
    getEmployees();

  const employee =
    employees.find(
      (item) =>
        item.id === employeeId
    );

  if (!employee) {
    return false;
  }

  if (
    employee.status !==
    "Active"
  ) {
    return false;
  }

  return (
    employee.password ===
    password
  );
}

/* =====================================================
   CHANGE EMPLOYEE PASSWORD
===================================================== */

export function changeEmployeePassword(
  employeeId: string,
  newPassword: string
): boolean {
  const cleanedPassword =
    newPassword.trim();

  if (
    cleanedPassword.length < 6
  ) {
    return false;
  }

  const employees =
    getEmployees();

  const employeeExists =
    employees.some(
      (employee) =>
        employee.id ===
        employeeId
    );

  if (!employeeExists) {
    return false;
  }

  const updated =
    employees.map(
      (employee) =>
        employee.id === employeeId
          ? {
              ...employee,
              password:
                cleanedPassword,
              passwordUpdatedAt:
                new Date().toISOString(),
              passwordResetRequested:
                false,
              passwordResetRequestedAt:
                undefined,
            }
          : employee
    );

  saveEmployees(updated);

  return true;
}

/* =====================================================
   REQUEST PASSWORD RESET
===================================================== */

export function requestPasswordReset(
  employeeId: string
): boolean {
  const employees =
    getEmployees();

  const employeeExists =
    employees.some(
      (employee) =>
        employee.id ===
        employeeId
    );

  if (!employeeExists) {
    return false;
  }

  const updated =
    employees.map(
      (employee) =>
        employee.id === employeeId
          ? {
              ...employee,
              passwordResetRequested:
                true,
              passwordResetRequestedAt:
                new Date().toISOString(),
            }
          : employee
    );

  saveEmployees(updated);

  return true;
}

/* =====================================================
   VERIFY REGISTERED PHONE
===================================================== */

export function verifyEmployeePhone(
  employeeId: string,
  phone: string
): boolean {
  const employees =
    getEmployees();

  const employee =
    employees.find(
      (item) =>
        item.id === employeeId
    );

  if (!employee) {
    return false;
  }

  const storedPhone =
    employee.phone
      .replace(/\D/g, "");

  const enteredPhone =
    phone.replace(/\D/g, "");

  if (
    !storedPhone ||
    !enteredPhone
  ) {
    return false;
  }

  /*
    Compare last 10 digits.
    This supports:
      9876543210
      +91 9876543210
      91-9876543210
  */

  const storedLast10 =
    storedPhone.slice(-10);

  const enteredLast10 =
    enteredPhone.slice(-10);

  return (
    storedLast10 ===
    enteredLast10
  );
}

/* =====================================================
   OWNER PASSWORD RESET
===================================================== */

export function ownerResetEmployeePassword(
  employeeId: string,
  newPassword: string
): boolean {
  const cleanedPassword =
    newPassword.trim();

  if (
    cleanedPassword.length < 6
  ) {
    return false;
  }

  const employees =
    getEmployees();

  const employeeExists =
    employees.some(
      (employee) =>
        employee.id ===
        employeeId
    );

  if (!employeeExists) {
    return false;
  }

  const updated =
    employees.map(
      (employee) =>
        employee.id === employeeId
          ? {
              ...employee,
              password:
                cleanedPassword,
              passwordUpdatedAt:
                new Date().toISOString(),
              passwordResetRequested:
                false,
              passwordResetRequestedAt:
                undefined,
            }
          : employee
    );

  saveEmployees(updated);

  return true;
}

/* =====================================================
   DEACTIVATE EMPLOYEE
   Keeps employee and all old works.
===================================================== */

export function deactivateEmployee(
  employeeId: string
) {
  const employees =
    getEmployees();

  const updated =
    employees.map(
      (employee) =>
        employee.id === employeeId
          ? {
              ...employee,
              status:
                "Inactive" as EmployeeStatus,
            }
          : employee
    );

  saveEmployees(updated);
}

/* =====================================================
   ACTIVATE EMPLOYEE
===================================================== */

export function activateEmployee(
  employeeId: string
) {
  const employees =
    getEmployees();

  const updated =
    employees.map(
      (employee) =>
        employee.id === employeeId
          ? {
              ...employee,
              status:
                "Active" as EmployeeStatus,
            }
          : employee
    );

  saveEmployees(updated);
}

/* =====================================================
   PERMANENT DELETE EMPLOYEE
   Deletes employee + all assigned works.
===================================================== */

export function permanentlyDeleteEmployee(
  employeeId: string
) {
  const employees =
    getEmployees();

  const employeeExists =
    employees.some(
      (employee) =>
        employee.id === employeeId
    );

  if (!employeeExists) {
    console.warn(
      `Employee ${employeeId} not found.`
    );

    return;
  }

  const remainingEmployees =
    employees.filter(
      (employee) =>
        employee.id !== employeeId
    );

  const works =
    getWorks();

  const remainingWorks =
    works.filter(
      (work) =>
        work.assignedTo !==
        employeeId
    );

  saveEmployees(
    remainingEmployees
  );

  saveWorks(
    remainingWorks
  );
}

/*
  Backward compatibility.

  Existing code using:
      removeEmployee(id)

  will perform permanent delete.
*/

export function removeEmployee(
  employeeId: string
) {
  permanentlyDeleteEmployee(
    employeeId
  );
}

/* =====================================================
   WORKS
===================================================== */

export function getWorks(): Work[] {
  initializeCRMData();

  return readStorage<Work[]>(
    WORKS_KEY,
    []
  );
}

export function saveWorks(
  works: Work[]
) {
  writeStorage(
    WORKS_KEY,
    works
  );
}

export function addWork(
  work: Work
) {
  const works =
    getWorks();

  const alreadyExists =
    works.some(
      (item) =>
        item.id === work.id
    );

  if (alreadyExists) {
    console.warn(
      `Work ${work.id} already exists.`
    );

    return;
  }

  saveWorks([
    ...works,
    work,
  ]);
}

export function updateWork(
  updatedWork: Work
) {
  const works =
    getWorks();

  const updated =
    works.map(
      (work) =>
        work.id === updatedWork.id
          ? updatedWork
          : work
    );

  saveWorks(updated);
}

export function removeWork(
  workId: string
) {
  const works =
    getWorks();

  const updated =
    works.filter(
      (work) =>
        work.id !== workId
    );

  saveWorks(updated);
}

/* =====================================================
   EXTRA WORK
===================================================== */

export function getExtraWorks(): ExtraWork[] {
  initializeCRMData();

  return readStorage<ExtraWork[]>(
    EXTRA_WORK_KEY,
    []
  );
}

export function saveExtraWorks(
  extraWorks: ExtraWork[]
) {
  writeStorage(
    EXTRA_WORK_KEY,
    extraWorks
  );
}

export function addExtraWork(
  extraWork: ExtraWork
) {
  const extraWorks =
    getExtraWorks();

  const alreadyExists =
    extraWorks.some(
      (item) =>
        item.id === extraWork.id
    );

  if (alreadyExists) {
    console.warn(
      `Extra work ${extraWork.id} already exists.`
    );

    return;
  }

  saveExtraWorks([
    ...extraWorks,
    extraWork,
  ]);
}

export function updateExtraWork(
  updatedExtraWork: ExtraWork
) {
  const extraWorks =
    getExtraWorks();

  const updated =
    extraWorks.map(
      (extraWork) =>
        extraWork.id ===
        updatedExtraWork.id
          ? updatedExtraWork
          : extraWork
    );

  saveExtraWorks(updated);
}

export function removeExtraWork(
  extraWorkId: string
) {
  const extraWorks =
    getExtraWorks();

  const updated =
    extraWorks.filter(
      (extraWork) =>
        extraWork.id !==
        extraWorkId
    );

  saveExtraWorks(updated);
}

/* =====================================================
   CRM CHANGE LISTENER
===================================================== */

export function subscribeToCRMChanges(
  callback: () => void
) {
  if (
    typeof window ===
    "undefined"
  ) {
    return () => {};
  }

  const handler = () => {
    callback();
  };

  window.addEventListener(
    "mkzora-data-changed",
    handler
  );

  window.addEventListener(
    "storage",
    handler
  );

  return () => {
    window.removeEventListener(
      "mkzora-data-changed",
      handler
    );

    window.removeEventListener(
      "storage",
      handler
    );
  };
}