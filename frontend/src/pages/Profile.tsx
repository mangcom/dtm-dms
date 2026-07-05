import { FormEvent, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { api, getApiErrorMessage } from "../lib/apiClient";
import { POSITION_LABEL } from "../lib/roles";
import { ImageUpload } from "../components/ImageUpload";

export function Profile() {
  const { user, switchPosition, refreshUser } = useAuth();
  const { showToast } = useToast();
  const [switching, setSwitching] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: "", next: "", confirm: "" });
  const [submittingPassword, setSubmittingPassword] = useState(false);

  if (!user) return null;

  async function onSwitch(positionAssignmentId: string) {
    if (positionAssignmentId === user!.activePositionId) return;
    setSwitching(true);
    try {
      await switchPosition(positionAssignmentId);
      showToast("สลับบทบาทเรียบร้อย");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "สลับบทบาทไม่สำเร็จ");
    } finally {
      setSwitching(false);
    }
  }

  async function onSubmitPassword(e: FormEvent) {
    e.preventDefault();
    if (passwordForm.next !== passwordForm.confirm) {
      showToast("รหัสผ่านใหม่และการยืนยันไม่ตรงกัน");
      return;
    }
    setSubmittingPassword(true);
    try {
      await api.put("/profile/password", { currentPassword: passwordForm.current, newPassword: passwordForm.next });
      showToast("เปลี่ยนรหัสผ่านเรียบร้อย");
      setPasswordForm({ current: "", next: "", confirm: "" });
    } catch (err) {
      showToast(getApiErrorMessage(err, "เปลี่ยนรหัสผ่านไม่สำเร็จ"));
    } finally {
      setSubmittingPassword(false);
    }
  }

  return (
    <div className="animate-fadein max-w-[720px]">
      <div className="mb-1 text-[22px] font-bold">โปรไฟล์ของฉัน</div>
      <div className="mb-6 text-sm text-text-2">
        {user.fullName} · {user.rmsCode}
      </div>

      <div className="flex flex-col gap-[18px]">
        {user.positions.length > 1 && (
          <div className="rounded-xl border border-border bg-surface p-5 shadow-card">
            <div className="mb-1 text-[15px] font-bold">สลับบทบาท</div>
            <div className="mb-4 text-[13px] text-text-2">
              คุณถือหลายตำแหน่งพร้อมกัน เลือกว่ากำลังทำหน้าที่ไหนอยู่ตอนนี้
            </div>
            <div className="flex flex-col gap-2">
              {user.positions.map((p) => {
                const active = p.id === user.activePositionId;
                const scope = p.departmentName ?? p.workSectionName;
                return (
                  <button
                    key={p.id}
                    onClick={() => onSwitch(p.id)}
                    disabled={switching || active}
                    className={`flex items-center justify-between rounded-lg border px-4 py-3 text-left text-[13.5px] font-semibold ${
                      active
                        ? "border-primary bg-primary-soft text-primary"
                        : "border-border bg-surface text-text-2 hover:border-primary"
                    } disabled:cursor-default`}
                  >
                    <span>
                      {p.label ?? POSITION_LABEL[p.positionType]}
                      {scope && <span className="ml-1.5 font-normal text-text-3">({scope})</span>}
                    </span>
                    {active && <span className="text-[12px] font-semibold text-primary">กำลังใช้งาน</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="rounded-xl border border-border bg-surface p-5 shadow-card">
          <div className="mb-4 text-[15px] font-bold">รูปโปรไฟล์</div>
          <ImageUpload
            endpoint="/profile/avatar"
            fieldName="avatar"
            currentUrl={user.avatarUrl}
            shape="circle"
            onUploaded={async () => {
              await refreshUser();
              showToast("เปลี่ยนรูปโปรไฟล์เรียบร้อย");
            }}
          />
        </div>

        <div className="rounded-xl border border-border bg-surface p-5 shadow-card">
          <div className="mb-4 text-[15px] font-bold">เปลี่ยนรหัสผ่าน</div>
          <form onSubmit={onSubmitPassword} className="flex flex-col gap-3.5">
            <Field label="รหัสผ่านปัจจุบัน">
              <input
                type="password"
                value={passwordForm.current}
                onChange={(e) => setPasswordForm((f) => ({ ...f, current: e.target.value }))}
                className="w-full max-w-sm rounded-lg border border-border bg-surface px-[11px] py-2.5 text-[13.5px] outline-none"
              />
            </Field>
            <Field label="รหัสผ่านใหม่ (อย่างน้อย 8 ตัวอักษร)">
              <input
                type="password"
                value={passwordForm.next}
                onChange={(e) => setPasswordForm((f) => ({ ...f, next: e.target.value }))}
                className="w-full max-w-sm rounded-lg border border-border bg-surface px-[11px] py-2.5 text-[13.5px] outline-none"
              />
            </Field>
            <Field label="ยืนยันรหัสผ่านใหม่">
              <input
                type="password"
                value={passwordForm.confirm}
                onChange={(e) => setPasswordForm((f) => ({ ...f, confirm: e.target.value }))}
                className="w-full max-w-sm rounded-lg border border-border bg-surface px-[11px] py-2.5 text-[13.5px] outline-none"
              />
            </Field>
            <div>
              <button
                type="submit"
                disabled={submittingPassword}
                className="rounded-lg bg-primary px-5 py-2.5 text-[13.5px] font-semibold text-white hover:bg-primary-h disabled:opacity-60"
              >
                บันทึกรหัสผ่านใหม่
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-[12.5px] font-semibold text-text-2">{label}</label>
      {children}
    </div>
  );
}
