import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { api, getApiErrorMessage } from "../lib/apiClient";
import { fmt } from "../lib/format";
import { POSITION_LABEL, PositionType } from "../lib/roles";
import { CheckIcon, CloseIcon } from "../components/icons";

type RequisitionStatus = "draft" | "submitted" | "approved" | "rejected";
type StepStatus = "pending" | "approved" | "rejected";

interface Step {
  id: string;
  stepOrder: number;
  positionType: PositionType;
  departmentId: string | null;
  departmentName: string | null;
  workSectionId: string | null;
  workSectionName: string | null;
  status: StepStatus;
  actedAt: string | null;
  note: string | null;
  actorName: string | null;
}

interface RequisitionListItem {
  id: string;
  term: string;
  year: string;
  status: RequisitionStatus;
  totalAmount: number;
  subject: { id: string; code: string; name: string };
  teacherName: string;
  currentStepId: string | null;
}

interface RequisitionDetail extends RequisitionListItem {
  steps: Step[];
  items: Array<{ id: string; materialName: string; unit: string; qty: number; subtotal: number }>;
}

const STATUS_LABEL: Record<RequisitionStatus, string> = {
  draft: "ฉบับร่าง",
  submitted: "รอพิจารณา",
  approved: "อนุมัติแล้ว",
  rejected: "ตีกลับ",
};

const STATUS_STYLE: Record<RequisitionStatus, string> = {
  draft: "bg-surface-2 text-text-3",
  submitted: "bg-primary-soft text-primary",
  approved: "bg-success-soft text-success",
  rejected: "bg-danger-soft text-danger",
};

// เมื่อคำขอถูกตีกลับ (status=rejected) ขั้นถัดจากขั้นที่ตีกลับจะยังมีสถานะ
// "pending" ในฐานข้อมูลเสมอ (ไม่มีใครแตะต้อง) — ต้องแยกป้ายกับกรณี "รอพิจารณา"
// จริงๆ ไม่งั้นจะดูเหมือนกระบวนการยังเดินต่อทั้งที่หยุดไปแล้วเพราะถูกตีกลับ
function stepBadge(
  step: Step,
  currentStepId: string | null,
  requisitionStatus: RequisitionStatus
): { label: string; style: string; dot: string } {
  if (step.status === "approved") {
    return { label: "อนุมัติแล้ว", style: "bg-success-soft text-success", dot: "border-success text-success bg-success-soft" };
  }
  if (step.status === "rejected") {
    return { label: "ตีกลับ", style: "bg-danger-soft text-danger", dot: "border-danger text-danger bg-danger-soft" };
  }
  if (step.id === currentStepId && requisitionStatus === "submitted") {
    return { label: "รอพิจารณา", style: "bg-primary-soft text-primary", dot: "border-primary text-primary bg-primary-soft" };
  }
  return { label: "ยังไม่ถึงลำดับ", style: "bg-surface-2 text-text-3", dot: "border-border text-text-3 bg-surface-2" };
}

