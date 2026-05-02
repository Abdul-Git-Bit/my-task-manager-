const API_URL = '/api';

let currentProject = null;
let allUsers = [];
let currentUser = null;

// Initialize app
const token = localStorage.getItem('token');
if (token) {
    showDashboard();
    loadProjects();
    checkUserRole();
    setupEventListeners();
} else {
    showAuth();
    setupAuthListeners();
}

// ===================== AUTH FUNCTIONS =====================

function setupAuthListeners() {
    document.getElementById('showLoginBtn').addEventListener('click', () => {
        document.querySelectorAll('.form').forEach(f => f.classList.remove('active'));
        document.getElementById('loginForm').classList.add('active');
        document.getElementById('showLoginBtn').classList.add('active');
        document.getElementById('showSignupBtn').classList.remove('active');
    });

    document.getElementById('showSignupBtn').addEventListener('click', () => {
        document.querySelectorAll('.form').forEach(f => f.classList.remove('active'));
        document.getElementById('signupForm').classList.add('active');
        document.getElementById('showSignupBtn').classList.add('active');
        document.getElementById('showLoginBtn').classList.remove('active');
    });

    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('signupForm').addEventListener('submit', handleSignup);
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            document.querySelector('#loginForm .message').textContent = data.message;
            return;
        }

        localStorage.setItem('token', data.token);
        currentUser = data.user;
        localStorage.setItem('user', JSON.stringify(data.user));

        showDashboard();
        loadProjects();
        checkUserRole();
        setupEventListeners();
    } catch (err) {
        console.error('Login error:', err);
        document.querySelector('#loginForm .message').textContent = 'Login failed';
    }
}

async function handleSignup(e) {
    e.preventDefault();
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const role = document.getElementById('signupRole').value;

    try {
        const response = await fetch(`${API_URL}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password, role })
        });

        const data = await response.json();

        if (!response.ok) {
            document.querySelector('#signupForm .message').textContent = data.message;
            return;
        }

        document.querySelector('#signupForm .message').textContent = 'Signup successful! Please login.';
        setTimeout(() => {
            document.getElementById('showLoginBtn').click();
            document.getElementById('signupForm').reset();
        }, 1500);
    } catch (err) {
        console.error('Signup error:', err);
        document.querySelector('#signupForm .message').textContent = 'Signup failed';
    }
}

// ===================== UI FUNCTIONS =====================

function showAuth() {
    document.getElementById('authSection').style.display = 'flex';
    document.getElementById('dashboardSection').style.display = 'none';
}

function showDashboard() {
    document.getElementById('authSection').style.display = 'none';
    document.getElementById('dashboardSection').style.display = 'block';
}

function checkUserRole() {
    const user = JSON.parse(localStorage.getItem('user')) || {};
    document.getElementById('userName').textContent = user.name || 'User';
    document.getElementById('userRole').textContent = (user.role || 'member').toUpperCase();
}

// ===================== PROJECT FUNCTIONS =====================

async function loadProjects() {
    const token = localStorage.getItem('token');
    const container = document.getElementById('projectsList');
    container.innerHTML = '<div class="loading">Loading projects...</div>';

    try {
        const response = await fetch(`${API_URL}/projects`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            console.error('Failed to load projects:', response.status, error);
            if (response.status === 401) {
                logout();
                return;
            }
            container.innerHTML = `<p>Failed to load projects: ${error.message || 'Unknown error'}</p>`;
            return;
        }

        const projects = await response.json();
        if (!Array.isArray(projects)) {
            console.error('Unexpected project list response:', projects);
            container.innerHTML = '<p>Unable to load project list</p>';
            return;
        }
        renderProjects(projects);
    } catch (err) {
        console.error('Failed to load projects:', err);
        container.innerHTML = '<p>Failed to load projects</p>';
    }
}

function renderProjects(projects) {
    const container = document.getElementById('projectsList');

    if (projects.length === 0) {
        container.innerHTML = '<p class="loading">No projects yet. Create one!</p>';
        return;
    }

    container.innerHTML = projects.map(project => `
        <div class="project-card" data-id="${project._id}">
            <h3>${project.name}</h3>
            <p>${project.description || 'No description'}</p>
            <small>Members: ${project.members.length}</small>
        </div>
    `).join('');

    container.querySelectorAll('.project-card').forEach(card => {
        card.addEventListener('click', () => selectProject(projects.find(p => p._id === card.dataset.id)));
    });
}

function selectProject(project) {
    currentProject = project;
    document.getElementById('selectedProjectName').textContent = project.name;
    document.getElementById('selectedProjectSection').style.display = 'block';
    loadMembers();
    loadTasks();
}

async function loadMembers() {
    const members = currentProject.members || [];
    const container = document.getElementById('membersList');

    container.innerHTML = members.map(member => `
        <div class="member-item">
            <span>${member.name}</span>
            <small>${member.email}</small>
        </div>
    `).join('');

    // Update task assignee options
    const assigneeSelect = document.getElementById('taskAssignee');
    assigneeSelect.innerHTML = '<option value="">Assign to...</option>' +
        members.map(m => `<option value="${m._id}">${m.name}</option>`).join('');
}

async function loadTasks() {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`${API_URL}/tasks/project/${currentProject._id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const tasks = await response.json();
        renderTasks(tasks);
    } catch (err) {
        console.error('Failed to load tasks:', err);
        document.getElementById('tasksContainer').innerHTML = '<p>Failed to load tasks</p>';
    }
}

function renderTasks(tasks) {
    const container = document.getElementById('tasksContainer');

    if (tasks.length === 0) {
        container.innerHTML = '<p class="loading">No tasks yet</p>';
        return;
    }

    container.innerHTML = tasks.map(task => `
        <div class="task-item priority-${task.priority}" data-id="${task._id}">
            <div class="task-header">
                <h5>${task.title}</h5>
                <span class="status ${task.status}">${task.status}</span>
            </div>
            <p>${task.description || 'No description'}</p>
            <div class="task-meta">
                <small>Assigned to: ${task.assignedTo.name}</small>
                <small>Due: ${new Date(task.dueDate).toLocaleDateString()}</small>
            </div>
            <div class="task-actions">
                ${task.status !== 'completed' ? `<button class="complete-btn" onclick="completeTask('${task._id}')">Complete</button>` : ''}
                <button class="delete-btn" onclick="deleteTask('${task._id}')">Delete</button>
            </div>
        </div>
    `).join('');
}

// ===================== MODAL FUNCTIONS =====================

const projectModal = document.getElementById('projectModal');
const memberModal = document.getElementById('memberModal');

document.getElementById('createProjectBtn').addEventListener('click', () => {
    projectModal.style.display = 'block';
});

document.getElementById('addMemberBtn').addEventListener('click', () => {
    memberModal.style.display = 'block';
});

document.querySelectorAll('.close').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.target.closest('.modal').style.display = 'none';
    });
});

