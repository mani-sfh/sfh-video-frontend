import type { Exercise } from './supabase';
import type { TemplateMetadata } from './templateParser';

// ============================================
// MemberVault Inline Code Generator
// ============================================
// Produces a self-contained MV code block:
//   - Routine header with badges
//   - Vimeo video embed (placeholder URL)
//   - 1-Week Progress Tracker PDF button (blob-to-new-tab)
//
// Paste output below the existing carousel in MemberVault.
// All styles inline. All handlers via onclick. 14px minimum.
// ============================================

function esc(text: string): string {
  return (text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function jsStr(text: string): string {
  return (text || '')
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\n/g, ' ');
}

// ============================================
// TRACKER PDF GENERATOR (runs in browser)
// ============================================

interface TrackerRow {
  name: string;
  side: 'right' | 'left' | null;
  img: string;
  timing: string;
  cue: string;
  instruction: string;
}

function buildTrackerRows(exercises: Exercise[]): TrackerRow[] {
  const rows: TrackerRow[] = [];

  for (const ex of exercises) {
    if (ex.bilateral === 'yes') {
      rows.push({
        name: ex.name,
        side: 'right',
        img: ex.right_image_url || ex.main_image_url || '',
        timing: ex.time_display || `${ex.duration_minutes || 1} min`,
        cue: ex.coaching_cue || '',
        instruction: ex.full_instruction || '',
      });
      rows.push({
        name: ex.name,
        side: 'left',
        img: ex.left_image_url || ex.main_image_url || '',
        timing: ex.time_display || `${ex.duration_minutes || 1} min`,
        cue: '',
        instruction: '',
      });
    } else {
      rows.push({
        name: ex.name,
        side: null,
        img: ex.main_image_url || '',
        timing: ex.time_display || `${ex.duration_minutes || 1} min`,
        cue: ex.coaching_cue || '',
        instruction: ex.full_instruction || '',
      });
    }
  }

  return rows;
}

function generateTrackerScript(
  exercises: Exercise[],
  routineName: string,
  totalTime: number,
  dailyCue: string,
  duration: string
): string {
  const rows = buildTrackerRows(exercises);

  const rowsJS = rows
    .map(
      (r) =>
        `  { name: '${jsStr(r.name)}', side: ${r.side ? "'" + r.side + "'" : 'null'}, img: '${jsStr(r.img)}', timing: '${jsStr(r.timing)}', cue: '${jsStr(r.cue)}', instruction: '${jsStr(r.instruction)}' }`
    )
    .join(',\n');

  return `
function generateTracker() {
  var dayTitle = '${jsStr(routineName)}';
  var dailyCue = '${jsStr(dailyCue)}';
  var duration = '${jsStr(duration)}';
  var rows = [
${rowsJS}
  ];
  var totalRows = rows.length;
  var dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  var trackerTitle = '\\u201C' + dayTitle + '\\u201D 1-Week Tracker';
  var continuedTitle = '\\u201C' + dayTitle + '\\u201D (continued)';

  var pageHdrHTML = '<div style="background:linear-gradient(135deg,#0C115B 0%,#A61E51 100%);padding:8px 14px;text-align:center;margin-bottom:12px;border-radius:6px;-webkit-print-color-adjust:exact;print-color-adjust:exact;"><span style="color:#fff;font-family:Petrona,Georgia,serif;font-size:10pt;font-weight:600;letter-spacing:2px;text-transform:uppercase;">SENIOR FITNESS <span style="color:#FFFBF7;">HUB<\\/span><\\/span><\\/div>';

  var thCSS = 'background:#0C115B;color:#fff;padding:6px 4px;text-align:center;font-size:8.5pt;font-weight:700;border:1px solid #0C115B;-webkit-print-color-adjust:exact;print-color-adjust:exact;';
  var theadHTML = '<thead><tr>'
    + '<th style="' + thCSS + 'text-align:left;padding:6px 8px;">Exercise<\\/th>'
    + '<th style="' + thCSS + 'width:130px;">Timing<\\/th>'
    + '<th style="' + thCSS + 'width:32px;">D1<\\/th>'
    + '<th style="' + thCSS + 'width:32px;">D2<\\/th>'
    + '<th style="' + thCSS + 'width:32px;">D3<\\/th>'
    + '<th style="' + thCSS + 'width:32px;">D4<\\/th>'
    + '<th style="' + thCSS + 'width:32px;">D5<\\/th>'
    + '<th style="' + thCSS + 'width:32px;">D6<\\/th>'
    + '<th style="' + thCSS + 'width:32px;">D7<\\/th>'
    + '<\\/tr><\\/thead>';

  var checkboxCells = '';
  for (var dc = 0; dc < 7; dc++) {
    checkboxCells += '<td style="padding:5px 2px;border:1px solid #e0e0e0;text-align:center;font-size:14pt;color:#0C115B;width:32px;">\\u2610<\\/td>';
  }

  function makeRow(r, evenRow) {
    var bg = evenRow ? '#ffffff' : '#f5f5f5';
    var exName = r.name;
    if (r.side) exName += ' \\u2014 ' + (r.side === 'right' ? 'Right' : 'Left');
    var cueHTML = '';
    var instructionHTML = '';
    if (r.cue) {
      cueHTML = '<div style="margin-top:4px;padding:3px 8px;background:#FDF2F4;border-radius:4px;display:inline-block;"><span style="font-family:Petrona,Georgia,serif;font-size:9.5pt;font-weight:600;color:#A61E51;">' + r.cue + '<\\/span><\\/div>';
    }
    if (r.instruction) {
      instructionHTML = '<p style="margin:4px 0 0 0;font-size:14px;color:#222;line-height:1.4;font-weight:600;">' + r.instruction + '<\\/p>';
    }
    return '<tr style="background:' + bg + ';-webkit-print-color-adjust:exact;print-color-adjust:exact;">'
      + '<td style="padding:5px 8px;border:1px solid #e0e0e0;vertical-align:top;">'
      + '<div>'
      + '<span style="font-size:10pt;font-weight:700;color:#0C115B;display:block;">' + exName + '<\\/span>'
      + cueHTML + instructionHTML
      + '<\\/div><\\/td>'
      + '<td style="padding:5px 4px;border:1px solid #e0e0e0;text-align:center;font-size:8.5pt;font-weight:600;width:150px;vertical-align:top;">'
      + '<img src="' + r.img + '" alt="" style="width:120px;height:auto;max-width:100%;border-radius:4px;display:block;margin:0 auto 4px auto;">'
      + r.timing
      + '<\\/td>'
      + checkboxCells
      + '<\\/tr>';
  }

  var html = '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">'
    + '<title>' + dayTitle + ' - 1-Week Tracker - Senior Fitness Hub<\\/title>'
    + '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Petrona:wght@400;600;700;800&family=Quicksand:wght@500;600;700&display=swap">'
    + '<style>'
    + '@page{size:letter portrait;margin:0.4in 0.5in 0.9in 0.5in}'
    + 'thead{display:table-header-group}'
    + 'tfoot{display:table-footer-group}'
    + '.pdf-footer{background:#0C115B;color:#FFFBF7;text-align:center;padding:8px 14px;-webkit-print-color-adjust:exact;print-color-adjust:exact;border-radius:0 0 8px 8px;margin-top:8px}'
    + '.pdf-footer p{margin:0;font-size:8pt;line-height:1.4}'
    + '@media print{.no-print{display:none!important}.page-container+.page-container{page-break-before:always}body{-webkit-print-color-adjust:exact;print-color-adjust:exact}tfoot{display:table-footer-group}tr{page-break-inside:avoid}.pdf-footer{position:fixed;bottom:0;left:0;right:0;width:100%;border-radius:0;margin-top:0}}'
    + 'body{font-family:Quicksand,sans-serif;font-weight:500;color:#1a1a1a;max-width:7.5in;margin:0 auto;padding:16px}'
    + 'table{width:100%;border-collapse:collapse}'
    + 'thead{background:#0C115B;color:#fff;font-size:8pt;font-weight:700}'
    + '.page-container{position:relative}'
    + '<\\/style><\\/head><body>';

  html += '<div class="no-print" style="text-align:center;margin-bottom:16px;">'
    + '<button onclick="window.print()" style="background:linear-gradient(135deg,#0C115B,#A61E51);color:#fff;border:none;padding:14px 40px;border-radius:10px;font-size:16px;font-weight:700;cursor:pointer;font-family:Quicksand,sans-serif;min-height:48px;">Print / Save as PDF<\\/button>'
    + '<p style="font-size:14px;color:#444;margin:8px 0 0 0;font-weight:600;">Use your browser print dialog to save as PDF or print directly.<\\/p><\\/div>';

  var ROWS_PAGE_1 = 13;
  var ROWS_PER_PAGE = 14;
  var exIndex = 0;
  var pageNum = 0;

  while (exIndex < totalRows) {
    pageNum++;
    html += '<div class="page-container">';
    var rowsThisPage;

    if (pageNum === 1) {
      html += '<div style="background:linear-gradient(135deg,#0C115B 0%,#A61E51 100%);padding:12px 20px;border-radius:10px;text-align:center;margin-bottom:10px;-webkit-print-color-adjust:exact;print-color-adjust:exact;">'
        + '<p style="font-size:9pt;color:rgba(255,255,255,0.8);text-transform:uppercase;letter-spacing:2px;margin:0 0 3px 0;font-weight:700;">' + dayTitle + '<\\/p>'
        + '<h1 style="font-family:Petrona,Georgia,serif;font-size:18pt;color:#ffffff;margin:0 0 3px 0;font-weight:700;">' + trackerTitle + '<\\/h1>'
        + '<p style="font-size:9pt;color:rgba(255,255,255,0.9);margin:0;font-weight:500;">Created: ' + dateStr + ' \\u00B7 ' + totalRows + ' exercises \\u00B7 ' + duration + '<\\/p><\\/div>';
      html += '<div style="background:#e8f5e9;border-left:4px solid #1b5e20;padding:8px 12px;border-radius:0 8px 8px 0;margin-bottom:10px;">'
        + '<p style="font-size:9.5pt;font-weight:700;color:#1b5e20;margin:0 0 3px 0;">How to use this tracker<\\/p>'
        + '<p style="font-size:9pt;color:#333;margin:0;line-height:1.35;">Check off each exercise as you complete it each day. Your goal is consistency \\u2014 aim to complete your routine at least 5 of 7 days. Notice how your confidence and steadiness improve over the week.<\\/p><\\/div>';
      rowsThisPage = Math.min(ROWS_PAGE_1, totalRows - exIndex);
    } else {
      html += pageHdrHTML;
      html += '<p style="font-size:10pt;font-weight:700;color:#0C115B;margin:0 0 10px 0;">' + continuedTitle + '<\\/p>';
      rowsThisPage = Math.min(ROWS_PER_PAGE, totalRows - exIndex);
    }

    var tfootHTML = '<tfoot><tr><td colspan="9" style="height:60px;border:none;padding:0;"><\\/td><\\/tr><\\/tfoot>';
    html += '<table>' + theadHTML + '<tbody>';

    for (var r = 0; r < rowsThisPage; r++) {
      html += makeRow(rows[exIndex], exIndex % 2 === 0);
      exIndex++;
    }
    html += '<\\/tbody>' + tfootHTML + '<\\/table>';

    if (exIndex >= totalRows) {
      html += '<div style="display:flex;justify-content:space-between;padding:10px 14px;background:#f5f5f5;border:1px solid #e0e0e0;border-top:none;border-radius:0 0 8px 8px;font-size:10pt;margin-bottom:14px;-webkit-print-color-adjust:exact;print-color-adjust:exact;">'
        + '<span><strong>Goal: <\\/strong>Complete all ' + totalRows + ' exercises daily<\\/span>'
        + '<span><strong>Your Cue: <\\/strong>\\u201C' + dailyCue + '\\u201D<\\/span>'
        + '<\\/div>';
    }
    html += '<\\/div>';
  }

  html += '<div class="pdf-footer">'
    + '<p>\\u00A9 Senior Fitness Hub 2026 \\u00B7 All Rights Reserved<\\/p>'
    + '<p style="font-family:Petrona,Georgia,serif;margin:2px 0 0 0;">Practice with purpose. Move with confidence. Live with independence.<\\/p>'
    + '<p style="margin:2px 0 0 0;font-size:7pt;color:rgba(255,255,251,0.7);">For educational purposes only. Not a substitute for professional medical advice.<\\/p>'
    + '<\\/div>';

  html += '<\\/body><\\/html>';
  var blob = new Blob([html], { type: 'text/html' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
}`;
}

// ============================================
// MAIN GENERATOR
// ============================================

export function generateMVCode(
  playlist: Exercise[],
  routineName: string,
  totalTime: number,
  templateData: TemplateMetadata | null
): string {
  const exerciseCount = playlist.length;
  const duration = `~${totalTime} minutes`;
  const level = templateData?.level || '';
  const subtitle = templateData?.subtitle || '';
  const condition = templateData?.condition || '';
  const dailyCue = condition || 'Practice with purpose';

  // Count tracker rows (bilateral = 2)
  let trackerRows = 0;
  for (const ex of playlist) {
    trackerRows += ex.bilateral === 'yes' ? 2 : 1;
  }

  // Level badge (only if provided)
  const levelBadge = level
    ? `\n      <span style="background: linear-gradient(135deg, #0C115B, #A61E51); color: white; padding: 8px 16px; border-radius: 20px; font-size: 15px; font-weight: 700;">${esc(level)}</span>`
    : '';

  // Condition tag (only if provided)
  const conditionTag = condition
    ? `\n      <span style="background: #0F766E; color: white; padding: 8px 16px; border-radius: 20px; font-size: 15px; font-weight: 700;">${esc(condition)}</span>`
    : '';

  // Subtitle line (only if provided)
  const subtitleLine = subtitle
    ? `\n    <p style="color: #444; font-size: 16px; line-height: 1.6; margin: 0 0 12px 0; font-weight: 600;">${esc(subtitle)}</p>`
    : '';

  const html = `<!-- ═══════════════════════════════════════════════════════════════════════ -->
<!-- FOLLOW-ALONG VIDEO + PROGRESS TRACKER                                 -->
<!-- ${routineName}                                                        -->
<!-- Paste this BELOW the existing carousel in MemberVault                 -->
<!-- Generated: ${new Date().toISOString().split('T')[0]} | ${exerciseCount} exercises | ${trackerRows} tracker rows -->
<!-- ═══════════════════════════════════════════════════════════════════════ -->

<p></p>
<div style="font-family: 'Quicksand', 'Segoe UI', sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background: #FFFBF7; font-weight: 600;">

  <!-- ──────────────────────────────────────── -->
  <!-- ROUTINE VIDEO HEADER                     -->
  <!-- ──────────────────────────────────────── -->
  <div style="text-align: center; margin-bottom: 20px;">
    <h2 style="font-family: 'Petrona', Georgia, serif; color: #0C115B; font-size: 26px; margin: 0 0 8px 0;">Follow-Along Video</h2>${subtitleLine}
    <div style="display: flex; justify-content: center; gap: 8px; flex-wrap: wrap; margin-top: 10px;">
      <span style="background: linear-gradient(135deg, #0C115B, #A61E51); color: white; padding: 8px 16px; border-radius: 20px; font-size: 15px; font-weight: 700;">${exerciseCount} Exercises</span>
      <span style="background: linear-gradient(135deg, #0C115B, #A61E51); color: white; padding: 8px 16px; border-radius: 20px; font-size: 15px; font-weight: 700;">${esc(duration)}</span>${levelBadge}${conditionTag}
    </div>
  </div>

  <!-- ──────────────────────────────────────── -->
  <!-- VIMEO VIDEO EMBED                        -->
  <!-- Replace the src below with your Vimeo    -->
  <!-- player embed URL, e.g.:                  -->
  <!-- https://player.vimeo.com/video/123456789 -->
  <!-- ──────────────────────────────────────── -->
  <div style="margin-bottom: 16px;">
    <div style="background: linear-gradient(135deg, #0C115B, #A61E51); color: white; padding: 10px 16px; border-radius: 12px 12px 0 0; text-align: center;">
      <p style="margin: 0; font-size: 17px; font-weight: 700; font-family: 'Petrona', Georgia, serif;">Press Play</p>
    </div>
    <div style="position: relative; padding-bottom: 56.25%; height: 0; background: #000;">
      <iframe src="https://player.vimeo.com/video/YOUR_VIDEO_ID_HERE?badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;" allowfullscreen></iframe>
    </div>
    <div style="background: #f5f5f5; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 12px 12px; padding: 10px 16px; text-align: center;">
      <p style="margin: 0; font-size: 15px; color: #444; font-weight: 600;">Pause anytime you need. Your pace, your practice.</p>
    </div>
  </div>

  <!-- NOTE ABOUT VIDEO LENGTH -->
  <div style="background: #e3f2fd; border-left: 4px solid #0d47a1; border-radius: 0 10px 10px 0; padding: 14px 16px; margin-bottom: 24px;">
    <p style="margin: 0; font-size: 15px; color: #0d47a1; font-weight: 700; line-height: 1.6;">Follow-along videos are longer because they include video instructions for every exercise. Once you know the exercises, you can be done in under 10 minutes using the PDF tracker below.</p>
  </div>

  <!-- ──────────────────────────────────────── -->
  <!-- 1-WEEK PROGRESS TRACKER (PDF download)   -->
  <!-- ──────────────────────────────────────── -->
  <div style="background: #FFFFFF; border: 1.5px solid #e0e0e0; border-radius: 10px; padding: 12px 14px; text-align: center;">
    <p style="font-size: 15px; font-weight: 700; color: #0C115B; margin: 0 0 8px 0;">Print your tracker and follow along!</p>
    <button onclick="generateTracker()" style="background: linear-gradient(135deg, #0C115B 0%, #A61E51 100%); border: none; color: #ffffff; padding: 12px 24px; border-radius: 10px; font-size: 15px; font-weight: 700; cursor: pointer; font-family: 'Quicksand', sans-serif; min-height: 44px; width: 100%; max-width: 380px; line-height: 1.5;">
      <span style="display: block; font-size: 15px; font-weight: 700;">&#x2193; Download 1-Week Progress Tracker</span>
      <span style="display: block; font-size: 14px; font-weight: 600; margin-top: 2px; opacity: 0.9;">Best on desktop &mdash; print or save to your computer</span>
    </button>
  </div>

</div>

<script>
${generateTrackerScript(playlist, routineName, totalTime, dailyCue, duration)}
<\/script>`;

  return html;
}
