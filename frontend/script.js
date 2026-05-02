// API URL
const API_URL = 'http://localhost:5000/api';

// Global Variables
let currentProject = null;
let allUsers = [];

// Check Login Status
const token = localStorage.getItem('token');
if (token) {
    showDashboard();
    loadProjects();
    checkUserRole();
} else {
    showAuth();
}

// ============ AUTHENTICATION ============

// Form Switching
document.getElementById('showLoginBtn')?.addEventListener('click', () => {
    document.getElementById('loginForm').classList.add('active');
    document.getElementById('signupForm').classList.remove('active');
    document.getElementById('showLoginBtn').classList.add('active');
    document.getElementById('showSignupBtn').classList.remove('active');
});

document.getElementById('showSignupBtn')?.addEventListener('click', () => {
    document.getElementById('signupForm').classList.add('active');
    document.getElementById('loginForm').classList.remove('active');
    document.getElementById('showSignupBtn').classList.add('active');
    document.getElementById('showLoginBtn').classList.remove('active');
});

// Signup
document.getElementById('signupForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const role = document.getElementById('signupRole').value;
    
    try {
        const res = await fetch(`${API_URL}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password, role })
        });
        const data = await res.json();
        if (res.ok) {
            alert('Account created! Please login.');
            document.getElementById('showLoginBtn').click();
        } else {
            alert(data.message);
        }
    } catch (err) {
        alert('Error: ' + err.message);
    }
});

// Login
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (res.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            showDashboard();
            loadProjects();
            checkUserRole();
        } else {
            alert(data.message);
        }
    } catch (err) {
        alert('Error: ' + err.message);
    }
});

// Logout
document.getElementById('logoutBtn')?.addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    showAuth();
});

// ============ UI FUNCTIONS ============

function showAuth() {
    document.getElementById('authSection').style.display = 'flex';
    document.getElementById('dashboardSection').style.display = 'none';
}

function showDashboard() {
    document.getElementById('authSection').style.display = 'none';
    document.getElementById('dashboardSection').style.display = 'block';
    const user = JSON.parse(localStorage.getItem('user'));
    document.getElementById('userName').textContent = user.name;
}

async function checkUserRole() {
    try {
        const res = await fetch(`${API_URL}/auth/me`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const user = await res.json();
        document.getElementById('userRole').textContent = user.role === 'admin' ? '👑 Admin' : '👤 Member';
        
        // Show/hide admin buttons
        if (user.role === 'admin') {
            document.getElementById('createProjectBtn').style.display = 'block';
        }
    } catch (err) {
        console.error('Error checking role:', err);
    }
}

// ============ PROJECTS ============

async function loadProjects() {
    try {
        const res = await fetch(`${API_URL}/projects`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const projects = await res.json();
        displayProjects(projects);
    } catch (err) {
        console.error('Error loading projects:', err);
    }
}

function displayProjects(projects) {
    const container = document.getElementById('projectsList');
    if (!projects || projects.length === 0) {
        container.innerHTML = '<div class="loading">No projects yet. Create your first project!</div>';
        return;
    }
    
    container.innerHTML = projects.map(project => `
        <div class="project-card" onclick="selectProject('${project._id}')">
            <h4>${escapeHtml(project.name)}</h4>
            <p>${escapeHtml(project.description?.substring(0, 50)) || 'No description'}</p>
            <small>👥 ${project.members?.length || 1} members</small>
        </div>
    `).join('');
}

window.selectProject = async (projectId) => {
    currentProject = projectId;
    document.getElementById('selectedProjectSection').style.display = 'block';
    
    try {
        // Load project details
        const res = await fetch(`${API_URL}/projects/${projectId}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const project = await res.json();
        document.getElementById('selectedProjectName').textContent = project.name;
        
        // Display members
        displayMembers(project.members);
        
        // Load tasks for this project
        loadTasks(projectId);
        
        // Load assignee dropdown
        loadAssigneeOptions(project.members);
        
    } catch (err) {
        console.error('Error loading project:', err);
    }
};

function displayMembers(members) {
    const container = document.getElementById('membersList');
    if (!members || members.length === 0) {
        container.innerHTML = '<div class="loading">No members yet</div>';
        return;
    }
    
    const currentUser = JSON.parse(localStorage.getItem('user'));
    
    container.innerHTML = members.map(member => `
        <div class="member-chip ${member.role === 'admin' ? 'admin' : ''}">
            ${escapeHtml(member.name)} (${escapeHtml(member.email)})
            ${member.role === 'admin' ? '👑' : ''}
        </div>
    `).join('');
}

async function loadAssigneeOptions(members) {
    const select = document.getElementById('taskAssignee');
    select.innerHTML = '<option value="">Assign to...</option>';
    
    members.forEach(member => {
        select.innerHTML += `<option value="${member._id}">${escapeHtml(member.name)}</option>`;
    });
}

// ============ TASKS ============

async function loadTasks(projectId) {
    try {
        const res = await fetch(`${API_URL}/tasks/project/${projectId}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const tasks = await res.json();
        displayTasks(tasks);
    } catch (err) {
        console.error('Error loading tasks:', err);
    }
}

function displayTasks(tasks) {
    const container = document.getElementById('tasksContainer');
    if (!tasks || tasks.length === 0) {
        container.innerHTML = '<div class="loading">No tasks yet. Create your first task!</div>';
        return;
    }
    
    const today = new Date();
    
    container.innerHTML = tasks.map(task => {
        const dueDate = new Date(task.dueDate);
        const isOverdue = dueDate < today && task.status !== 'completed';
        const priorityClass = `priority-${task.priority}`;
        
        return `
            <div class="task-card ${priorityClass} ${isOverdue ? 'overdue' : ''}">
                <div class="task-info">
                    <div class="task-title ${task.status === 'completed' ? 'completed' : ''}">
                        ${escapeHtml(task.title)}
                    </div>
                    <div class="task-desc">${escapeHtml(task.description) || 'No description'}</div>
                    <div class="task-meta">
                        Assigned to: ${escapeHtml(task.assignedTo?.name || 'Unknown')} | 
                        Due: ${new Date(task.dueDate).toLocaleDateString()} |
                        Status: ${task.status}
                        ${isOverdue ? ' | ⚠️ OVERDUE' : ''}
                    </div>
                </div>
                <div class="task-actions">
                    <select onchange="updateTaskStatus('${task._id}', this.value)" class="status-select">
                        <option value="pending" ${task.status === 'pending' ? 'selected' : ''}>Pending</option>
                        <option value="in-progress" ${task.status === 'in-progress' ? 'selected' : ''}>In Progress</option>
                        <option value="completed" ${task.status === 'completed' ? 'selected' : ''}>Completed</option>
                    </select>
                    <button class="delete-btn" onclick="deleteTask('${task._id}')">Delete</button>
                </div>
            </div>
        `;
    }).join('');
}

// Add Task
document.getElementById('addTaskBtn')?.addEventListener('click', async () => {
    if (!currentProject) {
        alert('Please select a project first');
        return;
    }
    
    const title = document.getElementById('taskTitle').value;
    const description = document.getElementById('taskDesc').value;
    const assignedTo = document.getElementById('taskAssignee').value;
    const dueDate = document.getElementById('taskDueDate').value;
    const priority = document.getElementById('taskPriority').value;
    
    if (!title.trim() || !assignedTo || !dueDate) {
        alert('Please fill all required fields (title, assignee, due date)');
        return;
    }
    
    try {
        const res = await fetch(`${API_URL}/tasks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                title,
                description,
                projectId: currentProject,
                assignedTo,
                dueDate,
                priority
            })
        });
        
        if (res.ok) {
            document.getElementById('taskTitle').value = '';
            document.getElementById('taskDesc').value = '';
            document.getElementById('taskDueDate').value = '';
            loadTasks(currentProject);
        } else {
            const error = await res.json();
            alert(error.message);
        }
    } catch (err) {
        alert('Error adding task: ' + err.message);
    }
});

