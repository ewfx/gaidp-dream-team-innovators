const { getDatabase } = require("../config/database");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;

// 🔹 User Signup
const signup = async (req, res) => {
  try {
    const database = getDatabase();
    const usersCollection = database.collection("users");

    const { name, email, password } = req.body;

    // Check if the user already exists
    const existingUser = await usersCollection.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    // Hash password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save user to database
    await usersCollection.insertOne({ name, email, password: hashedPassword });

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// 🔹 User Login
const login = async (req, res) => {
  try {
    const database = getDatabase();
    const usersCollection = database.collection("users");

    const { email, password } = req.body;

    // Check if user exists
    const user = await usersCollection.findOne({ email });
    if (!user)
      return res.status(400).json({ message: "Invalid email or password" });

    // Compare hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid email or password" });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email, name: user.name },
      JWT_SECRET,
      {
        expiresIn: "3h",
      }
    );

    res.status(200).json({ message: "Login successful", token });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// 🔹 Forgot Password (Send Reset Link)
const forgotPassword = async (req, res) => {
  try {
    const database = getDatabase();
    const usersCollection = database.collection("users");

    const { email } = req.body;

    // Check if user exists
    const user = await usersCollection.findOne({ email });
    if (!user) return res.status(400).json({ message: "Email not found" });

    // Generate a reset token (valid for 10 minutes)
    const resetToken = jwt.sign({ userId: user._id }, JWT_SECRET, {
      expiresIn: "10m",
    });

    // In real-world, send the resetToken via email (for now, just return it)
    res
      .status(200)
      .json({ message: "Password reset token generated", resetToken });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// 🔹 Reset Password
const resetPassword = async (req, res) => {
  try {
    const database = getDatabase();
    const usersCollection = database.collection("users");

    const { token, newPassword } = req.body;

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded)
      return res.status(400).json({ message: "Invalid or expired token" });

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password in the database
    await usersCollection.updateOne(
      { _id: decoded.userId },
      { $set: { password: hashedPassword } }
    );

    res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

module.exports = { signup, login, forgotPassword, resetPassword };
