const mammoth = require("mammoth");
const pdfParse = require("pdf-parse");
const xlsx = require("xlsx");
const fs = require("fs");

const extractTextFromDocument = async (filePath, mimetype) => {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    if (mimetype === "application/pdf") {
      const { text } = await pdfParse(fileBuffer);
      return text;
    }
    if (
      mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      const { value } = await mammoth.extractRawText({ buffer: fileBuffer });
      return value;
    }
    if (mimetype === "text/csv") {
      const workbook = xlsx.readFile(filePath);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      return xlsx.utils.sheet_to_csv(sheet);
    }
    if (mimetype === "text/plain") {
      return fs.readFileSync(filePath, "utf-8");
    }
    return "";
  } catch (err) {
    console.error("Error extracting text:", err);
    return "";
  }
};
module.exports = { extractTextFromDocument };
