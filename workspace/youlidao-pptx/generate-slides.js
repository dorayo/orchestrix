const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, 'slides');

const C = {
  bg: '#0B0F19', surface: '#141B2D', surfaceLight: '#1A2238',
  primary: '#6C63FF', cyan: '#00D2FF', gold: '#FFB84D',
  red: '#F85149', green: '#3FB950',
  text: '#FFFFFF', textSub: '#A0AEC0', textDim: '#5A6578',
  border: '#1E293B', borderLight: '#2D3748'
};

function slide(body, bgImage = 'bg-content.png') {
  return `<!DOCTYPE html><html><head><style>
html{background:${C.bg}}
body{width:720pt;height:405pt;margin:0;padding:0;font-family:Arial,sans-serif;display:flex;flex-direction:column;position:relative;overflow:hidden;background-image:url('../assets/${bgImage}');background-size:cover;background-position:center}
</style></head><body>${body}</body></html>`;
}

// ── SLIDE 1: COVER ──
const s01 = slide(`
<div style="position:absolute;top:0;left:0;width:100%;height:100%">
  <img src="../assets/glow-cover.png" style="width:100%;height:100%;position:absolute;top:0;left:0">
  <img src="../assets/grid.png" style="width:100%;height:100%;position:absolute;top:0;left:0;opacity:0.3">
</div>
<div style="position:absolute;top:0;left:0;width:4pt;height:100%;background:${C.primary}"></div>
<div style="margin:60pt 0 0 65pt;position:relative">
  <div style="display:flex;align-items:center;margin-bottom:8pt">
    <div style="width:8pt;height:8pt;border-radius:50%;background:${C.cyan};margin-right:10pt"></div>
    <p style="color:${C.cyan};font-size:11pt;letter-spacing:3pt;margin:0">YOULIDAO.AI</p>
  </div>
  <h1 style="color:${C.text};font-size:42pt;margin:10pt 0 0 0;font-weight:bold;letter-spacing:-1pt">AI 驱动的软件公司</h1>
  <div style="margin-top:16pt;margin-bottom:20pt"><img src="../assets/accent-gold.png" style="width:120pt;height:3pt"></div>
  <p style="color:${C.textSub};font-size:16pt;margin:0;line-height:1.6">9 位专业 AI 工程师组成的团队</p>
  <p style="color:${C.textSub};font-size:16pt;margin:4pt 0 0 0;line-height:1.6">实时为你开发软件，全程透明可见</p>
</div>
<div style="position:absolute;bottom:30pt;left:65pt;display:flex;align-items:center">
  <div style="width:6pt;height:6pt;border-radius:50%;background:${C.green};margin-right:8pt"></div>
  <p style="color:${C.textDim};font-size:9pt;margin:0">CONSTRUCTION CENTER  |  READY</p>
</div>`, 'bg-cover.png');

// ── SLIDE 2: THE PAIN ──
const s02 = slide(`
<div style="position:absolute;top:0;left:0;width:100%;height:100%">
  <img src="../assets/grid.png" style="width:100%;height:100%;position:absolute;top:0;left:0;opacity:0.15">
</div>
<div style="margin:45pt 55pt 0 55pt;position:relative">
  <p style="color:${C.red};font-size:10pt;letter-spacing:3pt;margin:0">THE PROBLEM</p>
  <h1 style="color:${C.text};font-size:32pt;margin:8pt 0 0 0">软件开发，为什么这么痛？</h1>
  <div style="margin-top:8pt"><img src="../assets/accent-gold.png" style="width:80pt;height:2pt"></div>
</div>
<div style="display:flex;margin:30pt 55pt 0 55pt;gap:20pt;position:relative">
  <div style="flex:1;background:${C.surface};border:1pt solid ${C.border};border-radius:8pt;padding:22pt 18pt;border-top:3pt solid ${C.red}">
    <h2 style="color:${C.red};font-size:28pt;margin:0;font-weight:bold">200万+</h2>
    <p style="color:${C.gold};font-size:11pt;margin:6pt 0 0 0;font-weight:bold">年均人力成本</p>
    <p style="color:${C.textSub};font-size:10pt;margin:8pt 0 0 0;line-height:1.5">一个 5 人技术团队的年薪、社保、管理成本</p>
  </div>
  <div style="flex:1;background:${C.surface};border:1pt solid ${C.border};border-radius:8pt;padding:22pt 18pt;border-top:3pt solid ${C.gold}">
    <h2 style="color:${C.gold};font-size:28pt;margin:0;font-weight:bold">3-6 个月</h2>
    <p style="color:${C.gold};font-size:11pt;margin:6pt 0 0 0;font-weight:bold">平均交付周期</p>
    <p style="color:${C.textSub};font-size:10pt;margin:8pt 0 0 0;line-height:1.5">从需求确认到 MVP 上线的漫长等待</p>
  </div>
  <div style="flex:1;background:${C.surface};border:1pt solid ${C.border};border-radius:8pt;padding:22pt 18pt;border-top:3pt solid ${C.primary}">
    <h2 style="color:${C.primary};font-size:28pt;margin:0;font-weight:bold">80%</h2>
    <p style="color:${C.gold};font-size:11pt;margin:6pt 0 0 0;font-weight:bold">非编码时间</p>
    <p style="color:${C.textSub};font-size:10pt;margin:8pt 0 0 0;line-height:1.5">沟通、会议、返工、等待确认消耗大量时间</p>
  </div>
</div>
<div style="margin:22pt 55pt 0 55pt;position:relative">
  <p style="color:${C.textDim};font-size:10pt;margin:0;text-align:center">传统软件开发中，写代码只占总时间的 20%，剩下的 80% 都在沟通和返工</p>
</div>`, 'bg-pain.png');

// ── SLIDE 3: THE GAP ──
const s03 = slide(`
<div style="position:absolute;top:0;left:0;width:100%;height:100%">
  <img src="../assets/grid.png" style="width:100%;height:100%;position:absolute;top:0;left:0;opacity:0.15">
</div>
<div style="margin:45pt 55pt 0 55pt;position:relative">
  <p style="color:${C.cyan};font-size:10pt;letter-spacing:3pt;margin:0">MARKET GAP</p>
  <h1 style="color:${C.text};font-size:30pt;margin:8pt 0 0 0">现有 AI 工具，只解决了冰山一角</h1>
  <div style="margin-top:8pt"><img src="../assets/accent-cyan.png" style="width:80pt;height:2pt"></div>
</div>
<div style="margin:25pt 55pt 0 55pt;position:relative">
  <div style="display:flex;height:50pt;border-radius:6pt;overflow:hidden;margin-bottom:12pt">
    <div style="width:15%;background:#2D1B3D;display:flex;align-items:center;justify-content:center"><p style="color:${C.textSub};font-size:8pt;margin:0;text-align:center">需求<br>分析</p></div>
    <div style="width:13%;background:#2A1B3A;display:flex;align-items:center;justify-content:center"><p style="color:${C.textSub};font-size:8pt;margin:0;text-align:center">产品<br>设计</p></div>
    <div style="width:12%;background:#271A37;display:flex;align-items:center;justify-content:center"><p style="color:${C.textSub};font-size:8pt;margin:0;text-align:center">UI/UX<br>设计</p></div>
    <div style="width:13%;background:#241934;display:flex;align-items:center;justify-content:center"><p style="color:${C.textSub};font-size:8pt;margin:0;text-align:center">架构<br>规划</p></div>
    <div style="width:20%;background:${C.primary};display:flex;align-items:center;justify-content:center;border:2pt solid ${C.cyan}"><p style="color:${C.text};font-size:9pt;margin:0;font-weight:bold;text-align:center">编码实现</p></div>
    <div style="width:14%;background:#241934;display:flex;align-items:center;justify-content:center"><p style="color:${C.textSub};font-size:8pt;margin:0;text-align:center">测试<br>验收</p></div>
    <div style="width:13%;background:#271A37;display:flex;align-items:center;justify-content:center"><p style="color:${C.textSub};font-size:8pt;margin:0;text-align:center">部署<br>运维</p></div>
  </div>
  <div style="display:flex;justify-content:center;margin-bottom:18pt">
    <p style="color:${C.cyan};font-size:9pt;margin:0">Cursor / Copilot / Replit 只覆盖高亮部分</p>
  </div>
</div>
<div style="margin:0 55pt;background:${C.surface};border:1pt solid ${C.border};border-radius:8pt;padding:20pt 25pt;border-left:3pt solid ${C.gold}">
  <p style="color:${C.gold};font-size:12pt;margin:0;font-weight:bold">市场需要什么？</p>
  <p style="color:${C.text};font-size:15pt;margin:10pt 0 0 0;line-height:1.5">一个覆盖<b>完整软件开发生命周期</b>的 AI 解决方案</p>
  <p style="color:${C.textSub};font-size:10pt;margin:6pt 0 0 0">不只是写代码，而是从需求分析到测试部署的全流程 AI 协作</p>
</div>`, 'bg-content.png');

