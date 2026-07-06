import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/apiClient";
import { DocumentsIcon } from "../components/icons";

type DocTab = "sp11" | "sp12" | "sp13" | "price-estimate" | "memo";

const TABS: Array<{ key: DocTab; label: string }> = [
  { key: "sp11", label: "สผ.1.1 · ประมาณการรวมทั้งแผนก" },
  { key: "sp12", label: "สผ.1.2 · สรุปรายวิชา" },
  { key: "sp13", label: "สผ.1.3 · รายละเอียดตามรายวิชา" },
  { key: "price-estimate", label: "ใบประมาณราคา" },
  { key: "memo", label: "บันทึกข้อความ (ใบผ่านแผน)" },
];

interface RequisitionOption {
  id: string;
  term: string;
  year: string;
  subject: { code: string; name: string };
}

// เอกสารทั้งหมดใช้ endpoint เดียวกันทั้ง preview (iframe, format=html) และ
// export จริง (format=pdf) เพื่อรับประกันว่าสิ่งที่เห็นบนจอกับไฟล์ที่ export
// ออกมาเป็นข้อมูลชุดเดียวกันเป๊ะ ไม่ต้องดูแลโค้ด render สองชุดแยกกัน
function buildDocUrl(tab: DocTab, params: Record<string, string>, format: "html" | "pdf"): string {
  const query = new URLSearchParams({ ...params, format }).toString();
  return `/api/documents/${tab}?${query}`;
}

export function Documents() {
  const { user } = useAuth();
  const [tab, setTab] = useState<DocTab>("sp11");
  const [term, setTerm] = useState("1");
  const [year, setYear] = useState("2568");
  const [requisitionId, setRequisitionId] = useState("");
  const [docNumber, setDocNumber] = useState("");
  const [projectRef, setProjectRef] = useState("");
  const [dateRangeText, setDateRangeText] = useState("");

  const { data: mine = [] } = useQuery({
    queryKey: ["requisitions", "mine"],
    queryFn: async () => (await api.get<{ requisitions: RequisitionOption[] }>("/requisitions/mine")).data.requisitions,
  });
  const { data: pending = [] } = useQuery({
    queryKey: ["workflow-pending-docs"],
    queryFn: async () => (await api.get<{ requisitions: RequisitionOption[] }>("/workflow/pending")).data.requisitions,
  });

  const requisitionOptions = useMemo(() => {
    const byId = new Map<string, RequisitionOption>();
    [...mine, ...pending].forEach((r) => byId.set(r.id, r));
    return [...byId.values()];
  }, [mine, pending]);

  if (!user) return null;

  const departmentId = user.department?.id ?? "";
  const needsRequisition = tab !== "sp11";
  const params: Record<string, string> = needsRequisition
    ? tab === "memo"
      ? { requisitionId, docNumber, projectRef, dateRangeText }
      : { requisitionId }
    : { departmentId, term, year };
  const canPreview = needsRequisition ? !!requisitionId : !!departmentId && !!term && !!year;
  const previewUrl = canPreview ? buildDocUrl(tab, params, "html") : "";
  const pdfUrl = canPreview ? buildDocUrl(tab, params, "pdf") : "";

  return (
    <div className="animate-fadein">
      <div className="mb-1 flex items-center justify-between gap-3">
        <div>
          <div className="text-[22px] font-bold">เอกสารสรุปเพื่อจัดซื้อ</div>
          <div className="text-sm text-text-2">
            {user.department?.name ?? "ยังไม่ได้กำหนดแผนก"} · ภาคเรียนที่ {term}/{year}
          </div>
        </div>
        {canPreview && (
          <a
            href={pdfUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-[9px] bg-primary px-4 py-2.5 text-[13.5px] font-semibold text-white hover:bg-primary-h"
          >
            <DocumentsIcon width={16} height={16} strokeWidth={1.8} />
            Export PDF
          </a>
        )}
      </div>

      <div className="mb-4 flex flex-wrap gap-1 rounded-[10px] bg-surface-2 p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-lg px-4 py-2 text-[13px] font-semibold ${
              tab === t.key ? "bg-primary text-white" : "text-text-2 hover:bg-surface"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface p-4 shadow-card">
        {needsRequisition ? (
          <div className="min-w-[280px]">
            <label className="mb-1.5 block text-[12.5px] font-semibold text-text-2">คำขอ</label>
            <select
              value={requisitionId}
              onChange={(e) => setRequisitionId(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-[13.5px] outline-none"
            >
              <option value="">-- เลือกคำขอ --</option>
              {requisitionOptions.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.subject.code} {r.subject.name} · ภาคเรียนที่ {r.term}/{r.year}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        {tab === "memo" && (
          <>
            <div>
              <label className="mb-1.5 block text-[12.5px] font-semibold text-text-2">เลขที่หนังสือ</label>
              <input
                value={docNumber}
                onChange={(e) => setDocNumber(e.target.value)}
                placeholder="เช่น วก 1.12/1/2566"
                className="w-52 rounded-lg border border-border bg-surface px-3 py-2 text-[13.5px] outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[12.5px] font-semibold text-text-2">โครงการที่</label>
              <input
                value={projectRef}
                onChange={(e) => setProjectRef(e.target.value)}
                placeholder="เช่น 3.2.2.10 โครงการจัดซื้อวัสดุการศึกษา"
                className="w-72 rounded-lg border border-border bg-surface px-3 py-2 text-[13.5px] outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[12.5px] font-semibold text-text-2">ระหว่างวันที่</label>
              <input
                value={dateRangeText}
                onChange={(e) => setDateRangeText(e.target.value)}
                placeholder="เช่น ตุลาคม 2565 – กุมภาพันธ์ 2566"
                className="w-64 rounded-lg border border-border bg-surface px-3 py-2 text-[13.5px] outline-none"
              />
            </div>
          </>
        )}
        {!needsRequisition && (
          <>
            <div>
              <label className="mb-1.5 block text-[12.5px] font-semibold text-text-2">ภาคเรียน</label>
              <input
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                className="w-24 rounded-lg border border-border bg-surface px-3 py-2 text-[13.5px] outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[12.5px] font-semibold text-text-2">ปีการศึกษา</label>
              <input
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-28 rounded-lg border border-border bg-surface px-3 py-2 text-[13.5px] outline-none"
              />
            </div>
            {!departmentId && (
              <div className="text-[13px] text-danger">บัญชีนี้ยังไม่ได้กำหนดแผนกวิชา ไม่สามารถแสดงเอกสารได้</div>
            )}
          </>
        )}
      </div>

      <div className="flex justify-center rounded-xl border border-border bg-surface-2 p-5">
        {canPreview ? (
          <iframe title="document-preview" src={previewUrl} className="h-[1100px] w-[794px] max-w-full border-0 bg-white shadow-card" />
        ) : (
          <div className="flex h-[300px] w-full items-center justify-center text-sm text-text-3">
            {needsRequisition ? "กรุณาเลือกคำขอเพื่อแสดงเอกสาร" : "กรุณาระบุภาคเรียนและปีการศึกษา"}
          </div>
        )}
      </div>
    </div>
  );
}
