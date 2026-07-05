import { Material } from "@prisma/client";

export function toMaterialDto(m: Material) {
  return {
    id: m.id,
    code: m.code,
    name: m.name,
    unit: m.unit,
    pricePerUnit: Number(m.pricePerUnit),
    vendor: m.vendor,
    active: m.active,
  };
}

export type MaterialDto = ReturnType<typeof toMaterialDto>;
