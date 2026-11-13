const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const inputPath = path.join(__dirname, 'public', 'logo.webp');

async function generateIcons() {
  try {
    if (!fs.existsSync(inputPath)) {
      console.error("Error: public/logo.webp not found.");
      return;
    }

    console.log('Generating icons from public/logo.webp...');

    // Generate 192x192 for Android
    await sharp(inputPath)
      .resize(192, 192, { fit: 'contain', background: { r: 10, g: 10, b: 10, alpha: 1 } })
      .toFile(path.join(__dirname, 'public', 'pwa-192x192.png'));
      
    // Generate 512x512 for Android
    await sharp(inputPath)
      .resize(512, 512, { fit: 'contain', background: { r: 10, g: 10, b: 10, alpha: 1 } })
      .toFile(path.join(__dirname, 'public', 'pwa-512x512.png'));

    // Generate 180x180 for Apple iOS (Apple strictly requires this specific size and PNG format)
    await sharp(inputPath)
      .resize(180, 180, { fit: 'contain', background: { r: 10, g: 10, b: 10, alpha: 1 } })
      .toFile(path.join(__dirname, 'public', 'apple-touch-icon.png'));

    console.log('Successfully generated pwa-192x192.png, pwa-512x512.png, and apple-touch-icon.png!');
  } catch (error) {
    console.error('Error generating icons:', error);
  }
}

generateIcons();