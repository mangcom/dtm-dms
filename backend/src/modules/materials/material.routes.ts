import { Request, Response, NextFunction, Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma";
import { requireAuth } from "../../middleware/auth";
import { asyncHandler, HttpError } from "../../middleware/errorHandler";
import { createImageUpload, publicUrlFor } from "../../middleware/upload";
import { toMaterialDto } from "./material.dto";

export const materialRouter = Router();

// admin/dept_head/curriculum_head can always manage materials; a
// work_section_head can too, but only if the specific WorkSection they lead
// has managesMaterials=true (admin-configurable — e.g. "งานพัสดุ") — this is
// how a teacher who also heads procurement (e.g. นางพรจิรา) gets the ability
// to add Material records without hardcoding her name/role anywhere.
const ALWAYS_ALLOWED_TYPES = ["admin", "dept_head", "curriculum_head"] as const;

const requireMaterialManager = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  if (!req.user) throw new HttpError(401, "Not authenticated");
  if ((ALWAYS_ALLOWED_TYPES as readonly string[]).includes(req.user.activePositionType)) return next();
  if (req.user.activePositionType === "work_section_head" && req.user.activeWorkSectionId) {
    const section = await prisma.workSection.findUnique({ where: { id: req.user.activeWorkSectionId } });
    if (section?.managesMaterials) return next();
  }
  throw new HttpError(403, "Insufficient permissions");
});

const materialInputSchema = z.object({
  name: z.string().min(1, "กรุณากรอกชื่อวัสดุ"),
  description: z.string().optional(),
  unit: z.string().min(1).default("ชิ้น"),
  pricePerUnit: z.coerce.number().min(0),
  vendor: z.string().optional(),
  source: z.string().optional(),
});

const materialImageUpload = createImageUpload("materials");

async function nextMaterialCode(): Promise<string> {
  const count = await prisma.material.count();
  return `MT-${String(count + 1).padStart(3, "0")}`;
}

materialRouter.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
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
  })
);

materialRouter.post(
  "/",
  requireAuth,
  requireMaterialManager,
  asyncHandler(async (req, res) => {
    const parsed = materialInputSchema.safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, parsed.error.errors[0]?.message ?? "ข้อมูลไม่ถูกต้อง");

    const code = await nextMaterialCode();
    const material = await prisma.material.create({
      data: { ...parsed.data, code },
    });
    res.status(201).json({ material: toMaterialDto(material) });
  })
);

materialRouter.put(
  "/:id",
  requireAuth,
  requireMaterialManager,
  asyncHandler(async (req, res) => {
    const parsed = materialInputSchema.safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, parsed.error.errors[0]?.message ?? "ข้อมูลไม่ถูกต้อง");

    const existing = await prisma.material.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new HttpError(404, "ไม่พบรายการวัสดุ");

    const material = await prisma.material.update({
      where: { id: req.params.id },
      data: parsed.data,
    });
    res.json({ material: toMaterialDto(material) });
  })
);

materialRouter.delete(
  "/:id",
  requireAuth,
  requireMaterialManager,
  asyncHandler(async (req, res) => {
    const existing = await prisma.material.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new HttpError(404, "ไม่พบรายการวัสดุ");

    await prisma.material.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);

materialRouter.put(
  "/:id/image",
  requireAuth,
  requireMaterialManager,
  materialImageUpload.single("image"),
  asyncHandler(async (req, res) => {
    if (!req.file) throw new HttpError(400, "กรุณาเลือกไฟล์รูปภาพ");

    const existing = await prisma.material.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new HttpError(404, "ไม่พบรายการวัสดุ");

    const imageUrl = publicUrlFor("materials", req.file.filename);
    const material = await prisma.material.update({ where: { id: req.params.id }, data: { imageUrl } });
    res.json({ material: toMaterialDto(material) });
  })
);
