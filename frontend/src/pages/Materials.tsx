import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, getApiErrorMessage } from "../lib/apiClient";
import { fmt } from "../lib/format";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import { EditIcon, PlusIcon, SearchIcon, TrashIcon } from "../components/icons";

interface Material {
  id: string;
  code: string;
  name: string;
  unit: string;
  pricePerUnit: number;
  vendor: string | null;
  active: boolean;
}

interface MaterialFormState {
  open: boolean;
  editId: string | null;
  name: string;
  unit: string;
  pricePerUnit: string;
  vendor: string;
}

const emptyForm: MaterialFormState = { open: false, editId: null, name: "", unit: "", pricePerUnit: "", vendor: "" };

export function Materials() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [form, setForm] = useState<MaterialFormState>(emptyForm);

  const canManage = !!user?.canManageMaterials;

  const { data: materials = [] } = useQuery({
    queryKey: ["materials"],
    queryFn: async () => (await api.get<{ materials: Material[] }>("/materials")).data.materials,
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return materials;
    return materials.filter((m) => m.name.toLowerCase().includes(q) || m.code.toLowerCase().includes(q));
  }, [materials, query]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["materials"] });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name.trim(),
        unit: form.unit.trim() || "ชิ้น",
        pricePerUnit: Number(form.pricePerUnit) || 0,
        vendor: form.vendor.trim() || undefined,
      };
      if (form.editId) {
        return (await api.put(`/materials/${form.editId}`, payload)).data;
      }
      return (await api.post("/materials", payload)).data;
    },
    onSuccess: () => {
      invalidate();
      showToast(form.editId ? "บันทึกการแก้ไขแล้ว" : "เพิ่มวัสดุใหม่เรียบร้อย");
      setForm(emptyForm);
    },
    onError: (err) => showToast(getApiErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/materials/${id}`),
    onSuccess: () => {
      invalidate();
      showToast("ลบรายการแล้ว");
    },
    onError: (err) => showToast(getApiErrorMessage(err)),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      showToast("กรุณากรอกชื่อวัสดุ");
      return;
    }
    saveMutation.mutate();
  }

  function openEdit(m: Material) {
    setForm({ open: true, editId: m.id, name: m.name, unit: m.unit, pricePerUnit: String(m.pricePerUnit), vendor: m.vendor ?? "" });
  }

  return (
    <div className="animate-fadein">
      <div className="mb-[22px] flex items-end justify-between">
        <div>
          <div className="mb-1 text-[22px] font-bold">จัดการรายการวัสดุ (Master Data)</div>
          <div className="text-sm text-text-2">
            ทั้งหมด {materials.length} รายการ · ชื่อวัสดุ ราคาต่อหน่วย หน่วยนับ และร้านค้า
          </div>
        </div>
        {canManage && (
          <button
            onClick={() => setForm({ ...emptyForm, open: true })}
            className="flex items-center gap-2 rounded-[9px] bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-h"
          >
            <PlusIcon width={17} height={17} stroke="#fff" strokeWidth={2.1} />
            เพิ่มวัสดุ
          </button>
        )}
      </div>

      {form.open && (
        <form onSubmit={onSubmit} className="mb-[18px] rounded-xl border border-primary bg-surface p-5 shadow-card">
          <div className="mb-4 text-[15px] font-bold">{form.editId ? "แก้ไขรายการวัสดุ" : "เพิ่มรายการวัสดุใหม่"}</div>
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="ชื่อวัสดุ">
              <input
                autoFocus
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="เช่น สาย UTP CAT6"
                className="w-full rounded-lg border border-border bg-surface px-[11px] py-2.5 text-[13.5px] text-text outline-none"
              />
            </Field>
            <Field label="หน่วยนับ">
              <input
                value={form.unit}
                onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                placeholder="ตัว/กล่อง"
                className="w-full rounded-lg border border-border bg-surface px-[11px] py-2.5 text-[13.5px] text-text outline-none"
              />
            </Field>
            <Field label="ราคา/หน่วย (฿)">
              <input
                type="number"
                value={form.pricePerUnit}
                onChange={(e) => setForm((f) => ({ ...f, pricePerUnit: e.target.value }))}
                placeholder="0"
                className="w-full rounded-lg border border-border bg-surface px-[11px] py-2.5 text-[13.5px] text-text outline-none"
              />
            </Field>
            <Field label="ร้านค้า/แหล่งจัดซื้อ">
              <input
                value={form.vendor}
                onChange={(e) => setForm((f) => ({ ...f, vendor: e.target.value }))}
                placeholder="ชื่อร้าน"
                className="w-full rounded-lg border border-border bg-surface px-[11px] py-2.5 text-[13.5px] text-text outline-none"
              />
            </Field>
          </div>
          <div className="mt-[18px] flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setForm(emptyForm)}
              className="rounded-lg border border-border bg-surface px-4 py-2.5 text-[13.5px] font-semibold text-text-2"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="rounded-lg bg-primary px-5 py-2.5 text-[13.5px] font-semibold text-white hover:bg-primary-h disabled:opacity-60"
            >
              บันทึก
            </button>
          </div>
        </form>
      )}

      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-card">
        <div className="flex items-center gap-2.5 border-b border-border p-[14px_18px]">
          <div className="relative max-w-[340px] flex-1">
            <SearchIcon className="absolute left-[11px] top-1/2 -translate-y-1/2" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ค้นหาชื่อวัสดุหรือรหัส..."
              className="w-full rounded-lg border border-border bg-bg py-2.5 pl-[34px] pr-3 text-[13.5px] text-text outline-none"
            />
          </div>
        </div>
        <table className="w-full border-collapse text-[13.5px]">
          <thead>
            <tr className="bg-surface-2 text-left text-text-3">
              <th className="px-[18px] py-[11px] font-semibold">รหัส</th>
              <th className="px-3 py-[11px] font-semibold">ชื่อวัสดุ</th>
              <th className="px-3 py-[11px] font-semibold">หน่วยนับ</th>
              <th className="px-3 py-[11px] text-right font-semibold">ราคา/หน่วย</th>
              <th className="px-3 py-[11px] font-semibold">ร้านค้า</th>
              {canManage && <th className="w-[110px] px-[18px] py-[11px] text-center font-semibold">จัดการ</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => (
              <tr key={m.id} className="border-t border-border">
                <td className="px-[18px] py-3 font-mono text-[12.5px] text-text-2">{m.code}</td>
                <td className="px-3 py-3 font-medium">{m.name}</td>
                <td className="px-3 py-3 text-text-2">{m.unit}</td>
                <td className="px-3 py-3 text-right font-semibold">{fmt(m.pricePerUnit)}</td>
                <td className="px-3 py-3 text-text-2">{m.vendor}</td>
                {canManage && (
                  <td className="px-[18px] py-3">
                    <div className="flex justify-center gap-1.5">
                      <button
                        onClick={() => openEdit(m)}
                        title="แก้ไข"
                        className="flex h-[30px] w-[30px] items-center justify-center rounded-[7px] border border-border bg-surface text-text-2 hover:border-primary hover:text-primary"
                      >
                        <EditIcon />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`ลบ "${m.name}" ใช่หรือไม่?`)) deleteMutation.mutate(m.id);
                        }}
                        title="ลบ"
                        className="flex h-[30px] w-[30px] items-center justify-center rounded-[7px] border border-border bg-surface text-text-2 hover:border-danger hover:text-danger"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={canManage ? 6 : 5} className="px-[18px] py-10 text-center text-text-3">
                  ไม่พบรายการวัสดุ
                </td>
              </tr>
            )}
          </tbody>
        </table>
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
