import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { POSITION_LABEL } from "../lib/roles";
import { ChevronDownIcon, MenuIcon, MoonIcon, SunIcon, SystemIcon } from "./icons";

interface TopbarProps {
  onToggleSidebar: () => void;
}

function themeBtnClass(active: boolean) {
  return `flex h-[30px] w-8 items-center justify-center rounded-[7px] border-none cursor-pointer ${
    active ? "bg-surface text-primary shadow-card" : "bg-transparent text-text-3"
  }`;
}

export function Topbar({ onToggleSidebar }: TopbarProps) {
  const { user } = useAuth();
  const { mode, setMode } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  if (!user) return null;
  const initial = user.fullName.trim().charAt(0);
  const activePosition = user.positions.find((p) => p.id === user.activePositionId);
  const activePositionLabel =
    activePosition?.label ??
    [POSITION_LABEL[user.activePositionType], activePosition?.departmentName ?? activePosition?.workSectionName]
      .filter(Boolean)
      .join(" · ");

  return (
    <header className="sticky top-0 z-20 flex h-[60px] flex-none items-center justify-between border-b border-border bg-surface px-[22px]">
      <div className="flex items-center gap-3.5">
        <button
          onClick={onToggleSidebar}
          className="flex h-9 w-9 items-center justify-center rounded-[9px] border border-border bg-surface text-text-2 hover:bg-surface-2"
        >
          <MenuIcon />
        </button>
        <div className="text-[15px] font-semibold text-text-2">{user.department?.name ?? "-"}</div>
      </div>

      <div className="flex items-center gap-3.5">
        <div className="flex gap-0.5 rounded-[9px] bg-surface-2 p-[3px]">
          <button title="Light" className={themeBtnClass(mode === "light")} onClick={() => setMode("light")}>
            <SunIcon />
          </button>
          <button title="Dark" className={themeBtnClass(mode === "dark")} onClick={() => setMode("dark")}>
            <MoonIcon />
          </button>
          <button title="System" className={themeBtnClass(mode === "system")} onClick={() => setMode("system")}>
            <SystemIcon />
          </button>
        </div>

        <div className="h-[26px] w-px bg-border" />

        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2.5 rounded-[10px] border border-border bg-surface py-[5px] pl-1.5 pr-2.5 hover:bg-surface-2"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-soft text-[15px] font-bold text-primary">
              {initial}
            </div>
            <div className="text-left leading-tight">
              <div className="text-[13px] font-semibold text-text">{user.fullName}</div>
              <div className="text-[11.5px] font-semibold text-primary">{activePositionLabel}</div>
            </div>
            <ChevronDownIcon className="ml-0.5" />
          </button>
          {menuOpen && (
            <div
              onMouseLeave={() => setMenuOpen(false)}
              className="animate-fadein absolute right-0 top-[52px] z-50 w-[270px] rounded-xl border border-border bg-surface p-[7px] shadow-[0_12px_30px_rgba(16,24,40,.16)]"
            >
              <div className="px-2.5 pb-1.5 pt-2 text-[11px] font-bold tracking-[0.4px] text-text-3">
                ข้อมูลบัญชี
              </div>
              <div className="rounded-lg px-[11px] py-2 text-[13.5px] text-text-2">{user.rmsCode}</div>
              <div className="rounded-lg px-[11px] py-2 text-[13.5px] text-text-2">{user.username}</div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
