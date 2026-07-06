// CSS ร่วมของกระดาษ A4 ทุกแบบฟอร์ม (สผ.1.1-1.3, ใบประมาณราคา) — คัดลอกค่าตัวเลข/
// สีมาจาก data-doc-paper ในไฟล์ดีไซน์ต้นแบบ (DTM-DMS.dc.html) ให้ตรงกับที่
// preview บนหน้าจอเป๊ะ ยกเว้นฟอนต์: หน้าจอใช้ "IBM Plex Sans Thai" จาก Google
// Fonts แต่ตอน render PDF ฝั่ง backend ไม่มีอินเทอร์เน็ตใน container (Chromium
// รันแบบ offline) จึงใช้ฟอนต์ไทยที่ติดตั้งไว้ในระบบผ่าน apt (fonts-thai-tlwg)
// แทน — หน้าตาใกล้เคียงกันมากพอสำหรับเอกสารราชการ แต่จะไม่ตรงเป๊ะกับหน้าจอ
export const A4_WIDTH_PX = 794;

export const PAPER_STYLE = `
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: 'TlwgTypo', 'Loma', 'Garuda', sans-serif;
    color: #1a1a1a;
    background: #fff;
  }
  .sheet {
    width: ${A4_WIDTH_PX}px;
    padding: 44px 50px;
    page-break-after: always;
  }
  .sheet:last-child { page-break-after: auto; }
  .doc-code { text-align: right; font-size: 12px; color: #666; margin-bottom: 2px; }
  .doc-college { text-align: center; font-size: 18px; font-weight: 700; line-height: 1.35; }
  .doc-title { text-align: center; font-size: 15.5px; font-weight: 600; margin-bottom: 2px; }
  .doc-subtitle { text-align: center; font-size: 13.5px; color: #444; margin-bottom: 14px; }
  .doc-meta-row { display: flex; gap: 28px; font-size: 13.5px; margin-bottom: 8px; justify-content: center; color: #333; }
  .doc-summary { font-size: 13.5px; margin-bottom: 14px; color: #333; }
  table.doc-table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
  table.doc-table th { border: 1px solid #b9c4d4; padding: 7px 6px; background: #eef4fb; }
  table.doc-table td { border: 1px solid #cdd6e2; padding: 6px; }
  table.doc-table td.right { text-align: right; padding: 6px 8px; }
  table.doc-table td.center { text-align: center; }
  table.doc-table tr.total-row { background: #f6f8fb; font-weight: 700; }
  table.doc-table tr.total-row td { border: 1px solid #b9c4d4; padding: 7px 8px; }
  .doc-total-text { font-size: 13px; margin-top: 8px; }
  .doc-signatures { display: flex; justify-content: space-around; margin-top: 44px; font-size: 13px; text-align: center; }
  .doc-signatures .sig { width: 44%; }
  .doc-signatures .sig-line { margin-bottom: 22px; }
  .doc-signatures .sig-role { color: #666; }
  .doc-note { text-align: right; font-size: 11.5px; color: #999; margin-top: 10px; }
`;

export function wrapHtmlDocument(bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="utf-8" />
<style>${PAPER_STYLE}</style>
</head>
<body>${bodyHtml}</body>
</html>`;
}
