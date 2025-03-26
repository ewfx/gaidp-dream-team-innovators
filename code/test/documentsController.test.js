const request = require("supertest");
const { MongoMemoryServer } = require("mongodb-memory-server");
const { MongoClient, ObjectId } = require("mongodb");
const app = require("../server"); // Your Express server
const { getDatabase } = require("../config/database");
const { extractTextFromDocument } = require("../utils/file");
const {
  extractRegulatoryInstructions,
  updateInstructionRules,
} = require("../utils/llmAgents");

jest.mock("../config/database");
jest.mock("../utils/file");
jest.mock("../utils/llmAgents");

let mongoServer;
let db;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  // Connect to in-memory MongoDB
  const client = await MongoClient.connect(uri);
  db = client.db();
  getDatabase.mockReturnValue(db); // Mock database connection
});

afterAll(async () => {
  await mongoServer.stop();
});

// Mock JWT middleware for authorization
const mockAuthMiddleware = (req, res, next) => {
  req.user = { userId: "12345" };
  next();
};

app.use(mockAuthMiddleware);

// Sample Document Data
const documentData = {
  name: "Test Document",
  description: "This is a test document",
  fileName: "instructions.pdf",
  filePath: "/uploads/instructions.pdf",
  userId: "12345",
  createdAt: Date.now(),
  extractedRules: [{ rule: "Test Rule" }],
};

let documentId;

describe("🔹 Get All Documents", () => {
  beforeEach(async () => {
    const result = await db.collection("documents").insertOne(documentData);
    documentId = result.insertedId;
  });

  it("should return all documents for a user", async () => {
    const res = await request(app).get("/documents");

    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  });
});

describe("🔹 Get Document by ID", () => {
  it("should return a document by valid ID", async () => {
    const res = await request(app).get(`/documents/${documentId}`);

    expect(res.status).toBe(200);
    expect(res.body.name).toBe(documentData.name);
  });

  it("should return 404 for invalid document ID", async () => {
    const res = await request(app).get(`/documents/${new ObjectId()}`);

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Document not found");
  });

  it("should return 400 for invalid ObjectId format", async () => {
    const res = await request(app).get("/documents/invalid-id");

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Invalid Document ID");
  });
});

describe("🔹 Delete Document", () => {
  it("should delete a document successfully", async () => {
    const res = await request(app).delete(`/documents/${documentId}`);
    expect(res.status).toBe(200);
    expect(res.body.deletedCount).toBe(1);
  });

  it("should return 400 for invalid ObjectId format", async () => {
    const res = await request(app).delete("/documents/invalid-id");
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Invalid Document ID");
  });
});

describe("🔹 Upload Document", () => {
  it("should upload and process document successfully", async () => {
    extractTextFromDocument.mockResolvedValue("Sample extracted text");
    extractRegulatoryInstructions.mockResolvedValue([{ rule: "Rule 1" }]);

    const res = await request(app)
      .post("/documents/upload")
      .attach("instructionsFile", Buffer.from("test"), "test.pdf")
      .field("name", "Test Doc")
      .field("description", "Sample Description");

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Document processed successfully");
  });

  it("should return error if extraction fails", async () => {
    extractTextFromDocument.mockRejectedValue(
      new Error("Failed to process document")
    );

    const res = await request(app)
      .post("/documents/upload")
      .attach("instructionsFile", Buffer.from("test"), "test.pdf")
      .field("name", "Test Doc")
      .field("description", "Sample Description");

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Error processing the document");
  });
});

describe("🔹 Update Document Rules", () => {
  it("should update extracted rules successfully", async () => {
    const updates = [{ rule: "Updated Rule" }];
    updateInstructionRules.mockResolvedValue(updates);

    const res = await request(app)
      .put(`/documents/${documentId}/rules`)
      .send({ updates });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Document processed successfully");

    const updatedDoc = await db
      .collection("documents")
      .findOne({ _id: new ObjectId(documentId) });
    expect(updatedDoc.extractedRules).toEqual(updates);
  });

  it("should return 404 for non-existing document", async () => {
    const res = await request(app)
      .put(`/documents/${new ObjectId()}/rules`)
      .send({ updates: [{ rule: "Updated Rule" }] });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Document not found");
  });

  it("should return 400 for invalid ObjectId format", async () => {
    const res = await request(app)
      .put("/documents/invalid-id/rules")
      .send({ updates: [{ rule: "Updated Rule" }] });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Invalid Document ID");
  });
});
