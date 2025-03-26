require("dotenv").config();

const express = require("express");
const multer = require("multer");
const mammoth = require("mammoth");
const pdfParse = require("pdf-parse");
const xlsx = require("xlsx");
const { OpenAI } = require("openai");
const { MongoClient, ObjectId } = require("mongodb");
const path = require("path");
const cors = require("cors");
const fs = require("fs");
const csv = require("csv-parser");
const { exec } = require("child_process");
const { connectDB, getDatabase } = require("./config/database");
const Papa = require("papaparse");

// Import Routes
const authRoutes = require("./routes/authRoutes");
const documentsRoutes = require("./routes/documentsRoutes");

// Initialize Express app
const app = express();
const port = process.env.PORT || 3001;
// Express middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

// OpenAI setup
const openAIClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const uploadDataSet = multer({
  storage: multer.diskStorage({
    destination: (_, __, cb) => cb(null, "uploads/datasets/"),
    filename: (_, file, cb) => {
      if (!file.originalname) {
        return cb(new Error("Invalid file name"));
      }
      const sanitizedFileName = file.originalname
        .replace(/\s+/g, "_")
        .replace(/[^\w.-]/g, "");
      cb(null, `${Date.now()}-${sanitizedFileName}`);
    },
  }),
});

const extractPythonScript = async (extractedRules, csvHeaders, documentId) => {
  const prompt = `
  Generate a executable Python script(executed independently) that validates CSV rows based on these rules: ${JSON.stringify(
    extractedRules
  )}
  and flags incorrect rows.

  CSV will be having first row with header (${csvHeaders})

  The script should:
      Perform Data Validation & Profiling:
          Validate each CSV row based on the given rules and flag non-conforming rows.

          Provide automated explanations for flagged transactions to assist auditors.

          Suggest remediation actions for flagged records.

      Implement Unsupervised Machine Learning for Consistency Checks:

          Use clustering and anomaly detection techniques to identify inconsistent patterns in the data.

          Detect potential outliers or irregularities beyond rule-based validation.

      Adaptive Risk Scoring:

          Develop a risk scoring mechanism that evolves over time based on past regulatory violations and transaction trends.

          Continuously refine risk assessment based on historical patterns.

  What will be input of python script:

      sys.argv[1] : A path of CSV file containing transactional data.
      sys.argv[2] : A Name of CSV that has to be created.

  Expected Python Script Output:
      A csv report with with columns(${csvHeaders}) flagging non-compliant rows with explanations and suggested remediation. A risk score for each transaction that adapts based on historical data.

      Machine learning insights highlighting potential anomalies.    

  Ensure to Return ONLY the Python script without explanations or comments and also that the script is modular, efficient, and can be executed independently.
  `;
  console.log("prompt", prompt);
  try {
    const completion = await openAIClient.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });
    const responseText = completion.choices[0].message.content.trim();
    const codeMatch = responseText.match(/```python([\s\S]*?)```/);
    const generatedPythonCode = codeMatch ? codeMatch[1].trim() : responseText;
    const pythonScriptPath = `temp_script_${documentId}.py`;
    fs.writeFileSync(pythonScriptPath, generatedPythonCode);
    return pythonScriptPath;
  } catch (err) {
    console.error("Error processing text with GPT-4o-mini:", err);
    return [];
  }
};

const executePythonScript = async (
  scriptPath,
  filePath,
  outputFilePath,
  extractedRules,
  csvHeaders,
  id,
  retryCount = 3
) => {
  return new Promise((resolve, reject) => {
    exec(
      `python3 ${scriptPath} ${filePath} ${outputFilePath}`,
      async (error, stdout, stderr) => {
        if (error) {
          console.error(`Execution Error: ${error.message}`);
          if (retryCount > 0) {
            console.log(`Retrying execution... Attempts left: ${retryCount}`);
            // Regenerate the script and retry execution
            const newScriptPath = await extractPythonScript(
              extractedRules,
              csvHeaders,
              id
            );
            return resolve(
              executePythonScript(
                newScriptPath,
                filePath,
                outputFilePath,
                retryCount - 1
              )
            );
          }
          return reject(`Execution failed after retries: ${error.message}`);
        }

        if (stderr) {
          console.error(`Python Script Error: ${stderr}`);
        }

        console.log("Python script executed successfully.");
        resolve(stdout);
      }
    );
  });
};

connectDB().then(() => {
  const database = getDatabase();
  const documentsCollection = database.collection("documents");

  // Routes
  app.use("/api/auth", authRoutes);
  app.use("/api/documents", documentsRoutes);

  app.post(
    "/api/documents/:id/profile",
    uploadDataSet.single("file"),
    async (req, res) => {
      try {
        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
          return res.status(400).json({ error: "Invalid Document ID" });
        }

        const document = await documentsCollection.findOne(
          { _id: new ObjectId(id) },
          { projection: { extractedRules: 1 } } // Optimize query
        );

        if (!document) {
          return res.status(404).json({ error: "Document not found" });
        }

        const { extractedRules } = document;
        if (!Array.isArray(extractedRules) || extractedRules.length === 0) {
          return res.status(404).json({ error: "No rules found" });
        }

        // Handle CSV file
        if (!req.file) {
          return res.status(400).json({ error: "CSV file is required" });
        }

        //Read First Row of the CSV
        const filePath = req.file.path;
        let csvHeaders = null;
        if (filePath) {
          const csvData = fs.readFileSync(filePath, "utf8");
          const parsedData = Papa.parse(csvData, { header: true });
          if (parsedData.data.length > 0) {
            csvHeaders = Object.keys(parsedData.data[0]).join(",");
          }
        }

        const pythonScriptPath = await extractPythonScript(
          extractedRules,
          csvHeaders,
          id
        );
        if (!pythonScriptPath || !fs.existsSync(pythonScriptPath)) {
          return res
            .status(500)
            .json({ error: "Failed to generate Python script" });
        }

        const outputFilePath = `${id}.csv`;

        try {
          await executePythonScript(
            pythonScriptPath,
            filePath,
            outputFilePath,
            extractedRules,
            csvHeaders,
            id
          );
          res.setHeader("Content-Type", "text/csv");
          res.setHeader(
            "Content-Disposition",
            'attachment; filename="data.csv"'
          );
          res.download(outputFilePath, "data.csv", (err) => {
            if (err) {
              console.error("Error downloading file:", err);
              res.status(500).send("Error downloading file");
            }
            // Optional: Delete the file after sending
            fs.unlink(filePath, (err) => {
              if (err) console.error("Error deleting file:", err);
            });
          });
        } catch (error) {
          res
            .status(500)
            .json({ error: "Failed to process file after retries" });
        }
      } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    }
  );

  // Start server
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
});