// ── SLIDE 4: THE SOLUTION ──
const s04 = slide(`
<div style="position:absolute;top:0;left:0;width:100%;height:100%">
  <img src="../assets/glow-cover.png" style="width:100%;height:100%;position:absolute;top:0;left:0;opacity:0.5">
  <img src="../assets/grid.png" style="width:100%;height:100%;position:absolute;top:0;left:0;opacity:0.2">
</div>
<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;position:relative">
  <p style="color:${C.primary};font-size:10pt;letter-spacing:4pt;margin:0">OUR SOLUTION</p>
  <h1 style="color:${C.text};font-size:36pt;margin:12pt 0 0 0;text-align:center">全球首个「透明 AI 软件公司」</h1>
  <div style="margin:14pt 0 25pt 0"><img src="../assets/accent-gold.png" style="width:100pt;height:3pt"></div>
  <div style="display:flex;gap:25pt;margin:0 60pt">
    <div style="flex:1;text-align:center;background:${C.surface};border:1pt solid ${C.border};border-radius:10pt;padding:22pt 16pt">
      <div style="width:40pt;height:40pt;border-radius:50%;background:rgba(108,99,255,0.15);border:1pt solid ${C.primary};margin:0 auto 10pt auto;display:flex;align-items:center;justify-content:center"><p style="color:${C.primary};font-size:18pt;margin:0;font-weight:bold">9</p></div>
      <p style="color:${C.text};font-size:13pt;margin:0;font-weight:bold">完整 AI 团队</p>
      <p style="color:${C.textSub};font-size:9pt;margin:6pt 0 0 0;line-height:1.4">9 位各司其职的 AI 工程师<br>模拟真实软件公司分工</p>
    </div>
    <div style="flex:1;text-align:center;background:${C.surface};border:1pt solid ${C.border};border-radius:10pt;padding:22pt 16pt">
      <div style="width:40pt;height:40pt;border-radius:50%;background:rgba(0,210,255,0.15);border:1pt solid ${C.cyan};margin:0 auto 10pt auto;display:flex;align-items:center;justify-content:center"><p style="color:${C.cyan};font-size:18pt;margin:0;font-weight:bold">8</p></div>
      <p style="color:${C.text};font-size:13pt;margin:0;font-weight:bold">标准化全流程</p>
      <p style="color:${C.textSub};font-size:9pt;margin:6pt 0 0 0;line-height:1.4">从需求分析到测试上线<br>8 步标准工作流</p>
    </div>
    <div style="flex:1;text-align:center;background:${C.surface};border:1pt solid ${C.border};border-radius:10pt;padding:22pt 16pt">
      <div style="width:40pt;height:40pt;border-radius:50%;background:rgba(255,184,77,0.15);border:1pt solid ${C.gold};margin:0 auto 10pt auto;display:flex;align-items:center;justify-content:center"><p style="color:${C.gold};font-size:14pt;margin:0;font-weight:bold">24h</p></div>
      <p style="color:${C.text};font-size:13pt;margin:0;font-weight:bold">透明厨房模式</p>
      <p style="color:${C.textSub};font-size:9pt;margin:6pt 0 0 0;line-height:1.4">实时观看 AI 工作过程<br>每一步都清晰可见</p>
    </div>
  </div>
</div>`, 'bg-cover.png');

// ── SLIDE 5: THE ENGINE ──
const s05 = slide(`
<div style="position:absolute;top:0;left:0;width:100%;height:100%">
  <img src="../assets/grid.png" style="width:100%;height:100%;position:absolute;top:0;left:0;opacity:0.15">
</div>
<div style="margin:38pt 55pt 0 55pt;position:relative">
  <p style="color:${C.primary};font-size:10pt;letter-spacing:3pt;margin:0">ARCHITECTURE</p>
  <h1 style="color:${C.text};font-size:28pt;margin:6pt 0 0 0">Orchestrix 协调引擎</h1>
  <p style="color:${C.textSub};font-size:10pt;margin:4pt 0 0 0">Orchestra（管弦乐团）+ Matrix（矩阵）= 精密协调的 AI 团队</p>
</div>
<div style="margin:20pt 55pt 0 55pt;display:flex;flex-direction:column;gap:10pt;position:relative">
  <div style="background:${C.surface};border:1pt solid ${C.primary};border-radius:8pt;padding:14pt 20pt;display:flex;align-items:center">
    <div style="width:50pt;text-align:center"><p style="color:${C.primary};font-size:10pt;margin:0;font-weight:bold">LAYER 1</p></div>
    <div style="width:2pt;height:32pt;background:${C.border};margin:0 15pt"></div>
    <div style="flex:1">
      <p style="color:${C.text};font-size:13pt;margin:0;font-weight:bold">界面层  |  建造中心工作台</p>
      <p style="color:${C.textSub};font-size:9pt;margin:3pt 0 0 0">三区工作台 + AI 对话界面 + 实时状态面板</p>
    </div>
    <p style="color:${C.textDim};font-size:8pt;margin:0">你看到的一切</p>
  </div>
  <div style="display:flex;justify-content:center"><div style="width:2pt;height:12pt;background:${C.primary};opacity:0.5"></div></div>
  <div style="background:${C.surface};border:1pt solid ${C.cyan};border-radius:8pt;padding:14pt 20pt;display:flex;align-items:center">
    <div style="width:50pt;text-align:center"><p style="color:${C.cyan};font-size:10pt;margin:0;font-weight:bold">LAYER 2</p></div>
    <div style="width:2pt;height:32pt;background:${C.border};margin:0 15pt"></div>
    <div style="flex:1">
      <p style="color:${C.text};font-size:13pt;margin:0;font-weight:bold">流程层  |  Orchestrix 流程引擎</p>
      <p style="color:${C.textSub};font-size:9pt;margin:3pt 0 0 0">标准化工作流 + 质量门禁 + 状态管理 + 文档模板</p>
    </div>
    <p style="color:${C.textDim};font-size:8pt;margin:0">质量保障</p>
  </div>
  <div style="display:flex;justify-content:center"><div style="width:2pt;height:12pt;background:${C.cyan};opacity:0.5"></div></div>
  <div style="background:${C.surface};border:1pt solid ${C.gold};border-radius:8pt;padding:14pt 20pt;display:flex;align-items:center">
    <div style="width:50pt;text-align:center"><p style="color:${C.gold};font-size:10pt;margin:0;font-weight:bold">LAYER 3</p></div>
    <div style="width:2pt;height:32pt;background:${C.border};margin:0 15pt"></div>
    <div style="flex:1">
      <p style="color:${C.text};font-size:13pt;margin:0;font-weight:bold">能力层  |  Claude AI 大模型</p>
      <p style="color:${C.textSub};font-size:9pt;margin:3pt 0 0 0">理解语言 + 推理逻辑 + 生成代码 + 质量审查</p>
    </div>
    <p style="color:${C.textDim};font-size:8pt;margin:0">智能核心</p>
  </div>
</div>`, 'bg-content.png');

