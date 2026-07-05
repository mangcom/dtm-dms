import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma";
import { requireAuth, requirePosition } from "../../middleware/auth";
import { asyncHandler, HttpError } from "../../middleware/errorHandler";
import { toAdminUserDto } from "./user.dto";

export const userRouter = Router();

const userUpdateSchema = z.object({
  fullName: z.string().min(1).optional(),
  departmentId: z.string().nullable().optional(),
  active: z.boolean().optional(),
});

// Admin's user directory — edits basic profile fields only. Assigning/revoking
// a duty (PositionAssignment) is a separate concern handled by the
// `positions` module, so "who this person is" stays decoupled from "what
// they're allowed to do".
userRouter.get(
  "/",
  requireAuth,
  requirePosition("admin"),
  asyncHandler(async (_req, res) => {
    const users = await prisma.user.findMany({
      include: {
        departmentRef: true,
        positions: { where: { active: true }, include: { department: true, workSection: true } },
      },
      orderBy: { fullName: "asc" },
    });
    res.json({ users: users.map(toAdminUserDto) });
  })
);

userRouter.put(
  "/:id",
  requireAuth,
  requirePosition("admin"),
  asyncHandler(async (req, res) => {
    const parsed = userUpdateSchema.safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, "ข้อมูลไม่ถูกต้อง");

    const existing = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new HttpError(404, "ไม่พบผู้ใช้");

    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: parsed.data,
      include: {
        departmentRef: true,
        positions: { where: { active: true }, include: { department: true, workSection: true } },
      },
    });
    res.json({ user: toAdminUserDto(updated) });
  })
);
