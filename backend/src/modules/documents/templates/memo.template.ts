import { fmt, bahtText, thaiDateLong } from "../../../lib/bahtText";
import { wrapHtmlDocument } from "../paperStyles";

// อ้างอิงจาก "บันทึกข้อความใบผ่านแผน.pdf" (ตัวอย่างจริงของวิทยาลัย) — ระบบนี้
// ทำได้แค่จัดซื้อวัสดุฝึก จึงติ๊ก "จัดซื้อ" ตายตัวเสมอ ไม่ต้องมี field ให้เลือก
// ช่องทำเครื่องหมายอื่น (ครุภัณฑ์/จัดจ้าง/อนุมัติเบิกจ่าย) ปล่อยว่างเหมือนฟอร์ม
// เปล่า ส่วนครึ่งล่างของฟอร์ม (ความเห็นหัวหน้างานวางแผนฯ, รองผู้อำนวยการฝ่าย
// ทรัพยากร, คำสั่งผู้อำนวยการ, ผู้รับเอกสาร) เป็นขั้นตอนที่เกิดขึ้นหลังพิมพ์แล้ว
// เท่านั้น จึงคงไว้เป็นช่องว่างให้กรอกด้วยลายมือตามกระดาษจริง ไม่ derive ข้อมูล
// มาเติมเอง
interface MemoData {
  college: string;
  docNumber: string;
  docDate: Date;
  term: string;
  year: string;
  teacherName: string;
  departmentName: string;
  projectRef: string;
  dateRangeText: string;
  totalAmount: number;
  headName: string;
  deputyAcademicName: string;
}

const MEMO_STYLE = `
  .memo-sheet { font-size: 13px; line-height: 1.7; }
  .memo-topbox { float: right; width: 190px; border: 1px solid #333; padding: 6px 8px; font-size: 11.5px; margin-bottom: 8px; }
  .memo-topbox div { margin-bottom: 10px; border-bottom: 1px dotted #999; }
  .memo-title { text-align: center; font-size: 20px; font-weight: 700; padding-top: 6px; margin-bottom: 18px; }
  .memo-row { margin-bottom: 6px; clear: both; }
  .memo-row .u { border-bottom: 1px dotted #999; padding: 0 4px; }
  .chk { display: inline-block; width: 12px; height: 12px; border: 1px solid #333; text-align: center; line-height: 11px; font-size: 10px; font-weight: 700; margin: 0 3px 0 10px; }
  .chk:first-child { margin-left: 0; }
  .memo-sign { margin-top: 26px; }
  .memo-sign-line { margin-bottom: 16px; padding-left: 60px; }
  .memo-bottom { display: flex; border: 1px solid #333; margin-top: 18px; font-size: 11.5px; }
  .memo-bottom .col { width: 50%; padding: 10px 12px; }
  .memo-bottom .col + .col { border-left: 1px solid #333; }
  .memo-bottom .h { font-weight: 700; margin-bottom: 8px; }
  .memo-bottom .line { margin-bottom: 10px; }
  .memo-sub { border-top: 1px solid #333; margin-top: 14px; padding-top: 10px; }
  .memo-blank-sig { text-align: center; margin-top: 30px; font-size: 11.5px; }
`;

