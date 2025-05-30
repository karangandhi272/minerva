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

// Dummy data for demo account
const dummyData = {
  transcript: {
    cumGPA: '3.75',
    courses: [
      {
        completed: '',
        department: 'COMP',
        course_number: '202',
        section: '001',
        credit: '3',
        grade: 'A',
        class_avg: 'B+',
        term: 'Fall',
        year: '2023',
        title: 'Foundations of Programming'
      },
      {
        completed: '',
        department: 'COMP',
        course_number: '250',
        section: '002',
        credit: '3',
        grade: 'A-',
        class_avg: 'B',
        term: 'Fall',
        year: '2023',
        title: 'Intro to Computer Science'
      },
      {
        completed: '',
        department: 'MATH',
        course_number: '240',
        section: '001',
        credit: '3',
        grade: 'B+',
        class_avg: 'B-',
        term: 'Fall',
        year: '2023',
        title: 'Discrete Structures'
      },
      {
        completed: '',
        department: 'COMP',
        course_number: '206',
        section: '001',
        credit: '3',
        grade: 'A-',
        class_avg: 'B',
        term: 'Winter',
        year: '2024',
        title: 'Introduction to Software Systems'
      },
      {
        completed: '',
        department: 'COMP',
        course_number: '251',
        section: '001',
        credit: '3',
        grade: 'B+',
        class_avg: 'B',
        term: 'Winter',
        year: '2024',
        title: 'Algorithms and Data Structures'
      },
      {
        completed: 'RW',
        department: 'COMP',
        course_number: '303',
        section: '001',
        credit: '3',
        term: 'Fall',
        year: '2024',
        title: 'Software Design'
      },
      {
        completed: 'RW',
        department: 'COMP',
        course_number: '310',
        section: '001',
        credit: '3',
        term: 'Fall',
        year: '2024',
        title: 'Operating Systems'
      }
    ]
  },
  courses: {
    'COMP': {
      '202': [
        {
          crn: '1234',
          department: 'COMP',
          course_number: '202',
          type: 'Lecture',
          instructor: 'John Smith',
          days: ['Monday', 'Wednesday', 'Friday'],
          time: ['10:35-11:25', '10:35-11:25', '10:35-11:25'],
          is_full: false,
          section: '001',
          title: 'Foundations of Programming'
        },
        {
          crn: '1235',
          department: 'COMP',
          course_number: '202',
          type: 'Tutorial',
          instructor: 'TA One',
          days: ['Tuesday'],
          time: ['14:35-15:55'],
          is_full: false,
          section: 'T01'
        },
        {
          crn: '1236',
          department: 'COMP',
          course_number: '202',
          type: 'Tutorial',
          instructor: 'TA Two',
          days: ['Thursday'],
          time: ['14:35-15:55'],
          is_full: true,
          section: 'T02'
        }
      ],
      '303': [
        {
          crn: '3334',
          department: 'COMP',
          course_number: '303',
          type: 'Lecture',
          instructor: 'Jane Doe',
          days: ['Tuesday', 'Thursday'],
          time: ['13:05-14:25', '13:05-14:25'],
          is_full: false,
          section: '001',
          title: 'Software Design'
        }
      ],
      '307': [
        {
          crn: '3534',
          department: 'COMP',
          course_number: '307',
          type: 'Lecture',
          instructor: 'Bob Johnson',
          days: ['Monday', 'Wednesday', 'Friday'],
          time: ['12:35-13:25', '12:35-13:25', '12:35-13:25'],
          is_full: true,
          section: '001',
          title: 'Software Engineering'
        }
      ],
      '421': [
        {
          crn: '4534',
          department: 'COMP',
          course_number: '421',
          type: 'Lecture',
          instructor: 'Alice Green',
          days: ['Tuesday', 'Thursday'],
          time: ['10:05-11:25', '10:05-11:25'],
          is_full: false,
          section: '001',
          title: 'Database Systems'
        }
      ]
    },
    'MATH': {
      '240': [
        {
          crn: '2341',
          department: 'MATH',
          course_number: '240',
          type: 'Lecture',
          instructor: 'Sarah White',
          days: ['Monday', 'Wednesday', 'Friday'],
          time: ['8:35-9:25', '8:35-9:25', '8:35-9:25'],
          is_full: false,
          section: '001',
          title: 'Discrete Structures'
        }
      ],
      '323': [
        {
          crn: '2451',
          department: 'MATH',
          course_number: '323',
          type: 'Lecture',
          instructor: 'Michael Gray',
          days: ['Monday', 'Wednesday', 'Friday'],
          time: ['9:35-10:25', '9:35-10:25', '9:35-10:25'],
          is_full: false,
          section: '001',
          title: 'Probability Theory'
        }
      ]
    }
  },
  registeredCourses: [
    {
      crn: '3334',
      department: 'COMP',
      course_number: '303',
      section: '001',
      title: 'Software Design',
      instructor: 'Jane Doe',
      days: ['Tuesday', 'Thursday'],
      time: ['13:05-14:25', '13:05-14:25'],
      location: 'Trottier 1080',
      credits: '3',
      status: 'Registered'
    },
    {
      crn: '4998',
      department: 'COMP',
      course_number: '310',
      section: '001',
      title: 'Operating Systems',
      instructor: 'Carlos Rodriguez',
      days: ['Monday', 'Wednesday', 'Friday'],
      time: ['14:35-15:25', '14:35-15:25', '14:35-15:25'],
      location: 'Leacock 132',
      credits: '3',
      status: 'Registered'
    }
  ]
};

