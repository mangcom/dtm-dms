import { fmt, bahtText } from "../../../lib/bahtText";
import { wrapHtmlDocument } from "../paperStyles";
import { DocMaterialRow } from "../document.dto";

interface Sp12Data {
  college: string;
  subject: {
    code: string;
    name: string;
    level: string;
    levelYear: string;
    roomCount: number;
    studentCount: number;
    classroomLabel: string;
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
    <td></td>
  </tr>`;
}

// สผ.1.2 ในต้นแบบดีไซน์แสดงตารางระดับชั้นแบบเมทริกซ์ (ปวช.1-3/ปวส.1-2 ทุกแถว)
// เพราะข้อมูลตัวอย่างเป็นค่าคงที่ล้วนๆ แต่ schema จริงของเราผูก 1 รายวิชา = 1
// ระดับชั้น/ห้องเรียนเท่านั้น (Subject.level/levelYear/classroom) จึงย่อเหลือ
// แถวเดียวที่ตรงกับข้อมูลจริงของวิชานั้น แทนการจำลองเมทริกซ์เปล่าๆ ที่ไม่มี
// ข้อมูลรองรับ
export function renderSp12(data: Sp12Data): string {
  const totalText = bahtText(data.totalAmount);
  const body = `<div class="sheet">
    <div class="doc-code">แบบ สผ.๑.๒</div>
    <div class="doc-college">${data.college}</div>
    <div class="doc-title">แบบสรุปการขอใช้วัสดุฝึกรายวิชา (สผ.๑.๒)</div>
    <div class="doc-summary"><b>วิชา</b> ${data.subject.name} (${data.subject.code}) &nbsp;·&nbsp; ครูผู้สอน ${
    data.teacherName
  } &nbsp;·&nbsp; ภาคเรียนที่ ${data.term} ปีการศึกษา ${data.year}</div>
    <table class="doc-table" style="margin-bottom:14px">
      <tbody>
        <tr>
          <td style="width:34%">ระดับชั้น ${data.subject.level}${data.subject.levelYear}</td>
          <td style="width:33%">จำนวน ${data.subject.roomCount} ห้อง (${data.subject.classroomLabel})</td>
          <td style="width:33%">จำนวน ${data.subject.studentCount} คน</td>
        </tr>
      </tbody>
    </table>
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
        ${data.rows.map(rowHtml).join("")}
        <tr class="total-row"><td colspan="5" class="right">รวมทั้งสิ้น</td><td class="right">${fmt(
          data.totalAmount
        )}</td><td></td></tr>
      </tbody>
    </table>
    <div class="doc-total-text">(ตัวอักษร) ${totalText}</div>
    <div class="doc-signatures">
      <div class="sig"><div class="sig-line">ลงชื่อ .....................................</div><div>( ${
        data.teacherName
      } )</div><div class="sig-role">ผู้สรุป / ครูผู้สอน</div></div>
      <div class="sig"><div class="sig-line">ลงชื่อ .....................................</div><div>( ${
        data.headName
      } )</div><div class="sig-role">หัวหน้าแผนกวิชา</div></div>
    </div>
  </div>`;

  return wrapHtmlDocument(body);
}