// ── SLIDE 6: THE TEAM ──
function teamCard(icon, role, desc, color) {
  return `<div style="flex:1;background:${C.surface};border:1pt solid ${C.border};border-radius:6pt;padding:10pt 8pt;text-align:center;border-top:2pt solid ${color}">
    <p style="color:${color};font-size:14pt;margin:0">${icon}</p>
    <p style="color:${C.text};font-size:9pt;margin:4pt 0 0 0;font-weight:bold">${role}</p>
    <p style="color:${C.textSub};font-size:7pt;margin:3pt 0 0 0;line-height:1.3">${desc}</p>
  </div>`;
}
const s06 = slide(`
<div style="position:absolute;top:0;left:0;width:100%;height:100%">
  <img src="../assets/grid.png" style="width:100%;height:100%;position:absolute;top:0;left:0;opacity:0.12">
</div>
<div style="margin:35pt 45pt 0 45pt;position:relative">
  <p style="color:${C.primary};font-size:10pt;letter-spacing:3pt;margin:0">YOUR AI TEAM</p>
  <h1 style="color:${C.text};font-size:28pt;margin:6pt 0 0 0">9 位 AI 工程师，各司其职</h1>
</div>
<div style="margin:14pt 45pt 0 45pt;position:relative">
  <div style="display:flex;align-items:center;margin-bottom:8pt">
    <div style="width:5pt;height:5pt;border-radius:50%;background:${C.cyan};margin-right:6pt"></div>
    <p style="color:${C.cyan};font-size:9pt;margin:0;font-weight:bold">战略规划部 Strategic Planning</p>
  </div>
  <div style="display:flex;gap:8pt;margin-bottom:14pt">
    ${teamCard('&#x1F50D;', 'Analyst', '市场调研<br>项目初探', C.cyan)}
    ${teamCard('&#x1F4CB;', 'PM', '需求梳理<br>产品规划', C.cyan)}
    ${teamCard('&#x1F3A8;', 'UX-Expert', '界面设计<br>交互规范', C.cyan)}
    ${teamCard('&#x1F3D7;', 'Architect', '技术选型<br>系统架构', C.cyan)}
    ${teamCard('&#x2705;', 'PO', '质量把关<br>优先管理', C.cyan)}
  </div>
  <div style="display:flex;align-items:center;margin-bottom:8pt">
    <div style="width:5pt;height:5pt;border-radius:50%;background:${C.green};margin-right:6pt"></div>
    <p style="color:${C.green};font-size:9pt;margin:0;font-weight:bold">工程实施部 Engineering</p>
  </div>
  <div style="display:flex;gap:8pt">
    ${teamCard('&#x1F4CA;', 'SM', '故事拆分<br>迭代管理', C.green)}
    ${teamCard('&#x1F527;', 'Arch-Eng', '技术评审<br>代码规范', C.green)}
    ${teamCard('&#x1F4BB;', 'Dev', '代码实现<br>功能开发', C.green)}
    ${teamCard('&#x1F9EA;', 'QA', '测试验证<br>质量门禁', C.green)}
    <div style="flex:1"></div>
  </div>
</div>`, 'bg-content.png');

