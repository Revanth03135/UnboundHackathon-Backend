require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const User = require('./models/User');
const Rule = require('./models/Rule');

// Initialize App
const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to Database
connectDB();

// --- SEEDING (Runs on startup) ---
const seedData = async () => {
  try {
    // 1. Seed Admin
    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
      await User.create({ username: 'SuperAdmin', apiKey: 'admin-secret-123', role: 'admin', credits: 999 });
      console.log('✅ Seeded Admin: admin-secret-123');
    }
  
    // 2. Seed Default Rules
    const rulesCount = await Rule.countDocuments();
    if (rulesCount === 0) {
      await Rule.create([
        { pattern: 'rm\\s+-rf\\s+/', action: 'AUTO_REJECT' },
        { pattern: 'git\\s+status', action: 'AUTO_ACCEPT' },
        { pattern: '^ls', action: 'AUTO_ACCEPT' }
      ]);
      console.log('✅ Seeded Default Rules');
    }
  } catch (err) {
    console.log("⚠️ Seeding Warning:", err.message);
  }
};
// Run Seeder
seedData();

// --- MOUNT ROUTES ---
// This connects your api.js to the app
app.use('/api', require('./routes/api'));

// Start Server
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));