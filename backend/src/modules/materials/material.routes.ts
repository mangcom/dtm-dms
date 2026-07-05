import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma";
import { requireAuth, requireRole } from "../../middleware/auth";
import { HttpError } from "../../middleware/errorHandler";
import { toMaterialDto } from "./material.dto";

export const materialRouter = Router();

const MANAGE_ROLES = ["dept_head", "curriculum_head", "admin"] as const;

const materialInputSchema = z.object({
  name: z.string().min(1, "กรุณากรอกชื่อวัสดุ"),
  unit: z.string().min(1).default("ชิ้น"),
  pricePerUnit: z.coerce.number().min(0),
  vendor: z.string().optional(),
});

async function nextMaterialCode(): Promise<string> {
  const count = await prisma.material.count();
  return `MT-${String(count + 1).padStart(3, "0")}`;
}

materialRouter.get("/", requireAuth, async (req, res) => {
  const q = String(req.query.q ?? "").trim();
  const materials = await prisma.material.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { code: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { code: "asc" },
  });
  res.json({ materials: materials.map(toMaterialDto) });
});

materialRouter.post("/", requireAuth, requireRole(...MANAGE_ROLES), async (req, res) => {
  const parsed = materialInputSchema.safeParse(req.body);
  if (!parsed.success) throw new HttpError(400, parsed.error.errors[0]?.message ?? "ข้อมูลไม่ถูกต้อง");

  const code = await nextMaterialCode();
  const material = await prisma.material.create({
    data: { ...parsed.data, code },
  });
  res.status(201).json({ material: toMaterialDto(material) });
});

materialRouter.put("/:id", requireAuth, requireRole(...MANAGE_ROLES), async (req, res) => {
  const parsed = materialInputSchema.safeParse(req.body);
  if (!parsed.success) throw new HttpError(400, parsed.error.errors[0]?.message ?? "ข้อมูลไม่ถูกต้อง");

  const existing = await prisma.material.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new HttpError(404, "ไม่พบรายการวัสดุ");

  const material = await prisma.material.update({
    where: { id: req.params.id },
    data: parsed.data,
  });
  res.json({ material: toMaterialDto(material) });
});

materialRouter.delete("/:id", requireAuth, requireRole(...MANAGE_ROLES), async (req, res) => {
  const existing = await prisma.material.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new HttpError(404, "ไม่พบรายการวัสดุ");

  await prisma.material.delete({ where: { id: req.params.id } });
  res.status(204).send();
});
