require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// Body parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Start server function (called after we know if MongoDB is available)
function startServer(mongoAvailable) {
  const sessionConfig = {
    secret: process.env.SESSION_SECRET || 'mynonna_dev_secret',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 7 * 24 * 60 * 60 * 1000, httpOnly: true }
  };

  if (mongoAvailable) {
    sessionConfig.store = MongoStore.create({ mongoUrl: process.env.MONGODB_URI, touchAfter: 24 * 3600 });
    console.log('Sessions backed by MongoDB');
  } else {
    console.warn('Using in-memory session store (data resets on restart)');
  }

  app.use(session(sessionConfig));

  // API Routes
  app.use('/api/auth',     require('./routes/auth'));
  app.use('/api/recipes',  require('./routes/recipes'));
  app.use('/api/personas', require('./routes/personas'));
  app.use('/api/family',   require('./routes/family'));
  app.use('/api/tts',      require('./routes/tts'));
  app.use('/api/openai',   require('./routes/openai'));

  // SPA fallback
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });

  app.listen(PORT, () => {
    console.log(`MyNonna running at http://localhost:${PORT}`);
  });
}

// Try MongoDB, then start regardless
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB Atlas');
    startServer(true);
  })
  .catch(err => {
    console.warn('MongoDB unavailable, running offline:', err.message);
    startServer(false);
  });

