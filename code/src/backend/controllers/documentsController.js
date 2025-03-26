const { ObjectId } = require("mongodb");
const { getDatabase } = require("../config/database");
const { extractTextFromDocument } = require("../utils/file");
const {
  extractRegulatoryInstructions,
  updateInstructionRules,
} = require("../utils/llmAgents");

// Get All Documents for User
const getAllDocuments = async (req, res) => {
  try {
    const userId = req.user.userId;
    const database = getDatabase();
    const documentsCollection = database.collection("documents");

    const documents = await documentsCollection
      .find({ userId })
      .sort({ createdAt: -1 })
      .toArray();
    res.json(documents);
  } catch (err) {
    console.error("Error fetching documents:", err);
    res.status(500).json({ error: "Error fetching documents" });
  }
};

// Get Document by ID
const getDocumentById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    if (!ObjectId.isValid(id))
      return res.status(400).json({ error: "Invalid Document ID" });

    const database = getDatabase();
    const document = await database
      .collection("documents")
      .findOne({ _id: new ObjectId(String(id)), userId });

    if (!document) return res.status(404).json({ error: "Document not found" });

    res.json(document);
  } catch (err) {
    console.error("Error fetching document:", err);
    res.status(500).json({ error: "Error fetching document" });
  }
};

// Delete Document
const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    if (!ObjectId.isValid(id))
      return res.status(400).json({ error: "Invalid Document ID" });

    const database = getDatabase();
    const result = await database
      .collection("documents")
      .deleteOne({ _id: new ObjectId(String(id)), userId });
    res.send(result);
  } catch (err) {
    console.error("Error deleting document:", err);
    res.status(500).json({ error: "Error deleting document" });
  }
};

const uploadDocument = async (req, res) => {
  try {
    const database = getDatabase();
    const documentsCollection = database.collection("documents");
    const { name, description } = req.body;
    const userId = req.user.userId;
    const createdAt = Date.now();

    // Extract text from the document
    const {
      originalname,
      path: instructionFilePath,
      mimetype: instructionFileMimetype,
    } = req.files.instructionsFile[0];
    const fileText = await extractTextFromDocument(
      instructionFilePath,
      instructionFileMimetype
    );
    let csvDataSetPath = null;
    if (req.files?.datasetFile?.[0]) {
      csvDataSetPath = req.files?.datasetFile[0]?.path;
    }

    // Get regulatory instructions (if it fails, do not store the document)
    let regulatoryInstructions;
    try {
      regulatoryInstructions = await extractRegulatoryInstructions(
        fileText,
        csvDataSetPath,
        name
      );
    } catch (err) {
      console.error("Error processing text with OpenAI:", err);
      return res
        .status(500)
        .json({ error: "Failed to extract regulatory instructions." });
    }

    const document = await documentsCollection.insertOne({
      name,
      description,
      fileName: originalname,
      filePath: instructionFilePath,
      userId,
      createdAt,
      extractedRules: regulatoryInstructions,
    });

    res.json({
      message: "Document processed successfully",
      documentId: String(document.insertedId),
    });
  } catch (err) {
    console.error("Error processing the document:", err);
    res.status(500).json({ error: "Error processing the document" });
  }
};

const updateRules = async (req, res) => {
  try {
    const { id } = req.params;
    const database = getDatabase();
    const documentsCollection = database.collection("documents");
    const { updates } = req.body;
    const userId = req.user.userId;

    if (!ObjectId.isValid(id))
      return res.status(400).json({ error: "Invalid Document ID" });

    const document = await documentsCollection.findOne(
      {
        _id: new ObjectId(String(id)),
        userId,
      },
      { projection: { extractedRules: 1 } }
    );

    if (!document) return res.status(404).json({ error: "Document not found" });
    let extractedRules = await updateInstructionRules(
      JSON.stringify(document?.extractedRules),
      updates
    );
    await documentsCollection.updateOne(
      { _id: new ObjectId(String(id)), userId }, // Find the document by ID and userId
      { $set: { extractedRules: extractedRules } } // Update specific fields
    );
    res.json({
      message: "Document processed successfully",
    });
  } catch (err) {
    console.error("Error processing the document:", err);
    res.status(500).json({ error: "Error processing the document" });
  }
};

module.exports = {
  getAllDocuments,
  getDocumentById,
  deleteDocument,
  uploadDocument,
  updateRules,
  //uploadRegulatoryInstruction,
};
