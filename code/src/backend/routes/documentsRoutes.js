const express = require("express");
const router = express.Router();
const authenticateToken = require("../config/authMiddleware");
const {
  getAllDocuments,
  getDocumentById,
  deleteDocument,
  uploadDocument,
  updateRules,
} = require("../controllers/documentsController");
const { upload } = require("../config/multer");

router.get("/", authenticateToken, getAllDocuments);
router.get("/:id", authenticateToken, getDocumentById);
router.delete("/:id", authenticateToken, deleteDocument);
router.post(
  "/upload",
  authenticateToken,
  upload.fields([
    { name: "instructionsFile", maxCount: 1 },
    { name: "datasetFile", maxCount: 1 },
  ]),
  uploadDocument
);
router.post("/update-rules/:id", authenticateToken, updateRules);
module.exports = router;
