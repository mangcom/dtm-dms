import { NextFunction, Request, RequestHandler, Response } from "express";

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/**
 * ครอบ async route handler ทุกตัว — Express 4 ไม่ได้ดักจับ Promise ที่ reject
 * จาก handler อัตโนมัติ (ต่างจาก Express 5) ถ้า handler เป็น async function
 * แล้ว throw error ตรงๆ (เช่น `throw new HttpError(...)`) มันจะกลายเป็น
 * unhandled promise rejection ทำให้ทั้ง process ล่มทันที ไม่ใช่แค่ตอบ error
 * กลับไปเฉยๆ — เคยเจอปัญหานี้จริงตอน /me หา user ไม่เจอแล้ว throw error กลาง
 * handler ทำให้ backend ทั้งตัวล่มไปเลย จึงต้องครอบทุก handler ด้วยฟังก์ชันนี้
 * เพื่อส่ง error เข้า errorHandler ผ่าน next(err) แทนการปล่อยให้ promise reject ลอยๆ
 */
export function asyncHandler(fn: RequestHandler): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message });
  }
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
}

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ error: "Not found" });
}
