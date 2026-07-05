import { Material } from "@prisma/client";

export function toMaterialDto(m: Material) {
  return {
    id: m.id,
    code: m.code,
    name: m.name,
    description: m.description,
    unit: m.unit,
    pricePerUnit: Number(m.pricePerUnit),
    vendor: m.vendor,
    imageUrl: m.imageUrl,
    source: m.source,
    active: m.active,
  };
}

export type MaterialDto = ReturnType<typeof toMaterialDto>;
