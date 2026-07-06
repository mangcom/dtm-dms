import { Response, Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma";
import { AuthTokenPayload, requireAuth } from "../../middleware/auth";
import { asyncHandler, HttpError } from "../../middleware/errorHandler";
import { renderHtmlToPdf } from "../../lib/pdf";
import { getMemoData, getPriceEstimateData, getSp11Data, getSubjectDocData } from "./document.dto";
import { renderSp11 } from "./templates/sp11.template";
import { renderSp12 } from "./templates/sp12.template";
import { renderSp13 } from "./templates/sp13.template";
import { renderPriceEstimate } from "./templates/priceEstimate.template";
import { renderMemo } from "./templates/memo.template";

export const documentRouter = Router();

const formatSchema = z.enum(["html", "pdf"]).default("html");

/** ให้ preview บนหน้าจอ (iframe) กับไฟล์ PDF ที่ export ออกมาใช้ HTML ต้นทาง
 * เดียวกันเป๊ะเสมอ (แค่ format=html คืน HTML ตรงๆ, format=pdf เอา HTML
 * เดียวกันไป render ผ่าน Puppeteer) กันปัญหาข้อมูล preview กับ PDF จริงไม่ตรงกัน */
async function respondWithDocument(res: Response, html: string, format: "html" | "pdf", filename: string) {
  if (format === "pdf") {
    const buffer = await renderHtmlToPdf(html);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${filename}.pdf"`);
    res.send(buffer);
    return;
  }
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(html);
}

/** เจ้าของคำขอดูเอกสารของตัวเองได้เสมอ; ผู้อนุมัติที่มีขั้นอนุมัติของคำขอนี้
 * ตรงกับตำแหน่ง+ขอบเขตที่สวมอยู่ตอนนี้ก็ดูได้ (เอกสารเหล่านี้คือสิ่งที่พวกเขา
 * กำลังพิจารณาอนุมัติอยู่พอดี) — เกณฑ์เดียวกับ GET /requisitions/:id */
async function assertCanViewRequisition(requisitionId: string, actor: AuthTokenPayload) {
  const requisition = await prisma.requisition.findUnique({
    where: { id: requisitionId },
    include: { approvalSteps: true },
  });
  if (!requisition) throw new HttpError(404, "ไม่พบคำขอ");
  const isOwner = requisition.teacherId === actor.sub;
  const isRelevantApprover = requisition.approvalSteps.some(
    (s) =>
      s.positionType === actor.activePositionType &&
      (!s.departmentId || s.departmentId === actor.activeDepartmentId) &&
      (!s.workSectionId || s.workSectionId === actor.activeWorkSectionId)
  );
  if (!isOwner && !isRelevantApprover) throw new HttpError(403, "ไม่มีสิทธิ์เข้าถึงเอกสารของคำขอนี้");
}

const sp11Schema = z.object({
  departmentId: z.string().min(1),
  term: z.string().min(1),
  year: z.string().min(1),
  format: formatSchema,
});

documentRouter.get(
  "/sp11",
  requireAuth,
  asyncHandler(async (req, res) => {
    const parsed = sp11Schema.safeParse(req.query);
    if (!parsed.success) throw new HttpError(400, "กรุณาระบุแผนกวิชา ภาคเรียน และปีการศึกษา");
    const data = await getSp11Data(parsed.data.departmentId, parsed.data.term, parsed.data.year);
    const html = renderSp11(data);
    await respondWithDocument(res, html, parsed.data.format, "sp11");
  })
);

const requisitionDocSchema = z.object({
  requisitionId: z.string().min(1),
  format: formatSchema,
});

documentRouter.get(
  "/sp12",
  requireAuth,
  asyncHandler(async (req, res) => {
    const parsed = requisitionDocSchema.safeParse(req.query);
    if (!parsed.success) throw new HttpError(400, "กรุณาระบุคำขอ");
    await assertCanViewRequisition(parsed.data.requisitionId, req.user!);
    const data = await getSubjectDocData(parsed.data.requisitionId);
    const html = renderSp12(data);
    await respondWithDocument(res, html, parsed.data.format, "sp12");
  })
);

documentRouter.get(
  "/sp13",
  requireAuth,
  asyncHandler(async (req, res) => {
    const parsed = requisitionDocSchema.safeParse(req.query);
    if (!parsed.success) throw new HttpError(400, "กรุณาระบุคำขอ");
    await assertCanViewRequisition(parsed.data.requisitionId, req.user!);
    const data = await getSubjectDocData(parsed.data.requisitionId);
    const html = renderSp13(data);
    await respondWithDocument(res, html, parsed.data.format, "sp13");
  })
);

documentRouter.get(
  "/price-estimate",
  requireAuth,
  asyncHandler(async (req, res) => {
    const parsed = requisitionDocSchema.safeParse(req.query);
    if (!parsed.success) throw new HttpError(400, "กรุณาระบุคำขอ");
    await assertCanViewRequisition(parsed.data.requisitionId, req.user!);
    const data = await getPriceEstimateData(parsed.data.requisitionId);
    const html = renderPriceEstimate(data);
    await respondWithDocument(res, html, parsed.data.format, "price-estimate");
  })
);

const memoSchema = z.object({
  requisitionId: z.string().min(1),
  docNumber: z.string().default(""),
  projectRef: z.string().default(""),
  dateRangeText: z.string().default(""),
  format: formatSchema,
});

documentRouter.get(
  "/memo",
  requireAuth,
  asyncHandler(async (req, res) => {
    const parsed = memoSchema.safeParse(req.query);
    if (!parsed.success) throw new HttpError(400, "กรุณาระบุคำขอ");
    await assertCanViewRequisition(parsed.data.requisitionId, req.user!);
    const data = await getMemoData(
      parsed.data.requisitionId,
      parsed.data.docNumber,
      parsed.data.projectRef,
      parsed.data.dateRangeText
    );
    const html = renderMemo(data);
    await respondWithDocument(res, html, parsed.data.format, "memo");
  })
);
