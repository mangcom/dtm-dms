import { fmt, bahtText } from "../../../lib/bahtText";
import { wrapHtmlDocument } from "../paperStyles";
import { DocMaterialRow } from "../document.dto";

interface Sp13Data {
  college: string;
  departmentShortName: string;
  subject: {
    code: string;
    name: string;
    level: string;
    levelYear: string;
    roomCount: number;
    studentCount: number;
  };
  term: string;
  year: string;
  teacherName: string;
  rows: DocMaterialRow[];
  totalAmount: number;
  headName: string;
}

function rowHtml(r: DocMaterialRow): string {
  return `<tr>
    <td class="center">${r.no}</td>
    <td>${r.name}</td>
    <td class="center">${r.qty}</td>
    <td class="center">${r.unit}</td>
    <td class="right">${fmt(r.price)}</td>
    <td class="right">${fmt(r.subtotal)}</td>
  </tr>`;
}

export function renderSp13(data: Sp13Data): string {
  const totalText = bahtText(data.totalAmount);
  const body = `<div class="sheet">
    <div class="doc-code">แบบ สผ.๑.๓</div>
    <div class="doc-college">${data.college}</div>
    <div class="doc-title">รายละเอียดการขอใช้วัสดุฝึกตามรายวิชา (สผ.๑.๓)</div>
    <div class="doc-summary">แผนกวิชา ${data.departmentShortName} &nbsp;·&nbsp; ข้าพเจ้า <b>${
    data.teacherName
  }</b> มีความประสงค์ขอใช้วัสดุฝึก ในภาคเรียนที่ ${data.term}/${data.year}</div>
    <table class="doc-table" style="margin-bottom:12px">
      <thead><tr>
        <th>ชื่อวิชา</th>
        <th style="width:88px">รหัสวิชา</th>
        <th style="width:70px">ปวช./ปวส.</th>
        <th style="width:72px">ชั้นปี</th>
        <th style="width:60px">จำนวนห้อง</th>
        <th style="width:72px">จำนวน นร./นศ</th>
      </tr></thead>
      <tbody><tr>
        <td>${data.subject.name}</td>
        <td class="center">${data.subject.code}</td>
        <td class="center">${data.subject.level}</td>
        <td class="center">${data.subject.levelYear}</td>
        <td class="center">${data.subject.roomCount}</td>
        <td class="center">${data.subject.studentCount}</td>
      </tr></tbody>
    </table>
    <div style="font-size:12.5px;font-weight:600;margin-bottom:4px;color:#333">รายการขอใช้วัสดุ</div>
    <table class="doc-table">
      <thead><tr>
        <th style="width:42px">ลำดับ</th>
        <th>ชื่อวัสดุ</th>
        <th style="width:56px">จำนวน</th>
        <th style="width:64px">หน่วย</th>
        <th style="width:92px">ราคาต่อหน่วย</th>
        <th style="width:96px">จำนวนเงิน</th>
      </tr></thead>
      <tbody>
        ${data.rows.map(rowHtml).join("")}
        <tr class="total-row"><td colspan="5" class="right">รวมทั้งสิ้น</td><td class="right">${fmt(
          data.totalAmount
        )}</td></tr>
      </tbody>
    </table>
    <div class="doc-total-text">(ตัวอักษร) ${totalText}</div>
    <div class="doc-signatures">
      <div class="sig"><div class="sig-line">ลงชื่อ .....................................</div><div>( ${
        data.teacherName
      } )</div><div class="sig-role">ครูผู้สอน</div></div>
      <div class="sig"><div class="sig-line">ลงชื่อ .....................................</div><div>( ${
        data.headName
      } )</div><div class="sig-role">หัวหน้าแผนกวิชา</div></div>
    </div>
    <div class="doc-note">หมายเหตุ วิชาละ ๑ แผ่น</div>
  </div>`;

  return wrapHtmlDocument(body);
}
