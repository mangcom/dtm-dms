import { Router } from "express";
import { z } from "zod";
import { PositionType } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { requireAuth, requirePosition } from "../../middleware/auth";
import { asyncHandler, HttpError } from "../../middleware/errorHandler";
import { toPositionDto } from "./position.dto";

export const positionRouter = Router();

const SCOPED_TO_DEPARTMENT: PositionType[] = ["dept_head"];
const SCOPED_TO_WORK_SECTION: PositionType[] = ["work_section_head"];

const positionInputSchema = z.object({
  userId: z.string().min(1),
  positionType: z.enum([
    "teacher",
    "dept_head",
    "work_section_head",
    "curriculum_head",
    "deputy_academic",
    "deputy_plan",
    "deputy_resource",
    "deputy_student_affairs",
    "director",
    "admin",
  ]),
  departmentId: z.string().optional(),
  workSectionId: z.string().optional(),
  label: z.string().optional(),
});

positionRouter.get(
  "/",
  requireAuth,
  requirePosition("admin"),
  asyncHandler(async (req, res) => {
    const userId = String(req.query.userId ?? "");
    if (!userId) throw new HttpError(400, "ต้องระบุ userId");

    const positions = await prisma.positionAssignment.findMany({
      where: { userId, active: true },
      include: { department: true, workSection: true },
      orderBy: { createdAt: "asc" },
    });
    res.json({ positions: positions.map(toPositionDto) });
  })
);

positionRouter.post(
  "/",
  requireAuth,
  requirePosition("admin"),
  asyncHandler(async (req, res) => {
    const parsed = positionInputSchema.safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, parsed.error.errors[0]?.message ?? "ข้อมูลไม่ถูกต้อง");
    const { userId, positionType, label } = parsed.data;
    let { departmentId, workSectionId } = parsed.data;

    if (SCOPED_TO_DEPARTMENT.includes(positionType)) {
      if (!departmentId) throw new HttpError(400, "ตำแหน่งนี้ต้องระบุแผนกที่สังกัด");
      workSectionId = undefined;
    } else if (SCOPED_TO_WORK_SECTION.includes(positionType)) {
      if (!workSectionId) throw new HttpError(400, "ตำแหน่งนี้ต้องระบุงานที่สังกัด");
      departmentId = undefined;
    } else {
      departmentId = undefined;
      workSectionId = undefined;
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new HttpError(404, "ไม่พบผู้ใช้");
    if (departmentId && !(await prisma.department.findUnique({ where: { id: departmentId } }))) {
      throw new HttpError(404, "ไม่พบแผนกที่เลือก");
    }
    if (workSectionId && !(await prisma.workSection.findUnique({ where: { id: workSectionId } }))) {
      throw new HttpError(404, "ไม่พบงานที่เลือก");
    }

    const duplicate = await prisma.positionAssignment.findFirst({
      where: { userId, positionType, departmentId: departmentId ?? null, workSectionId: workSectionId ?? null, active: true },
    });
    if (duplicate) throw new HttpError(409, "ผู้ใช้นี้มีตำแหน่งนี้ในขอบเขตเดียวกันอยู่แล้ว");

    const position = await prisma.positionAssignment.create({
      data: { userId, positionType, departmentId, workSectionId, label },
      include: { department: true, workSection: true },
    });
    res.status(201).json({ position: toPositionDto(position) });
  })
);

positionRouter.delete(
  "/:id",
  requireAuth,
  requirePosition("admin"),
  asyncHandler(async (req, res) => {
    const existing = await prisma.positionAssignment.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new HttpError(404, "ไม่พบตำแหน่งนี้");

    await prisma.positionAssignment.update({ where: { id: req.params.id }, data: { active: false } });
    res.status(204).send();
  })
);
