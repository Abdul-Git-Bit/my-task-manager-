const API_URL = '/api';

let currentProject = null;
let allUsers = [];

const token = localStorage.getItem('token');
if (token) {
    showDashboard();
    loadProjects();
    checkUserRole();
} else {
    showAuth();
}