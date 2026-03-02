const fs = require('fs');
const path = require('path');

// Create fonts directory if it doesn't exist
const fontsDir = path.join(process.cwd(), 'public', 'fonts');
if (!fs.existsSync(fontsDir)) {
  fs.mkdirSync(fontsDir, { recursive: true });
}

// Copy fonts from node_modules
const robotoPath = path.join(process.cwd(), 'node_modules', '@fontsource', 'roboto', 'files');
const fontFiles = {
  'roboto-latin-400-normal.ttf': 'Roboto-Regular.ttf',
  'roboto-latin-500-normal.ttf': 'Roboto-Medium.ttf',
  'roboto-latin-700-normal.ttf': 'Roboto-Bold.ttf'
};

Object.entries(fontFiles).forEach(([src, dest]) => {
  const sourcePath = path.join(robotoPath, src);
  const destPath = path.join(fontsDir, dest);
  if (fs.existsSync(sourcePath)) {
    fs.copyFileSync(sourcePath, destPath);
    console.log(`Copied ${src} to ${dest}`);
  } else {
    console.error(`Source file not found: ${sourcePath}`);
  }
});