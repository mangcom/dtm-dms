import { Department, PositionAssignment, PositionType, User, WorkSection } from "@prisma/client";

export type PositionWithRelations = PositionAssignment & {
  department: Department | null;
  workSection: WorkSection | null;
};

export type UserWithRelations = User & {
  departmentRef: Department | null;
  positions: PositionWithRelations[];
};

// Positions always allowed to manage Material master data, regardless of
// scope. work_section_head is handled separately (see canManageMaterials
// below) since it depends on a DB-configured flag (WorkSection.managesMaterials)
// rather than the position type alone.
const ALWAYS_MATERIAL_MANAGER_TYPES: PositionType[] = ["admin", "dept_head", "curriculum_head"];

function canManageMaterials(active: PositionWithRelations): boolean {
  if (ALWAYS_MATERIAL_MANAGER_TYPES.includes(active.positionType)) return true;
  return active.positionType === "work_section_head" && !!active.workSection?.managesMaterials;
}

function mapPositions(positions: PositionWithRelations[]) {
  return positions.map((p) => ({
    id: p.id,
    positionType: p.positionType,
    departmentId: p.departmentId,
    departmentName: p.department?.name ?? null,
    workSectionId: p.workSectionId,
    workSectionName: p.workSection?.name ?? null,
    label: p.label,
  }));
}

function mapDepartment(user: UserWithRelations) {
  return user.departmentRef
    ? { id: user.departmentRef.id, name: user.departmentRef.name, shortName: user.departmentRef.shortName }
    : null;
}

export function toUserDto(user: UserWithRelations, activePositionId: string) {
  const active = user.positions.find((p) => p.id === activePositionId);
  if (!active) {
    throw new Error(`toUserDto: activePositionId ${activePositionId} ไม่อยู่ในตำแหน่งของผู้ใช้ ${user.id}`);
  }

  return {
    id: user.id,
    rmsCode: user.rmsCode,
    username: user.username,
    fullName: user.fullName,
    avatarUrl: user.avatarUrl,
    department: mapDepartment(user),
    active: user.active,
    canManageMaterials: canManageMaterials(active),
    positions: mapPositions(user.positions),
    activePositionId: active.id,
    activePositionType: active.positionType,
  };
}

export type UserDto = ReturnType<typeof toUserDto>;

/** Admin's user-list shape — same underlying data as toUserDto but for
 * *another* user being managed (no "active position" concept applies). */
export function toAdminUserDto(user: UserWithRelations) {
  return {
    id: user.id,
    rmsCode: user.rmsCode,
    username: user.username,
    fullName: user.fullName,
    avatarUrl: user.avatarUrl,
    department: mapDepartment(user),
    active: user.active,
    positions: mapPositions(user.positions),
  };
}

export type AdminUserDto = ReturnType<typeof toAdminUserDto>;
