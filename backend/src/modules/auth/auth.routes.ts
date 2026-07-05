import { Router } from "express";
import { z } from "zod";
import { authProvider } from "./authProvider";
import { clearAuthCookie, requireAuth, setAuthCookie, signToken } from "../../middleware/auth";
import { asyncHandler, HttpError } from "../../middleware/errorHandler";
import { prisma } from "../../config/prisma";
import { toUserDto } from "../users/user.dto";

export const authRouter = Router();

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

authRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, "กรุณากรอกชื่อผู้ใช้และรหัสผ่าน");

    const user = await authProvider.verify(parsed.data.username, parsed.data.password);
    if (!user) throw new HttpError(401, "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");

    const token = signToken({ sub: user.id, role: user.role, username: user.username });
    setAuthCookie(res, token);
    res.json({ user: toUserDto(user) });
  })
);

authRouter.post("/logout", (_req, res) => {
  clearAuthCookie(res);
  res.status(204).send();
});

// ผู้ใช้ที่ login ไว้ก่อนหน้าอาจถือ cookie ที่ผูกกับ user id ที่ถูกลบไปแล้ว
// (เช่น ตอน seed เปลี่ยนชุดผู้ใช้) กรณีนี้ถือเป็นเซสชันหมดอายุ ตอบ 401 ธรรมดา
// ไม่ throw error ให้ process ล่ม (เคยพลาดจุดนี้มาก่อน — ดู asyncHandler ด้านบน)
authRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.user!.sub } });
    if (!user) throw new HttpError(401, "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่");
    res.json({ user: toUserDto(user) });
  })
);
