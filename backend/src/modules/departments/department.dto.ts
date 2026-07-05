import { Department } from "@prisma/client";

export function toDepartmentDto(d: Department) {
  return { id: d.id, name: d.name, shortName: d.shortName, active: d.active };
}

export type DepartmentDto = ReturnType<typeof toDepartmentDto>;
