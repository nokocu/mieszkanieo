const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Starting Python bundling process...');

const pythonPortableDir = path.join(__dirname, '..', 'python-portable');
const backendDir = path.join(__dirname, '..', 'backend');
const requirementsPath = path.join(backendDir, 'requirements.txt');

// clean existing python-portable directory
if (fs.existsSync(pythonPortableDir)) {
  console.log('Cleaning existing python-portable directory...');
  fs.rmSync(pythonPortableDir, { recursive: true, force: true });
}

try {
  // create python-portable directory
  fs.mkdirSync(pythonPortableDir, { recursive: true });
  
  console.log('Creating portable Python environment...');
  
  // create virtual environment in python-portable
  execSync(`python -m venv "${pythonPortableDir}"`, { stdio: 'inherit' });
  
  // determine python executable path in venv
  const pythonExe = path.join(pythonPortableDir, 'Scripts', 'python.exe');
  const pipExe = path.join(pythonPortableDir, 'Scripts', 'pip.exe');
  
  console.log('Installing Python dependencies...');
  
  // upgrade pip first
  execSync(`"${pipExe}" install --upgrade pip`, { stdio: 'inherit' });
  
  // install setuptools for distutils compatibility (python 3.13+)
  execSync(`"${pipExe}" install setuptools`, { stdio: 'inherit' });
  
  // install requirements
  execSync(`"${pipExe}" install -r "${requirementsPath}"`, { stdio: 'inherit' });
  
  console.log('Python bundling completed successfully');
  console.log(`Python portable created at: ${pythonPortableDir}`);
  
} catch (error) {
  console.error('Error bundling Python:', error.message);
  process.exit(1);
}
