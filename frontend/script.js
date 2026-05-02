const API_URL = window.location.origin + '/api';

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