export function Workflow() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [note, setNote] = useState("");

  const isTeacher = user?.activePositionType === "teacher";

  const { data: list = [], isLoading } = useQuery({
    queryKey: ["workflow-list", isTeacher ? "mine" : "pending"],
    queryFn: async () =>
      isTeacher
        ? (await api.get<{ requisitions: RequisitionListItem[] }>("/requisitions/mine")).data.requisitions
        : (await api.get<{ requisitions: RequisitionListItem[] }>("/workflow/pending")).data.requisitions,
    enabled: !!user,
  });

  const { data: detail } = useQuery({
    queryKey: ["requisition", selectedId],
    queryFn: async () => (await api.get<{ requisition: RequisitionDetail }>(`/requisitions/${selectedId}`)).data.requisition,
    enabled: !!selectedId,
  });

  const actMutation = useMutation({
    mutationFn: async (action: "approve" | "reject") => {
      if (!detail || !detail.currentStepId) throw new Error("ไม่มีขั้นที่รอดำเนินการ");
      return api.post(`/workflow/${detail.id}/steps/${detail.currentStepId}/${action}`, {
        note: note.trim() || undefined,
      });
    },
    onSuccess: (_res, action) => {
      showToast(action === "approve" ? "อนุมัติรายการเรียบร้อย" : "ตีกลับคำขอเรียบร้อย");
      setNote("");
      queryClient.invalidateQueries({ queryKey: ["requisition", selectedId] });
      queryClient.invalidateQueries({ queryKey: ["workflow-list"] });
    },
    onError: (err) => showToast(getApiErrorMessage(err)),
  });

  if (!user) return null;

  if (selectedId && detail) {
    const activePosition = user.positions.find((p) => p.id === user.activePositionId);
    const canAct =
      !!activePosition &&
      detail.status === "submitted" &&
      detail.steps.some(
        (s) =>
          s.id === detail.currentStepId &&
          s.positionType === activePosition.positionType &&
          (!s.departmentId || s.departmentId === activePosition.departmentId) &&
          (!s.workSectionId || s.workSectionId === activePosition.workSectionId)
      );

    return (
      <div className="animate-fadein max-w-[820px]">
        <button onClick={() => setSelectedId(null)} className="mb-3 text-[13px] font-semibold text-primary">
          ← กลับไปยังรายการ
        </button>
        <div className="mb-1 flex items-center gap-2 text-[22px] font-bold">
          {detail.subject.code} {detail.subject.name}
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLE[detail.status]}`}>
            {STATUS_LABEL[detail.status]}
          </span>
        </div>
        <div className="mb-[22px] text-sm text-text-2">
          {detail.teacherName} · ภาคเรียนที่ {detail.term} ปีการศึกษา {detail.year} · งบ ฿{fmt(detail.totalAmount)}
        </div>

        <div className="rounded-xl border border-border bg-surface p-[26px] shadow-card">
          {detail.steps.map((step, i) => {
            const badge = stepBadge(step, detail.currentStepId, detail.status);
            const isLast = i === detail.steps.length - 1;
            return (
              <div key={step.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-9 w-9 flex-none items-center justify-center rounded-full border-2 text-sm font-bold ${badge.dot}`}
                  >
                    {i + 1}
                  </div>
                  {!isLast && (
                    <div className={`w-0.5 flex-1 min-h-[26px] ${step.status === "approved" ? "bg-success" : "bg-border"}`} />
                  )}
                </div>
                <div className="flex-1 pb-[22px]">
                  <div className="mb-0.5 flex items-center justify-between">
                    <div className="text-[15px] font-semibold">
                      {step.workSectionName ?? step.departmentName ? `${POSITION_LABEL[step.positionType]} (${step.workSectionName ?? step.departmentName})` : POSITION_LABEL[step.positionType]}
                    </div>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.style}`}>{badge.label}</span>
                  </div>
                  {step.actorName && (
                    <div className="text-[13.5px] text-text-2">
                      {step.actorName} {step.actedAt && `· ${new Date(step.actedAt).toLocaleDateString("th-TH")}`}
                    </div>
                  )}
                  {step.note && <div className="mt-1 text-[13px] text-text-3">{step.note}</div>}
                </div>
              </div>
            );
          })}

          {canAct && (
            <div className="mt-2 border-t border-border pt-5">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="หมายเหตุ (ถ้ามี)"
                rows={2}
                className="mb-3 w-full rounded-lg border border-border bg-surface px-3 py-2 text-[13.5px] outline-none"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => actMutation.mutate("approve")}
                  disabled={actMutation.isPending}
                  className="flex flex-1 items-center justify-center gap-2 rounded-[9px] bg-success py-3 text-[14.5px] font-semibold text-white disabled:opacity-60"
                >
                  <CheckIcon width={18} height={18} stroke="#fff" strokeWidth={2.2} />
                  อนุมัติรายการ
                </button>
                <button
                  onClick={() => actMutation.mutate("reject")}
                  disabled={actMutation.isPending}
                  className="flex flex-1 items-center justify-center gap-2 rounded-[9px] border border-danger bg-surface py-3 text-[14.5px] font-semibold text-danger disabled:opacity-60"
                >
                  <CloseIcon width={18} height={18} strokeWidth={2.2} />
                  ตีกลับเพื่อแก้ไข
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fadein max-w-[900px]">
      <div className="mb-1 text-[22px] font-bold">ติดตามสถานะการอนุมัติ</div>
      <div className="mb-[22px] text-sm text-text-2">
        {isTeacher ? "คำขอวัสดุฝึกของฉัน" : "รายการที่รอการพิจารณาจากคุณ"}
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-card">
        {isLoading && <div className="p-8 text-center text-sm text-text-3">กำลังโหลด...</div>}
        {!isLoading && list.length === 0 && (
          <div className="p-8 text-center text-sm text-text-3">
            {isTeacher ? "ยังไม่มีคำขอ" : "ไม่มีรายการที่รอการพิจารณา"}
          </div>
        )}
        {list.map((r) => (
          <button
            key={r.id}
            onClick={() => setSelectedId(r.id)}
            className="flex w-full items-center justify-between gap-3 border-b border-border px-5 py-4 text-left last:border-b-0 hover:bg-primary-soft"
          >
            <div>
              <div className="text-[14.5px] font-semibold">
                {r.subject.code} {r.subject.name}
              </div>
              <div className="text-[13px] text-text-2">
                {r.teacherName} · ภาคเรียนที่ {r.term} ปีการศึกษา {r.year} · ฿{fmt(r.totalAmount)}
              </div>
            </div>
            <span className={`flex-none rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLE[r.status]}`}>
              {STATUS_LABEL[r.status]}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
