import { fmt, bahtText, thaiDateLong } from "../../../lib/bahtText";
import { wrapHtmlDocument } from "../paperStyles";
import { DocMaterialRow } from "../document.dto";

// จำนวนแถวต่อหน้า อ้างอิงจากตัวอย่างไฟล์จริง (ใบประมาณราคา.pdf) ที่หน้าแรกมี
// พอดี 17 แถวก่อนขึ้น "ยอดยกไป"
const ROWS_PER_PAGE = 17;

interface PriceEstimateData {
  college: string;
  subjectLabel: string;
  teacherName: string;
  headName: string;
  rows: DocMaterialRow[];
  totalAmount: number;
  docDate: Date;
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

export function renderPriceEstimate(data: PriceEstimateData): string {
  const pages = paginate(data.rows, ROWS_PER_PAGE);
  const dateStr = thaiDateLong(data.docDate);
  let runningTotal = 0;

  const sheets = pages
    .map((pageRows, pageIndex) => {
      const isFirst = pageIndex === 0;
      const isLast = pageIndex === pages.length - 1;
      const carryIn = runningTotal;
      const pageTotal = pageRows.reduce((s, r) => s + r.subtotal, 0);
      runningTotal += pageTotal;

      const header = `
        <div class="doc-title" style="margin-bottom:10px">ใบประมาณราคา</div>
        ${isFirst ? `<div class="doc-summary" style="margin-top:-6px">${data.subjectLabel}</div>` : ""}
      `;

      const carryRow = !isFirst
        ? `<tr><td class="center">-</td><td>ยกยอดมาจากรายการหน้าที่แล้ว</td><td></td><td></td><td></td><td class="right">${fmt(
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

      const footer = isLast
        ? `
        <div class="doc-total-text">(ตัวอักษร) ${bahtText(data.totalAmount)}</div>
        <div class="doc-signatures" style="margin-top:36px">
          <div class="sig">
            <div class="sig-line">ลงชื่อ .....................................</div>
            <div>( ${data.teacherName} )</div>
            <div class="sig-role">ผู้ประมาณราคา</div>
            <div class="sig-role">ตำแหน่ง ครู ผู้สอน</div>
            <div class="sig-role">วันที่ ${dateStr}</div>
          </div>
          <div class="sig">
            <div class="sig-line">ลงชื่อ .....................................</div>
            <div>( ${data.headName} )</div>
            <div class="sig-role">หัวหน้าแผนก</div>
            <div class="sig-role">วันที่ ${dateStr}</div>
          </div>
        </div>
      `
        : "";

      return `<div class="sheet">
        ${data.college ? `<div class="doc-college" style="font-size:15px;margin-bottom:4px">${data.college}</div>` : ""}
        ${header}
        <table class="doc-table">
          <thead><tr>
            <th style="width:42px">ลำดับ</th>
            <th>รายการ</th>
            <th style="width:56px">จำนวนหน่วย</th>
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
        ${footer}
      </div>`;
    })
    .join("");

  return wrapHtmlDocument(sheets);
}
