const fs = require('fs-extra');
const path = require('path');
const nodeSrc = path.resolve(__dirname, '../redist/node.exe');
const pythonSrc = path.resolve(__dirname, '../redist/python.exe');
const outputDir = path.resolve(__dirname, '../release');
const backendSrc = path.resolve(__dirname, '../backend');
const venvSrc = path.resolve(__dirname, '../.venv');

async function prepareReleaseFolder() {
  // clean output folder
  await fs.remove(outputDir);
  await fs.ensureDir(outputDir);
  // copy node and python
  await fs.copy(nodeSrc, path.join(outputDir, 'node.exe'));
  await fs.copy(pythonSrc, path.join(outputDir, 'python.exe'));
  // copy tauri & DLL
  await fs.copy(path.resolve(__dirname, 'target/release/mieszkanieo.exe'), path.join(outputDir, 'mieszkanieo.exe'));
  await fs.copy(path.resolve(__dirname, 'target/release/WebView2Loader.dll'), path.join(outputDir, 'WebView2Loader.dll'));
  // copy backend &venv
  await fs.copy(backendSrc, path.join(outputDir, 'backend'));

  if (await fs.pathExists(venvSrc)) {
    await fs.copy(venvSrc, path.join(outputDir, '.venv'));
  }
  console.log('Release folder prepared:', outputDir);
}

prepareReleaseFolder().catch(err => {
  console.error('Packaging failed:', err);
  process.exit(1);
});
