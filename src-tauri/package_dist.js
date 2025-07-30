const fs = require('fs-extra');
const path = require('path');

const releaseDir = path.resolve(__dirname, 'target/release');
const outputDir = path.join(releaseDir, 'mieszkanieo');
const backendSrc = path.resolve(__dirname, '../backend');

async function prepareReleaseFolder() {
  await fs.remove(outputDir);
  await fs.ensureDir(outputDir);
  await fs.copy(path.join(releaseDir, 'mieszkanieo.exe'), path.join(outputDir, 'mieszkanieo.exe'));
  await fs.copy(path.join(releaseDir, 'WebView2Loader.dll'), path.join(outputDir, 'WebView2Loader.dll'));
  await fs.copy(backendSrc, path.join(outputDir, 'backend'));
  const venvSrc = path.resolve(__dirname, '../.venv');
  if (await fs.pathExists(venvSrc)) {
    await fs.copy(venvSrc, path.join(outputDir, '.venv'));
  }
  console.log('Release folder prepared:', outputDir);
}

prepareReleaseFolder().catch(err => {
  console.error('Packaging failed:', err);
  process.exit(1);
});