// Check if credentials are demo account
const isDemoAccount = (username, password) => {
  return username === 'demo' && password === 'demo';
};

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
    
    // Check if using demo account
    if (isDemoAccount(username, password)) {
      // Create a JWT token with username and password
      const token = jwt.sign({ username, password, isDemo: true }, JWT_SECRET, { expiresIn: '7d' });
      
      // Return the token to the client
      return res.json({ 
        message: 'Demo authentication successful',
        token,
        user: { username: 'demo', isDemo: true }
      });
    }
    
    // Regular authentication logic for non-demo accounts
    // Attempt to create a new Minerva instance with the provided credentials
    let userMinerva;
    try {
      userMinerva = new Minerva(username, password);
      
      // Try a basic operation to verify the credentials fully
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
    
    // Check if using demo account
    if (isDemoAccount(username, password) || req.user.isDemo) {
      // Calculate GPA for demo data - only for courses with final grades
      let totalGradePoints = 0;
      let totalCredits = 0;
      
      dummyData.transcript.courses.forEach(course => {
        // Only include courses that have a final grade (not registered courses)
        if (course.grade && course.completed !== "RW") {
          const gradePoint = convertGradeToPoints(course.grade);
          const credits = parseFloat(course.credit);
          
          if (!isNaN(gradePoint) && !isNaN(credits) && gradePoint !== null) {
            totalGradePoints += gradePoint * credits;
            totalCredits += credits;
          }
        }
      });
      
      const cumGPA = totalCredits > 0 ? (totalGradePoints / totalCredits).toFixed(2) : 'N/A';
      
      return res.json({
        cumGPA: cumGPA,
        courses: dummyData.transcript.courses,
        student: { id: '260123456' }
      });
    }
    
    // Regular logic for non-demo accounts
    const userMinerva = new Minerva(username, password);
    
    const transcript = await userMinerva.getTranscript();
    
    // Validate transcript data
    if (!transcript || !Array.isArray(transcript)) {
      return res.status(500).json({ error: 'Invalid transcript data received' });
    }
    
    // Calculate CUM GPA - only for courses with final grades
    let totalGradePoints = 0;
    let totalCredits = 0;
    
    transcript.forEach(course => {
      // Only include courses that have a final grade (not registered courses)
      if (course.grade && course.completed !== "RW") {
        const gradePoint = convertGradeToPoints(course.grade);
        const credits = parseFloat(course.credit);
        
        if (!isNaN(gradePoint) && !isNaN(credits) && gradePoint !== null) {
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

// Keep the original GET endpoint for backward compatibility - also updated
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
    
    // Calculate CUM GPA - only for courses with final grades
    let totalGradePoints = 0;
    let totalCredits = 0;
    
    transcript.forEach(course => {
      // Only include courses that have a final grade (not registered courses)
      if (course.grade && course.completed !== "RW") {
        const gradePoint = convertGradeToPoints(course.grade);
        const credits = parseFloat(course.credit);
        
        if (!isNaN(gradePoint) && !isNaN(credits) && gradePoint !== null) {
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
    const dep = req.query.dep;
    const number = req.query.number;
    const season = req.query.season;
    const year = req.query.year;
    const username = req.query.username || req.user.username;
    const password = req.query.password || req.user.password;

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

    // Check if using demo account
    if (isDemoAccount(username, password) || req.user.isDemo) {
      const department = dep.toUpperCase();
      let results = [];
      
      if (dummyData.courses[department]) {
        if (number) {
          // Filter by course number if provided
          if (dummyData.courses[department][number]) {
            results = dummyData.courses[department][number];
          }
        } else {
          // Return all courses in the department
          Object.values(dummyData.courses[department]).forEach(courses => {
            results = [...results, ...courses];
          });
        }
      }
      
      return res.json(results);
    }

    // Regular logic for non-demo accounts
    // Create a new Minerva instance with the provided credentials
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
    const { season, year, crn, username, password } = req.body;
    const userCredentials = {
      username: username || req.user.username,
      password: password || req.user.password
    };
    
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

    // Check if using demo account
    if (isDemoAccount(userCredentials.username, userCredentials.password) || req.user.isDemo) {
      // Simulate successful course addition
      return res.json({ 
        success: true, 
        result: { 
          message: 'Course added successfully (Demo)',
          crn: crn
        }
      });
    }
    
    // Regular logic for non-demo accounts
    // Use the credentials from the request body or token
    const userMinerva = new Minerva(userCredentials.username, userCredentials.password);
    
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
    const { season, year, crn, username, password } = req.body;
    
    console.log('Drop course request received:', { season, year, crn, username: username || req.user.username });
    
    const userCredentials = {
      username: username || req.user.username,
      password: password || req.user.password
    };
    
    // Input validation
    if (!season || !['f', 'w', 's'].includes(season.toLowerCase())) {
      console.log('Invalid season:', season);
      return res.status(400).json({ error: 'Valid season is required (f, w, s)' });
    }

    if (!year || !/^\d{4}$/.test(year)) {
      console.log('Invalid year:', year);
      return res.status(400).json({ error: 'Valid 4-digit year is required' });
    }

    if (!crn) {
      console.log('Missing CRN');
      return res.status(400).json({ error: 'CRN is required' });
    }

    // Check if using demo account
    if (isDemoAccount(userCredentials.username, userCredentials.password) || req.user.isDemo) {
      console.log('Demo account - simulating course drop for CRN:', crn);
      // Simulate successful course drop
      return res.json({ 
        success: true, 
        result: { 
          message: 'Course dropped successfully (Demo)',
          crn: crn
        }
      });
    }
    
    console.log('Real account - attempting to drop course with credentials:', userCredentials.username);
    
    // Regular logic for non-demo accounts
    try {
      const userMinerva = new Minerva(userCredentials.username, userCredentials.password);
      
      const result = await userMinerva.dropCourses({
        season: season.toLowerCase(),
        year,
        crn
      });

      console.log('Drop result:', result);
      
      res.json({ success: true, result });
    } catch (dropError) {
      console.error('Error in dropCourses method:', dropError);
      return res.status(500).json({ 
        error: 'Failed to drop course', 
        message: dropError.message || 'Unknown error in drop operation',
        code: dropError.code || 'DROP_ERROR'
      });
    }
  } catch (error) {
    console.error('Error dropping courses (outer catch):', error);
    res.status(500).json({ 
      error: 'Failed to drop courses', 
      message: error.message || 'Unknown error',
      code: error.code || 'UNKNOWN_ERROR'
    });
  }
});

// Get registered courses
app.post('/api/courses/registered', authenticateToken, async (req, res) => {
  try {
    // Get parameters from request body
    const { season, year, username, password } = req.body;
    
    // Use credentials from request body or fallback to token
    const userCredentials = {
      username: username || req.user.username,
      password: password || req.user.password
    };
    
    // Input validation
    if (!season || !['f', 'w', 's'].includes(season.toLowerCase())) {
      return res.status(400).json({ error: 'Valid season is required (f, w, s)' });
    }

    if (!year || !/^\d{4}$/.test(year)) {
      return res.status(400).json({ error: 'Valid 4-digit year is required' });
    }
    
    // Check if using demo account
    if (isDemoAccount(userCredentials.username, userCredentials.password) || req.user.isDemo) {
      return res.json(dummyData.registeredCourses);
    }
    
    // Regular logic for non-demo accounts
    // Create a new Minerva instance with the user's credentials
    const userMinerva = new Minerva(userCredentials.username, userCredentials.password);
    
    // Call the getRegisteredCourses method from minerva.js
    const registeredCourses = await userMinerva.getRegisteredCourses({
      season: season.toLowerCase(),
      year
    });
    
    // Validate the response
    if (!registeredCourses || !Array.isArray(registeredCourses)) {
      console.error('Invalid registered courses data received:', registeredCourses);
      return res.status(500).json({ error: 'Invalid registered courses data received' });
    }
    
    // Return the registered courses to the client
    res.json(registeredCourses);
  } catch (error) {
    console.error('Error fetching registered courses:', error);
    res.status(500).json({ 
      error: 'Failed to fetch registered courses', 
      message: error.message || 'Unknown error',
      code: error.code || 'UNKNOWN_ERROR'
    });
  }
});

// View course details
app.post('/api/courses/view', authenticateToken, async (req, res) => {
  try {
    const { season, year, crn, username, password } = req.body;
    
    // Use credentials from request body or fallback to token
    const userCredentials = {
      username: username || req.user.username,
      password: password || req.user.password
    };
    
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
    
    // Check if using demo account
    if (isDemoAccount(userCredentials.username, userCredentials.password) || req.user.isDemo) {
      // Return demo course detail
      return res.json({
        title: 'Software Design',
        crn: crn,
        course_code: 'COMP 303',
        section: '001',
        term: 'Fall 2024',
        credits: '3.000',
        meeting_times: [
          {
            type: 'Lecture',
            time: '13:05-14:25',
            days: 'TR',
            location: 'Trottier 1080',
            date_range: '08/27/2024-12/03/2024',
            schedule_type: 'Lecture',
            instructors: 'Jane Doe'
          }
        ],
        description: 'Introduction to software design principles and patterns.'
      });
    }
    
    // Regular logic for non-demo accounts
    const userMinerva = new Minerva(userCredentials.username, userCredentials.password);
    
    const courseDetail = await userMinerva.viewCourse({
      season: season.toLowerCase(),
      year,
      crn
    });
    
    res.json(courseDetail);
  } catch (error) {
    console.error('Error viewing course:', error);
    res.status(500).json({ 
      error: 'Failed to view course', 
      message: error.message || 'Unknown error',
      code: error.code || 'UNKNOWN_ERROR'
    });
  }
});

// Get schedule data
app.post('/api/schedule', authenticateToken, async (req, res) => {
  try {
    const { season, year, username, password } = req.body;
    
    console.log('Schedule request received:', { season, year, username: username || req.user.username });
    
    // Use credentials from request body or fallback to token
    const userCredentials = {
      username: username || req.user.username,
      password: password || req.user.password
    };
    
    // Input validation
    if (!season || !['f', 'w', 's'].includes(season.toLowerCase())) {
      console.log('Invalid season for schedule:', season);
      return res.status(400).json({ error: 'Valid season is required (f, w, s)' });
    }

    if (!year || !/^\d{4}$/.test(year)) {
      console.log('Invalid year for schedule:', year);
      return res.status(400).json({ error: 'Valid 4-digit year is required' });
    }
    
    // Check if using demo account
    if (isDemoAccount(userCredentials.username, userCredentials.password) || req.user.isDemo) {
      console.log('Demo account - returning demo schedule');
      
      // Return demo schedule data with correct format
      const demoSchedule = [
        {
          crn: '3334',
          department: 'COMP',
          course_number: '303',
          section: '001',
          title: 'Software Design',
          instructor: 'Jane Doe',
          days: ['Tuesday', 'Thursday'],
          time: ['13:05-14:25', '13:05-14:25'],
          location: 'Trottier 1080',
          credits: '3',
          type: 'Lecture'
        },
        {
          crn: '4998',
          department: 'COMP',
          course_number: '310',
          section: '001',
          title: 'Operating Systems',
          instructor: 'Carlos Rodriguez',
          days: ['Monday', 'Wednesday', 'Friday'],
          time: ['14:35-15:25', '14:35-15:25', '14:35-15:25'],
          location: 'Leacock 132',
          credits: '3',
          type: 'Lecture'
        },
        {
          crn: '5001',
          department: 'MATH',
          course_number: '324',
          section: 'T01',
          title: 'Statistics Tutorial',
          instructor: 'TA Smith',
          days: ['Friday'],
          time: ['10:35-11:25'],
          location: 'Burnside 1205',
          credits: '0',
          type: 'Tutorial'
        }
      ];

      console.log('Demo schedule response:', JSON.stringify(demoSchedule, null, 2));
      return res.json(demoSchedule);
    }
    
    console.log('Real account - fetching actual schedule');
    
    // Regular logic for non-demo accounts
    try {
      const userMinerva = new Minerva(userCredentials.username, userCredentials.password);
      
      const registeredCourses = await userMinerva.getRegisteredCourses({
        season: season.toLowerCase(),
        year
      });
      
      console.log('Raw registered courses from API:', JSON.stringify(registeredCourses, null, 2));
      
      // Transform the data to include schedule information with proper structure
      const scheduleData = registeredCourses.map(course => {
        console.log('Processing course:', course);
        
        // Ensure days and time are arrays
        let days = course.days;
        let time = course.time;
        
        // If days is a string, try to parse it
        if (typeof days === 'string') {
          console.log('Converting days string to array:', days);
          // Common day abbreviations
          const dayMap = { 'M': 'Monday', 'T': 'Tuesday', 'W': 'Wednesday', 'R': 'Thursday', 'F': 'Friday' };
          days = days.split('').map(d => dayMap[d] || d).filter(Boolean);
          console.log('Converted days:', days);
        }
        
        // If time is a string, convert to array
        if (typeof time === 'string') {
          console.log('Converting time string to array:', time);
          time = [time];
          console.log('Converted time:', time);
        }
        
        // Ensure days and time are arrays
        if (!Array.isArray(days)) {
          console.log('Days not an array, setting to empty:', days);
          days = [];
        }
        if (!Array.isArray(time)) {
          console.log('Time not an array, setting to empty:', time);
          time = [];
        }
        
        const transformedCourse = {
          crn: course.crn,
          department: course.department,
          course_number: course.course_number,
          section: course.section,
          title: course.title,
          instructor: course.instructor,
          days: days,
          time: time,
          location: course.location,
          credits: course.credits,
          type: course.type || 'Lecture'
        };
        
        console.log('Transformed course:', transformedCourse);
        return transformedCourse;
      });
      
      console.log('Final schedule data response:', JSON.stringify(scheduleData, null, 2));
      res.json(scheduleData);
    } catch (registeredCoursesError) {
      console.error('Error getting registered courses:', registeredCoursesError);
      console.log('Returning empty schedule due to error');
      // If registered courses fails, return empty array
      res.json([]);
    }
  } catch (error) {
    console.error('Error fetching schedule (outer catch):', error);
    res.status(500).json({ 
      error: 'Failed to fetch schedule', 
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