export function renderMemo(data: MemoData): string {
  const dateStr = thaiDateLong(data.docDate);
  const purpose = `วัสดุฝึก ภาคเรียนที่ ${data.term} ปีการศึกษา ${data.year}`;

  const body = `
    <style>${MEMO_STYLE}</style>
    <div class="sheet memo-sheet">
      <div class="memo-topbox">
        <div>งานวางแผนและงบประมาณ</div>
        <div>เอกสารเลขที่ .....................................</div>
        <div>วันที่ .....................................</div>
        <div style="border-bottom:none">เวลา .....................................</div>
      </div>
      <div class="memo-title">บันทึกข้อความ</div>

      <div class="memo-row">ส่วนราชการ <span class="u">${data.college}</span></div>
      <div class="memo-row">
        ที่ <span class="u">${data.docNumber || "&nbsp;".repeat(10)}</span>
        วันที่ <span class="u">${dateStr}</span>
      </div>
      <div class="memo-row">
        เรื่อง ขออนุมัติ
        <span class="chk">X</span>จัดซื้อ
        <span class="chk"></span>ครุภัณฑ์
        <span class="chk"></span>จัดจ้าง
        <span class="chk"></span>อนุมัติเบิกจ่าย
        <span class="u">${purpose}</span>
      </div>
      <div class="memo-row">เรียน ผู้อำนวยการ${data.college}</div>
      <div class="memo-row">
        ด้วยข้าพเจ้า นาย/นาง/นางสาว <span class="u">${data.teacherName}</span>
        แผนก/งาน <span class="u">${data.departmentName}</span>
      </div>
      <div class="memo-row">
        มีความประสงค์ขออนุมัติ
        <span class="chk"></span>เบิกจ่าย
        <span class="chk">X</span>จัดซื้อ
        <span class="chk"></span>จัดจ้าง
        <span class="u">${purpose}</span>
      </div>
      <div class="memo-row">เพื่อใช้ในโครงการที่ <span class="u">${data.projectRef || "&nbsp;".repeat(30)}</span></div>
      <div class="memo-row">
        ระหว่างวันที่ <span class="u">${data.dateRangeText || "&nbsp;".repeat(20)}</span>
        ณ (สถานที่) <span class="u">${data.college}</span>
      </div>
      <div class="memo-row">
        จำนวนเงิน <span class="u">${fmt(data.totalAmount)}</span> บาท
        ( <span class="u">${bahtText(data.totalAmount)}</span> )
      </div>
      <div class="memo-row">ตามรายละเอียด ใบเสนอราคา/ใบประมาณราคา ที่แนบมาพร้อมนี้</div>
      <div class="memo-row">จึงเรียนมาเพื่อโปรดพิจารณาอนุมัติ</div>

      <div class="memo-sign">
        <div class="memo-sign-line">ลงชื่อ ..................................... ผู้ขออนุมัติ</div>
        <div class="memo-sign-line" style="padding-left:78px">( ${data.teacherName} )</div>
        <div class="memo-sign-line">ลงชื่อ ..................................... หัวหน้าแผนกวิชา/งาน ${data.departmentName}</div>
        <div class="memo-sign-line" style="padding-left:78px">( ${data.headName} )</div>
        <div class="memo-sign-line">ลงชื่อ ..................................... รองผู้อำนวยการ ฝ่ายวิชาการ</div>
        <div class="memo-sign-line" style="padding-left:78px">( ${data.deputyAcademicName} )</div>
      </div>

      <div class="memo-bottom">
        <div class="col">
          <div class="h">1. ความเห็นหัวหน้างานวางแผนและงบประมาณ</div>
          <div class="line"><span class="chk"></span>มีอยู่ในแผน &nbsp; <span class="chk"></span>ไม่มีอยู่ในแผน</div>
          <div class="line">
            งบประมาณ
            <span class="chk"></span>ปวช. <span class="chk"></span>ปวส.
            <span class="chk"></span>ระยะสั้น <span class="chk"></span>วิจัย
          </div>
          <div class="line">เงินอุดหนุนทั่วไป – ขั้นพื้นฐาน 15 ปี</div>
          <div class="line"><span class="chk"></span>ค่าจัดการเรียนการสอน &nbsp; <span class="chk"></span>ค่ากิจกรรมพัฒนาผู้เรียน</div>
          <div class="line"><span class="chk"></span>ค่าหนังสือเรียน &nbsp; <span class="chk"></span>ค่าอุปกรณ์การเรียน &nbsp; <span class="chk"></span>ค่าเครื่องแบบฯ</div>
          <div class="line"><span class="chk"></span>รายได้สถานศึกษา &nbsp; <span class="chk"></span>อื่นๆ .....................................</div>
          <div class="line">แหล่งของเงิน .....................................</div>
          <div class="line">รหัส .....................................</div>
          <div class="line">หมวดรายจ่าย .....................................</div>
          <div class="line">หมวดรายจ่ายย่อย .....................................</div>
          <div class="line">หมวดรายจ่ายปลีกย่อย .....................................</div>
          <div class="line">งบประมาณที่ได้รับจัดสรร .....................................</div>
          <div class="line">ยอดคงเหลือยกมา .....................................</div>
          <div class="line">ยอดเงินเสนอครั้งนี้ .....................................</div>
          <div class="line">ยอดเงินคงเหลือ .....................................</div>
          <div class="memo-blank-sig">
            .....................................<br />
            ( &nbsp; )<br />
            หัวหน้างานวางแผนและงบประมาณ<br />
            วันที่ .....................................
          </div>
        </div>
        <div class="col">
          <div class="h">2. ความเห็นรองผู้อำนวยการฝ่ายบริหารทรัพยากร</div>
          <div class="line"><span class="chk"></span>เพื่อโปรดพิจารณาอนุมัติ &nbsp; <span class="chk"></span>ความเห็นอื่น</div>
          <div class="line">.....................................................................................</div>
          <div class="memo-blank-sig">
            .....................................<br />
            ( &nbsp; )<br />
            รองผู้อำนวยการวิทยาลัย ฝ่ายแผนงานและความร่วมมือ<br />
            วันที่ .....................................
          </div>
          <div class="memo-sub">
            <div class="h">คำสั่ง</div>
            <div class="line">.....................................................................................</div>
            <div class="line">.....................................................................................</div>
            <div class="memo-blank-sig">
              .....................................<br />
              ( &nbsp; )<br />
              ผู้อำนวยการ${data.college}<br />
              วันที่ .....................................
            </div>
          </div>
          <div class="memo-sub">
            <div class="line">ผู้รับเอกสาร (งานพัสดุ/งานการเงิน) .....................................</div>
            <div class="line">วันที่ ..................... เวลา ..................... น.</div>
            <div class="line">เรียน งานการเงิน</div>
            <div class="line">กรุณากรอกจำนวนเงินที่จ่ายจริง ..................................... บาท</div>
            <div class="line">สำเนาส่งคืนงานวางแผนและงบประมาณ</div>
          </div>
        </div>
      </div>
    </div>
  `;

  return wrapHtmlDocument(body);
}
