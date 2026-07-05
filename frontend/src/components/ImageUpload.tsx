import { ChangeEvent, useRef, useState } from "react";
import { api, getApiErrorMessage } from "../lib/apiClient";

interface ImageUploadProps {
  endpoint: string;
  fieldName: string;
  currentUrl?: string | null;
  onUploaded: (url: string) => void;
  shape?: "circle" | "square";
}

const MAX_SIZE_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];

export function ImageUpload({ endpoint, fieldName, currentUrl, onUploaded, shape = "square" }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("รองรับเฉพาะไฟล์ PNG, JPEG, WEBP");
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setError("ขนาดไฟล์ต้องไม่เกิน 2MB");
      return;
    }

    setPreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append(fieldName, file);
      // ไม่ตั้ง Content-Type เอง — ปล่อยให้ axios ตรวจจับ FormData แล้วใส่
      // boundary ให้อัตโนมัติ (ถ้าตั้งเองแบบไม่มี boundary จะพาร์สฝั่ง backend ไม่ได้)
      const res = await api.put<{ url?: string; avatarUrl?: string }>(endpoint, formData);
      onUploaded(res.data.url ?? res.data.avatarUrl ?? "");
    } catch (err) {
      setError(getApiErrorMessage(err, "อัปโหลดไม่สำเร็จ"));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div
        className={`flex h-20 w-20 flex-none items-center justify-center overflow-hidden border border-border bg-surface-2 text-text-3 ${
          shape === "circle" ? "rounded-full" : "rounded-lg"
        }`}
      >
        {preview ? (
          <img src={preview} alt="preview" className="h-full w-full object-cover" />
        ) : (
          <span className="text-xs">ไม่มีรูป</span>
        )}
      </div>
      <div>
        <input ref={inputRef} type="file" accept={ALLOWED_TYPES.join(",")} className="hidden" onChange={handleFile} />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="rounded-lg border border-border bg-surface px-3.5 py-2 text-[13px] font-semibold text-text-2 hover:bg-surface-2 disabled:opacity-60"
        >
          {uploading ? "กำลังอัปโหลด..." : "เลือกรูปภาพ"}
        </button>
        <div className="mt-1 text-[11.5px] text-text-3">PNG, JPEG, WEBP ไม่เกิน 2MB</div>
        {error && <div className="mt-1 text-[12px] text-danger">{error}</div>}
      </div>
    </div>
  );
}
