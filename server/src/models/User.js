import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/, "Please fill a valid email address"]
  },
  password: {
    type: String,
    required: function() {
      // Password is only required if googleId is not present
      return !this.googleId;
    }
  },
  googleId: {
    type: String,
    sparse: true
  },
  profileImage: {
    type: String
  },
  authProvider: {
    type: String,
    enum: ["local", "google"],
    default: "local"
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const User = mongoose.model("User", userSchema);

export default User;
