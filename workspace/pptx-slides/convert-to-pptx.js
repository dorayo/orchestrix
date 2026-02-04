/**
 * Convert HTML slides to PowerPoint presentation
 * AI多智能体协作重塑游戏研发流程
 */

const pptxgen = require('pptxgenjs');
const path = require('path');

// Use the local html2pptx library
const html2pptx = require('./html2pptx.js');

const SLIDE_DIR = __dirname;

// List of slides in order
const slides = [
  'slide01-cover.html',
  'slide02-intro.html',
  'slide03-section1.html',
  'slide04-stages.html',
  'slide05-roles.html',
  'slide06-painpoints.html',
  'slide07-section2.html',
  'slide08-philosophy.html',
  'slide09-agents.html',
  'slide10-mapping.html',
  'slide11-decision.html',
  'slide12-solutions.html',
  'slide13-section3.html',
  'slide14-demo1.html',
  'slide15-demo2.html',
  'slide16-demo3.html',
  'slide17-section4.html',
  'slide18-youlidao.html',
  'slide19-roadmap.html',
  'slide20-results.html',
  'slide21-qa.html',
  'slide22-summary.html',
  'slide23-contact.html',
  'slide24-thanks.html'
];

async function createPresentation() {
  const pptx = new pptxgen();

  // Set presentation properties
  pptx.layout = 'LAYOUT_16x9';
  pptx.author = 'Orchestrix x youlidao.ai';
  pptx.title = 'AI多智能体协作重塑游戏研发流程';
  pptx.subject = '游戏开发团队培训材料';
  pptx.company = 'youlidao.ai';

  // Process each slide
  for (let i = 0; i < slides.length; i++) {
    const slideFile = slides[i];
    const slidePath = path.join(SLIDE_DIR, slideFile);

    console.log(`Processing slide ${i + 1}/${slides.length}: ${slideFile}`);

    try {
      const { slide, placeholders } = await html2pptx(slidePath, pptx);

      // Log placeholders for reference
      if (placeholders.length > 0) {
        console.log(`  Found ${placeholders.length} placeholder(s)`);
      }
    } catch (error) {
      console.error(`Error processing ${slideFile}:`, error.message);
      throw error;
    }
  }

  // Save the presentation
  const outputPath = path.join(SLIDE_DIR, 'AI多智能体协作重塑游戏研发流程.pptx');
  await pptx.writeFile({ fileName: outputPath });
  console.log(`\nPresentation saved to: ${outputPath}`);

  return outputPath;
}

createPresentation()
  .then(outputPath => {
    console.log('Done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Failed to create presentation:', error);
    process.exit(1);
  });
