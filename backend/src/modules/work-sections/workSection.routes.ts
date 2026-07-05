import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma";
import { requireAuth, requirePosition } from "../../middleware/auth";
import { asyncHandler, HttpError } from "../../middleware/errorHandler";
import { toWorkSectionDto } from "./workSection.dto";

export const workSectionRouter = Router();

const workSectionInputSchema = z.object({
  name: z.string().min(1, "กรุณากรอกชื่องาน"),
  managesMaterials: z.boolean().optional(),
  isProcurementReview: z.boolean().optional(),
});

workSectionRouter.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const includeInactive = req.query.all === "true";
    const workSections = await prisma.workSection.findMany({
      where: includeInactive ? undefined : { active: true },
      orderBy: { name: "asc" },
    });
    res.json({ workSections: workSections.map(toWorkSectionDto) });
  })
);

workSectionRouter.post(
  "/",
  requireAuth,
  requirePosition("admin"),
  asyncHandler(async (req, res) => {
    const parsed = workSectionInputSchema.safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, parsed.error.errors[0]?.message ?? "ข้อมูลไม่ถูกต้อง");

    const workSection = await prisma.workSection.create({ data: parsed.data });
    res.status(201).json({ workSection: toWorkSectionDto(workSection) });
  })
);

workSectionRouter.put(
  "/:id",
  requireAuth,
  requirePosition("admin"),
  asyncHandler(async (req, res) => {
    const parsed = workSectionInputSchema.partial().extend({ active: z.boolean().optional() }).safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, parsed.error.errors[0]?.message ?? "ข้อมูลไม่ถูกต้อง");

    const existing = await prisma.workSection.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new HttpError(404, "ไม่พบงาน");

    const workSection = await prisma.workSection.update({ where: { id: req.params.id }, data: parsed.data });
    res.json({ workSection: toWorkSectionDto(workSection) });
  })
);

workSectionRouter.delete(
  "/:id",
  requireAuth,
  requirePosition("admin"),
  asyncHandler(async (req, res) => {
    const existing = await prisma.workSection.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new HttpError(404, "ไม่พบงาน");

    await prisma.workSection.update({ where: { id: req.params.id }, data: { active: false } });
    res.status(204).send();
  })
);
