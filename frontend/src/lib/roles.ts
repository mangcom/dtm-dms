export type Role =
  | "teacher"
  | "dept_head"
  | "curriculum_head"
  | "deputy_academic"
  | "deputy_plan"
  | "deputy_resource"
  | "deputy_student_affairs"
  | "director"
  | "admin";

export const ROLE_LABEL: Record<Role, string> = {
  teacher: "ครูผู้สอน",
  dept_head: "หัวหน้าแผนกวิชา",
  curriculum_head: "หัวหน้างานหลักสูตร",
  deputy_academic: "รองผู้อำนวยการฝ่ายวิชาการ",
  deputy_plan: "รองผู้อำนวยการฝ่ายแผนงานและยุทธศาสตร์",
  deputy_resource: "รองผู้อำนวยการฝ่ายบริหารทรัพยากร",
  deputy_student_affairs: "รองผู้อำนวยการฝ่ายพัฒนากิจการนักเรียนนักศึกษา",
  director: "ผู้อำนวยการวิทยาลัย",
  admin: "ผู้ดูแลระบบ (Admin)",
};

export const APPROVER_ROLES: Role[] = [
  "dept_head",
  "curriculum_head",
  "deputy_academic",
  "deputy_plan",
  "director",
];

export const MATERIAL_MANAGER_ROLES: Role[] = ["dept_head", "curriculum_head", "admin"];

/** Sidebar item visibility per role — mirrors mShowX flags in the DTM-DMS design prototype. */
export const NAV_VISIBILITY = {
  dashboard: (_role: Role) => true,
  request: (role: Role) => role === "teacher",
  materials: (role: Role) => MATERIAL_MANAGER_ROLES.includes(role) || role === "teacher",
  workflow: (role: Role) => role === "teacher" || APPROVER_ROLES.includes(role),
  documents: (role: Role) => role !== "admin",
  admin: (role: Role) => role === "admin",
};
