export function buildFallbackLearningPath(input) {
  const { skillLevel, targetRole, duration } = input;
  const roleLower = String(targetRole || "").toLowerCase();

  let roadmap = "";
  let dailyPlan = "";
  let practice = "";
  let projects = "";
  let progressTracking = "";

  if (
    roleLower.includes("mern") ||
    roleLower.includes("web") ||
    roleLower.includes("react") ||
    roleLower.includes("node") ||
    roleLower.includes("front") ||
    roleLower.includes("back") ||
    roleLower.includes("full stack") ||
    roleLower.includes("fullstack")
  ) {
    // MERN / Web Developer Fallback
    roadmap = `# MERN Stack & Web Developer Learning Roadmap - ${duration}
## Phase 1: Frontend Core & UI Development
### Week 1: Git & HTML/CSS Foundations
- Learn HTML5 semantic elements and CSS modern layout systems (Flexbox, Grid)
- Set up local development environment using VS Code and Chrome DevTools
- Version control basics: Git workflow (add, commit, push) and GitHub
### Week 2: JavaScript Modern Concepts
- Master JS fundamentals: Variables, functions, scope, arrays, and object manipulation
- Practice DOM manipulation, event handling, and asynchronous API calls using fetch/async-await
- Modern ES6+ features: Destructuring, template literals, map/filter/reduce, and arrow functions
### Week 3: React Library Core
- Learn React fundamentals: JSX, components, props, state, and unidirectional data flow
- Master essential hooks: useState, useEffect, and useRef
- Build clean, responsive user interfaces with CSS frameworks like Tailwind CSS
### Week 4: Frontend State & Architecture
- Learn React Router for client-side navigation and multiple page architectures
- Understand global state management patterns (Context API or Redux Toolkit)
- Connect frontend UI to external public REST APIs and handle loading/error states

## Phase 2: Backend Development & Database Integration
### Week 5: Node.js & Express Server Basics
- Learn Node.js architecture, event loop, module system, and npm package management
- Create a basic HTTP server using Express and design RESTful API routing structure
- Use middleware for request logging, error handling, and JSON request body parsing
### Week 6: Databases & MongoDB Atlas
- Understand NoSQL database concepts and MongoDB document structure
- Set up cloud database clusters on MongoDB Atlas and connect with MongoDB Compass
- Integrate Mongoose ODM to model schemas, validate fields, and handle relationships
### Week 7: Authentication & Advanced APIs
- Implement secure JWT-based user signup/login and password hashing with bcrypt
- Create protected API endpoints and write custom authentication verification middlewares
- Design robust CRUD operations for multiple resources with reference-based relations
### Week 8: Deployment & Production Workflows
- Deploy client frontend application on Vercel, Netlify, or AWS Amplify
- Deploy backend Express server on Render, Railway, or Heroku cloud environments
- Set up environment variables (.env), handle CORS configurations, and perform end-to-end testing`;

    dailyPlan = `### Week 1-2: Web Fundamentals (HTML/CSS/JS)
- Recommended YouTube videos: SuperSimpleDev HTML & CSS Full Course & Dave Gray JavaScript Course
- Official documentation: Mozilla MDN Web Docs (developer.mozilla.org)
- Practice platforms: freeCodeCamp Responsive Web Design & Codewars JavaScript track
- Tools to use: VS Code editor, Google Chrome Developer Tools, Git & GitHub

### Week 3-4: Modern Frontend (React)
- Recommended YouTube videos: Programming with Mosh React Tutorial & Dave Gray React Series
- Official documentation: React Official Docs (react.dev)
- Practice platforms: Frontend Mentor, freeCodeCamp Frontend Libraries
- Tools to use: Vite build tool, npm package manager, React Developer Tools

### Week 5-6: Backend Development (Node.js & Express)
- Recommended YouTube videos: Dave Gray Node.js tutorials & Traversy Media Express JS Crash Course
- Official documentation: Node.js docs (nodejs.org) & Express docs (expressjs.com)
- Practice platforms: freeCodeCamp Relational Database & Back End APIs, Postman API Network
- Tools to use: Postman API client, nodemon server restarter, VS Code Thunder Client

### Week 7-8: Database & Full Stack Integration
- Recommended YouTube videos: Net Ninja MongoDB Tutorial & Traversy Media MERN Stack from Scratch
- Official documentation: MongoDB Manual (docs.mongodb.com) & Mongoose Docs (mongoosejs.com)
- Practice platforms: MongoDB Atlas online playground, full-stack integration exercises
- Tools to use: MongoDB Compass desktop client, Atlas cloud cluster, Render/Vercel for deployment`;

    practice = `# Practice Questions & Coding Exercises
1. Build an Express API with routes for GET, POST, PUT, DELETE operations on a products collection
2. Design a MongoDB schema for users, products, and orders with standard relational references
3. Implement secure JWT user authentication and signup flow with password hashing
4. Create a custom React hook to fetch API data and manage loading, error, and cached states
5. Implement CORS configurations on your Express server to securely communicate with a Vite React client`;

    projects = `# Real-World Project Milestones
- Task Management App (Beginner): CRUD application using React, Express, MongoDB, and Tailwind CSS
- E-Commerce Store (Intermediate): Product searching, filtering, shopping cart, and Stripe checkout integration
- Collaborative Whiteboard (Advanced): Real-time drawing canvas using Socket.io, React, and Canvas API`;

  } else if (
    roleLower.includes("data") ||
    roleLower.includes("ml") ||
    roleLower.includes("python") ||
    roleLower.includes("machine")
  ) {
    // Data Scientist / ML Developer Fallback
    roadmap = `# Data Science & Machine Learning Roadmap - ${duration}
## Phase 1: Python Core & Data Analysis
### Week 1: Python Programming Foundations
- Learn Python syntax, basic variables, control flows, loops, and data structures (lists, dicts, sets)
- Learn functional programming, exception handling, and writing reusable custom modules
- Git fundamentals: Version control workflow using Git bash and GitHub repositories
### Week 2: Data Manipulation with Pandas & NumPy
- Master multi-dimensional array operations using NumPy vectorization techniques
- Master Pandas Series and DataFrames: Loading CSV/JSON, filtering, sorting, and indexing data
- Practice data cleaning: Handling missing values, duplicates, out-of-bounds metrics, and data type conversions
### Week 3: Data Visualization & Exploratory Analysis
- Learn visual hierarchy and narrative plotting with Matplotlib and Seaborn libraries
- Build distribution graphs, box plots, correlation heatmaps, and scatter plot matrices
- Conduct Exploratory Data Analysis (EDA) on real datasets to uncover trends and patterns
### Week 4: Structured Query Language (SQL) Basics
- Master relational database basics: Tables, rows, primary/foreign keys, and standard relations
- Learn SQL queries: SELECT, WHERE, JOINs (INNER, LEFT, RIGHT), GROUP BY, and HAVING clauses
- Practice writing aggregate queries and subqueries on local databases using SQLite or PostgreSQL

## Phase 2: Machine Learning Foundations & Production
### Week 5: Statistical Foundations & Scikit-Learn
- Master basic statistics: Mean, median, mode, variance, standard deviation, and normal distributions
- Set up Scikit-Learn pipelines for feature encoding, normalization, and scaling data
- Understand Supervised vs Unsupervised learning paradigms and dataset splitting methods
### Week 6: Classical Machine Learning Models
- Master Linear and Logistic Regression for continuous and discrete classification tasks
- Master decision tree-based algorithms: Decision Trees, Random Forests, and Gradient Boosting
- Learn classification metrics: Accuracy, Precision, Recall, F1-Score, ROC-AUC, and Confusion Matrix
### Week 7: Model Tuning & Hyperparameter Optimization
- Learn Grid Search and Random Search methods to optimize model hyperparameters
- Understand Cross-Validation (K-Fold) techniques to prevent overfitting and improve generalization
- Work with Scikit-Learn pipeline pipelines for automated data transforming and model training
### Week 8: Model Deployment & API Creation
- Deploy ML models by serializing them using pickle/joblib and creating prediction endpoints in FastAPI/Flask
- Containerize model environments with Docker to run seamlessly on cloud infrastructure
- Deploy live prediction endpoints on Render, AWS EC2, or Google Cloud Run platforms`;

    dailyPlan = `### Week 1-2: Python & Data Analysis Core
- Recommended YouTube videos: Programming with Mosh Python for Beginners & freeCodeCamp Data Analysis Course
- Official documentation: Python Docs (docs.python.org) & Pandas Docs (pandas.pydata.org)
- Practice platforms: HackerRank Python Track & Exercism Python exercises
- Tools to use: Anaconda distribution, Jupyter Notebooks, VS Code editor

### Week 3-4: Visualizations & SQL databases
- Recommended YouTube videos: Keith Galli Pandas tutorials & Alex The Analyst SQL Playlist
- Official documentation: Matplotlib Docs (matplotlib.org) & PostgreSQL manual
- Practice platforms: Kaggle Micro-courses (Pandas, Data Cleaning, SQL)
- Tools to use: Jupyter Lab, Google Colab cloud notebook, DBeaver database manager

### Week 5-6: Classical Machine Learning
- Recommended YouTube videos: StatQuest Machine Learning Playlist & Andrew Ng Machine Learning Foundations
- Official documentation: Scikit-Learn Getting Started Guide (scikit-learn.org)
- Practice platforms: Kaggle playground competitions (e.g. Titanic Classification, House Prices Regression)
- Tools to use: Scikit-Learn framework, Anaconda, Git version control

### Week 7-8: Model Tuning & Cloud Deployment
- Recommended YouTube videos: Ken Jee Data Science workflows & freeCodeCamp FastAPI Tutorial
- Official documentation: FastAPI Documentation (fastapi.tiangolo.com)
- Practice platforms: Kaggle datasets, end-to-end local repository creations
- Tools to use: FastAPI framework, pickle/joblib serialization, Docker containerization, Render cloud`;

    practice = `# Practice Questions & Coding Exercises
1. Write Python/Pandas code to merge three dataframes and fill missing numerical columns with their median values
2. Train a Linear Regression model, perform 5-fold cross-validation, and calculate the RMSE score
3. Create SQL queries using JOINs and aggregate functions to find the top 5 customers by sales revenue
4. Design a FastAPI endpoint that takes a JSON payload, parses features, and returns an ML model prediction
5. Build visual charts using Seaborn showing correlation heatmaps and box plots of key dataset parameters`;

    projects = `# Real-World Project Milestones
- Exploratory Data Analysis (Beginner): Perform full statistical data cleaning and visual analysis on house price dataset
- Movie Recommendation Engine (Intermediate): Build a content-based recommendation filter using TF-IDF and cosine similarity
- FastAPI Predictive Analytics App (Advanced): Train a Random Forest classifier, package inside FastAPI, and containerize using Docker`;

  } else {
    // General Software Engineering Fallback
    roadmap = `# ${targetRole} Software Engineering Roadmap - ${duration}
## Phase 1: Software Foundations
### Week 1: Computer Science & Logic Basics
- Learn fundamental concepts of programming: Variables, functions, types, conditionals, and loops
- Master terminal operations: CLI navigations, shell commands, and local directory structures
- Version control basics: Git workflow (clone, add, commit, push) and GitHub online repositories
### Week 2: Object-Oriented & Modern Programming
- Master class definitions, object instances, inheritance, encapsulation, and polymorphism
- Learn essential data structures: Lists, queues, stacks, associative maps, and sets
- Practice writing clean code, proper variable/method namings, and self-documenting codeblocks
### Week 3: Relational & Non-Relational Databases
- Understand relational database concepts, primary/foreign keys, and data normalization (1NF, 2NF, 3NF)
- Master standard SQL queries: CRUD operations, tables creation, JOINs, and conditional grouping
- Explore NoSQL document storage models and understand key-value datastores like Redis
### Week 4: System Architectures & RESTful APIs
- Learn network basics: IP protocols, HTTP request methods, response status codes, and JSON data formats
- Learn to design and construct robust RESTful API endpoints following standard CRUD conventions
- Connect local software applications to databases and implement safe environment configurations

## Phase 2: Engineering Production & Operations
### Week 5: Data Structures & Core Algorithms
- Learn runtime analysis: Big-O notation, time and space complexity evaluations
- Master search and sorting algorithms: Binary search, bubble sort, merge sort, and quicksort
- Study advanced data structures: Hash maps, linked lists, graphs, and binary trees
### Week 6: Automated Testing & Debugging
- Understand testing paradigms: Unit tests, integration tests, and end-to-end testing
- Write clean automated unit tests for software applications using modern testing frameworks
- Practice debugging techniques: Call stack traces, breakpoints, logging systems, and memory inspection
### Week 7: Security & Best Practices
- Implement security controls: Input sanitation, SQL injection preventions, and CORS rules
- Learn hashing techniques, encryption algorithms, and secure environment configurations (.env)
- Understand continuous integration (CI) workflows, automatic code formatting, and linters
### Week 8: Cloud Systems & Deployment
- Learn cloud hosting architectures and deploy software applications to hosting environments
- Understand containerization concepts and write simple Dockerfile setups
- Set up monitoring dashboards, simple logging pipelines, and production release flows`;

    dailyPlan = `### Week 1-2: CS Foundations & Terminal
- Recommended YouTube videos: CS50 Introduction to Computer Science & freeCodeCamp Git crash course
- Official documentation: Chosen programming language manual/reference guides
- Practice platforms: freeCodeCamp Programming foundations & Codewars basic logic tracks
- Tools to use: VS Code editor, terminal (Git Bash or PowerShell), Git version control

### Week 3-4: OOP, Databases & REST APIs
- Recommended YouTube videos: Programming with Mosh OOP concepts & Traversy Media SQL/NoSQL crash courses
- Official documentation: PostgreSQL manuals & MDN Web Docs for HTTP structures
- Practice platforms: HackerRank SQL Track & Exercism coding tracks
- Tools to use: Local database managers (e.g. SQLite, PostgreSQL, MongoDB Compass), Postman API client

### Week 5-6: Testing & Performance
- Recommended YouTube videos: freeCodeCamp Testing methodologies & Traversy Media Testing guides
- Official documentation: Language-specific testing libraries (e.g. Jest, PyTest, JUnit)
- Practice platforms: LeetCode Easy problems & HackerRank Algorithms track
- Tools to use: Native debuggers in VS Code, automated unit test runners

### Week 7-8: Security, CI/CD & Deployments
- Recommended YouTube videos: freeCodeCamp Docker for Beginners & TechWorld with Nana CI/CD tutorial
- Official documentation: Docker Reference Guide & Github Actions documentation
- Practice platforms: local pipeline runs, deploying hobby apps to Vercel/Render/Heroku
- Tools to use: Docker, GitHub Actions, cloud hosting command-line tools`;

    practice = `# Practice Questions & Coding Exercises
1. Implement binary search and bubble sort algorithms, calculating their Big-O time complexities
2. Write automated unit tests for a custom validation helper library class to verify correctness
3. Create SQL queries using subqueries and window functions to retrieve grouped aggregation data
4. Design a robust RESTful API routing path mapping HTTP methods (GET, POST, PUT, DELETE) to resource controllers
5. Write custom middleware to sanitize database input fields and prevent SQL injection or XSS scripting`;

    projects = `# Real-World Project Milestones
- Personal Portfolio Website (Beginner): Responsive portfolio site showcasing your projects, skills, and credentials
- Command-Line Utility Tool (Intermediate): Custom file parser or secure password generator built with Python/Node.js
- RESTful Resource Server (Advanced): Database-backed API server with user auth, Dockerfile setups, and automated testing`;
  }

  // Progress summary dynamically set
  progressTracking = `Embark on a robust structured roadmap to master ${targetRole} starting from ${skillLevel.toLowerCase()} concepts to advanced industry workflows. This beginner-friendly program maps your trajectory from core syntax to functional database integration, automated testing, and cloud deployment, backed by hand-picked YouTube videos, official documentation, practice platforms, and standard developer tools.`;

  return {
    roadmap,
    dailyPlan,
    practice,
    projects,
    progressTracking
  };
}

