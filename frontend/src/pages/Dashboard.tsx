import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/apiClient";
import { POSITION_LABEL, NAV_VISIBILITY } from "../lib/roles";
import { StatCard } from "../components/StatCard";
import { DocumentsIcon, MaterialsIcon, PlusIcon, WorkflowIcon } from "../components/icons";

interface MaterialDto {
  id: string;
  active: boolean;
}

export function Dashboard() {
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: ["materials", "dashboard-count"],
    queryFn: async () => (await api.get<{ materials: MaterialDto[] }>("/materials")).data.materials,
  });

  if (!user) return null;
  const materialCount = data?.length ?? 0;

  return (
    <div className="animate-fadein">
      <div className="mb-1 text-[22px] font-bold">สวัสดี, {user.fullName}</div>
      <div className="mb-6 text-sm text-text-2">
        บทบาท: {POSITION_LABEL[user.activePositionType]} · {user.department?.name ?? "-"}
      </div>

      <div className="mb-[22px] grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="รายการวัสดุฝึกในระบบ" value={materialCount} hint="Master data" />
        <StatCard label="คำขอรออนุมัติ" value={0} valueClassName="text-warn" hint="เปิดใช้งานใน Phase 2" />
        <StatCard label="อนุมัติแล้ว" value={0} valueClassName="text-success" hint="เปิดใช้งานใน Phase 2" />
        <StatCard label="งบประมาณรวม" value="฿ 0" valueClassName="text-primary" hint="เปิดใช้งานใน Phase 2" />
      </div>

      <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-[1.6fr_1fr]">
        <div className="rounded-xl border border-border bg-surface p-5 shadow-card">
          <div className="mb-4 text-[15px] font-bold">คำขอล่าสุด</div>
          <div className="flex items-center justify-center rounded-lg border border-dashed border-border py-10 text-sm text-text-3">
            ฟีเจอร์คำขอวัสดุฝึกและ workflow อนุมัติจะเปิดใช้งานใน Phase 2
          </div>
        </div>
        <div className="rounded-xl border border-border bg-surface p-5 shadow-card">
          <div className="mb-4 text-[15px] font-bold">ทางลัด</div>
          <div className="flex flex-col gap-2.5">
            {NAV_VISIBILITY.request(user.activePositionType) && (
              <QuickLink to="/request" icon={<PlusIcon />} label="กรอกรายการวัสดุฝึกใหม่" />
            )}
            {NAV_VISIBILITY.materials(user.activePositionType) && (
              <QuickLink to="/materials" icon={<MaterialsIcon />} label="จัดการรายการวัสดุ" />
            )}
            {NAV_VISIBILITY.documents(user.activePositionType) && (
              <QuickLink to="/documents" icon={<DocumentsIcon />} label="ดู/พิมพ์เอกสาร สผ.1.1–1.3" />
            )}
            {NAV_VISIBILITY.workflow(user.activePositionType) && (
              <QuickLink to="/workflow" icon={<WorkflowIcon />} label="ติดตามสถานะการอนุมัติ" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickLink({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-[10px] border border-border p-[13px] hover:border-primary hover:bg-primary-soft"
    >
      <span className="text-primary">{icon}</span>
      <span className="text-sm font-semibold">{label}</span>
    </Link>
  );
}
