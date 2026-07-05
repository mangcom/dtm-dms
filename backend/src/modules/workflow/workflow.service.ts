import { Prisma, PositionType, User } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { AuthTokenPayload } from "../../middleware/auth";

// ยอมรับทั้ง prisma client ปกติและ transaction client (จาก prisma.$transaction)
// เพื่อให้ generateApprovalChain เรียกจากใน transaction แล้ว atomic จริงๆ กับ
// การอัปเดตสถานะ requisition — ถ้าใช้ prisma ตัว global ตรงๆ ข้างในนี้ คำสั่งจะ
// commit แยกจาก transaction ห่อข้างนอกทันที ไม่ atomic ตามที่ตั้งใจ
type DbClient = typeof prisma | Prisma.TransactionClient;

/**
 * ลำดับขั้นอนุมัติคงที่ (ไม่ทำ workflow-builder ให้ admin แก้ลำดับเอง — เกิน
 * ขอบเขตที่ขอไว้ในเฟสนี้ ถ้าต้องการในอนาคตค่อยทำเป็น DB-configurable table)
 * "scopeFrom" บอกว่าต้อง resolve scope (แผนก/งาน) จากไหน:
 *   - "subjectDept": แผนกของวิชาที่ยื่นคำขอ (Subject.departmentId)
 *   - "procurementWorkSection": งานที่ถูกตั้งค่าให้เป็นขั้นตรวจงบ
 *     (WorkSection.isProcurementReview=true) — resolve จาก flag ไม่ hardcode
 *     ชื่องาน เพื่อให้ Admin สร้าง/เปลี่ยนงานที่ทำหน้าที่นี้ได้เองในอนาคต โดย
 *     ไม่ต้องแก้โค้ด (นี่คือทางแก้ปัญหา "หัวหน้างานวางแผนและงบประมาณ" ที่ค้าง
 *     ไว้จากตัวอย่างเอกสารจริง — Admin เพิ่ม WorkSection ใหม่ + ติ๊ก flag นี้ได้)
 *   - null: ไม่ผูกแผนก/งานใดๆ (ตำแหน่งระดับวิทยาลัย)
 */
interface ChainStepDef {
  positionType: PositionType;
  scopeFrom: "subjectDept" | "procurementWorkSection" | null;
}

const APPROVAL_CHAIN: ChainStepDef[] = [
  { positionType: "dept_head", scopeFrom: "subjectDept" },
  { positionType: "work_section_head", scopeFrom: "procurementWorkSection" },
  { positionType: "curriculum_head", scopeFrom: null },
  { positionType: "deputy_academic", scopeFrom: null },
  { positionType: "deputy_plan", scopeFrom: null },
  { positionType: "director", scopeFrom: null },
];

/** หาว่าใครถืออำนาจ positionType (+scope) นี้อยู่ในปัจจุบัน — ใช้ทั้งตอนสร้าง
 * ขั้นอนุมัติ (เพื่อรู้ว่าจะข้ามขั้นไหนถ้าไม่มีใครถือ) และตอน approve/reject
 * (เพื่อยืนยันว่าผู้ใช้ปัจจุบันมีสิทธิ์กระทำขั้นนี้จริง) */
export async function resolveActorsForStep(
  positionType: PositionType,
  scope: { departmentId?: string | null; workSectionId?: string | null },
  db: DbClient = prisma
): Promise<User[]> {
  const assignments = await db.positionAssignment.findMany({
    where: {
      positionType,
      active: true,
      departmentId: scope.departmentId ?? undefined,
      workSectionId: scope.workSectionId ?? undefined,
    },
    include: { user: true },
  });
  return assignments.map((a) => a.user);
}

/** สร้างแถว ApprovalStep ทั้งสายให้คำขอที่เพิ่ง submit — ข้ามขั้นที่ scope หา
 * ไม่เจอ (เช่น ยังไม่มี WorkSection ไหนตั้ง isProcurementReview) แทนที่จะทำให้
 * การ submit ล้มเหลวทั้งหมด เพื่อไม่ให้ระบบ block ครูเพราะ Admin ยังตั้งค่า
 * โครงสร้างองค์กรไม่ครบ — ระบบยังใช้งานได้ แค่ขั้นที่ยังไม่มีคนถือจะถูกข้าม */
export async function generateApprovalChain(
  requisitionId: string,
  subjectDepartmentId: string | null,
  db: DbClient = prisma
) {
  const procurementSection = await db.workSection.findFirst({ where: { isProcurementReview: true } });

  const stepsData: Array<{
    stepOrder: number;
    positionType: PositionType;
    departmentId?: string;
    workSectionId?: string;
  }> = [];

  let order = 1;
  for (const step of APPROVAL_CHAIN) {
    let departmentId: string | undefined;
    let workSectionId: string | undefined;

    if (step.scopeFrom === "subjectDept") {
      if (!subjectDepartmentId) continue;
      departmentId = subjectDepartmentId;
    } else if (step.scopeFrom === "procurementWorkSection") {
      if (!procurementSection) continue;
      workSectionId = procurementSection.id;
    }

    stepsData.push({ stepOrder: order++, positionType: step.positionType, departmentId, workSectionId });
  }

  if (stepsData.length > 0) {
    await db.approvalStep.createMany({ data: stepsData.map((s) => ({ ...s, requisitionId })) });
  }
}

/** ผู้ใช้ปัจจุบัน (จาก JWT) มีสิทธิ์กระทำขั้นนี้หรือไม่ — เทียบ activePositionType
 * (+scope) กับที่ขั้นต้องการ ตรงกันเป๊ะทั้ง positionType และ scope ถึงจะผ่าน */
export function canActOnStep(
  step: { positionType: PositionType; departmentId: string | null; workSectionId: string | null },
  actor: AuthTokenPayload
): boolean {
  if (step.positionType !== actor.activePositionType) return false;
  if (step.departmentId && step.departmentId !== actor.activeDepartmentId) return false;
  if (step.workSectionId && step.workSectionId !== actor.activeWorkSectionId) return false;
  return true;
}
