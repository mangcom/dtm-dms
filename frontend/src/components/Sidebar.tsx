import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { NAV_VISIBILITY } from "../lib/roles";
import {
  AdminIcon,
  DashboardIcon,
  DocumentsIcon,
  LogoIcon,
  LogoutIcon,
  MaterialsIcon,
  PlusIcon,
  WorkflowIcon,
} from "./icons";

interface SidebarProps {
  collapsed: boolean;
}

const itemBase =
  "flex items-center gap-3 rounded-[9px] px-[11px] py-2.5 text-sm whitespace-nowrap overflow-hidden cursor-pointer";

function navClass({ isActive }: { isActive: boolean }) {
  return `${itemBase} ${
    isActive ? "bg-primary-soft text-primary font-semibold" : "text-text-2 font-medium hover:bg-surface-2"
  }`;
}

export function Sidebar({ collapsed }: SidebarProps) {
  const { user, logout } = useAuth();
  const position = user?.activePositionType;
  const showLabels = !collapsed;

  return (
    <aside
      className="sticky top-0 flex h-screen flex-none flex-col border-r border-border bg-surface transition-[width] duration-150"
      style={{ width: collapsed ? 76 : 240 }}
    >
      <div className="flex h-[60px] items-center gap-[11px] border-b border-border px-[18px]">
        <div className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-[9px] bg-primary">
          <LogoIcon width={19} height={19} />
        </div>
        {showLabels && <div className="text-[16px] font-bold tracking-[0.2px]">DTM&#8209;DMS</div>}
      </div>

      <nav className="flex flex-1 flex-col gap-[3px] overflow-y-auto p-3">
        <NavLink to="/dashboard" className={navClass}>
          <DashboardIcon className="flex-none" />
          {showLabels && <span>แดชบอร์ด</span>}
        </NavLink>
        {position && NAV_VISIBILITY.request(position) && (
          <NavLink to="/request" className={navClass}>
            <PlusIcon className="flex-none" />
            {showLabels && <span>กรอกรายการวัสดุฝึก</span>}
          </NavLink>
        )}
        {position && NAV_VISIBILITY.materials(position) && (
          <NavLink to="/materials" className={navClass}>
            <MaterialsIcon className="flex-none" />
            {showLabels && <span>จัดการรายการวัสดุ</span>}
          </NavLink>
        )}
        {position && NAV_VISIBILITY.workflow(position) && (
          <NavLink to="/workflow" className={navClass}>
            <WorkflowIcon className="flex-none" />
            {showLabels && <span>ติดตามสถานะอนุมัติ</span>}
          </NavLink>
        )}
        {position && NAV_VISIBILITY.documents(position) && (
          <NavLink to="/documents" className={navClass}>
            <DocumentsIcon className="flex-none" />
            {showLabels && <span>เอกสาร สผ.1.1 – สผ.1.3</span>}
          </NavLink>
        )}
        {position && NAV_VISIBILITY.admin(position) && (
          <NavLink to="/admin" className={navClass}>
            <AdminIcon className="flex-none" />
            {showLabels && <span>จัดการผู้ใช้/สิทธิ์</span>}
          </NavLink>
        )}
      </nav>

      <div className="border-t border-border p-3">
        <button
          onClick={() => logout()}
          className="flex w-full items-center gap-3 overflow-hidden whitespace-nowrap rounded-[9px] px-[11px] py-2.5 text-left text-sm text-text-2 hover:bg-surface-2"
        >
          <LogoutIcon className="flex-none" />
          {showLabels && <span>ออกจากระบบ</span>}
        </button>
      </div>
    </aside>
  );
}
