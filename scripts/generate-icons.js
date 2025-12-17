// Simple icon generator: converts SVG icons in public/icons to PNGs using sharp
// DEV USAGE:
//   npm install
//   npm run generate:icons

import path from 'path';
import fs from 'fs';
import sharp from 'sharp';

const icons = [
  { src: 'public/icons/icon-192.svg', sizes: [192] },
  { src: 'public/icons/icon-512.svg', sizes: [512] },
];

(async () => {
  try {
    for (const icon of icons) {
      const svgPath = path.resolve(icon.src);
      if (!fs.existsSync(svgPath)) {
        console.warn('SVG not found:', svgPath);
        continue;
      }

      const svgBuffer = fs.readFileSync(svgPath);

      for (const size of icon.sizes) {
        const outPath = path.resolve(`public/icons/icon-${size}.png`);
        console.log(`Generating ${outPath} from ${svgPath}`);
        await sharp(svgBuffer).resize(size, size).png().toFile(outPath);
      }
    }

    console.log('Icon generation complete.');
  } catch (err) {
    console.error('Icon generation error:', err);
    process.exit(1);
  }
})();
