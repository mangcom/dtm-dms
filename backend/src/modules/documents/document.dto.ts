import { prisma } from "../../config/prisma";
import { HttpError } from "../../middleware/errorHandler";

// ชื่อสถานศึกษา — ยึดตามตัวอย่างเอกสารจริง (ใบประมาณราคา.pdf,
// บันทึกข้อความใบผ่านแผน.pdf) และไฟล์ดีไซน์ต้นแบบ ไม่มีในฐานข้อมูล RMS
// (RMS เก็บเฉพาะข้อมูลครู/รายวิชา ไม่เก็บชื่อสถานศึกษาของตัวเอง)
export const COLLEGE_NAME = "วิทยาลัยพณิชยการบางนา";

export interface DocMaterialRow {
  no: number;
  name: string;
  unit: string;
  price: number;
  qty: number;
  subtotal: number;
}

/** หาว่าใครเป็นหัวหน้าแผนกวิชาที่ active อยู่ตอนนี้ ไว้เซ็นชื่อในเอกสาร —
 * resolve จาก PositionAssignment แบบเดียวกับที่ workflow.service.ts ใช้ตอน
 * สร้างสายอนุมัติ ไม่ hardcode ชื่อคนใดคนหนึ่งไว้ตายตัว */
async function resolveDeptHeadName(departmentId: string): Promise<string> {
  const assignment = await prisma.positionAssignment.findFirst({
    where: { departmentId, positionType: "dept_head", active: true },
    include: { user: true },
  });
  return assignment?.user.fullName ?? "( ยังไม่ได้กำหนดหัวหน้าแผนก )";
}

async function loadRequisitionForDoc(requisitionId: string) {
  const requisition = await prisma.requisition.findUnique({
    where: { id: requisitionId },
    include: {
      subject: { include: { classroom: true, department: true } },
      teacher: true,
      items: { include: { material: true } },
    },
  });
  if (!requisition) throw new HttpError(404, "ไม่พบคำขอ");
  return requisition;
}

export async function getSp11Data(departmentId: string, term: string, year: string) {
  const department = await prisma.department.findUnique({ where: { id: departmentId } });
  if (!department) throw new HttpError(404, "ไม่พบแผนกวิชา");

  // สผ.1.1 คือ "ประมาณการรวมทั้งแผนก" — รวมทุกคำขอ (ทุกรายวิชา) ของแผนกนี้ใน
  // ภาคเรียน/ปีการศึกษาเดียวกัน โดยรวมยอดวัสดุชนิดเดียวกันที่ถูกขอในหลายวิชา
  // เข้าเป็นแถวเดียว (ตรงกับความหมายของ "รวมทั้งแผนก" ในแบบฟอร์มจริง)
  const requisitions = await prisma.requisition.findMany({
    where: { term, year, status: { in: ["submitted", "approved"] }, subject: { departmentId } },
    include: { items: { include: { material: true } }, subject: true },
  });

  const rowMap = new Map<string, { name: string; unit: string; price: number; qty: number; subtotal: number }>();
  const subjectStudentCounts = new Map<string, number>();
  for (const r of requisitions) {
    subjectStudentCounts.set(r.subject.id, r.subject.studentCount);
    for (const item of r.items) {
      const key = item.materialId;
      const existing = rowMap.get(key);
      const price = Number(item.unitPriceSnapshot);
      const subtotal = Number(item.subtotal);
      if (existing) {
        existing.qty += item.qty;
        existing.subtotal += subtotal;
      } else {
        rowMap.set(key, { name: item.material.name, unit: item.material.unit, price, qty: item.qty, subtotal });
      }
    }
  }

  const rows: DocMaterialRow[] = [...rowMap.values()].map((r, i) => ({ no: i + 1, ...r }));
  const grandTotal = rows.reduce((sum, r) => sum + r.subtotal, 0);
  const totalStudents = [...subjectStudentCounts.values()].reduce((a, b) => a + b, 0);
  const headName = await resolveDeptHeadName(departmentId);

  return {
    college: COLLEGE_NAME,
    departmentName: department.name,
    term,
    year,
    totalStudents,
    rows,
    grandTotal,
    headName,
  };
}

export async function getSubjectDocData(requisitionId: string) {
  const requisition = await loadRequisitionForDoc(requisitionId);
  const rows: DocMaterialRow[] = requisition.items.map((item, i) => ({
    no: i + 1,
    name: item.material.name,
    unit: item.material.unit,
    price: Number(item.unitPriceSnapshot),
    qty: item.qty,
    subtotal: Number(item.subtotal),
  }));
  const totalAmount = Number(requisition.totalAmount);
  const headName = requisition.subject.departmentId
    ? await resolveDeptHeadName(requisition.subject.departmentId)
    : "( ยังไม่ได้กำหนดหัวหน้าแผนก )";

  return {
    college: COLLEGE_NAME,
    departmentShortName: requisition.subject.department?.shortName ?? requisition.subject.department?.name ?? "-",
    subject: {
      code: requisition.subject.code,
      name: requisition.subject.name,
      level: requisition.subject.level,
      levelYear: requisition.subject.levelYear,
      roomCount: requisition.subject.roomCount,
      studentCount: requisition.subject.studentCount,
      classroomLabel: requisition.subject.classroom?.label ?? "-",
    },
    term: requisition.term,
    year: requisition.year,
    teacherName: requisition.teacher.fullName,
    rows,
    totalAmount,
    headName,
  };
}

export async function getPriceEstimateData(requisitionId: string) {
  const requisition = await loadRequisitionForDoc(requisitionId);
  const rows: DocMaterialRow[] = requisition.items.map((item, i) => ({
    no: i + 1,
    name: item.material.name,
    unit: item.material.unit,
    price: Number(item.unitPriceSnapshot),
    qty: item.qty,
    subtotal: Number(item.subtotal),
  }));
  const totalAmount = Number(requisition.totalAmount);
  const headName = requisition.subject.departmentId
    ? await resolveDeptHeadName(requisition.subject.departmentId)
    : "( ยังไม่ได้กำหนดหัวหน้าแผนก )";
  const docDate = requisition.submittedAt ?? requisition.createdAt;

  return {
    college: COLLEGE_NAME,
    subjectLabel: `${requisition.subject.code} ${requisition.subject.name}`,
    teacherName: requisition.teacher.fullName,
    headName,
    rows,
    totalAmount,
    docDate,
  };
}
