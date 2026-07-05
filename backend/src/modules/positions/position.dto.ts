import { Department, PositionAssignment, WorkSection } from "@prisma/client";

type PositionWithRelations = PositionAssignment & { department: Department | null; workSection: WorkSection | null };

export function toPositionDto(p: PositionWithRelations) {
  return {
    id: p.id,
    userId: p.userId,
    positionType: p.positionType,
    departmentId: p.departmentId,
    departmentName: p.department?.name ?? null,
    workSectionId: p.workSectionId,
    workSectionName: p.workSection?.name ?? null,
    label: p.label,
    active: p.active,
  };
}

export type PositionDto = ReturnType<typeof toPositionDto>;
