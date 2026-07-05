import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "../../config/prisma";
import { requireAuth } from "../../middleware/auth";
import { asyncHandler, HttpError } from "../../middleware/errorHandler";
import { createImageUpload, publicUrlFor } from "../../middleware/upload";

export const profileRouter = Router();

const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, "รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร"),
});

profileRouter.put(
  "/password",
  requireAuth,
  asyncHandler(async (req, res) => {
    const parsed = passwordSchema.safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, parsed.error.errors[0]?.message ?? "ข้อมูลไม่ถูกต้อง");

    const user = await prisma.user.findUnique({ where: { id: req.user!.sub } });
    if (!user) throw new HttpError(401, "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่");

    const ok = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
    if (!ok) throw new HttpError(400, "รหัสผ่านปัจจุบันไม่ถูกต้อง");

    const passwordHash = await bcrypt.hash(parsed.data.newPassword, 10);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
    res.status(204).send();
  })
);

const avatarUpload = createImageUpload("avatars");

profileRouter.put(
  "/avatar",
  requireAuth,
  avatarUpload.single("avatar"),
  asyncHandler(async (req, res) => {
    if (!req.file) throw new HttpError(400, "กรุณาเลือกไฟล์รูปภาพ");

    const avatarUrl = publicUrlFor("avatars", req.file.filename);
    await prisma.user.update({ where: { id: req.user!.sub }, data: { avatarUrl } });
    res.json({ avatarUrl });
  })
);
