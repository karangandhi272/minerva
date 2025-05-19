const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const Minerva = require('mcgill-minerva-api');
const jwt = require('jsonwebtoken');

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'minerva-app-jwt-secret';

// Middleware
app.use(cors());
app.use(express.json());

// Check if environment variables are set
if (!process.env.MG_USER || !process.env.MG_PASS) {
  console.error('Error: McGill credentials not set in .env file');
  process.exit(1);
}

// Initialize Minerva client with error handling
let minerva;
try {
  minerva = new Minerva(process.env.MG_USER, process.env.MG_PASS);
} catch (error) {
  console.error('Error initializing Minerva client:', error);
  process.exit(1);
}

// Authentication middleware
const authenticateToken = (req, res, next) => {
  // Get authorization header from the request
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"
  
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  try {
    // Verify the token
    const user = jwt.verify(token, JWT_SECRET);
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Global error handler middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Minerva API Backend', status: 'online' });
});

// Authentication endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Input validation
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    
    // Attempt to create a new Minerva instance with the provided credentials
    // If this succeeds, the credentials are valid
    let userMinerva;
    try {
      userMinerva = new Minerva(username, password);
      
      // Try a basic operation to verify the credentials fully
      // This will throw an error if authentication fails
      await userMinerva.getTranscript();
    } catch (error) {
      console.error('Authentication failed:', error);
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    
    // If we get here, authentication was successful
    // Create a JWT token with username and password
    const token = jwt.sign({ username, password }, JWT_SECRET, { expiresIn: '7d' }); 
    
    // Return the token to the client
    res.json({ 
      message: 'Authentication successful',
      token,
      user: { username }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Authentication failed', 
      message: error.message || 'Unknown error'
    });
  }
});

// User info endpoint
app.get('/api/user', authenticateToken, (req, res) => {
  // This endpoint is protected by the authenticateToken middleware
  // The middleware already verified the token and added the user to req.user
  res.json({ 
    username: req.user.username,
    name: req.user.name || 'McGill Student', // Placeholder, you could fetch this from another source
  });
});

// Get transcript (POST version that accepts credentials in body)
app.post('/api/transcript', authenticateToken, async (req, res) => {
  try {
    // Get credentials from body or token
    const username = req.body.username || req.user.username;
    const password = req.body.password || req.user.password;
    
    // Create a new Minerva instance with the provided credentials
    const userMinerva = new Minerva(username, password);
    
    const transcript = await userMinerva.getTranscript();
    
    // Validate transcript data
    if (!transcript || !Array.isArray(transcript)) {
      return res.status(500).json({ error: 'Invalid transcript data received' });
    }
    
    // Calculate CUM GPA
    let totalGradePoints = 0;
    let totalCredits = 0;
    
    transcript.forEach(course => {
      if (course.grade && course.credit) {
        const gradePoint = convertGradeToPoints(course.grade);
        const credits = parseFloat(course.credit);
        
        if (!isNaN(gradePoint) && !isNaN(credits)) {
          totalGradePoints += gradePoint * credits;
          totalCredits += credits;
        }
      }
    });
    
    const cumGPA = totalCredits > 0 ? (totalGradePoints / totalCredits).toFixed(2) : 'N/A';
    
    res.json({
      cumGPA,
      courses: transcript
    });
  } catch (error) {
    console.error('Error fetching transcript:', error);
    res.status(500).json({ 
      error: 'Failed to fetch transcript', 
      message: error.message || 'Unknown error',
      code: error.code || 'UNKNOWN_ERROR'
    });
  }
});

// Keep the original GET endpoint for backward compatibility
app.get('/api/transcript', authenticateToken, async (req, res) => {
  try {
    // Get credentials from query params or token
    const username = req.query.username || req.user.username;
    const password = req.query.password || req.user.password;
    
    // Create a new Minerva instance with the provided credentials
    const userMinerva = new Minerva(username, password);
    
    const transcript = await userMinerva.getTranscript();
    
    // Validate transcript data
    if (!transcript || !Array.isArray(transcript)) {
      return res.status(500).json({ error: 'Invalid transcript data received' });
    }
    
    // Calculate CUM GPA
    let totalGradePoints = 0;
    let totalCredits = 0;
    
    transcript.forEach(course => {
      if (course.grade && course.credit) {
        const gradePoint = convertGradeToPoints(course.grade);
        const credits = parseFloat(course.credit);
        
        if (!isNaN(gradePoint) && !isNaN(credits)) {
          totalGradePoints += gradePoint * credits;
          totalCredits += credits;
        }
      }
    });
    
    const cumGPA = totalCredits > 0 ? (totalGradePoints / totalCredits).toFixed(2) : 'N/A';
    
    res.json({
      cumGPA,
      totalCredits,
      courses: transcript
    });
  } catch (error) {
    console.error('Error fetching transcript:', error);
    res.status(500).json({ 
      error: 'Failed to fetch transcript', 
      message: error.message || 'Unknown error',
      code: error.code || 'UNKNOWN_ERROR'
    });
  }
});

