export type EmployeeStatus = "Active" | "Inactive";

export type WorkStatus =
  | "New"
  | "Assigned"
  | "In Progress"
  | "Submitted"
  | "Owner Review"
  | "Rework"
  | "Approved"
  | "Completed"
  | "Cancelled";

export type WorkPriority =
  | "Low"
  | "Medium"
  | "High"
  | "Urgent";

export type WorkCategory =
  | "Video"
  | "Website"
  | "Coding"
  | "Design"
  | "Social Media"
  | "Content"
  | "Marketing"
  | "Client Work"
  | "Extra Work"
  | "Other";

export type UserRole = "Owner" | "Employee";

export type ReviewStatus =
  | "Pending"
  | "Approved"
  | "Rework";

export interface Employee {
  id: string;
  name: string;
  role: string;
  department: string;
  phone: string;
  email: string;
  joiningDate: string;
  status: EmployeeStatus;

  /**
   * V1 localStorage authentication.
   * Production version should use a secure backend
   * with hashed passwords.
   */
  password?: string;

  passwordUpdatedAt?: string;

  /**
   * Password reset workflow
   */
  passwordResetRequested?: boolean;
  passwordResetRequestedAt?: string;

  avatar?: string;
  createdAt: string;
}

export interface Work {
  id: string;
  title: string;
  description: string;
  category: WorkCategory;
  priority: WorkPriority;
  status: WorkStatus;
  assignedTo: string;
  assignedBy: string;
  startDate: string;
  deadline: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  estimatedHours?: number;
  actualHours?: number;
  tags?: string[];
  attachments?: Attachment[];
  submission?: Submission;
  review?: Review;
  reworkCount?: number;
  isExtraWork?: boolean;
}

export type AttachmentType =
  | "Image"
  | "Video"
  | "Document"
  | "Code"
  | "Website"
  | "Link"
  | "Other";

export interface Attachment {
  id: string;
  name: string;
  type: AttachmentType;
  url: string;
  uploadedAt: string;
  uploadedBy: string;
}

export interface Submission {
  submittedAt: string;
  submittedBy: string;
  message: string;
  attachments: Attachment[];
  liveUrl?: string;
  githubUrl?: string;
  demoUrl?: string;
}

export interface Review {
  status: ReviewStatus;
  reviewedAt?: string;
  reviewedBy?: string;
  comments?: string;
  reworkReason?: string;
}

export type ExtraWorkStatus =
  | "Requested"
  | "Approved"
  | "Rejected"
  | "Assigned"
  | "Completed";

export interface ExtraWork {
  id: string;
  title: string;
  description: string;
  requestedBy: string;
  assignedTo?: string;
  requestedAt: string;
  approvedAt?: string;
  completedAt?: string;
  status: ExtraWorkStatus;
  priority: WorkPriority;
  deadline?: string;
}

export interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  todaysWork: number;
  newWork: number;
  assignedWork: number;
  inProgress: number;
  pendingReview: number;
  completed: number;
  overdue: number;
  rework: number;
}

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  employeeId?: string;
}