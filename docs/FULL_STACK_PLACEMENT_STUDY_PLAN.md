# Full Stack Placement Study Plan From Zero

Developer: Saurav Satpute

This file is separate from the project code. Use it as your personal study plan for BTech placement preparation.

Your goal is not to memorize this project blindly. Your goal is to understand enough to explain it honestly, answer interview questions, debug basic issues, and show that you can learn and build.

---

## 1. Honest Starting Point

If you feel you know nothing, start here:

- You do not need to know everything on day one.
- You must understand the project flow before you try to memorize interview answers.
- You should be honest in interviews: say you built, customized, debugged, deployed, and studied this project deeply.
- You must be able to explain every resume point you write.

Good resume project explanation:

> I developed and customized a MERN stack JobPortal project for placement readiness. I worked on understanding the full-stack architecture, authentication, job posting, resume upload, application tracking, interview scheduling, private recruiter notes, AI tools, notifications, deployment, testing, demo seed data, and documentation. I can explain the main workflows and the files involved.

Avoid saying:

> I built everything from scratch without help.

That can create difficult follow-up questions if you cannot defend every detail.

---

## 2. Your Placement Preparation Has 5 Tracks

You must prepare these together:

| Track | Why It Matters |
| --- | --- |
| Full-stack project | Helps you explain resume work |
| JavaScript + React | Needed for frontend questions |
| Node + Express + MongoDB | Needed for backend questions |
| DSA basics | Needed for coding rounds |
| CS fundamentals + HR | Needed for technical and HR interviews |

Do not study only React or only the project. Placement interviews usually mix project, coding, and fundamentals.

---

## 3. Daily Routine

If you have 3 hours per day:

| Time | Work |
| --- | --- |
| 45 minutes | JavaScript / React / Backend concept |
| 45 minutes | JobPortal project reading and tracing files |
| 60 minutes | DSA practice |
| 30 minutes | Interview speaking practice |

If you have only 1 hour per day:

| Time | Work |
| --- | --- |
| 25 minutes | One full-stack concept |
| 25 minutes | One DSA problem |
| 10 minutes | Speak one answer aloud |

Speaking aloud is important. In interviews, knowing silently is not enough.

---

## 4. First Understand Full Stack In Simple Words

A full-stack app has three main parts:

1. Frontend: the screen the user sees.
2. Backend: the server that receives requests and applies logic.
3. Database: the place where data is stored.

In this project:

| Part | Technology |
| --- | --- |
| Frontend | React, Vite, Tailwind CSS |
| Backend | Node.js, Express.js |
| Database | MongoDB with Mongoose |
| Login security | JWT, HTTP-only cookies, bcrypt |
| File upload | express-fileupload, Cloudinary |
| AI | Gemini API with fallback logic |
| Real-time updates | Socket.IO |
| Deployment | Vercel frontend, Render backend |

Simple request flow:

```text
User clicks button
React handles the click
Axios sends request to backend
Express route receives request
Controller runs business logic
Mongoose reads/writes MongoDB
Backend sends JSON response
React updates the screen
```

Interview answer:

> In my project, React handles the user interface. It sends API requests using Axios to an Express backend. The backend validates the request, checks authentication when needed, performs database operations through Mongoose, and returns JSON responses. MongoDB stores users, jobs, applications, notifications, and resume metadata.

---

## 5. 45-Day Placement Roadmap

### Week 1: Web And JavaScript Basics

Goal: understand what happens when a user clicks something.

Study:

- What is a website?
- What is frontend and backend?
- HTML tags, forms, buttons, inputs.
- CSS basics: layout, colors, spacing.
- JavaScript variables, functions, arrays, objects.
- `map`, `filter`, `find`, `reduce`.
- `async`, `await`, promises.
- HTTP methods: GET, POST, PUT, DELETE.
- JSON.

Project practice:

- Open `frontend/src/App.jsx`.
- Open `frontend/src/components/Auth/Login.jsx`.
- Find where login form data is submitted.
- Find where Axios is used in `frontend/src/utils/api.js`.

You should be able to answer:

- What is JavaScript used for?
- What is JSON?
- What is an API?
- What happens when a form is submitted?

### Week 2: React Basics

Goal: understand pages and components.

Study:

- Components.
- Props.
- State using `useState`.
- Side effects using `useEffect`.
- React Router.
- Conditional rendering.
- Forms in React.
- Loading and error states.

Project practice:

- Read `frontend/src/main.jsx`.
- Read `frontend/src/App.jsx`.
- Read `frontend/src/components/Layout/Navbar.jsx`.
- Read `frontend/src/components/Job/Jobs.jsx`.
- Read `frontend/src/components/Job/JobDetails.jsx`.

You should be able to answer:

- What is React?
- What is a component?
- What is state?
- Why do we use `useEffect`?
- How does routing work in this project?

### Week 3: Backend Basics

Goal: understand routes, controllers, middleware, and responses.

Study:

- Node.js.
- Express.js.
- Routes.
- Controllers.
- Middleware.
- Status codes.
- Request body, params, query.
- Error handling.

Project practice:

- Read `backend/server.js`.
- Read `backend/app.js`.
- Read `backend/routes/userRoutes.js`.
- Read `backend/controllers/userController.js`.
- Read `backend/middlewares/auth.js`.
- Read `backend/middlewares/error.js`.

You should be able to answer:

- What is Express?
- What is a route?
- What is a controller?
- What is middleware?
- Why do we validate data on the backend?

### Week 4: MongoDB And Authentication

Goal: understand how user data is stored and protected.

Study:

- Database basics.
- Collections and documents.
- Mongoose schemas.
- Create, read, update, delete.
- Password hashing with bcrypt.
- JWT.
- Cookies.
- Role-based access.

Project practice:

- Read `backend/models/userSchema.js`.
- Read `backend/models/jobSchema.js`.
- Read `backend/models/applicationSchema.js`.
- Trace register and login from frontend to backend.
- Trace protected route access.

You should be able to answer:

- What is MongoDB?
- What is Mongoose?
- Why are passwords hashed?
- What is JWT?
- Why use HTTP-only cookies?
- How does role-based access work?

### Week 5: Main Project Features

Goal: explain your actual resume project confidently.

Study these flows:

- Job posting.
- Job search and filtering.
- Saved jobs.
- Job application.
- Resume upload.
- Application status update.
- Interview scheduling.
- Notifications.
- AI career tools.
- External jobs API.

Project practice:

- For each feature, identify frontend file, backend route, controller, and model.
- Draw the flow in a notebook.
- Speak the explanation aloud in 60 seconds.

You should be able to answer:

- How does resume upload work?
- How does applying to a job work?
- How does employer status update work?
- How do notifications work?
- How are AI tools integrated?

### Week 6: Deployment, Testing, Interview Revision

Goal: become placement-ready.

Study:

- Environment variables.
- CORS.
- Vercel deployment.
- Render deployment.
- MongoDB Atlas.
- Cloudinary.
- Basic testing.
- GitHub Actions CI.
- Common production issues.

Project practice:

- Read `README.md`.
- Read `docs/PROJECT_LEARNING_GUIDE.md`.
- Read `docs/PRODUCTION_AUDIT_ROADMAP.md`.
- Practice final interview answers.

You should be able to answer:

- Where is the project deployed?
- What environment variables are used?
- What checks did you run?
- What bugs did you face?
- What improvements would you add next?

---

## 6. DSA Minimum Plan For Placements

For service-based companies, do at least:

- Arrays.
- Strings.
- Hash maps.
- Sorting.
- Searching.
- Two pointers.
- Sliding window basics.
- Stack and queue.
- Recursion basics.
- Linked list basics.
- Tree basics.

Daily DSA rule:

- Solve 1 easy problem.
- Revise 1 old problem.
- Write the logic in plain English.

Do not only watch solutions. You must code.

Interview explanation format:

```text
First I will explain the brute force approach.
Then I will optimize it using ...
The time complexity is ...
The space complexity is ...
Now I will code it.
```

---

## 7. CS Fundamentals Minimum Plan

### OOP

Must know:

- Class.
- Object.
- Inheritance.
- Encapsulation.
- Polymorphism.
- Abstraction.

Simple answer:

> OOP is a programming style where we organize code around objects. Objects combine data and behavior. It helps with reuse, organization, and maintainability.

### DBMS

Must know:

- Database.
- Table/collection.
- Primary key.
- Foreign key.
- Index.
- Normalization basics.
- SQL vs NoSQL.