// ── SLIDE 7: THE WORKFLOW ──
const s07 = slide(`
<div style="position:absolute;top:0;left:0;width:100%;height:100%">
  <img src="../assets/grid.png" style="width:100%;height:100%;position:absolute;top:0;left:0;opacity:0.12">
</div>
<div style="margin:35pt 45pt 0 45pt;position:relative">
  <p style="color:${C.primary};font-size:10pt;letter-spacing:3pt;margin:0">WORKFLOW</p>
  <h1 style="color:${C.text};font-size:26pt;margin:6pt 0 0 0">从想法到上线，8 步标准流程</h1>
</div>
<div style="margin:18pt 35pt 0 35pt;position:relative">
  <div style="display:flex;gap:4pt;align-items:stretch">
    <div style="flex:1;background:${C.surface};border-radius:6pt;padding:10pt 6pt;text-align:center;border-bottom:2pt solid ${C.cyan}">
      <p style="color:${C.cyan};font-size:8pt;margin:0;font-weight:bold">STEP 1</p>
      <p style="color:${C.text};font-size:9pt;margin:5pt 0 0 0;font-weight:bold">Analyst</p>
      <p style="color:${C.textSub};font-size:7pt;margin:3pt 0 0 0">市场分析<br>可行性评估</p>
    </div>
    <div style="display:flex;align-items:center"><p style="color:${C.textDim};font-size:10pt;margin:0">&#x25B6;</p></div>
    <div style="flex:1;background:${C.surface};border-radius:6pt;padding:10pt 6pt;text-align:center;border-bottom:2pt solid ${C.cyan}">
      <p style="color:${C.cyan};font-size:8pt;margin:0;font-weight:bold">STEP 2</p>
      <p style="color:${C.text};font-size:9pt;margin:5pt 0 0 0;font-weight:bold">PM</p>
      <p style="color:${C.textSub};font-size:7pt;margin:3pt 0 0 0">需求细化<br>功能规划</p>
    </div>
    <div style="display:flex;align-items:center"><p style="color:${C.textDim};font-size:10pt;margin:0">&#x25B6;</p></div>
    <div style="flex:1;background:${C.surface};border-radius:6pt;padding:10pt 6pt;text-align:center;border-bottom:2pt solid ${C.cyan}">
      <p style="color:${C.cyan};font-size:8pt;margin:0;font-weight:bold">STEP 3</p>
      <p style="color:${C.text};font-size:9pt;margin:5pt 0 0 0;font-weight:bold">UX</p>
      <p style="color:${C.textSub};font-size:7pt;margin:3pt 0 0 0">界面设计<br>交互规范</p>
    </div>
    <div style="display:flex;align-items:center"><p style="color:${C.textDim};font-size:10pt;margin:0">&#x25B6;</p></div>
    <div style="flex:1;background:${C.surface};border-radius:6pt;padding:10pt 6pt;text-align:center;border-bottom:2pt solid ${C.cyan}">
      <p style="color:${C.cyan};font-size:8pt;margin:0;font-weight:bold">STEP 4</p>
      <p style="color:${C.text};font-size:9pt;margin:5pt 0 0 0;font-weight:bold">Architect</p>
      <p style="color:${C.textSub};font-size:7pt;margin:3pt 0 0 0">技术选型<br>架构设计</p>
    </div>
  </div>
  <div style="display:flex;justify-content:center;margin:6pt 0"><p style="color:${C.primary};font-size:10pt;margin:0">&#x25BC;</p></div>
  <div style="display:flex;gap:4pt;align-items:stretch;flex-direction:row-reverse">
    <div style="flex:1;background:${C.surface};border-radius:6pt;padding:10pt 6pt;text-align:center;border-bottom:2pt solid ${C.green}">
      <p style="color:${C.green};font-size:8pt;margin:0;font-weight:bold">STEP 5</p>
      <p style="color:${C.text};font-size:9pt;margin:5pt 0 0 0;font-weight:bold">PO</p>
      <p style="color:${C.textSub};font-size:7pt;margin:3pt 0 0 0">质量验证<br>文档对齐</p>
    </div>
    <div style="display:flex;align-items:center"><p style="color:${C.textDim};font-size:10pt;margin:0">&#x25C0;</p></div>
    <div style="flex:1;background:${C.surface};border-radius:6pt;padding:10pt 6pt;text-align:center;border-bottom:2pt solid ${C.green}">
      <p style="color:${C.green};font-size:8pt;margin:0;font-weight:bold">STEP 6</p>
      <p style="color:${C.text};font-size:9pt;margin:5pt 0 0 0;font-weight:bold">SM</p>
      <p style="color:${C.textSub};font-size:7pt;margin:3pt 0 0 0">任务拆分<br>优先排序</p>
    </div>
    <div style="display:flex;align-items:center"><p style="color:${C.textDim};font-size:10pt;margin:0">&#x25C0;</p></div>
    <div style="flex:1;background:${C.surface};border-radius:6pt;padding:10pt 6pt;text-align:center;border-bottom:2pt solid ${C.green}">
      <p style="color:${C.green};font-size:8pt;margin:0;font-weight:bold">STEP 7</p>
      <p style="color:${C.text};font-size:9pt;margin:5pt 0 0 0;font-weight:bold">Dev</p>
      <p style="color:${C.textSub};font-size:7pt;margin:3pt 0 0 0">代码实现<br>功能开发</p>
    </div>
    <div style="display:flex;align-items:center"><p style="color:${C.textDim};font-size:10pt;margin:0">&#x25C0;</p></div>
    <div style="flex:1;background:${C.surface};border-radius:6pt;padding:10pt 6pt;text-align:center;border-bottom:2pt solid ${C.green}">
      <p style="color:${C.green};font-size:8pt;margin:0;font-weight:bold">STEP 8</p>
      <p style="color:${C.text};font-size:9pt;margin:5pt 0 0 0;font-weight:bold">QA</p>
      <p style="color:${C.textSub};font-size:7pt;margin:3pt 0 0 0">测试验证<br>质量门禁</p>
    </div>
  </div>
</div>
<div style="margin:12pt 45pt 0 45pt;display:flex;gap:20pt;justify-content:center">
  <div style="display:flex;align-items:center"><div style="width:6pt;height:6pt;border-radius:50%;background:${C.cyan};margin-right:5pt"></div><p style="color:${C.textSub};font-size:8pt;margin:0">自动流转</p></div>
  <div style="display:flex;align-items:center"><div style="width:6pt;height:6pt;border-radius:50%;background:${C.gold};margin-right:5pt"></div><p style="color:${C.textSub};font-size:8pt;margin:0">质量门禁</p></div>
  <div style="display:flex;align-items:center"><div style="width:6pt;height:6pt;border-radius:50%;background:${C.green};margin-right:5pt"></div><p style="color:${C.textSub};font-size:8pt;margin:0">全程可追溯</p></div>
</div>`, 'bg-content.png');

// ── SLIDE 8: WORKBENCH ──
const s08 = slide(`
<div style="position:absolute;top:0;left:0;width:100%;height:100%">
  <img src="../assets/grid.png" style="width:100%;height:100%;position:absolute;top:0;left:0;opacity:0.1">
</div>
<div style="margin:35pt 50pt 0 50pt;position:relative">
  <p style="color:${C.gold};font-size:10pt;letter-spacing:3pt;margin:0">PRODUCT</p>
  <h1 style="color:${C.text};font-size:28pt;margin:6pt 0 0 0">三区工作台 · 全景掌控</h1>
</div>
<div style="margin:16pt 50pt 0 50pt;display:flex;gap:10pt;position:relative;height:230pt">
  <div style="flex:25;background:${C.surface};border:1pt solid ${C.border};border-radius:8pt;padding:14pt;display:flex;flex-direction:column">
    <div style="display:flex;align-items:center;margin-bottom:10pt"><div style="width:6pt;height:6pt;border-radius:50%;background:${C.cyan};margin-right:6pt"></div><p style="color:${C.cyan};font-size:9pt;margin:0;font-weight:bold">档案室</p></div>
    <div style="flex:1;background:#0D1220;border-radius:4pt;padding:8pt">
      <p style="color:${C.textDim};font-size:7pt;margin:0;font-family:'Courier New',monospace">src/</p>
      <p style="color:${C.textDim};font-size:7pt;margin:2pt 0 0 6pt;font-family:'Courier New',monospace">components/</p>
      <p style="color:${C.green};font-size:7pt;margin:2pt 0 0 12pt;font-family:'Courier New',monospace">+ Header.tsx</p>
      <p style="color:${C.green};font-size:7pt;margin:2pt 0 0 12pt;font-family:'Courier New',monospace">+ Footer.tsx</p>
      <p style="color:${C.textDim};font-size:7pt;margin:2pt 0 0 6pt;font-family:'Courier New',monospace">pages/</p>
      <p style="color:${C.gold};font-size:7pt;margin:2pt 0 0 12pt;font-family:'Courier New',monospace">~ index.tsx</p>
    </div>
    <p style="color:${C.textSub};font-size:7pt;margin:8pt 0 0 0;text-align:center">实时查看每一个文件变化</p>
  </div>
  <div style="flex:45;display:flex;flex-direction:column;gap:10pt">
    <div style="flex:40;background:${C.surface};border:1pt solid ${C.border};border-radius:8pt;padding:12pt;display:flex;flex-direction:column">
      <p style="color:${C.primary};font-size:9pt;margin:0;font-weight:bold">AI 团队状态面板</p>
      <div style="display:flex;gap:6pt;margin-top:8pt;flex-wrap:wrap">
        <div style="display:flex;align-items:center"><div style="width:6pt;height:6pt;border-radius:50%;background:${C.green}"></div><p style="color:${C.textSub};font-size:6pt;margin:0 0 0 3pt">PM</p></div>
        <div style="display:flex;align-items:center"><div style="width:6pt;height:6pt;border-radius:50%;background:#3B82F6"></div><p style="color:${C.textSub};font-size:6pt;margin:0 0 0 3pt">Dev</p></div>
        <div style="display:flex;align-items:center"><div style="width:6pt;height:6pt;border-radius:50%;background:${C.textDim}"></div><p style="color:${C.textSub};font-size:6pt;margin:0 0 0 3pt">QA</p></div>
        <div style="display:flex;align-items:center"><div style="width:6pt;height:6pt;border-radius:50%;background:${C.textDim}"></div><p style="color:${C.textSub};font-size:6pt;margin:0 0 0 3pt">UX</p></div>
        <div style="display:flex;align-items:center"><div style="width:6pt;height:6pt;border-radius:50%;background:${C.green}"></div><p style="color:${C.textSub};font-size:6pt;margin:0 0 0 3pt">Arch</p></div>
      </div>
    </div>
    <div style="flex:60;background:${C.surface};border:1pt solid ${C.border};border-radius:8pt;padding:12pt;display:flex;flex-direction:column">
      <p style="color:${C.green};font-size:9pt;margin:0;font-weight:bold">工程监视器</p>
      <div style="flex:1;background:#0D1220;border-radius:4pt;padding:6pt;margin-top:6pt">
        <p style="color:${C.green};font-size:6pt;margin:0;font-family:'Courier New',monospace">$ Dev: Creating Header component...</p>
        <p style="color:${C.textDim};font-size:6pt;margin:2pt 0 0 0;font-family:'Courier New',monospace">$ Writing src/components/Header.tsx</p>
        <p style="color:${C.cyan};font-size:6pt;margin:2pt 0 0 0;font-family:'Courier New',monospace">$ Added responsive navigation bar</p>
        <p style="color:${C.textDim};font-size:6pt;margin:2pt 0 0 0;font-family:'Courier New',monospace">$ Running lint checks...</p>
        <p style="color:${C.green};font-size:6pt;margin:2pt 0 0 0;font-family:'Courier New',monospace">$ All checks passed</p>
      </div>
      <p style="color:${C.textSub};font-size:7pt;margin:6pt 0 0 0;text-align:center">实时观看 AI 工作过程</p>
    </div>
  </div>
  <div style="flex:30;background:${C.surface};border:1pt solid ${C.border};border-radius:8pt;padding:14pt;display:flex;flex-direction:column">
    <div style="display:flex;align-items:center;margin-bottom:10pt"><div style="width:6pt;height:6pt;border-radius:50%;background:${C.gold};margin-right:6pt"></div><p style="color:${C.gold};font-size:9pt;margin:0;font-weight:bold">指令通道</p></div>
    <div style="flex:1;display:flex;flex-direction:column;justify-content:flex-end">
      <div style="background:rgba(108,99,255,0.1);border-radius:6pt;padding:6pt;margin-bottom:6pt">
        <p style="color:${C.textSub};font-size:6pt;margin:0">做一个响应式导航栏，参考 Stripe 的风格</p>
      </div>
      <div style="background:rgba(0,210,255,0.1);border-radius:6pt;padding:6pt">
        <p style="color:${C.cyan};font-size:6pt;margin:0">收到！正在创建导航组件...</p>
      </div>
    </div>
    <p style="color:${C.textSub};font-size:7pt;margin:8pt 0 0 0;text-align:center">自然语言下达命令</p>
  </div>
</div>`, 'bg-content.png');

