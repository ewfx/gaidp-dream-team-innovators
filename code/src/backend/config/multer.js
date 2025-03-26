const multer = require("multer");
const fs = require("fs");
const path = require("path");

// Function to check and create a folder if it doesn't exist
const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = "uploads/"; // Default path

    // Use switch case for different file types
    switch (file.fieldname) {
      case "instructionsFile":
        uploadPath = "uploads/instructions/";
        break;
      case "datasetFile":
        uploadPath = "uploads/datasets/";
        break;
      default:
        uploadPath = "uploads/";
        break;
    }

    // Ensure directory exists
    ensureDirectoryExists(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    let prefix = Date.now(); // Default prefix

    // Use switch case to modify filename (if needed)
    switch (file.fieldname) {
      case "instructionsFile":
        prefix = `instructions-${Date.now()}`;
        break;
      case "datasetFile":
        prefix = `dataset-${Date.now()}`;
        break;
      default:
        prefix = `file-${Date.now()}`;
        break;
    }

    cb(null, `${prefix}-${file.originalname}`);
  },
});

const upload = multer({ storage });

module.exports = { upload };
