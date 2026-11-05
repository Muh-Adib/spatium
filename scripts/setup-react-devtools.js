import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const electronDir = path.resolve('node_modules/electron');
const pathTxt = path.join(electronDir, 'path.txt');
const framework = path.join(electronDir, 'dist/Electron.app/Contents/Frameworks/Electron Framework.framework/Electron Framework');

if (fs.existsSync(electronDir) && !fs.existsSync(framework)) {
  const cachePath = path.resolve(process.env.HOME || '', 'Library/Caches/electron');
  try {
    if (fs.existsSync(cachePath)) {
      const zipFiles = execSync(`find "${cachePath}" -name "*.zip" | head -n 1`, { encoding: 'utf-8' }).trim();
      if (zipFiles) {
        fs.rmSync(path.join(electronDir, 'dist'), { recursive: true, force: true });
        fs.mkdirSync(path.join(electronDir, 'dist'), { recursive: true });
        execSync(`ditto -xk "${zipFiles}" "${path.join(electronDir, 'dist')}"`);
        fs.writeFileSync(pathTxt, 'Electron.app/Contents/MacOS/Electron');
      }
    }
  } catch (err) {
    console.warn('[React-DevTools] Note: electron setup encountered:', err.message);
  }
} else if (fs.existsSync(electronDir) && !fs.existsSync(pathTxt)) {
  fs.writeFileSync(pathTxt, 'Electron.app/Contents/MacOS/Electron');
}
