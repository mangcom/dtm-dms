import { fmt, bahtText } from "../../../lib/bahtText";
import { wrapHtmlDocument } from "../paperStyles";
import { DocMaterialRow } from "../document.dto";

const ROWS_PER_PAGE = 22;

interface Sp11Data {
  college: string;
  departmentName: string;
  term: string;
  year: string;
  totalStudents: number;
  rows: DocMaterialRow[];
  grandTotal: number;
  headName: string;
}

function paginate<T>(rows: T[], perPage: number): T[][] {
  if (rows.length === 0) return [[]];
  const pages: T[][] = [];
  for (let i = 0; i < rows.length; i += perPage) pages.push(rows.slice(i, i + perPage));
  return pages;
}

function rowHtml(r: DocMaterialRow): string {
  return `<tr>
    <td class="center">${r.no}</td>
    <td>${r.name}</td>
    <td class="center">${r.qty}</td>
    <td class="center">${r.unit}</td>
    <td class="right">${fmt(r.price)}</td>
    <td class="right">${fmt(r.subtotal)}</td>
    <td></td>
  </tr>`;
}

export function renderSp11(data: Sp11Data): string {
  const pages = paginate(data.rows, ROWS_PER_PAGE);
  let runningTotal = 0;

  const sheets = pages
    .map((pageRows, pageIndex) => {
      const isFirst = pageIndex === 0;
      const isLast = pageIndex === pages.length - 1;
      const carryIn = runningTotal;
      const pageTotal = pageRows.reduce((s, r) => s + r.subtotal, 0);
      runningTotal += pageTotal;

      const header = isFirst
        ? `
        <div class="doc-code">แบบ สผ.๑.๑</div>
        <div class="doc-college">${data.college}</div>
        <div class="doc-title">แบบประมาณการค่าวัสดุฝึก (สผ.๑.๑)</div>
        <div class="doc-subtitle">${data.departmentName} · ภาคเรียนที่ ${data.term} ปีการศึกษา ${data.year}</div>
        <div class="doc-meta-row">
          <span>จำนวนนักศึกษารวม <b>${data.totalStudents}</b> คน</span>
        </div>
        <div class="doc-summary">ประมาณการค่าวัสดุฝึก ดังรายละเอียดที่แนบ รวมเป็นเงินทั้งสิ้น <b>${fmt(
          data.grandTotal
        )}</b> บาท (${bahtText(data.grandTotal)})</div>
      `
        : `<div class="doc-title">แบบประมาณการค่าวัสดุฝึก (สผ.๑.๑) (ต่อ)</div>`;

      const carryRow = !isFirst
        ? `<tr><td class="center">-</td><td>ยกยอดมาจากหน้าที่แล้ว</td><td></td><td></td><td></td><td class="right">${fmt(
            carryIn
          )}</td><td></td></tr>`
        : "";

      const footerRow = isLast
        ? `<tr class="total-row"><td colspan="5" class="right">รวมทั้งสิ้น</td><td class="right">${fmt(
            runningTotal
          )}</td><td></td></tr>`
        : `<tr class="total-row"><td colspan="5" class="right">ยอดยกไป</td><td class="right">${fmt(
            runningTotal
          )}</td><td></td></tr>`;

      const signatures = isLast
        ? `
        <div class="doc-signatures">
          <div class="sig"><div class="sig-line">ลงชื่อ .....................................</div><div>( ${data.headName} )</div><div class="sig-role">ผู้สรุป</div></div>
          <div class="sig"><div class="sig-line">ลงชื่อ .....................................</div><div>( ${data.headName} )</div><div class="sig-role">หัวหน้าแผนกวิชา</div></div>
        </div>
      `
        : "";

      return `<div class="sheet">
        ${header}
        <table class="doc-table">
          <thead><tr>
            <th style="width:42px">ลำดับ</th>
            <th>รายการ</th>
            <th style="width:56px">จำนวน</th>
            <th style="width:64px">หน่วย</th>
            <th style="width:92px">ราคาต่อหน่วย</th>
            <th style="width:96px">จำนวนเงิน</th>
            <th style="width:70px">หมายเหตุ</th>
          </tr></thead>
          <tbody>
            ${carryRow}
            ${pageRows.map(rowHtml).join("")}
            ${footerRow}
          </tbody>
        </table>
        ${signatures}
      </div>`;
    })
    .join("");

  return wrapHtmlDocument(sheets);
}
