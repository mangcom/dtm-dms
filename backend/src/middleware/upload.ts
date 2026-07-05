import fs from "fs";
import path from "path";
import multer from "multer";
import { randomUUID } from "crypto";

const UPLOAD_ROOT = path.join(__dirname, "../../uploads");
const ALLOWED_MIME_TYPES: Record<string, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
};

/**
 * สร้าง multer middleware สำหรับอัปโหลดรูปภาพใต้ backend/uploads/<subdir>/ —
 * ใช้ร่วมกันทั้งรูปโปรไฟล์ (avatars) และรูปวัสดุฝึก (materials) จำกัดขนาด 2MB
 * และรับเฉพาะ png/jpeg/webp — ไฟล์ถูกเสิร์ฟผ่าน express.static ที่ /uploads
 * (ดู app.ts) และ path ถูก mount เป็น docker volume เพื่อให้ทนต่อการ recreate
 * container (ดู docker-compose.yml)
 */
export function createImageUpload(subdir: string) {
  const dir = path.join(UPLOAD_ROOT, subdir);
  fs.mkdirSync(dir, { recursive: true });

  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, dir),
    filename: (_req, file, cb) => {
      const ext = ALLOWED_MIME_TYPES[file.mimetype] ?? path.extname(file.originalname);
      cb(null, `${randomUUID()}${ext}`);
    },
  });

  return multer({
    storage,
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      if (!ALLOWED_MIME_TYPES[file.mimetype]) {
        cb(new Error("รองรับเฉพาะไฟล์รูปภาพ PNG, JPEG, WEBP เท่านั้น"));
        return;
      }
      cb(null, true);
    },
  });
}

export function publicUrlFor(subdir: string, filename: string): string {
  return `/uploads/${subdir}/${filename}`;
}
