import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, getApiErrorMessage } from "../lib/apiClient";
import { fmt } from "../lib/format";
import { useToast } from "../context/ToastContext";
import { PlusIcon } from "../components/icons";

interface Subject {
  id: string;
  code: string;
  name: string;
  level: string;
  levelYear: string;
  term: string;
  year: string;
  classroomLabel: string | null;
  studentCount: number;
}

interface Material {
  id: string;
  code: string;
  name: string;
  unit: string;
  pricePerUnit: number;
}

interface Line {
  materialId: string;
  qty: number;
}

export function RequestForm() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const { data: subjects = [] } = useQuery({
    queryKey: ["subjects", "mine"],
    queryFn: async () => (await api.get<{ subjects: Subject[] }>("/subjects/mine")).data.subjects,
  });
  const { data: materials = [] } = useQuery({
    queryKey: ["materials"],
    queryFn: async () => (await api.get<{ materials: Material[] }>("/materials")).data.materials,
  });

  const [subjectId, setSubjectId] = useState("");
  const [term, setTerm] = useState("");
  const [year, setYear] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [newMaterialId, setNewMaterialId] = useState("");
  const [newQty, setNewQty] = useState("1");

  const selectedSubject = subjects.find((s) => s.id === subjectId);
  const materialById = useMemo(() => new Map(materials.map((m) => [m.id, m])), [materials]);

  function onSelectSubject(id: string) {
    setSubjectId(id);
    const subject = subjects.find((s) => s.id === id);
    if (subject) {
      setTerm(subject.term);
      setYear(subject.year);
    }
  }

  function addLine() {
    if (!newMaterialId) {
      showToast("กรุณาเลือกวัสดุ");
      return;
    }
    const qty = Number(newQty) || 1;
    setLines((prev) => {
      const existing = prev.find((l) => l.materialId === newMaterialId);
      if (existing) {
        return prev.map((l) => (l.materialId === newMaterialId ? { ...l, qty: l.qty + qty } : l));
      }
      return [...prev, { materialId: newMaterialId, qty }];
    });
    setNewQty("1");
  }

  function removeLine(materialId: string) {
    setLines((prev) => prev.filter((l) => l.materialId !== materialId));
  }

  function setLineQty(materialId: string, qty: number) {
    setLines((prev) => prev.map((l) => (l.materialId === materialId ? { ...l, qty } : l)));
  }

  const total = lines.reduce((sum, l) => sum + (materialById.get(l.materialId)?.pricePerUnit ?? 0) * l.qty, 0);

  const submitMutation = useMutation({
    mutationFn: async () => {
      const created = await api.post<{ requisition: { id: string } }>("/requisitions", {
        subjectId,
        term,
        year,
        items: lines,
      });
      return api.post(`/requisitions/${created.data.requisition.id}/submit`);
    },
    onSuccess: () => {
      showToast("ส่งคำขอเข้าสู่กระบวนการอนุมัติแล้ว");
      queryClient.invalidateQueries({ queryKey: ["requisitions"] });
      setSubjectId("");
      setTerm("");
      setYear("");
      setLines([]);
    },
    onError: (err) => showToast(getApiErrorMessage(err)),
  });

  function onSubmitRequest() {
    if (!subjectId) {
      showToast("กรุณาเลือกรายวิชา");
      return;
    }
    if (lines.length === 0) {
      showToast("กรุณาเพิ่มรายการวัสดุอย่างน้อย 1 รายการ");
      return;
    }
    submitMutation.mutate();
  }

  return (
    <div className="animate-fadein max-w-[1000px]">
      <div className="mb-1 text-[22px] font-bold">กรอกรายการวัสดุฝึกต่อรายวิชา</div>
      <div className="mb-[22px] text-sm text-text-2">เลือกรายวิชา แล้วเพิ่มรายการวัสดุฝึกที่ต้องใช้</div>

      <div className="mb-[18px] rounded-xl border border-border bg-surface p-5 shadow-card">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-[12.5px] font-semibold text-text-2">รายวิชา</label>
            <select
              value={subjectId}
              onChange={(e) => onSelectSubject(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm outline-none"
            >
              <option value="">-- เลือกรายวิชา --</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code} {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-[12.5px] font-semibold text-text-2">ภาคเรียน</label>
            <input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[12.5px] font-semibold text-text-2">ปีการศึกษา</label>
            <input
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm outline-none"
            />
          </div>
        </div>
        {selectedSubject && (
          <div className="mt-3.5 text-[13px] text-text-2">
            {selectedSubject.level}{selectedSubject.levelYear} · {selectedSubject.classroomLabel ?? "-"} ·{" "}
            {selectedSubject.studentCount} คน
          </div>
        )}
      </div>

      <div className="mb-[18px] overflow-hidden rounded-xl border border-border bg-surface shadow-card">
        <div className="border-b border-border px-[18px] py-[15px] text-[15px] font-bold">
          รายการวัสดุฝึก ({lines.length} รายการ)
        </div>
        <table className="w-full border-collapse text-[13.5px]">
          <thead>
            <tr className="bg-surface-2 text-left text-text-3">
              <th className="px-[18px] py-2.5 font-semibold">วัสดุ</th>
              <th className="px-3 py-2.5 font-semibold">หน่วย</th>
              <th className="px-3 py-2.5 text-right font-semibold">ราคา/หน่วย</th>
              <th className="w-[110px] px-3 py-2.5 text-center font-semibold">จำนวน</th>
              <th className="px-3 py-2.5 text-right font-semibold">รวม (฿)</th>
              <th className="w-[50px] px-[18px] py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l) => {
              const m = materialById.get(l.materialId);
              if (!m) return null;
              return (
                <tr key={l.materialId} className="border-t border-border">
                  <td className="px-[18px] py-2.5 font-medium">{m.name}</td>
                  <td className="px-3 py-2.5 text-text-2">{m.unit}</td>
                  <td className="px-3 py-2.5 text-right">{fmt(m.pricePerUnit)}</td>
                  <td className="px-3 py-2.5 text-center">
                    <input
                      type="number"
                      min={1}
                      value={l.qty}
                      onChange={(e) => setLineQty(l.materialId, Number(e.target.value) || 1)}
                      className="w-[74px] rounded-lg border border-border bg-surface px-2 py-1.5 text-center text-[13.5px] outline-none"
                    />
                  </td>
                  <td className="px-3 py-2.5 text-right font-semibold">{fmt(m.pricePerUnit * l.qty)}</td>
                  <td className="px-[18px] py-2.5">
                    <button
                      onClick={() => removeLine(l.materialId)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-text-3 hover:border-danger hover:text-danger"
                    >
                      ×
                    </button>
                  </td>
                </tr>
              );
            })}
            {lines.length === 0 && (
              <tr>
                <td colSpan={6} className="px-[18px] py-8 text-center text-text-3">
                  ยังไม่มีรายการวัสดุ
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="flex flex-wrap items-end gap-3 border-t border-border bg-surface-2 px-[18px] py-3.5">
          <div className="flex-1">
            <label className="mb-1.5 block text-xs font-semibold text-text-2">เพิ่มวัสดุ</label>
            <select
              value={newMaterialId}
              onChange={(e) => setNewMaterialId(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-2.5 py-2 text-[13.5px] outline-none"
            >
              <option value="">-- เลือกวัสดุ --</option>
              {materials.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
          <div className="w-[120px]">
            <label className="mb-1.5 block text-xs font-semibold text-text-2">จำนวน</label>
            <input
              type="number"
              min={1}
              value={newQty}
              onChange={(e) => setNewQty(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-2.5 py-2 text-[13.5px] outline-none"
            />
          </div>
          <button
            onClick={addLine}
            className="flex items-center gap-1.5 rounded-lg border border-primary bg-primary-soft px-4 py-2 text-[13.5px] font-semibold text-primary"
          >
            <PlusIcon width={16} height={16} strokeWidth={2.1} />
            เพิ่มรายการ
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-border bg-surface px-[22px] py-[18px] shadow-card">
        <div>
          <div className="text-[13px] text-text-2">งบประมาณรวมโดยประมาณ</div>
          <div className="text-[26px] font-bold text-primary">฿ {fmt(total)}</div>
        </div>
        <button
          onClick={onSubmitRequest}
          disabled={submitMutation.isPending}
          className="flex items-center gap-2 rounded-[9px] bg-primary px-6 py-3 text-[15px] font-semibold text-white hover:bg-primary-h disabled:opacity-60"
        >
          ส่งเข้าสู่กระบวนการอนุมัติ
        </button>
      </div>
    </div>
  );
}
