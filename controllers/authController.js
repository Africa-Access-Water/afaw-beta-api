const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const UserModel = require("../models/userModel");

const JWT_SECRET = process.env.JWT_SECRET || "supersecret"; 

// SIGN UP
const signup = async (req, res) => {
  try {
    const { 
      name, 
      email, 
      password,
      role 
    } = req.body;

    // Check required fields
    if ( !email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }

    // Check if user already exists
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) return res.status(400).json({ error: "Email already in use" });


    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Default avatar URL
    const defaultAvatar = "https://cdn-icons-png.flaticon.com/512/847/847969.png";

    // Create user with pending status
    const [newUser] = await UserModel.create({
      name,
      email,
      password: hashedPassword,
      role: role || "contributor",
      avatar_url: defaultAvatar,
      status: "pending"
    });

    res.status(201).json({ 
      message: "Registration request submitted successfully", 
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status,
        avatar_url: newUser.avatar_url
      }
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: "Failed to sign up" });
  }
};


// LOGIN
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await UserModel.findByEmail(email);
    if (!user) return res.status(400).json({ error: "Invalid email or password" });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ error: "Invalid email or password" });

    // Check if user's registration request is still pending
    if (user.status === "pending") {
      return res.status(403).json({ error: "Your registration request is still pending approval" });
    }

    // Check if user's registration request was rejected
    if (user.status === "rejected") {
      return res.status(403).json({ error: "Your registration request has been rejected" });
    }

    // generate JWT
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: "1d",
    });

    res.json({ message: "Login successful", token , 
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar_url: user.avatar_url
      }
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Failed to log in" });
  }
};

// GET PROFILE (protected route)
const getProfile = async (req, res) => {
  try {
    const user = await UserModel.findById(req.user.id);
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch profile" });
  }
};

// GET PENDING USERS (admin only)
const getPendingUsers = async (req, res) => {
  try {
    const pendingUsers = await UserModel.findPendingUsers();
    res.json({ 
      message: "Pending users fetched successfully",
      users: pendingUsers 
    });
  } catch (err) {
    console.error("Get pending users error:", err);
    res.status(500).json({ error: "Failed to fetch pending users" });
  }
};

// APPROVE USER (admin only)
const approveUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Check if user exists and is pending
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    if (user.status !== "pending") {
      return res.status(400).json({ error: "User is not in pending status" });
    }

    // Update user status to accepted
    const [updatedUser] = await UserModel.updateUserStatus(userId, "accepted");
    
    res.json({ 
      message: "User approved successfully",
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        status: updatedUser.status
      }
    });
  } catch (err) {
    console.error("Approve user error:", err);
    res.status(500).json({ error: "Failed to approve user" });
  }
};

// REJECT USER (admin only)
const rejectUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Check if user exists and is pending
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    if (user.status !== "pending") {
      return res.status(400).json({ error: "User is not in pending status" });
    }

    // Update user status to rejected
    const [updatedUser] = await UserModel.updateUserStatus(userId, "rejected");
    
    res.json({ 
      message: "User rejected successfully",
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        status: updatedUser.status
      }
    });
  } catch (err) {
    console.error("Reject user error:", err);
    res.status(500).json({ error: "Failed to reject user" });
  }
};

module.exports = { signup, login, getProfile, getPendingUsers, approveUser, rejectUser };