// ── SLIDE 9: TRANSPARENCY ──
const s09 = slide(`
<div style="position:absolute;top:0;left:0;width:100%;height:100%">
  <img src="../assets/grid.png" style="width:100%;height:100%;position:absolute;top:0;left:0;opacity:0.12">
</div>
<div style="margin:40pt 55pt 0 55pt;position:relative">
  <p style="color:${C.gold};font-size:10pt;letter-spacing:3pt;margin:0">TRANSPARENCY</p>
  <h1 style="color:${C.text};font-size:30pt;margin:8pt 0 0 0">透明厨房 · 每一步都看得见</h1>
  <div style="margin-top:8pt"><img src="../assets/accent-gold.png" style="width:80pt;height:2pt"></div>
</div>
<div style="margin:28pt 55pt 0 55pt;display:flex;flex-direction:column;gap:14pt;position:relative">
  <div style="display:flex;align-items:center;gap:16pt">
    <div style="width:36pt;height:36pt;border-radius:50%;background:rgba(90,101,120,0.3);border:1pt solid ${C.textDim};display:flex;align-items:center;justify-content:center;flex-shrink:0"><p style="color:${C.textDim};font-size:14pt;margin:0">&#x25CF;</p></div>
    <div><p style="color:${C.text};font-size:13pt;margin:0;font-weight:bold">Idle · 空闲</p><p style="color:${C.textSub};font-size:10pt;margin:2pt 0 0 0">等待任务分配，随时可以激活</p></div>
  </div>
  <div style="display:flex;align-items:center;gap:16pt">
    <div style="width:36pt;height:36pt;border-radius:50%;background:rgba(255,184,77,0.2);border:1pt solid ${C.gold};display:flex;align-items:center;justify-content:center;flex-shrink:0"><p style="color:${C.gold};font-size:14pt;margin:0">&#x25CF;</p></div>
    <div><p style="color:${C.text};font-size:13pt;margin:0;font-weight:bold">Activating · 激活中</p><p style="color:${C.textSub};font-size:10pt;margin:2pt 0 0 0">正在启动工作环境，加载项目上下文</p></div>
  </div>
  <div style="display:flex;align-items:center;gap:16pt">
    <div style="width:36pt;height:36pt;border-radius:50%;background:rgba(63,185,80,0.2);border:1pt solid ${C.green};display:flex;align-items:center;justify-content:center;flex-shrink:0"><p style="color:${C.green};font-size:14pt;margin:0">&#x25CF;</p></div>
    <div><p style="color:${C.text};font-size:13pt;margin:0;font-weight:bold">Ready · 就绪</p><p style="color:${C.textSub};font-size:10pt;margin:2pt 0 0 0">准备完毕，可以接受命令</p></div>
  </div>
  <div style="display:flex;align-items:center;gap:16pt">
    <div style="width:36pt;height:36pt;border-radius:50%;background:rgba(88,166,255,0.2);border:1pt solid #58A6FF;display:flex;align-items:center;justify-content:center;flex-shrink:0"><p style="color:#58A6FF;font-size:14pt;margin:0">&#x25CF;</p></div>
    <div><p style="color:${C.text};font-size:13pt;margin:0;font-weight:bold">Executing · 执行中</p><p style="color:${C.textSub};font-size:10pt;margin:2pt 0 0 0">正在工作，可在监视器实时查看输出</p></div>
  </div>
</div>
<div style="margin:18pt 55pt 0 55pt"><p style="color:${C.textDim};font-size:9pt;margin:0;text-align:center">告别黑盒开发  ·  每个 AI 的工作状态一目了然</p></div>`, 'bg-content.png');

// ── SLIDE 10: SECTION - USE CASES ──
const s10 = slide(`
<div style="position:absolute;top:0;left:0;width:100%;height:100%">
  <img src="../assets/glow-cover.png" style="width:100%;height:100%;position:absolute;top:0;left:0;opacity:0.4">
  <img src="../assets/grid.png" style="width:100%;height:100%;position:absolute;top:0;left:0;opacity:0.2">
</div>
<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;position:relative">
  <p style="color:${C.primary};font-size:10pt;letter-spacing:4pt;margin:0">USE CASES</p>
  <h1 style="color:${C.text};font-size:38pt;margin:12pt 0 0 0;text-align:center">谁在使用<br>AI 软件公司？</h1>
  <div style="margin-top:14pt"><img src="../assets/accent-gold.png" style="width:80pt;height:3pt"></div>
  <div style="display:flex;gap:30pt;margin-top:30pt">
    <div style="text-align:center"><p style="color:${C.cyan};font-size:24pt;margin:0">01</p><p style="color:${C.textSub};font-size:10pt;margin:4pt 0 0 0">创业者</p></div>
    <div style="text-align:center"><p style="color:${C.gold};font-size:24pt;margin:0">02</p><p style="color:${C.textSub};font-size:10pt;margin:4pt 0 0 0">技术团队</p></div>
    <div style="text-align:center"><p style="color:${C.green};font-size:24pt;margin:0">03</p><p style="color:${C.textSub};font-size:10pt;margin:4pt 0 0 0">产品经理</p></div>
  </div>
</div>`, 'bg-section.png');