window.addEventListener('click', (e) => {
    if (e.target === projectModal) projectModal.style.display = 'none';
    if (e.target === memberModal) memberModal.style.display = 'none';
});

// ===================== PROJECT CREATION =====================

document.getElementById('saveProjectBtn').addEventListener('click', async () => {
    const name = document.getElementById('projectName').value;
    const description = document.getElementById('projectDesc').value;
    const token = localStorage.getItem('token');

    const trimmedName = name.trim();
    if (!trimmedName) {
        alert('Project name is required');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/projects`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ name: trimmedName, description })
        });

        const data = await response.json();
        console.log('Create project response:', response.status, data);

        if (response.ok) {
            document.getElementById('projectName').value = '';
            document.getElementById('projectDesc').value = '';
            projectModal.style.display = 'none';
            await loadProjects();
        } else {
            alert(data.message || 'Failed to create project');
        }
    } catch (err) {
        console.error('Error creating project:', err);
        alert('Error creating project');
    }
});

// ===================== ADD MEMBER =====================

document.getElementById('saveMemberBtn').addEventListener('click', async () => {
    const email = document.getElementById('memberEmail').value;
    const token = localStorage.getItem('token');

    if (!email || !currentProject) {
        alert('Email is required');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/projects/${currentProject._id}/members`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ email })
        });

        if (response.ok) {
            document.getElementById('memberEmail').value = '';
            memberModal.style.display = 'none';
            const data = await response.json();
            selectProject(data.project);
        } else {
            const error = await response.json();
            alert(error.message);
        }
    } catch (err) {
        console.error('Error adding member:', err);
        alert('Error adding member');
    }
});

// ===================== TASK FUNCTIONS =====================

function setupEventListeners() {
    document.getElementById('addTaskBtn').addEventListener('click', createTask);
    document.getElementById('logoutBtn').addEventListener('click', logout);
}

async function createTask() {
    const title = document.getElementById('taskTitle').value;
    const description = document.getElementById('taskDesc').value;
    const assignedTo = document.getElementById('taskAssignee').value;
    const dueDate = document.getElementById('taskDueDate').value;
    const priority = document.getElementById('taskPriority').value;
    const token = localStorage.getItem('token');

    if (!title || !assignedTo || !dueDate) {
        alert('Please fill in all required fields');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/tasks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                title,
                description,
                projectId: currentProject._id,
                assignedTo,
                dueDate,
                priority
            })
        });

        if (response.ok) {
            document.getElementById('taskTitle').value = '';
            document.getElementById('taskDesc').value = '';
            document.getElementById('taskAssignee').value = '';
            document.getElementById('taskDueDate').value = '';
            document.getElementById('taskPriority').value = 'medium';
            loadTasks();
        } else {
            alert('Failed to create task');
        }
    } catch (err) {
        console.error('Error creating task:', err);
        alert('Error creating task');
    }
}

async function completeTask(taskId) {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`${API_URL}/tasks/${taskId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status: 'completed' })
        });

        if (response.ok) {
            loadTasks();
        }
    } catch (err) {
        console.error('Error completing task:', err);
    }
}

async function deleteTask(taskId) {
    if (!confirm('Are you sure you want to delete this task?')) return;

    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`${API_URL}/tasks/${taskId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            loadTasks();
        }
    } catch (err) {
        console.error('Error deleting task:', err);
    }
}

// ===================== LOGOUT =====================

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    location.reload();
}