const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');
const crypto = require('crypto');

const projectRoot = process.cwd().replace(/\\/g, '/');
const pdfjsPath = projectRoot + '/node_modules/pdfjs-dist/legacy/build/pdf.mjs';
const tempId = crypto.randomUUID();
const scriptPath = path.join(os.tmpdir(), `test-${tempId}.mjs`);
const outPath = path.join(os.tmpdir(), `out-${tempId}.txt`).replace(/\\/g, '/');

// Create a simple PDF-like test: just verify pdfjs loads and getDocument exists
const script = `
import { readFileSync, writeFileSync } from 'fs';
const pdfjsLib = await import('file:///${pdfjsPath}');
const { getDocument } = pdfjsLib;
console.log('getDocument type:', typeof getDocument);
writeFileSync('${outPath}', 'SUCCESS: pdfjs loaded, getDocument is ' + typeof getDocument);
`;

fs.writeFileSync(scriptPath, script);
console.log('Script written to:', scriptPath);
console.log('Running...');

try {
  const result = execSync(`node ${scriptPath}`, { timeout: 15000, cwd: projectRoot });
  console.log('stdout:', result.toString());
  const out = fs.readFileSync(outPath.replace(/\//g, '\\'), 'utf-8');
  console.log('Output file content:', out);
} catch(e) {
  console.log('STDERR:', e.stderr?.toString());
  console.log('Error:', e.message);
}
