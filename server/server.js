require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');

// Only initialize Firebase Admin in development environment
let admin;
let db;

if (process.env.NODE_ENV !== 'production') {
  try {
    admin = require('firebase-admin');
    const serviceAccount = require('./config/serviceAccountKey.json');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    db = admin.firestore();
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error);
  }
}

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Authentication middleware
const authenticateToken = async (req, res, next) => {
  // Skip authentication in production for now
  if (process.env.NODE_ENV === 'production') {
    return next();
  }
  
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Routes - only include in development
if (process.env.NODE_ENV !== 'production') {
  try {
    app.use('/api/auth', require('./routes/auth'));
    app.use('/api/stadiums', authenticateToken, require('./routes/stadiums'));
    app.use('/api/shops', authenticateToken, require('./routes/shops'));
    app.use('/api/orders', authenticateToken, require('./routes/orders'));
  } catch (error) {
    console.error('Error setting up routes:', error);
  }
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  // Set static folder
  app.use(express.static(path.join(__dirname, '../client/build')));

  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client/build', 'index.html'));
  });
}

// Export Firebase admin and db for use in other files
module.exports = { admin, db };

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
