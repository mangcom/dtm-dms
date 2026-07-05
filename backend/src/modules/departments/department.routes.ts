import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma";
import { requireAuth, requirePosition } from "../../middleware/auth";
import { asyncHandler, HttpError } from "../../middleware/errorHandler";
import { toDepartmentDto } from "./department.dto";

export const departmentRouter = Router();

const departmentInputSchema = z.object({
  name: z.string().min(1, "กรุณากรอกชื่อแผนก"),
  shortName: z.string().optional(),
});

// Read is open to any authenticated user (dropdowns in Admin/Subject forms need it);
// writes are admin-only. Deletes are soft (active:false) so users/subjects that still
// reference a department don't break.
departmentRouter.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const includeInactive = req.query.all === "true";
    const departments = await prisma.department.findMany({
      where: includeInactive ? undefined : { active: true },
      orderBy: { name: "asc" },
    });
    res.json({ departments: departments.map(toDepartmentDto) });
  })
);

departmentRouter.post(
  "/",
  requireAuth,
  requirePosition("admin"),
  asyncHandler(async (req, res) => {
    const parsed = departmentInputSchema.safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, parsed.error.errors[0]?.message ?? "ข้อมูลไม่ถูกต้อง");

    const department = await prisma.department.create({ data: parsed.data });
    res.status(201).json({ department: toDepartmentDto(department) });
  })
);

departmentRouter.put(
  "/:id",
  requireAuth,
  requirePosition("admin"),
  asyncHandler(async (req, res) => {
    const parsed = departmentInputSchema.partial().extend({ active: z.boolean().optional() }).safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, parsed.error.errors[0]?.message ?? "ข้อมูลไม่ถูกต้อง");

    const existing = await prisma.department.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new HttpError(404, "ไม่พบแผนก");

    const department = await prisma.department.update({ where: { id: req.params.id }, data: parsed.data });
    res.json({ department: toDepartmentDto(department) });
  })
);

departmentRouter.delete(
  "/:id",
  requireAuth,
  requirePosition("admin"),
  asyncHandler(async (req, res) => {
    const existing = await prisma.department.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new HttpError(404, "ไม่พบแผนก");

    await prisma.department.update({ where: { id: req.params.id }, data: { active: false } });
    res.status(204).send();
  })
);
