import { WorkSection } from "@prisma/client";

export function toWorkSectionDto(w: WorkSection) {
  return {
    id: w.id,
    name: w.name,
    managesMaterials: w.managesMaterials,
    isProcurementReview: w.isProcurementReview,
    active: w.active,
  };
}

export type WorkSectionDto = ReturnType<typeof toWorkSectionDto>;
