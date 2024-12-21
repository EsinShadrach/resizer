import fs from "fs";
import path from "path";
import sharp from "sharp";

const dimensionRegex = /(\d+)\s*[×x]\s*(\d+)\s*(?:px)?/i;

// Supported App Store Connect dimensions
function extractDimensions(input: string) {
  const matches = input.match(dimensionRegex);
  if (matches) {
    const width = parseInt(matches[1]);
    const height = parseInt(matches[2]);
    return { width, height };
  }

  return null;
}

const supportedDimensions = [
  "2064 × 2752px",
  "2752 × 2064px",
  "2048 × 2732px",
  "2732 × 2048px",
];

const SUPPORTED_SIZES = supportedDimensions
  .map(extractDimensions)
  .filter((dimension) => dimension !== null);

/**
 * Resize images to App Store Connect dimensions
 * @param {string} inputFolder - Path to source images
 * @param {string} outputFolder - Path to save resized images
 */
async function resizeImagesForAppStore(
  inputFolder: string,
  outputFolder: string
) {
  // Ensure output folder exists
  if (!fs.existsSync(outputFolder)) {
    fs.mkdirSync(outputFolder, { recursive: true });
  }

  // Read input folder
  const files = fs.readdirSync(inputFolder);

  // Process each file
  for (const file of files) {
    const inputPath = path.join(inputFolder, file);
    const ext = path.extname(file);
    const baseName = path.basename(file, ext);

    // Check if it's an image file
    if (
      [".png", ".jpg", ".jpeg", ".tiff", ".bmp"].includes(ext.toLowerCase())
    ) {
      try {
        // Read the input image
        const inputImage = sharp(inputPath);

        // Get original image metadata
        const metadata = await inputImage.metadata();

        // Resize to each supported dimension
        for (const size of SUPPORTED_SIZES) {
          console.log(`Processing ${file} for ${size?.width}x${size?.height}`);

          if (size === null) return;

          const outputFileName = `${baseName}_${size.width}x${size.height}${ext}`;
          const outputPath = path.join(outputFolder, outputFileName);

          // Resize and save image
          await inputImage
            .resize({
              width: size.width,
              height: size.height,
              fit: "contain", // Crop to fill entire dimensions
              background: { r: 143, g: 44, b: 235, alpha: 1 }, // Purple background
              position: "center", // Center the image during cropping
            })
            .toFile(outputPath);

          console.log(`Resized ${file} to ${size.width}x${size.height}`);
        }
      } catch (error) {
        console.error(`Error processing ${file}:`, error);
      }
    }
  }
}

// Example usage
const inputFolder = "./source-images"; // Replace with your source images folder
const outputFolder = "./resized-images-ipad"; // Replace with your output folder

// Run the resize function
resizeImagesForAppStore(inputFolder, outputFolder)
  .then(() => console.log("Image resizing complete!"))
  .catch((error) => console.error("Error in image resizing:", error));

