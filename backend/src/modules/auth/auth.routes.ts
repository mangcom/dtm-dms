import { Router } from "express";
import { z } from "zod";
import { authProvider } from "./authProvider";
import { clearAuthCookie, requireAuth, setAuthCookie, signToken } from "../../middleware/auth";
import { asyncHandler, HttpError } from "../../middleware/errorHandler";
import { prisma } from "../../config/prisma";
import { PositionWithRelations, toUserDto } from "../users/user.dto";

export const authRouter = Router();

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

/** Which position becomes "active" right after login when a user holds more
 * than one. Prefer "teacher" as the safe default home duty; otherwise fall
 * back to whichever position was assigned first. The user can switch anytime
 * via the Profile screen — login doesn't force a "choose your hat" step. */
function pickDefaultPosition(positions: PositionWithRelations[]): PositionWithRelations {
  const teacherPosition = positions.find((p) => p.positionType === "teacher");
  if (teacherPosition) return teacherPosition;
  return positions.reduce((earliest, p) => (p.createdAt < earliest.createdAt ? p : earliest));
}

async function loadUserWithPositions(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      departmentRef: true,
      positions: { where: { active: true }, include: { department: true, workSection: true } },
    },
  });
}

function issueSession(res: import("express").Response, user: { id: string; username: string }, position: PositionWithRelations) {
  const token = signToken({
    sub: user.id,
    username: user.username,
    activePositionId: position.id,
    activePositionType: position.positionType,
    activeDepartmentId: position.departmentId ?? undefined,
    activeWorkSectionId: position.workSectionId ?? undefined,
  });
  setAuthCookie(res, token);
}

authRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, "กรุณากรอกชื่อผู้ใช้และรหัสผ่าน");

    const verifiedUser = await authProvider.verify(parsed.data.username, parsed.data.password);
    if (!verifiedUser) throw new HttpError(401, "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");

    const user = await loadUserWithPositions(verifiedUser.id);
    if (!user || user.positions.length === 0) {
      throw new HttpError(403, "บัญชีนี้ยังไม่มีตำแหน่งที่กำหนดสิทธิ์การใช้งาน กรุณาติดต่อผู้ดูแลระบบ");
    }

    const activePosition = pickDefaultPosition(user.positions);
    issueSession(res, user, activePosition);
    res.json({ user: toUserDto(user, activePosition.id) });
  })
);

authRouter.post("/logout", (_req, res) => {
  clearAuthCookie(res);
  res.status(204).send();
});

// ผู้ใช้ที่ login ไว้ก่อนหน้าอาจถือ cookie ที่ผูกกับ user id ที่ถูกลบไปแล้ว
// (เช่น ตอน seed เปลี่ยนชุดผู้ใช้) กรณีนี้ถือเป็นเซสชันหมดอายุ ตอบ 401 ธรรมดา
// ไม่ throw error ให้ process ล่ม (เคยพลาดจุดนี้มาก่อน — ดู asyncHandler)
authRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await loadUserWithPositions(req.user!.sub);
    if (!user) throw new HttpError(401, "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่");

    // ตำแหน่งที่ active อยู่ในโทเคนอาจถูกถอดไปแล้วระหว่างเซสชัน (เช่น admin
    // ปรับสิทธิ์กลางทาง) — ถ้าหาไม่เจอ fallback ไปตำแหน่ง default ใหม่แทนที่จะ
    // ทิ้งเซสชันไปเลย
    const stillActive = user.positions.find((p) => p.id === req.user!.activePositionId);
    const activePosition = stillActive ?? (user.positions.length > 0 ? pickDefaultPosition(user.positions) : null);
    if (!activePosition) throw new HttpError(403, "บัญชีนี้ไม่มีตำแหน่งที่ใช้งานได้แล้ว กรุณาติดต่อผู้ดูแลระบบ");

    res.json({ user: toUserDto(user, activePosition.id) });
  })
);

const switchPositionSchema = z.object({ positionAssignmentId: z.string().min(1) });

authRouter.post(
  "/switch-position",
  requireAuth,
  asyncHandler(async (req, res) => {
    const parsed = switchPositionSchema.safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, "ข้อมูลไม่ถูกต้อง");

    const user = await loadUserWithPositions(req.user!.sub);
    if (!user) throw new HttpError(401, "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่");

    const target = user.positions.find((p) => p.id === parsed.data.positionAssignmentId);
    if (!target) throw new HttpError(403, "ไม่พบตำแหน่งนี้ หรือไม่ได้เป็นของบัญชีนี้");

    issueSession(res, user, target);
    res.json({ user: toUserDto(user, target.id) });
  })
);
