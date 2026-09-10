const fs = require('fs');
const path = require('path');
const { PNG } = require('C:/Users/Lenovo/.gemini/antigravity-ide/brain/b5e6d4b4-cb22-4411-a186-3c030b266435/scratch/node_modules/pngjs');
const GIFEncoder = require('C:/Users/Lenovo/.gemini/antigravity-ide/brain/b5e6d4b4-cb22-4411-a186-3c030b266435/scratch/node_modules/gif-encoder-2');

const DOCS_DIR = 'C:/Users/Lenovo/Desktop/Deep Packet Inspection/docs';
const SCREENSHOTS_DIR = path.join(DOCS_DIR, 'screenshots');
const OUTPUT_GIF = path.join(DOCS_DIR, 'dashboard_demo.gif');

const TARGET_WIDTH = 960;
const TARGET_HEIGHT = 540;

const SEQUENCE = [
  { file: '01_login.png', duration: 2400, label: '1. Secure Authentication & RBAC Login' },
  { file: '02_dashboard.png', duration: 3400, label: '2. Live System Dashboard & Real-Time DPI Traffic' },
  { file: '03_packets.png', duration: 3400, label: '3. Deep Layer 3/4 Packet Dissection & Inspection' },
  { file: '04_alerts.png', duration: 3400, label: '4. Autonomous Threat Detection & 1-Click Blacklist' },
  { file: '05_blacklist.png', duration: 2800, label: '5. Dynamic IP Blacklist & Firewall Management' },
  { file: '02_dashboard.png', duration: 2200, label: '6. NetMonitor Glassmorphic Interface' }
];

function downscale(srcPng, targetW, targetH) {
  const dstBuf = Buffer.alloc(targetW * targetH * 4);
  const xRatio = srcPng.width / targetW;
  const yRatio = srcPng.height / targetH;

  for (let y = 0; y < targetH; y++) {
    const srcY = Math.floor(y * yRatio);
    for (let x = 0; x < targetW; x++) {
      const srcX = Math.floor(x * xRatio);
      const srcIdx = (srcY * srcPng.width + srcX) * 4;
      const dstIdx = (y * targetW + x) * 4;
      dstBuf[dstIdx] = srcPng.data[srcIdx];
      dstBuf[dstIdx + 1] = srcPng.data[srcIdx + 1];
      dstBuf[dstIdx + 2] = srcPng.data[srcIdx + 2];
      dstBuf[dstIdx + 3] = srcPng.data[srcIdx + 3];
    }
  }
  return dstBuf;
}

async function main() {
  console.log('--- Generating Ultra-Low RAM Animated Walkthrough GIF ---');
  const startMem = process.memoryUsage().heapUsed / 1024 / 1024;
  console.log(`Initial memory: ${startMem.toFixed(2)} MB`);

  const encoder = new GIFEncoder(TARGET_WIDTH, TARGET_HEIGHT, 'neuquant', false);
  const writeStream = fs.createWriteStream(OUTPUT_GIF);
  encoder.createReadStream().pipe(writeStream);

  encoder.start();
  encoder.setRepeat(0); // Loop indefinitely
  encoder.setQuality(10); // High NeuQuant color fidelity

  for (let i = 0; i < SEQUENCE.length; i++) {
    const step = SEQUENCE[i];
    const imgPath = path.join(SCREENSHOTS_DIR, step.file);

    if (!fs.existsSync(imgPath)) {
      console.warn(`Warning: Image not found: ${imgPath}`);
      continue;
    }

    console.log(`[${i + 1}/${SEQUENCE.length}] Processing ${step.label} (${step.duration}ms)...`);
    const fileBuf = fs.readFileSync(imgPath);
    const png = PNG.sync.read(fileBuf);

    // Downscale with bilinear/nearest to 960x540 for minimal RAM and crisp display
    const downscaledBuffer = downscale(png, TARGET_WIDTH, TARGET_HEIGHT);

    encoder.setDelay(step.duration);
    encoder.addFrame(downscaledBuffer);

    const curMem = process.memoryUsage().heapUsed / 1024 / 1024;
    console.log(`    -> Frame encoded. Heap in use: ${curMem.toFixed(2)} MB`);
  }

  encoder.finish();
  await new Promise(resolve => writeStream.on('finish', resolve));

  const stats = fs.statSync(OUTPUT_GIF);
  const finalMem = process.memoryUsage().heapUsed / 1024 / 1024;
  console.log('----------------------------------------------------');
  console.log(`SUCCESS! Output saved to: ${OUTPUT_GIF}`);
  console.log(`File Size: ${(stats.size / 1024).toFixed(1)} KB`);
  console.log(`Final Heap Memory Used: ${finalMem.toFixed(2)} MB`);
  console.log('----------------------------------------------------');
}

main().catch(err => {
  console.error('Error generating GIF:', err);
  process.exit(1);
});
