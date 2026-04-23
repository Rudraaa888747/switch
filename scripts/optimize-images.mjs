import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const assetsDir = path.resolve('src/assets');

async function optimizeImages() {
  const files = fs.readdirSync(assetsDir);
  
  for (const file of files) {
    if (file.match(/\.(png|jpe?g)$/i)) {
      const inputPath = path.join(assetsDir, file);
      const outputName = file.replace(/\.(png|jpe?g)$/i, '.webp');
      const outputPath = path.join(assetsDir, outputName);
      
      console.log(`Optimizing ${file} -> ${outputName}`);
      
      let pipeline = sharp(inputPath);
      
      // Resize hero banner to maximum 1344 width as suggested by Lighthouse
      if (file.includes('hero-banner')) {
        pipeline = pipeline.resize({ width: 1344, withoutEnlargement: true });
      }
      
      await pipeline
        .webp({ quality: 80, effort: 6 })
        .toFile(outputPath);
    }
  }
  console.log('Done optimizing images.');
}

optimizeImages().catch(console.error);
