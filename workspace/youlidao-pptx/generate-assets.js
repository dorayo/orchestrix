const sharp = require('sharp');
const path = require('path');
const dir = path.join(__dirname, 'assets');

async function createGradient(filename, w, h, stops) {
  const gradStops = stops.map(s => `<stop offset="${s[0]}%" style="stop-color:${s[1]};stop-opacity:${s[2] || 1}"/>`).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">${gradStops}</linearGradient></defs>
    <rect width="100%" height="100%" fill="url(#g)"/>
  </svg>`;
  await sharp(Buffer.from(svg)).png().toFile(path.join(dir, filename));
}

async function createRadialGlow(filename, w, h, color, opacity) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <defs><radialGradient id="g" cx="50%" cy="45%" r="55%">
      <stop offset="0%" style="stop-color:${color};stop-opacity:${opacity}"/>
      <stop offset="100%" style="stop-color:${color};stop-opacity:0"/>
    </radialGradient></defs>
    <rect width="100%" height="100%" fill="url(#g)"/>
  </svg>`;
  await sharp(Buffer.from(svg)).png().toFile(path.join(dir, filename));
}

async function createAccentBar(filename, w, h, color) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:${color};stop-opacity:1"/>
      <stop offset="100%" style="stop-color:${color};stop-opacity:0"/>
    </linearGradient></defs>
    <rect width="100%" height="100%" fill="url(#g)"/>
  </svg>`;
  await sharp(Buffer.from(svg)).png().toFile(path.join(dir, filename));
}

async function createGridPattern(filename, w, h) {
  let lines = '';
  for (let x = 0; x <= w; x += 60) lines += `<line x1="${x}" y1="0" x2="${x}" y2="${h}" stroke="#1E293B" stroke-width="0.5" opacity="0.4"/>`;
  for (let y = 0; y <= h; y += 60) lines += `<line x1="0" y1="${y}" x2="${w}" y2="${y}" stroke="#1E293B" stroke-width="0.5" opacity="0.4"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">${lines}</svg>`;
  await sharp(Buffer.from(svg)).png().toFile(path.join(dir, filename));
}

async function createCornerAccent(filename, size) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
    <defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#6C63FF;stop-opacity:0.6"/>
      <stop offset="100%" style="stop-color:#00D2FF;stop-opacity:0"/>
    </linearGradient></defs>
    <polygon points="0,0 ${size},0 0,${size}" fill="url(#g)"/>
  </svg>`;
  await sharp(Buffer.from(svg)).png().toFile(path.join(dir, filename));
}

async function main() {
  // Cover background: dark with purple-blue glow
  await createGradient('bg-cover.png', 1920, 1080, [
    [0, '#06080F', 1], [40, '#0B1023', 1], [70, '#101530', 1], [100, '#0A0D18', 1]
  ]);
  await createRadialGlow('glow-cover.png', 1920, 1080, '#6C63FF', 0.15);

  // Content background: clean dark
  await createGradient('bg-content.png', 1920, 1080, [
    [0, '#0B0F19', 1], [100, '#0E1220', 1]
  ]);

  // Section divider background
  await createGradient('bg-section.png', 1920, 1080, [
    [0, '#0D1025', 1], [50, '#111535', 1], [100, '#0D1025', 1]
  ]);

  // Pain slide: dark with red undertone
  await createGradient('bg-pain.png', 1920, 1080, [
    [0, '#0B0F19', 1], [50, '#150D15', 1], [100, '#0B0F19', 1]
  ]);

  // Grid pattern overlay
  await createGridPattern('grid.png', 1920, 1080);

  // Accent bars
  await createAccentBar('accent-gold.png', 800, 6, '#FFB84D');
  await createAccentBar('accent-blue.png', 800, 6, '#6C63FF');
  await createAccentBar('accent-cyan.png', 800, 6, '#00D2FF');

  // Corner accent
  await createCornerAccent('corner-tl.png', 300);

  // Closing background with stronger glow
  await createGradient('bg-closing.png', 1920, 1080, [
    [0, '#08081A', 1], [50, '#121240', 1], [100, '#08081A', 1]
  ]);
  await createRadialGlow('glow-closing.png', 1920, 1080, '#6C63FF', 0.25);

  console.log('Assets generated.');
}

main().catch(console.error);
