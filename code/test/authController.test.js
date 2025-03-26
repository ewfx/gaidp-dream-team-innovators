const request = require("supertest");
const { MongoMemoryServer } = require("mongodb-memory-server");
const { MongoClient } = require("mongodb");
const app = require("../server"); // Your Express server
const { getDatabase } = require("../config/database");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

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

// Mock JWT secret
process.env.JWT_SECRET = "testsecret";

// Sample User Data
const userData = {
  name: "John Doe",
  email: "john@example.com",
  password: "password123",
};

describe("🔹 User Signup", () => {
  it("should register a new user successfully", async () => {
    const res = await request(app).post("/signup").send(userData);
    expect(res.status).toBe(201);
    expect(res.body.message).toBe("User registered successfully");
  });

  it("should not allow duplicate registration", async () => {
    await db.collection("users").insertOne({
      ...userData,
      password: await bcrypt.hash(userData.password, 10),
    });

    const res = await request(app).post("/signup").send(userData);
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("User already exists");
  });
});

describe("🔹 User Login", () => {
  it("should login with valid credentials", async () => {
    await db.collection("users").insertOne({
      ...userData,
      password: await bcrypt.hash(userData.password, 10),
    });

    const res = await request(app).post("/login").send({
      email: userData.email,
      password: userData.password,
    });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Login successful");
    expect(res.body.token).toBeDefined();
  });

  it("should return error for invalid email", async () => {
    const res = await request(app).post("/login").send({
      email: "wrong@example.com",
      password: userData.password,
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Invalid email or password");
  });

  it("should return error for invalid password", async () => {
    const res = await request(app).post("/login").send({
      email: userData.email,
      password: "wrongpassword",
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Invalid email or password");
  });
});

describe("🔹 Forgot Password", () => {
  it("should generate a reset token for valid email", async () => {
    await db.collection("users").insertOne({
      ...userData,
      password: await bcrypt.hash(userData.password, 10),
    });

    const res = await request(app).post("/forgot-password").send({
      email: userData.email,
    });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Password reset token generated");
    expect(res.body.resetToken).toBeDefined();
  });

  it("should return error for invalid email", async () => {
    const res = await request(app).post("/forgot-password").send({
      email: "wrong@example.com",
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Email not found");
  });
});

describe("🔹 Reset Password", () => {
  let resetToken;

  beforeAll(async () => {
    const user = await db.collection("users").insertOne({
      ...userData,
      password: await bcrypt.hash(userData.password, 10),
    });

    resetToken = jwt.sign({ userId: user.insertedId }, process.env.JWT_SECRET, {
      expiresIn: "10m",
    });
  });

  it("should reset password with valid token", async () => {
    const res = await request(app).post("/reset-password").send({
      token: resetToken,
      newPassword: "newpassword123",
    });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Password reset successful");

    const user = await db
      .collection("users")
      .findOne({ email: userData.email });
    const isMatch = await bcrypt.compare("newpassword123", user.password);
    expect(isMatch).toBe(true);
  });

  it("should return error for invalid or expired token", async () => {
    const res = await request(app).post("/reset-password").send({
      token: "invalidtoken",
      newPassword: "newpassword123",
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Invalid or expired token");
  });
});