Simple MongoDB answer:

> MongoDB is a NoSQL document database. It stores data in JSON-like documents. In my project, users, jobs, applications, saved jobs, and notifications are stored as MongoDB collections.

### Operating System

Must know:

- Process.
- Thread.
- Memory.
- Deadlock basics.
- Scheduling basics.

### Computer Networks

Must know:

- Client-server model.
- HTTP.
- HTTPS.
- DNS.
- IP address.
- Request and response.
- Status codes.

---

## 8. Project Interview Pitch

Memorize this, then learn to say it naturally:

> My project is JobPortal, a MERN stack placement-focused job portal. It has two roles: job seeker and employer. Job seekers can register, login, search jobs, save jobs, upload resumes, apply to jobs, track application status, view interview schedules, receive notifications, and use AI tools for resume analysis, job match, cover letters, interview questions, and skill roadmaps. Employers can post jobs, manage posted jobs, view applications, open resume links, update statuses, schedule interviews, add private recruiter notes, see analytics, and use AI candidate summaries. The frontend is built with React and Tailwind CSS, the backend uses Express and MongoDB with Mongoose, authentication uses JWT cookies and bcrypt, resumes are stored on Cloudinary, AI uses Gemini, and the app is deployed on Vercel and Render.

Short version:

> It is a MERN stack job portal with job seeker and employer workflows, authentication, job posting, applications, resume upload, status tracking, interview scheduling, private recruiter notes, notifications, AI placement tools, demo seed data, and deployment.

---

## 9. Must-Know Project Questions

Practice these until you can answer without reading:

1. What is your project?
2. Why did you build it?
3. What is MERN?
4. What are the main features?
5. What is your role in the project?
6. How does login work?
7. How does registration work?
8. Why do you hash passwords?
9. What is JWT?
10. Why use HTTP-only cookies?
11. How does role-based access work?
12. How does job posting work?
13. How does job search work?
14. How does applying to a job work?
15. How does resume upload work?
16. Why use Cloudinary?
17. What data is stored in MongoDB?
18. How do notifications work?
19. What AI features are included?
20. What happens if Gemini fails?
21. How is the project deployed?
22. What is CORS?
23. What environment variables are used?
24. What tests are included?
25. What bugs did you solve?
26. What are the limitations?
27. What would you improve next?
28. What did you learn?
29. Why should this project be considered full-stack?
30. Can you explain the project to a non-technical person?

Use `docs/PROJECT_LEARNING_GUIDE.md` for detailed answers.

---

## 10. How We Will Study From Here

Use this chat like a teacher.

Send one of these messages:

- `Start lesson 1`
- `Teach me JavaScript basics`
- `Explain login flow from my project`
- `Ask me interview questions`
- `Give me DSA practice for today`
- `Take my mock interview`
- `Explain this file: backend/app.js`

Best daily pattern:

1. Learn one concept.
2. Open related project files.
3. Answer 5 interview questions.
4. Solve 1 DSA problem.
5. Speak your project pitch once.

---

## 11. Lesson 1: Full Stack From Zero

Imagine a user logs in.

The user sees the login page. That page is frontend.

The login page sends email, password, and role to the backend.

The backend checks if the user exists in MongoDB.

The backend compares the password using bcrypt.

If correct, the backend creates a token and sends it in an HTTP-only cookie.

Now the user can access protected pages.

In your project, the flow is:

```text
frontend/src/components/Auth/Login.jsx
  sends login request

frontend/src/utils/api.js
  Axios client sends request to backend

backend/routes/userRoutes.js
  defines login API route

backend/controllers/userController.js
  checks user and password

backend/models/userSchema.js
  represents user data in MongoDB

backend/services/tokenService.js
  creates and verifies tokens

backend/middlewares/auth.js
  protects private APIs
```

Your first assignment:

1. Read the files listed above.
2. Write the login flow in your notebook in 8 lines.
3. Speak this answer aloud:

> In my project, login starts from the React login form. The frontend sends email, password, and role to the Express backend. The backend finds the user in MongoDB, compares the password using bcrypt, creates JWT tokens, stores authentication in HTTP-only cookies, and then protected APIs use middleware to verify the logged-in user.

When you can say this without reading, continue to Lesson 2.
