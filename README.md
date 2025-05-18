# Minerva API Backend

This backend service provides an API for accessing McGill's Minerva system. It can fetch transcripts, search for courses, and add/drop courses.

## Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Configure your `.env` file with your Minerva credentials:
   ```
   PORT=3000
   MG_USER=your_minerva_username
   MG_PASS=your_minerva_password
   ```
4. Start the server:
   ```
   npm start
   ```
   For development with auto-restart:
   ```
   npm run dev
   ```

## API Endpoints

### Get Transcript
```
GET /api/transcript
```
Returns the user's transcript with calculated CUM GPA.

Response format:
```json
{
  "cumGPA": "3.75",
  "courses": [
    {
      "completed": " ",
      "department": "COMP",
      "course_number": "208",
      "section": "001",
      "credit": "2",
      "grade": "A",
      "class_avg": "A"
    },
    ...
  ]
}
```

### Search for Courses
```
GET /api/courses?dep=COMP&number=250&season=w&year=2023
```
Parameters:
- `dep`: Department code (e.g., "COMP", "MATH")
- `number`: Course number (optional)
- `season`: Season code (w = winter, f = fall, s = summer)
- `year`: Year (e.g., "2023")

Response format:
```json
[
  {
    "is_full": false,
    "crn": "709",
    "department": "COMP",
    "course_number": "250",
    "type": "Lecture",
    "days": ["MWF"],
    "time": ["09:35 AM-10:25 AM"],
    "instructor": "Martin Robillard",
    "status": "Active"
  },
  ...
]
```

### Add Courses
```
POST /api/courses/add
```
Request body:
```json
{
  "season": "w",
  "year": "2023",
  "crn": ["709", "710"]
}
```
- `season`: Season code (w = winter, f = fall, s = summer)
- `year`: Year (e.g., "2023")
- `crn`: Course Reference Number (string or array of strings)

### Drop Courses
```
POST /api/courses/drop
```
Request body:
```json
{
  "season": "w",
  "year": "2023",
  "crn": ["709", "710"]
}
```
- `season`: Season code (w = winter, f = fall, s = summer)
- `year`: Year (e.g., "2023")
- `crn`: Course Reference Number (string or array of strings)
