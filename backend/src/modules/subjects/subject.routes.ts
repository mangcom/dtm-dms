import { Router } from "express";
import { prisma } from "../../config/prisma";
import { requireAuth, requirePosition } from "../../middleware/auth";
import { asyncHandler } from "../../middleware/errorHandler";
import { toSubjectDto } from "./subject.dto";

export const subjectRouter = Router();

const includeRelations = { teacher: true, classroom: true, department: true } as const;

// Request form's course dropdown — only the logged-in teacher's own subjects,
// scoped by their user id regardless of which position is currently active
// (a teacher acting as work_section_head today still owns the same subjects).
subjectRouter.get(
  "/mine",
  requireAuth,
  asyncHandler(async (req, res) => {
    const subjects = await prisma.subject.findMany({
      where: { teacherId: req.user!.sub },
      include: includeRelations,
      orderBy: { code: "asc" },
    });
    res.json({ subjects: subjects.map(toSubjectDto) });
  })
);

// Admin sees every subject; a dept_head sees their own department's subjects
// (needed later for สผ.1.1/1.2/1.3 document generation scoped by department).
subjectRouter.get(
  "/",
  requireAuth,
  requirePosition("admin", "dept_head", "curriculum_head"),
  asyncHandler(async (req, res) => {
    const where =
      req.user!.activePositionType === "dept_head" && req.user!.activeDepartmentId
        ? { departmentId: req.user!.activeDepartmentId }
        : undefined;
    const subjects = await prisma.subject.findMany({
      where,
      include: includeRelations,
      orderBy: { code: "asc" },
    });
    res.json({ subjects: subjects.map(toSubjectDto) });
  })
);
