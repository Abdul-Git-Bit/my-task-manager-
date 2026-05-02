# Team Task Manager 📋

A full-stack web application for managing projects and tasks with role-based access control (admin and member roles).

## Features

- **User Authentication**: Signup and Login functionality
- **Project Management**: Create projects and manage team members
- **Task Management**: Create, assign, update, and delete tasks
- **Role-Based Access**: Admin and Member roles with different permissions
- **Task Priorities**: Low, Medium, High priority levels
- **Task Status**: Track tasks as Pending, In Progress, or Completed
- **Responsive Design**: Works on desktop and mobile devices

## Project Structure

```
my-task-manager/
├── frontend/
│   ├── index.html          # Main HTML page
│   ├── script.js           # Frontend JavaScript
│   ├── style.css           # Frontend styles
│   ├── login.html          # (included in index.html)
│   ├── signup.html         # (included in index.html)
│   ├── dashboard.html      # (included in index.html)
│
├── backend/
│   ├── server.js           # Express server setup
│   ├── middleware/
│   │   ├── auth.js         # JWT authentication middleware
│   │   └── roleCheck.js    # Role-based access middleware
│   ├── routes/
│   │   ├── auth.js         # Authentication routes (signup, login)
│   │   ├── projects.js     # Project routes
│   │   └── tasks.js        # Task routes
│   └── models/
│       ├── User.js         # User schema
│       ├── Project.js      # Project schema
│       └── Task.js         # Task schema
│
├── package.json            # Dependencies and scripts
├── .env                    # Environment variables
└── .gitignore              # Git ignore file
```

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB Atlas account or local MongoDB
- npm or yarn

### Steps

1. **Clone or Download the project**
   ```bash
   cd my-task-manager
   ```

2. **Install backend dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   - Edit `.env` file and add your MongoDB URI:
   ```
   MONGO_URI=your_mongodb_connection_string
   PORT=5000
   JWT_SECRET=your_secret_key
   ```

4. **Start the server**
   ```bash
   npm start         # Production
   npm run dev       # Development with auto-reload
   ```

5. **Access the application**
   - Open your browser and go to `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create a new account
- `POST /api/auth/login` - Login with email and password

### Projects
- `POST /api/projects` - Create a new project (Admin only)
- `GET /api/projects` - Get all projects for the user
- `GET /api/projects/:id` - Get specific project details
- `POST /api/projects/:id/members` - Add member to project
- `GET /api/projects/users/all` - Get all users (Admin only)

### Tasks
- `POST /api/tasks` - Create a new task
- `GET /api/tasks/project/:projectId` - Get tasks for a project
- `GET /api/tasks/my-tasks` - Get tasks assigned to me
- `GET /api/tasks/overdue` - Get overdue tasks
- `PUT /api/tasks/:id` - Update task status
- `DELETE /api/tasks/:id` - Delete a task

## Usage

### Creating an Account
1. Click "Sign Up"
2. Enter your name, email, password, and select a role (Admin or Member)
3. Click "Sign Up" to create the account

### Logging In
1. Click "Login"
2. Enter your email and password
3. Click "Login"

### Creating a Project (Admin only)
1. Click "+ New Project"
2. Enter project name and description
3. Click "Create Project"

### Adding Team Members
1. Select a project
2. Click "+ Add Member"
3. Enter the member's email
4. Click "Add to Project"

### Creating Tasks
1. Select a project
2. Fill in task title, description, assignee, due date, and priority
3. Click "+ Add Task"

### Managing Tasks
- Click "Complete" to mark a task as done
- Click "Delete" to remove a task
- Change status from the task card

## Technologies Used

### Frontend
- HTML5
- CSS3
- Vanilla JavaScript
- Local Storage for authentication

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT for authentication
- bcryptjs for password hashing
- CORS for cross-origin requests

## Key Features

- **Secure Authentication**: Passwords are hashed using bcryptjs
- **JWT Tokens**: Stateless authentication with JWT
- **Role-Based Access Control**: Different permissions for admin and member users
- **Input Validation**: Server-side validation for all inputs
- **Error Handling**: Comprehensive error messages
- **Responsive UI**: Mobile-friendly interface

## Environment Variables

```
MONGO_URI          # MongoDB connection string
PORT               # Server port (default: 5000)
JWT_SECRET         # Secret key for JWT signing
NODE_ENV           # Environment (development/production)
```

## Troubleshooting

### MongoDB Connection Error
- Verify your MONGO_URI in .env
- Check if MongoDB Atlas cluster is active
- Ensure your IP is whitelisted in MongoDB Atlas

### Port Already in Use
- Change the PORT in .env file
- Or kill the process using that port

### CORS Errors
- Ensure the frontend is served from the same domain
- Check CORS settings in server.js

## Future Improvements

- [ ] Task filtering and sorting
- [ ] Task labels/tags
- [ ] Task comments and activity logs
- [ ] Email notifications
- [ ] User profile management
- [ ] Dark mode
- [ ] Data export functionality
- [ ] Advanced search

## License

ISC

## Support

For issues or questions, please open an issue on the repository.