// Search for courses
app.get('/api/courses', authenticateToken, async (req, res) => {
  try {
    const dep= req.body.dep;
    const number =  req.body.number
    const season = req.body.season
    const year = req.body.year;
    const username = req.body.username || req.user.username;
    const password = req.body.password || req.user.password;
    
    // Input validation
    if (!dep) {
      return res.status(400).json({ error: 'Department is required' });
    }

    if (!season || !['f', 'w', 's'].includes(season.toLowerCase())) {
      return res.status(400).json({ error: 'Valid season is required (f, w, s)' });
    }

    if (!year || !/^\d{4}$/.test(year)) {
      return res.status(400).json({ error: 'Valid 4-digit year is required' });
    }

    if (number && !/^\d{1,3}[A-Z]?\d?$/.test(number)) {
      return res.status(400).json({ error: 'Course number format is invalid' });
    }
    
    // Create a new Minerva instance with the user's credentials
    const userMinerva = new Minerva(username, password);
    
    const options = {
      dep: dep.toUpperCase(),
      season: season.toLowerCase(),
      year
    };
    
    if (number) {
      options.number = number;
    }
    
    const courses = await userMinerva.getCourses(options);

    
    // Validate courses data
    if (!courses || !Array.isArray(courses)) {
      return res.status(500).json({ error: 'Invalid course data received' });
    }
    
    res.json(courses);
  } catch (error) {
    console.error('Error searching for courses:', error);
    res.status(500).json({ 
      error: 'Failed to search for courses', 
      message: error.message || 'Unknown error',
      code: error.code || 'UNKNOWN_ERROR'
    });
  }
});

// Add courses
app.post('/api/courses/add', authenticateToken, async (req, res) => {
  try {
    const { season, year, crn } = req.body;
    
    // Input validation
    if (!season || !['f', 'w', 's'].includes(season.toLowerCase())) {
      return res.status(400).json({ error: 'Valid season is required (f, w, s)' });
    }

    if (!year || !/^\d{4}$/.test(year)) {
      return res.status(400).json({ error: 'Valid 4-digit year is required' });
    }

    if (!crn) {
      return res.status(400).json({ error: 'CRN is required' });
    }

    // Validate CRN format - can be a string or array of strings
    let crnArray = Array.isArray(crn) ? crn : [crn];
    for (const crnItem of crnArray) {
      if (!/^\d+$/.test(crnItem)) {
        return res.status(400).json({ error: `Invalid CRN format: ${crnItem}` });
      }
    }
    
    // Create a new Minerva instance with the user's credentials
    const userMinerva = new Minerva(req.user.username, req.user.password);
    
    const result = await userMinerva.addCourses({
      season: season.toLowerCase(),
      year,
      crn
    });
    
    if (!result) {
      return res.status(500).json({ error: 'Failed to add course - no result returned' });
    }
    
    res.json({ success: true, result });
  } catch (error) {
    console.error('Error adding courses:', error);
    res.status(500).json({ 
      error: 'Failed to add courses', 
      message: error.message || 'Unknown error',
      code: error.code || 'UNKNOWN_ERROR'
    });
  }
});

// Drop courses
app.post('/api/courses/drop', authenticateToken, async (req, res) => {
  try {
    const { season, year, crn } = req.body;
    
    // Input validation
    if (!season || !['f', 'w', 's'].includes(season.toLowerCase())) {
      return res.status(400).json({ error: 'Valid season is required (f, w, s)' });
    }

    if (!year || !/^\d{4}$/.test(year)) {
      return res.status(400).json({ error: 'Valid 4-digit year is required' });
    }

    if (!crn) {
      return res.status(400).json({ error: 'CRN is required' });
    }

    // Validate CRN format - can be a string or array of strings
    let crnArray = Array.isArray(crn) ? crn : [crn];
    for (const crnItem of crnArray) {
      if (!/^\d+$/.test(crnItem)) {
        return res.status(400).json({ error: `Invalid CRN format: ${crnItem}` });
      }
    }
    
    // Create a new Minerva instance with the user's credentials
    const userMinerva = new Minerva(req.user.username, req.user.password);
    
    const result = await userMinerva.dropCourses({
      season: season.toLowerCase(),
      year,
      crn
    });
    
    if (!result) {
      return res.status(500).json({ error: 'Failed to drop course - no result returned' });
    }
    
    res.json({ success: true, result });
  } catch (error) {
    console.error('Error dropping courses:', error);
    res.status(500).json({ 
      error: 'Failed to drop courses', 
      message: error.message || 'Unknown error',
      code: error.code || 'UNKNOWN_ERROR'
    });
  }
});

// Helper function to convert letter grades to grade points
function convertGradeToPoints(grade) {
  if (!grade || typeof grade !== 'string') {
    return null;
  }
  
  const gradeMap = {
    'A': 4.0,
    'A-': 3.7,
    'B+': 3.3,
    'B': 3.0,
    'B-': 2.7,
    'C+': 2.3,
    'C': 2.0,
    'D': 1.0,
    'F': 0.0
  };
  
  return gradeMap[grade.trim()] || null;
}

// Start the server with error handling
const server = app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}).on('error', (error) => {
  console.error(`Failed to start server on port ${port}:`, error);
  process.exit(1);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});
