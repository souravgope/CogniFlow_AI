import crypto from "crypto";
import jwt from "jsonwebtoken";
import bcryptjs from "bcryptjs";
import nodemailer from "nodemailer";
import { OAuth2Client } from "google-auth-library";
import User from "../models/User.js";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Helper to generate JWT
const generateToken = (id) => {
  const secret = process.env.JWT_SECRET || "super_secret_cyber_security_key_ai_workspace";
  return jwt.sign({ id }, secret, {
    expiresIn: "7d"
  });
};

// @desc    Register new user
// @route   POST /api/auth/signup
// @access  Public
export const signup = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Please provide name, email, and password." });
    }

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "Account already exists with this email address." });
    }

    // Hash password
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(password, salt);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      authProvider: "local"
    });

    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage,
        authProvider: user.authProvider,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error("❌ Sign up error:", error);
    res.status(500).json({ message: error.message || "Error registering account. Please try again." });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ message: "Please enter email and password." });
    }

    // Check for user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password credentials." });
    }

    // Google-only accounts cannot log in via password directly
    if (user.googleId && !user.password) {
      return res.status(400).json({ message: "This email is registered with Google. Please use Google Login." });
    }

    // Check password
    const isMatch = await bcryptjs.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password credentials." });
    }

    const token = generateToken(user._id);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage,
        authProvider: user.authProvider,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error("❌ Login error:", error);
    res.status(500).json({ message: error.message || "Error authenticating account." });
  }
};

// @desc    Google OAuth Auth
// @route   POST /api/auth/google
// @access  Public
export const googleAuth = async (req, res) => {
  const { token } = req.body;

  try {
    if (!token) {
      return res.status(400).json({ message: "No Google token provided." });
    }

    // Verify the Google ID token
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    if (!payload) {
      return res.status(400).json({ message: "Failed to extract Google profile information." });
    }

    const { email, name, sub: googleId, picture: profileImage } = payload;

    if (!email || !googleId) {
      return res.status(400).json({ message: "Google profile is missing essential attributes." });
    }

    // Look for user
    let user = await User.findOne({ email });

    const avatarUrl = profileImage || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name || email)}`;

    if (user) {
      // Connect Google ID to existing user account if not yet attached
      let needsSave = false;
      if (!user.googleId) {
        user.googleId = googleId;
        user.authProvider = "google";
        needsSave = true;
      }
      if (!user.profileImage) {
        user.profileImage = avatarUrl;
        needsSave = true;
      }
      if (needsSave) {
        await user.save();
      }
    } else {
      // Create new user without password
      user = await User.create({
        name: name || "Google User",
        email,
        googleId,
        profileImage: avatarUrl,
        authProvider: "google"
      });
    }

    const jwtToken = generateToken(user._id);

    res.json({
      token: jwtToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage,
        authProvider: user.authProvider,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error("❌ Google login error:", error);
    res.status(500).json({ message: error.message || "Error processing Google authentication." });
  }
};

// @desc    Logout User
// @route   POST /api/auth/logout
// @access  Public
export const logout = async (req, res) => {
  res.json({ message: "Session terminated successfully." });
};

function getClientOrigin() {
  const raw = process.env.CLIENT_ORIGIN || "http://localhost:5173";
  return String(raw)
    .split(",")
    .map((origin) => origin.trim())
    .find((origin) => origin.startsWith("http")) || "http://localhost:5173";
}

async function sendPasswordResetEmail(userEmail, resetUrl) {

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log("SMTP not configured");
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      // host: "smtp.gmail.com",
      // port: 587,
      // secure: false,
      // auth: {
      //   user: process.env.EMAIL_USER,
      //   pass: process.env.EMAIL_PASS
      // }
       service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
    });

    const mailOptions = {
      from: `"AI Workspace" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: "AI Workspace - Password Reset Link",
      text: `You requested a password reset.\n\n${resetUrl}`
    };

    await transporter.verify();
    await transporter.sendMail(mailOptions);

    console.log("📡 Password reset email sent successfully");
  } catch (err) {
    console.error("❌ Real SMTP Mail error:", err);
  }
}
// @desc    Forgot Password Request
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "No account found with this email address." });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString("hex");

    // Hash token and save to database
    user.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

    await user.save();

    const clientOrigin = getClientOrigin();
    const resetUrl = `${clientOrigin}/reset-password/${resetToken}`;

    res.json({ message: "A secure password reset link has been successfully dispatched to your email address." });

    // Send the email in the background so the API returns quickly.
    void sendPasswordResetEmail(user.email, resetUrl);
  } catch (error) {
    console.error("❌ Forgot password error:", error);
    res.status(500).json({ message: error.message || "Error generating reset token request." });
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password/:token
// @access  Public
export const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    if (!password) {
      return res.status(400).json({ message: "Please enter a new password." });
    }

    // Strict complexity requirements safeguard
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);

    if (password.length < 8 || !hasUpper || !hasNumber || !hasSpecial) {
      return res.status(400).json({
        message: "Password does not meet professional complexity guidelines. It must be at least 8 characters and contain uppercase letters, digits, and special characters."
      });
    }

    // Hash parameter token
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Find matching user with active token
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired password reset token." });
    }

    // Hash and save new password
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(password, salt);

    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({ message: "Password reset complete. You can now log in." });
  } catch (error) {
    console.error("❌ Reset password error:", error);
    res.status(500).json({ message: error.message || "Error resetting password." });
  }
};

// @desc    Get Current User Profile
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    res.json(req.user);
  } catch (error) {
    res.status(500).json({ message: "Error loading user profile details." });
  }
};
