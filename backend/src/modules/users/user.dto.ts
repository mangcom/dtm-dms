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
    department: user.departmentRef
      ? { id: user.departmentRef.id, name: user.departmentRef.name, shortName: user.departmentRef.shortName }
      : null,
    active: user.active,
    canManageMaterials: canManageMaterials(active),
    positions: user.positions.map((p) => ({
      id: p.id,
      positionType: p.positionType,
      departmentId: p.departmentId,
      departmentName: p.department?.name ?? null,
      workSectionId: p.workSectionId,
      workSectionName: p.workSection?.name ?? null,
      label: p.label,
    })),
    activePositionId: active.id,
    activePositionType: active.positionType,
  };
}

export type UserDto = ReturnType<typeof toUserDto>;