// ── SLIDE 11: USE CASE - STARTUP ──
const s11 = slide(`
<div style="position:absolute;top:0;left:0;width:100%;height:100%">
  <img src="../assets/grid.png" style="width:100%;height:100%;position:absolute;top:0;left:0;opacity:0.12">
</div>
<div style="margin:40pt 55pt 0 55pt;position:relative">
  <p style="color:${C.cyan};font-size:22pt;margin:0;font-weight:bold">01</p>
  <h1 style="color:${C.text};font-size:28pt;margin:4pt 0 0 0">创业者的 MVP 加速器</h1>
</div>
<div style="margin:20pt 55pt 0 55pt;display:flex;gap:16pt;position:relative">
  <div style="flex:1;background:rgba(248,81,73,0.08);border:1pt solid rgba(248,81,73,0.3);border-radius:8pt;padding:18pt">
    <p style="color:${C.red};font-size:10pt;margin:0;font-weight:bold;letter-spacing:1pt">BEFORE</p>
    <p style="color:${C.textSub};font-size:10pt;margin:12pt 0 0 0;line-height:1.6">招聘团队：2-3 个月</p>
    <p style="color:${C.textSub};font-size:10pt;margin:4pt 0 0 0;line-height:1.6">外包沟通：效率低下</p>
    <p style="color:${C.textSub};font-size:10pt;margin:4pt 0 0 0;line-height:1.6">预算门槛：50 万+</p>
    <p style="color:${C.textSub};font-size:10pt;margin:4pt 0 0 0;line-height:1.6">交付周期：3-6 个月</p>
  </div>
  <div style="display:flex;align-items:center"><p style="color:${C.primary};font-size:18pt;margin:0">&#x25B6;</p></div>
  <div style="flex:1;background:rgba(63,185,80,0.08);border:1pt solid rgba(63,185,80,0.3);border-radius:8pt;padding:18pt">
    <p style="color:${C.green};font-size:10pt;margin:0;font-weight:bold;letter-spacing:1pt">AFTER</p>
    <p style="color:${C.text};font-size:10pt;margin:12pt 0 0 0;line-height:1.6;font-weight:bold">即刻开始，无需招聘</p>
    <p style="color:${C.text};font-size:10pt;margin:4pt 0 0 0;line-height:1.6;font-weight:bold">直接对话 AI，零沟通损耗</p>
    <p style="color:${C.text};font-size:10pt;margin:4pt 0 0 0;line-height:1.6;font-weight:bold">3000 元/月起</p>
    <p style="color:${C.text};font-size:10pt;margin:4pt 0 0 0;line-height:1.6;font-weight:bold">数天内获得可用原型</p>
  </div>
</div>
<div style="margin:22pt 55pt 0 55pt;background:${C.surface};border:1pt solid ${C.gold};border-radius:8pt;padding:14pt 20pt;text-align:center">
  <p style="color:${C.gold};font-size:14pt;margin:0;font-weight:bold">从想法到 MVP：数天 vs 数月</p>
</div>`, 'bg-content.png');

// ── SLIDE 12: USE CASE - TEAMS ──
const s12 = slide(`
<div style="position:absolute;top:0;left:0;width:100%;height:100%">
  <img src="../assets/grid.png" style="width:100%;height:100%;position:absolute;top:0;left:0;opacity:0.12">
</div>
<div style="margin:40pt 55pt 0 55pt;position:relative;display:flex;justify-content:space-between;align-items:flex-start">
  <div>
    <p style="color:${C.gold};font-size:22pt;margin:0;font-weight:bold">02</p>
    <h1 style="color:${C.text};font-size:28pt;margin:4pt 0 0 0">技术团队的效能倍增器</h1>
  </div>
  <div style="background:rgba(255,184,77,0.1);border:1pt solid ${C.gold};border-radius:8pt;padding:8pt 16pt">
    <p style="color:${C.gold};font-size:20pt;margin:0;font-weight:bold">3-5x</p>
    <p style="color:${C.textSub};font-size:8pt;margin:0;text-align:center">产能提升</p>
  </div>
</div>
<div style="margin:22pt 55pt 0 55pt;display:flex;flex-wrap:wrap;gap:12pt;position:relative">
  <div style="flex:1;min-width:250pt;background:${C.surface};border:1pt solid ${C.border};border-radius:8pt;padding:18pt;border-left:3pt solid ${C.cyan}">
    <p style="color:${C.text};font-size:12pt;margin:0;font-weight:bold">接手重复性开发任务</p>
    <p style="color:${C.textSub};font-size:9pt;margin:6pt 0 0 0">让 AI 处理 CRUD、表单、列表等标准功能</p>
  </div>
  <div style="flex:1;min-width:250pt;background:${C.surface};border:1pt solid ${C.border};border-radius:8pt;padding:18pt;border-left:3pt solid ${C.primary}">
    <p style="color:${C.text};font-size:12pt;margin:0;font-weight:bold">自动生成样板代码</p>
    <p style="color:${C.textSub};font-size:9pt;margin:6pt 0 0 0">组件骨架、API 路由、数据模型一键生成</p>
  </div>
  <div style="flex:1;min-width:250pt;background:${C.surface};border:1pt solid ${C.border};border-radius:8pt;padding:18pt;border-left:3pt solid ${C.green}">
    <p style="color:${C.text};font-size:12pt;margin:0;font-weight:bold">自动化测试编写</p>
    <p style="color:${C.textSub};font-size:9pt;margin:6pt 0 0 0">单元测试、集成测试自动生成并执行</p>
  </div>
  <div style="flex:1;min-width:250pt;background:${C.surface};border:1pt solid ${C.border};border-radius:8pt;padding:18pt;border-left:3pt solid ${C.gold}">
    <p style="color:${C.text};font-size:12pt;margin:0;font-weight:bold">文档自动生成</p>
    <p style="color:${C.textSub};font-size:9pt;margin:6pt 0 0 0">API 文档、README、技术规范同步输出</p>
  </div>
</div>`, 'bg-content.png');

// ── SLIDE 13: COMPETITIVE EDGE ──
const s13 = slide(`
<div style="position:absolute;top:0;left:0;width:100%;height:100%">
  <img src="../assets/grid.png" style="width:100%;height:100%;position:absolute;top:0;left:0;opacity:0.1">
</div>
<div style="margin:35pt 50pt 0 50pt;position:relative">
  <p style="color:${C.primary};font-size:10pt;letter-spacing:3pt;margin:0">COMPETITIVE EDGE</p>
  <h1 style="color:${C.text};font-size:26pt;margin:6pt 0 0 0">不止是 AI 编程助手</h1>
</div>
<div style="margin:16pt 50pt 0 50pt;position:relative" id="comparison-table" class="placeholder">
</div>`, 'bg-content.png');

