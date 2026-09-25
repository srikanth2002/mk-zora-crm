import type {
  Employee,
  Work,
  ExtraWork,
  CurrentUser,
} from "./types";

const KEYS = {
  employees: "mkzora_employees",
  works: "mkzora_works",
  extraWorks: "mkzora_extra_works",
  currentUser: "mkzora_current_user",
};

function isBrowser() {
  return typeof window !== "undefined";
}

// ==========================================
// EMPLOYEES
// ==========================================

export function getEmployees(): Employee[] {
  if (!isBrowser()) return [];

  const data = localStorage.getItem(KEYS.employees);

  if (!data) return [];

  try {
    return JSON.parse(data) as Employee[];
  } catch {
    return [];
  }
}

export function saveEmployees(employees: Employee[]) {
  if (!isBrowser()) return;

  localStorage.setItem(
    KEYS.employees,
    JSON.stringify(employees)
  );
}

export function addEmployee(employee: Employee) {
  const employees = getEmployees();

  employees.push(employee);

  saveEmployees(employees);

  return employee;
}

export function updateEmployee(
  id: string,
  updates: Partial<Employee>
) {
  const employees = getEmployees();

  const updated = employees.map((employee) =>
    employee.id === id
      ? { ...employee, ...updates }
      : employee
  );

  saveEmployees(updated);

  return updated.find((employee) => employee.id === id);
}

export function deleteEmployee(id: string) {
  const employees = getEmployees();

  const updated = employees.filter(
    (employee) => employee.id !== id
  );

  saveEmployees(updated);
}


// ==========================================
// WORKS
// ==========================================

export function getWorks(): Work[] {
  if (!isBrowser()) return [];

  const data = localStorage.getItem(KEYS.works);

  if (!data) return [];

  try {
    return JSON.parse(data) as Work[];
  } catch {
    return [];
  }
}

export function saveWorks(works: Work[]) {
  if (!isBrowser()) return;

  localStorage.setItem(
    KEYS.works,
    JSON.stringify(works)
  );
}

export function addWork(work: Work) {
  const works = getWorks();

  works.push(work);

  saveWorks(works);

  return work;
}

export function updateWork(
  id: string,
  updates: Partial<Work>
) {
  const works = getWorks();

  const updated = works.map((work) =>
    work.id === id
      ? {
          ...work,
          ...updates,
          updatedAt: new Date().toISOString(),
        }
      : work
  );

  saveWorks(updated);

  return updated.find((work) => work.id === id);
}

export function deleteWork(id: string) {
  const works = getWorks();

  const updated = works.filter(
    (work) => work.id !== id
  );

  saveWorks(updated);
}


// ==========================================
// EXTRA WORK
// ==========================================

export function getExtraWorks(): ExtraWork[] {
  if (!isBrowser()) return [];

  const data = localStorage.getItem(KEYS.extraWorks);

  if (!data) return [];

  try {
    return JSON.parse(data) as ExtraWork[];
  } catch {
    return [];
  }
}

export function saveExtraWorks(
  extraWorks: ExtraWork[]
) {
  if (!isBrowser()) return;

  localStorage.setItem(
    KEYS.extraWorks,
    JSON.stringify(extraWorks)
  );
}

export function addExtraWork(
  extraWork: ExtraWork
) {
  const extraWorks = getExtraWorks();

  extraWorks.push(extraWork);

  saveExtraWorks(extraWorks);

  return extraWork;
}

export function updateExtraWork(
  id: string,
  updates: Partial<ExtraWork>
) {
  const extraWorks = getExtraWorks();

  const updated = extraWorks.map((work) =>
    work.id === id
      ? { ...work, ...updates }
      : work
  );

  saveExtraWorks(updated);

  return updated.find((work) => work.id === id);
}


// ==========================================
// CURRENT USER
// ==========================================

export function getCurrentUser(): CurrentUser | null {
  if (!isBrowser()) return null;

  const data = localStorage.getItem(
    KEYS.currentUser
  );

  if (!data) return null;

  try {
    return JSON.parse(data) as CurrentUser;
  } catch {
    return null;
  }
}

export function saveCurrentUser(
  user: CurrentUser
) {
  if (!isBrowser()) return;

  localStorage.setItem(
    KEYS.currentUser,
    JSON.stringify(user)
  );
}

export function clearCurrentUser() {
  if (!isBrowser()) return;

  localStorage.removeItem(KEYS.currentUser);
}


// ==========================================
// CLEAR ALL CRM DATA
// ==========================================

export function clearAllCRMData() {
  if (!isBrowser()) return;

  localStorage.removeItem(KEYS.employees);
  localStorage.removeItem(KEYS.works);
  localStorage.removeItem(KEYS.extraWorks);
  localStorage.removeItem(KEYS.currentUser);
}