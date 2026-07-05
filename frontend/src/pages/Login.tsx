import { FormEvent, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LogoIcon } from "../components/icons";

export function Login() {
  const { user, login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(username, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "เข้าสู่ระบบไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      <div
        className="relative hidden flex-[1.1] flex-col justify-between overflow-hidden p-16 text-white md:flex"
        style={{ background: "linear-gradient(150deg,#1a5296,#1e5faa 55%,#2b74c4)" }}
      >
        <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full border border-white/[.14]" />
        <div className="absolute -bottom-32 right-10 h-[260px] w-[260px] rounded-full border border-white/10" />
        <div className="relative z-10 flex items-center gap-3.5">
          <div className="flex h-[46px] w-[46px] items-center justify-center rounded-xl bg-white/[.16]">
            <LogoIcon width={24} height={24} />
          </div>
          <div className="text-[19px] font-bold tracking-[0.3px]">DTM&#8209;DMS</div>
        </div>
        <div className="relative z-10 max-w-[440px]">
          <div className="mb-[18px] text-[34px] font-bold leading-[1.3]">
            ระบบสารสนเทศเพื่อการบริหารจัดการเอกสารวัสดุฝึกประจำแผนกวิชา
          </div>
          <div className="text-[15px] leading-[1.7] text-white/[.82]">
            บริหารจัดการรายการวัสดุฝึก ตั้งแต่การเสนอรายการ การอนุมัติตามลำดับขั้น
            จนถึงการออกเอกสารสรุปเพื่อจัดซื้อ (สผ.1.1 / สผ.1.2 / สผ.1.3)
          </div>
        </div>
        <div className="relative z-10 flex gap-[26px] text-[13px] text-white/75">
          <div>
            <div className="text-[22px] font-bold text-white">6 ลำดับ</div>ขั้นการอนุมัติ
          </div>
          <div>
            <div className="text-[22px] font-bold text-white">9 บทบาท</div>สิทธิ์การใช้งาน (RBAC)
          </div>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center p-10">
        <form onSubmit={onSubmit} className="w-full max-w-[380px]">
          <div className="mb-1.5 text-2xl font-bold">เข้าสู่ระบบ</div>
          <div className="mb-7 text-sm text-text-2">ลงชื่อเข้าใช้ด้วยบัญชี RMS ของสถานศึกษา</div>

          <label className="mb-[7px] block text-[13px] font-semibold text-text-2">
            ชื่อผู้ใช้ (RMS Account)
          </label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="mb-4 w-full rounded-[9px] border border-border bg-surface px-[13px] py-[11px] text-sm text-text outline-none"
            autoComplete="username"
          />

          <label className="mb-[7px] block text-[13px] font-semibold text-text-2">รหัสผ่าน</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mb-[22px] w-full rounded-[9px] border border-border bg-surface px-[13px] py-[11px] text-sm text-text outline-none"
            autoComplete="current-password"
          />

          {error && <div className="mb-4 text-sm font-medium text-danger">{error}</div>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-[9px] bg-primary py-3 text-[15px] font-semibold text-white hover:bg-primary-h disabled:opacity-60"
          >
            {submitting ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
          </button>

          <div className="mt-[18px] rounded-[9px] bg-surface-2 px-3.5 py-3 text-[12.5px] leading-[1.6] text-text-2">
            <b className="text-text">เดโม:</b> ผู้ใช้ทดสอบทุกบัญชี รหัสผ่านคือ{" "}
            <code className="font-mono">password</code> เช่น <code className="font-mono">pornjira.n</code>{" "}
            (ครูผู้สอน), <code className="font-mono">pornchai.t</code> (หัวหน้าแผนกวิชา), <code className="font-mono">admin</code>{" "}
            (ผู้ดูแลระบบ)
          </div>
        </form>
      </div>
    </div>
  );
}
