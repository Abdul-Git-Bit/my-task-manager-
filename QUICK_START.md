# ⚡ Quick Start Guide

## 1️⃣ Install Dependencies (Already Done!)
```bash
npm install
```

## 2️⃣ Configure MongoDB Connection

Edit `.env` file and set your MongoDB URI:

```env
MONGO_URI=mongodb+srv://myuser:MyStrongPass123!@cluster0.ttqmrnu.mongodb.net/taskmanager?retryWrites=true&w=majority
PORT=5000
JWT_SECRET=your_secret_key_here
NODE_ENV=development
```

### Getting MongoDB Connection String:
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a cluster
3. Create a database user
4. Get connection string and update `.env`

## 3️⃣ Start the Server

### Development (with auto-reload):
```bash
npm run dev
```

### Production:
```bash
npm start
```

The server will start on `http://localhost:5000`

## 4️⃣ Access the Application

Open your browser and go to:
```
http://localhost:5000
```

## 5️⃣ Create Your First Account

1. Click "Sign Up"
2. Fill in the details:
   - **Name**: Your name
   - **Email**: your@email.com
   - **Password**: Your password
   - **Role**: Select "admin" for full access
3. Click "Sign Up"

## 6️⃣ Login

1. Click "Login"
2. Enter your email and password
3. Click "Login"

## 7️⃣ Create a Project

1. Click "+ New Project"
2. Enter:
   - **Project Name**: e.g., "My First Project"
   - **Description**: e.g., "Managing my first project"
3. Click "Create Project"

## 8️⃣ Add Team Members

1. Click on your project
2. Click "+ Add Member"
3. Enter the email of a team member (must be registered user)
4. Click "Add to Project"

## 9️⃣ Create Tasks

1. Select a project
2. Fill in:
   - **Task Title**: What needs to be done
   - **Description**: Details (optional)
   - **Assign to**: Select team member
   - **Due Date**: When it's due
   - **Priority**: Low/Medium/High
3. Click "+ Add Task"

## 🔟 Manage Tasks

- **Complete Task**: Click "Complete" button
- **Delete Task**: Click "Delete" button
- **View Tasks**: All tasks appear on project page

## 📝 Default Test Account

You can use this for testing:
```
Email: test@example.com
Password: testpass123
Role: admin
```

(Create this through the signup page)

## 🐛 Troubleshooting

### Issue: "MongoDB connection error"
```bash
Solution: Check your MONGO_URI in .env file
```

### Issue: "Port 5000 already in use"
```bash
Solution: Change PORT in .env to 5001 or higher
```

### Issue: "Cannot find module"
```bash
Solution: Run: npm install
```

### Issue: "Token expired" or "Unauthorized"
```bash
Solution: Logout and login again
```

## 📋 Project Structure Reference

```
my-task-manager/
├── frontend/           # All UI files
│   ├── index.html      # Main page
│   ├── script.js       # All JavaScript logic
│   └── style.css       # All styles
├── backend/            # All server logic
│   ├── server.js       # Main server
│   ├── routes/         # API endpoints
│   ├── models/         # Database schemas
│   └── middleware/     # Authentication logic
├── .env                # Configuration (KEEP SECRET!)
├── package.json        # Dependencies
└── README.md           # Full documentation
```

## 🚀 Next Steps

After getting started:
1. Create multiple projects
2. Add different team members
3. Create tasks with different priorities
4. Test completing and deleting tasks
5. Try admin vs member accounts (different permissions)

## 📞 Need Help?

Check the full documentation:
- [README.md](README.md) - Complete guide
- [FIXES_SUMMARY.md](FIXES_SUMMARY.md) - What was fixed
- API errors shown in browser console (F12)

## ✅ You're All Set!

Your Task Manager is ready to use. Happy task managing! 🎉
