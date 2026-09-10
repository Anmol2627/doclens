// Temporary fallback implementation due to Node.js 23 compatibility issues
// with canvas and pdfjs-dist native modules

import { spawn } from 'child_process';
import { writeFileSync, readFileSync, unlinkSync, existsSync, mkdirSync, readdirSync, rmdirSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

function isValidPDF(pdfData: Uint8Array): boolean {
  if (pdfData.length < 5) return false;
  const header = [0x25, 0x50, 0x44, 0x46, 0x2D]; // "%PDF-"
  for (let i = 0; i < 5; i++) {
    if (pdfData[i] !== header[i]) return false;
  }
  return true;
}

export async function convertServerSide(
  pdfBase64: string,
  conversion_config: { image_format?: string, height?: number, scale?: number, width?: number } = {},
  tempDir: string
): Promise<string[]> {
  //console.log('Conversion config received:', conversion_config);
  
  // Remove data URL prefix if present
  const base64Data = pdfBase64.replace(/^data:application\/pdf;base64,/, '');
  const pdfData = new Uint8Array(Buffer.from(base64Data, 'base64'));

  // Validate PDF header
  if (!isValidPDF(pdfData)) {
    throw new Error('Invalid PDF file: File does not contain valid PDF header');
  }

  // Create temporary files
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substr(2, 9);
  const pdfPath = join(tempDir, `temp_${timestamp}_${randomId}.pdf`);
  const outputDir = join(tempDir, `output_${timestamp}_${randomId}`);
  mkdirSync(outputDir, { recursive: true });
  const outputPrefix = join(outputDir, 'image');

  try {
    // Write PDF data to temporary file
    writeFileSync(pdfPath, pdfData);
    
    // Verify file was created
    if (!existsSync(pdfPath)) {
      throw new Error(`Failed to create temporary PDF file at ${pdfPath}`);
    }

    // Determine output format - default to PNG if not specified
    const format = conversion_config.image_format === 'image/jpeg' ? 'jpeg' : 'png';
    //console.log('Selected format:', format);
    
    // Build pdftoppm command arguments
    const args = [
      '-scale-to', conversion_config.width ? conversion_config.width.toString() : '1500', // Scale to width
    ];

    // Add explicit format flag
    if (format === 'jpeg') {
      args.push('-jpeg');
      args.push('-jpegopt', 'quality=95');
    } else {
      args.push('-png');
    }

    // Add input and output paths
    args.push(pdfPath, outputPrefix);


    // Execute pdftoppm
    return new Promise((resolve, reject) => {
      const pdftoppm = spawn('pdftoppm', args);
      
      let stderr = '';
      
      pdftoppm.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      pdftoppm.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`pdftoppm failed with code ${code}: ${stderr}`));
          return;
        }

        try {
          // List all files in the output directory
          const files = readdirSync(outputDir);
          //console.log('Files in output directory:', files);
          
          // Filter for image files and sort them
          const imageFiles = files
            .sort(); // Sort to ensure correct page order
          
          //console.log('Image files found:', imageFiles);
          
          // Read all image files
          const images: string[] = [];
          for (const file of imageFiles) {
            const imagePath = join(outputDir, file);
            const imageData = readFileSync(imagePath);
            const base64Image = imageData.toString('base64');
            const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
            const dataUrl = `data:${mimeType};base64,${base64Image}`;
            images.push(dataUrl);
            
            // Clean up the image file
            unlinkSync(imagePath);
          }
          unlinkSync(pdfPath);
          rmdirSync(outputDir);


          resolve(images);
        } catch (err) {
          reject(new Error(`Failed to read generated images: ${err}`));
        }
      });

      pdftoppm.on('error', (err) => {
        reject(new Error(`Failed to execute pdftoppm: ${err.message}`));
      });
    });

  } finally {
    // Clean up temporary PDF file
  }
} 