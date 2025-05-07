// index.js
const express = require('express');
const bodyParser = require('body-parser');
const revolutRoutes = require('./server'); // Import your Revolut payment routes
require('dotenv').config(); // Load environment variables from .env file

// Initialize the Express app
const app = express();

// Middleware to parse incoming JSON requests
app.use(bodyParser.json());

// Define routes for Revolut API
app.use('/api/revolut', revolutRoutes); // Routes for Revolut payments

// Define a default route (optional, but good for testing)
app.get('/', (req, res) => {
  res.send('Server is running!');
});

// Set the port from environment variables, or default to 5000
const PORT = process.env.PORT || 5000;

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