window.updateTaskStatus = async (taskId, status) => {
    try {
        await fetch(`${API_URL}/tasks/${taskId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ status })
        });
        loadTasks(currentProject);
    } catch (err) {
        alert('Error updating task');
    }
};

window.deleteTask = async (taskId) => {
    if (confirm('Are you sure you want to delete this task?')) {
        try {
            await fetch(`${API_URL}/tasks/${taskId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            loadTasks(currentProject);
        } catch (err) {
            alert('Error deleting task');
        }
    }
};

// ============ CREATE PROJECT MODAL ============

const projectModal = document.getElementById('projectModal');
const memberModal = document.getElementById('memberModal');

document.getElementById('createProjectBtn')?.addEventListener('click', () => {
    projectModal.style.display = 'flex';
});

document.getElementById('saveProjectBtn')?.addEventListener('click', async () => {
    const name = document.getElementById('projectName').value;
    const description = document.getElementById('projectDesc').value;
    
    if (!name.trim()) {
        alert('Please enter project name');
        return;
    }
    
    try {
        const res = await fetch(`${API_URL}/projects`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ name, description })
        });
        
        if (res.ok) {
            projectModal.style.display = 'none';
            document.getElementById('projectName').value = '';
            document.getElementById('projectDesc').value = '';
            loadProjects();
        } else {
            const error = await res.json();
            alert(error.message);
        }
    } catch (err) {
        alert('Error creating project');
    }
});

// ============ ADD MEMBER MODAL ============

document.getElementById('addMemberBtn')?.addEventListener('click', () => {
    if (!currentProject) {
        alert('Please select a project first');
        return;
    }
    memberModal.style.display = 'flex';
});

document.getElementById('saveMemberBtn')?.addEventListener('click', async () => {
    const email = document.getElementById('memberEmail').value;
    
    if (!email.trim()) {
        alert('Please enter email');
        return;
    }
    
    try {
        const res = await fetch(`${API_URL}/projects/${currentProject}/members`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ email })
        });
        
        if (res.ok) {
            memberModal.style.display = 'none';
            document.getElementById('memberEmail').value = '';
            // Reload project details
            selectProject(currentProject);
            loadProjects();
        } else {
            const error = await res.json();
            alert(error.message);
        }
    } catch (err) {
        alert('Error adding member');
    }
});

// ============ MODAL CLOSE BUTTONS ============

document.querySelectorAll('.close').forEach(closeBtn => {
    closeBtn.addEventListener('click', () => {
        projectModal.style.display = 'none';
        memberModal.style.display = 'none';
    });
});

window.onclick = (event) => {
    if (event.target === projectModal) projectModal.style.display = 'none';
    if (event.target === memberModal) memberModal.style.display = 'none';
};

// ============ HELPER FUNCTIONS ============

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}