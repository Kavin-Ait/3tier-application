const express = require('express');
const { MongoClient } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 4000;

const MONGO_URI = process.env.MONGO_URI || 'mongodb://db:27017';
const MONGO_DB_NAME = process.env.MONGO_DB_NAME || 'veltech_exercise';

let dbClient;

async function connectDb() {
  try {
    dbClient = new MongoClient(MONGO_URI);
    await dbClient.connect();
    console.log('Connected to MongoDB at', MONGO_URI);
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
  }
}

connectDb();

// Health check endpoint - used for container/orchestration health checks
app.get('/health', (req, res) => {
  res.status(200).json({ status: '200 ok' });
});

// Simple hello endpoint
app.get('/api/hello', (req, res) => {
  res.status(200).json({ message: 'hello' });
});

app.listen(PORT, () => {
  console.log(`API service listening on port ${PORT}`);
});