// ── SLIDE 14: ENTERPRISE TECH ──
const s14 = slide(`
<div style="position:absolute;top:0;left:0;width:100%;height:100%">
  <img src="../assets/grid.png" style="width:100%;height:100%;position:absolute;top:0;left:0;opacity:0.12">
</div>
<div style="margin:40pt 55pt 0 55pt;position:relative">
  <p style="color:${C.gold};font-size:10pt;letter-spacing:3pt;margin:0">TECHNOLOGY</p>
  <h1 style="color:${C.text};font-size:28pt;margin:6pt 0 0 0">企业级技术底座</h1>
</div>
<div style="margin:22pt 55pt 0 55pt;display:flex;gap:12pt;position:relative">
  <div style="flex:1;background:${C.surface};border:1pt solid ${C.border};border-radius:8pt;padding:18pt;text-align:center">
    <div style="width:36pt;height:36pt;border-radius:50%;background:rgba(108,99,255,0.15);border:1pt solid ${C.primary};margin:0 auto 10pt auto;display:flex;align-items:center;justify-content:center"><p style="color:${C.primary};font-size:14pt;margin:0">&#x1F9E0;</p></div>
    <p style="color:${C.text};font-size:11pt;margin:0;font-weight:bold">Claude AI</p>
    <p style="color:${C.textSub};font-size:8pt;margin:6pt 0 0 0;line-height:1.4">业界最强推理能力<br>Anthropic 旗舰模型</p>
  </div>
  <div style="flex:1;background:${C.surface};border:1pt solid ${C.border};border-radius:8pt;padding:18pt;text-align:center">
    <div style="width:36pt;height:36pt;border-radius:50%;background:rgba(0,210,255,0.15);border:1pt solid ${C.cyan};margin:0 auto 10pt auto;display:flex;align-items:center;justify-content:center"><p style="color:${C.cyan};font-size:14pt;margin:0">&#x26A1;</p></div>
    <p style="color:${C.text};font-size:11pt;margin:0;font-weight:bold">实时同步</p>
    <p style="color:${C.textSub};font-size:8pt;margin:6pt 0 0 0;line-height:1.4">WebSocket 双向通信<br>多设备实时协作</p>
  </div>
  <div style="flex:1;background:${C.surface};border:1pt solid ${C.border};border-radius:8pt;padding:18pt;text-align:center">
    <div style="width:36pt;height:36pt;border-radius:50%;background:rgba(63,185,80,0.15);border:1pt solid ${C.green};margin:0 auto 10pt auto;display:flex;align-items:center;justify-content:center"><p style="color:${C.green};font-size:14pt;margin:0">&#x1F512;</p></div>
    <p style="color:${C.text};font-size:11pt;margin:0;font-weight:bold">银行级安全</p>
    <p style="color:${C.textSub};font-size:8pt;margin:6pt 0 0 0;line-height:1.4">行级数据隔离 (RLS)<br>代码只属于你</p>
  </div>
  <div style="flex:1;background:${C.surface};border:1pt solid ${C.border};border-radius:8pt;padding:18pt;text-align:center">
    <div style="width:36pt;height:36pt;border-radius:50%;background:rgba(255,184,77,0.15);border:1pt solid ${C.gold};margin:0 auto 10pt auto;display:flex;align-items:center;justify-content:center"><p style="color:${C.gold};font-size:14pt;margin:0">&#x1F30D;</p></div>
    <p style="color:${C.text};font-size:11pt;margin:0;font-weight:bold">全球 CDN</p>
    <p style="color:${C.textSub};font-size:8pt;margin:6pt 0 0 0;line-height:1.4">Vercel Edge Network<br>毫秒级极速响应</p>
  </div>
</div>
<div style="margin:20pt 55pt 0 55pt;display:flex;gap:25pt;justify-content:center">
  <p style="color:${C.textDim};font-size:8pt;margin:0">Next.js 14</p>
  <p style="color:${C.textDim};font-size:8pt;margin:0">React 18</p>
  <p style="color:${C.textDim};font-size:8pt;margin:0">TypeScript</p>
  <p style="color:${C.textDim};font-size:8pt;margin:0">Supabase</p>
  <p style="color:${C.textDim};font-size:8pt;margin:0">PostgreSQL</p>
  <p style="color:${C.textDim};font-size:8pt;margin:0">Tailwind CSS</p>
</div>`, 'bg-content.png');

// ── SLIDE 15: PRICING ──
const s15 = slide(`
<div style="position:absolute;top:0;left:0;width:100%;height:100%">
  <img src="../assets/grid.png" style="width:100%;height:100%;position:absolute;top:0;left:0;opacity:0.1">
</div>
<div style="margin:35pt 55pt 0 55pt;position:relative;text-align:center">
  <p style="color:${C.primary};font-size:10pt;letter-spacing:3pt;margin:0">PRICING</p>
  <h1 style="color:${C.text};font-size:28pt;margin:6pt 0 0 0">简单透明的定价</h1>
</div>
<div style="margin:18pt 50pt 0 50pt;display:flex;gap:14pt;position:relative">
  <div style="flex:1;background:${C.surface};border:1pt solid ${C.border};border-radius:10pt;padding:20pt;text-align:center">
    <p style="color:${C.textSub};font-size:10pt;margin:0;font-weight:bold">访客计划</p>
    <p style="color:${C.text};font-size:30pt;margin:8pt 0 0 0;font-weight:bold">$399</p>
    <p style="color:${C.textDim};font-size:9pt;margin:0">/月</p>
    <div style="width:100%;height:1pt;background:${C.border};margin:12pt 0"></div>
    <p style="color:${C.textSub};font-size:9pt;margin:8pt 0 0 0">初次体验</p>
    <p style="color:${C.textSub};font-size:9pt;margin:2pt 0 0 0">短期项目</p>
  </div>
  <div style="flex:1;background:${C.surface};border:2pt solid ${C.primary};border-radius:10pt;padding:20pt;text-align:center;position:relative">
    <div style="position:absolute;top:-10pt;left:50%;transform:translateX(-50%);background:${C.primary};border-radius:10pt;padding:2pt 12pt"><p style="color:${C.text};font-size:7pt;margin:0;font-weight:bold">POPULAR</p></div>
    <p style="color:${C.primary};font-size:10pt;margin:0;font-weight:bold">常住计划</p>
    <p style="color:${C.text};font-size:30pt;margin:8pt 0 0 0;font-weight:bold">$369</p>
    <p style="color:${C.textDim};font-size:9pt;margin:0">/月</p>
    <div style="width:100%;height:1pt;background:${C.border};margin:12pt 0"></div>
    <p style="color:${C.textSub};font-size:9pt;margin:8pt 0 0 0">持续开发</p>
    <p style="color:${C.textSub};font-size:9pt;margin:2pt 0 0 0">长期项目</p>
  </div>
  <div style="flex:1;background:${C.surface};border:2pt solid ${C.gold};border-radius:10pt;padding:20pt;text-align:center;position:relative">
    <div style="position:absolute;top:-10pt;left:50%;transform:translateX(-50%);background:${C.gold};border-radius:10pt;padding:2pt 12pt"><p style="color:#0B0F19;font-size:7pt;margin:0;font-weight:bold">BEST VALUE</p></div>
    <p style="color:${C.gold};font-size:10pt;margin:0;font-weight:bold">创始人计划</p>
    <p style="color:${C.text};font-size:30pt;margin:8pt 0 0 0;font-weight:bold">$299</p>
    <p style="color:${C.textDim};font-size:9pt;margin:0">/月</p>
    <div style="width:100%;height:1pt;background:${C.border};margin:12pt 0"></div>
    <p style="color:${C.textSub};font-size:9pt;margin:8pt 0 0 0">早期支持者</p>
    <p style="color:${C.textSub};font-size:9pt;margin:2pt 0 0 0">专属特惠</p>
  </div>
</div>
<div style="margin:16pt 55pt 0 55pt;display:flex;gap:16pt;justify-content:center;flex-wrap:wrap">
  <div style="display:flex;align-items:center"><div style="width:5pt;height:5pt;border-radius:50%;background:${C.green};margin-right:5pt"></div><p style="color:${C.textSub};font-size:8pt;margin:0">完整 9 人 AI 团队</p></div>
  <div style="display:flex;align-items:center"><div style="width:5pt;height:5pt;border-radius:50%;background:${C.green};margin-right:5pt"></div><p style="color:${C.textSub};font-size:8pt;margin:0">无限项目</p></div>
  <div style="display:flex;align-items:center"><div style="width:5pt;height:5pt;border-radius:50%;background:${C.green};margin-right:5pt"></div><p style="color:${C.textSub};font-size:8pt;margin:0">无限命令</p></div>
  <div style="display:flex;align-items:center"><div style="width:5pt;height:5pt;border-radius:50%;background:${C.green};margin-right:5pt"></div><p style="color:${C.textSub};font-size:8pt;margin:0">Git 集成</p></div>
  <div style="display:flex;align-items:center"><div style="width:5pt;height:5pt;border-radius:50%;background:${C.green};margin-right:5pt"></div><p style="color:${C.textSub};font-size:8pt;margin:0">多设备同步</p></div>
</div>`, 'bg-content.png');

