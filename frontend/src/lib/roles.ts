// Mirrors backend PositionType 1:1. A user can hold several of these
// simultaneously (see AuthUser.positions) — everything below keys off the
// currently *active* one (AuthUser.activePositionType), not the full list.
export type PositionType =
  | "teacher"
  | "dept_head"
  | "work_section_head"
  | "curriculum_head"
  | "deputy_academic"
  | "deputy_plan"
  | "deputy_resource"
  | "deputy_student_affairs"
  | "director"
  | "admin";

export const POSITION_LABEL: Record<PositionType, string> = {
  teacher: "ครูผู้สอน",
  dept_head: "หัวหน้าแผนกวิชา",
  work_section_head: "หัวหน้างาน",
  curriculum_head: "หัวหน้างานหลักสูตร",
  deputy_academic: "รองผู้อำนวยการฝ่ายวิชาการ",
  deputy_plan: "รองผู้อำนวยการฝ่ายแผนงานและยุทธศาสตร์",
  deputy_resource: "รองผู้อำนวยการฝ่ายบริหารทรัพยากร",
  deputy_student_affairs: "รองผู้อำนวยการฝ่ายพัฒนากิจการนักเรียนนักศึกษา",
  director: "ผู้อำนวยการวิทยาลัย",
  admin: "ผู้ดูแลระบบ (Admin)",
};

export const APPROVER_POSITIONS: PositionType[] = [
  "dept_head",
  "work_section_head",
  "curriculum_head",
  "deputy_academic",
  "deputy_plan",
  "director",
];

/**
 * Sidebar item visibility per *active* position — mirrors mShowX flags in the
 * DTM-DMS design prototype. Materials read-access is universal (the backend
 * only gates writes), so nav visibility there is always true — the add/edit
 * controls inside the page itself are gated by the server-computed
 * `user.canManageMaterials` flag, not a hardcoded position list here.
 */
export const NAV_VISIBILITY = {
  dashboard: (_position: PositionType) => true,
  request: (position: PositionType) => position === "teacher",
  materials: (_position: PositionType) => true,
  workflow: (position: PositionType) => position === "teacher" || APPROVER_POSITIONS.includes(position),
  documents: (position: PositionType) => position !== "admin",
  admin: (position: PositionType) => position === "admin",
};
