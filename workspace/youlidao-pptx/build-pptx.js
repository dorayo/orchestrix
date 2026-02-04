const pptxgen = require('pptxgenjs');
const html2pptx = require('/Users/dorayo/.claude/plugins/cache/anthropic-agent-skills/document-skills/69c0b1a06741/skills/pptx/scripts/html2pptx');
const path = require('path');

async function build() {
  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_16x9';
  pptx.author = 'youlidao.ai';
  pptx.title = 'youlidao.ai - AI 驱动的软件公司';

  const slidesDir = path.join(__dirname, 'slides');
  const totalSlides = 17;

  for (let i = 1; i <= totalSlides; i++) {
    const num = String(i).padStart(2, '0');
    const file = path.join(slidesDir, `slide${num}.html`);
    console.log(`Processing slide ${num}...`);
    const { slide, placeholders } = await html2pptx(file, pptx);

    // Slide 13: Add comparison table
    if (i === 13 && placeholders.length > 0) {
      const p = placeholders[0];
      const hdrOpts = { fill: { color: '6C63FF' }, color: 'FFFFFF', bold: true, fontSize: 10, align: 'center', valign: 'middle' };
      const cellOpts = { color: 'A0AEC0', fontSize: 9, align: 'center', valign: 'middle', fill: { color: '141B2D' } };
      const rowOpts = { color: 'F0F6FC', fontSize: 9, align: 'left', valign: 'middle', fill: { color: '141B2D' } };
      const yes = { text: '\u2705', options: { ...cellOpts, color: '3FB950' } };
      const no = { text: '\u274C', options: { ...cellOpts, color: 'F85149' } };
      const warn = { text: '\u26A0\uFE0F', options: { ...cellOpts, color: 'FFB84D' } };

      slide.addTable([
        [
          { text: '', options: hdrOpts },
          { text: 'youlidao', options: hdrOpts },
          { text: 'Cursor', options: hdrOpts },
          { text: 'Copilot', options: hdrOpts },
          { text: 'Replit', options: hdrOpts }
        ],
        [{ text: '\u5B8C\u6574 AI \u56E2\u961F', options: rowOpts }, yes, no, no, no],
        [{ text: '\u5168\u6D41\u7A0B\u8986\u76D6', options: rowOpts }, yes, no, no, warn],
        [{ text: '\u900F\u660E\u53EF\u89C1', options: rowOpts }, yes, warn, no, warn],
        [{ text: '\u67B6\u6784\u8BBE\u8BA1', options: rowOpts }, yes, no, no, no],
        [{ text: '\u8D28\u91CF\u95E8\u7981', options: rowOpts }, yes, no, no, warn],
        [{ text: 'Git \u6DF1\u5EA6\u96C6\u6210', options: rowOpts }, yes, yes, yes, warn],
      ], {
        x: p.x, y: p.y, w: p.w, h: 4.2,
        colW: [2.0, 1.6, 1.3, 1.3, 1.3],
        rowH: [0.45, 0.55, 0.55, 0.55, 0.55, 0.55, 0.55],
        border: { pt: 0.5, color: '1E293B' },
        autoPage: false
      });
    }
  }

  const outPath = path.join(__dirname, 'youlidao-ai-premium.pptx');
  await pptx.writeFile({ fileName: outPath });
  console.log(`\nPresentation saved: ${outPath}`);
}

build().catch(e => { console.error(e); process.exit(1); });