// ── SLIDE 16: CTA ──
const s16 = slide(`
<div style="position:absolute;top:0;left:0;width:100%;height:100%">
  <img src="../assets/glow-closing.png" style="width:100%;height:100%;position:absolute;top:0;left:0">
  <img src="../assets/grid.png" style="width:100%;height:100%;position:absolute;top:0;left:0;opacity:0.15">
</div>
<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;position:relative">
  <p style="color:${C.primary};font-size:10pt;letter-spacing:4pt;margin:0">GET STARTED</p>
  <h1 style="color:${C.text};font-size:34pt;margin:12pt 0 0 0;text-align:center">三步开启你的 AI 软件公司</h1>
  <div style="margin-top:14pt"><img src="../assets/accent-gold.png" style="width:80pt;height:3pt"></div>
  <div style="display:flex;gap:30pt;margin-top:30pt">
    <div style="text-align:center;width:130pt">
      <div style="width:44pt;height:44pt;border-radius:50%;background:rgba(108,99,255,0.2);border:2pt solid ${C.primary};margin:0 auto;display:flex;align-items:center;justify-content:center"><p style="color:${C.primary};font-size:20pt;margin:0;font-weight:bold">1</p></div>
      <p style="color:${C.text};font-size:13pt;margin:10pt 0 0 0;font-weight:bold">注册</p>
      <p style="color:${C.textSub};font-size:9pt;margin:4pt 0 0 0">访问 youlidao.ai</p>
    </div>
    <div style="display:flex;align-items:center"><p style="color:${C.textDim};font-size:14pt;margin:0">&#x2192;</p></div>
    <div style="text-align:center;width:130pt">
      <div style="width:44pt;height:44pt;border-radius:50%;background:rgba(0,210,255,0.2);border:2pt solid ${C.cyan};margin:0 auto;display:flex;align-items:center;justify-content:center"><p style="color:${C.cyan};font-size:20pt;margin:0;font-weight:bold">2</p></div>
      <p style="color:${C.text};font-size:13pt;margin:10pt 0 0 0;font-weight:bold">订阅</p>
      <p style="color:${C.textSub};font-size:9pt;margin:4pt 0 0 0">选择适合的方案</p>
    </div>
    <div style="display:flex;align-items:center"><p style="color:${C.textDim};font-size:14pt;margin:0">&#x2192;</p></div>
    <div style="text-align:center;width:130pt">
      <div style="width:44pt;height:44pt;border-radius:50%;background:rgba(255,184,77,0.2);border:2pt solid ${C.gold};margin:0 auto;display:flex;align-items:center;justify-content:center"><p style="color:${C.gold};font-size:20pt;margin:0;font-weight:bold">3</p></div>
      <p style="color:${C.text};font-size:13pt;margin:10pt 0 0 0;font-weight:bold">创建</p>
      <p style="color:${C.textSub};font-size:9pt;margin:4pt 0 0 0">开始与 AI 团队协作</p>
    </div>
  </div>
  <div style="margin-top:30pt;background:${C.primary};border-radius:8pt;padding:10pt 35pt">
    <p style="color:${C.text};font-size:13pt;margin:0;font-weight:bold">youlidao.ai  ·  立即体验</p>
  </div>
</div>`, 'bg-closing.png');

// ── SLIDE 17: CLOSING ──
const s17 = slide(`
<div style="position:absolute;top:0;left:0;width:100%;height:100%">
  <img src="../assets/glow-closing.png" style="width:100%;height:100%;position:absolute;top:0;left:0">
  <img src="../assets/grid.png" style="width:100%;height:100%;position:absolute;top:0;left:0;opacity:0.12">
</div>
<div style="position:absolute;top:0;left:0;width:4pt;height:100%;background:${C.primary}"></div>
<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;position:relative">
  <div style="display:flex;align-items:center;margin-bottom:10pt">
    <div style="width:8pt;height:8pt;border-radius:50%;background:${C.cyan};margin-right:10pt"></div>
    <p style="color:${C.cyan};font-size:11pt;letter-spacing:3pt;margin:0">YOULIDAO.AI</p>
  </div>
  <h1 style="color:${C.text};font-size:30pt;margin:0;text-align:center;line-height:1.4">让每一个有想法的人</h1>
  <h1 style="color:${C.text};font-size:30pt;margin:0;text-align:center;line-height:1.4">都能把创意变成现实</h1>
  <div style="margin:18pt 0 22pt 0"><img src="../assets/accent-gold.png" style="width:100pt;height:3pt"></div>
  <p style="color:${C.text};font-size:16pt;margin:0;font-weight:bold">你的 AI 软件公司，随时待命</p>
  <div style="display:flex;gap:30pt;margin-top:30pt">
    <p style="color:${C.textSub};font-size:10pt;margin:0">youlidao.ai</p>
    <p style="color:${C.textDim};font-size:10pt;margin:0">|</p>
    <p style="color:${C.textSub};font-size:10pt;margin:0">contact@youlidao.ai</p>
  </div>
</div>
<div style="position:absolute;bottom:20pt;left:0;right:0;text-align:center">
  <p style="color:${C.textDim};font-size:7pt;margin:0">2025 youlidao.ai  ·  AI-Driven Software Company</p>
</div>`, 'bg-closing.png');

// Write all slides
const slides = [s01, s02, s03, s04, s05, s06, s07, s08, s09, s10, s11, s12, s13, s14, s15, s16, s17];
slides.forEach((html, i) => {
  const num = String(i + 1).padStart(2, '0');
  fs.writeFileSync(path.join(dir, `slide${num}.html`), html);
});
console.log(`Generated ${slides.length} slide HTML files.`);
