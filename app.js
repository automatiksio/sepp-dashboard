// ===========================================
// Sepp Command Center — App
// ===========================================

let data = null;
let liveStatus = null;

// Load data
async function loadData() {
    try {
        const [tasksRes, statusRes] = await Promise.all([
            fetch('data/tasks.json'),
            fetch('data/live-status.json')
        ]);
        data = await tasksRes.json();
        liveStatus = await statusRes.json();
        renderAll();
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

// Auto-refresh every 10 seconds
setInterval(async () => {
    try {
        const statusRes = await fetch('data/live-status.json?t=' + Date.now());
        liveStatus = await statusRes.json();
        renderLiveStatus();
        renderActivity();
        renderFullActivity();
    } catch (e) {}
}, 10000);

// Render all components
function renderAll() {
    renderDate();
    renderLiveStatus();
    renderStats();
    renderActiveTasks();
    renderChrisTasks();
    renderProjects();
    renderActivity();
    renderAllTasks();
    renderProjectsDetail();
    renderFullActivity();
}

// Render live status
function renderLiveStatus() {
    if (!liveStatus) return;
    
    const badge = document.getElementById('live-badge');
    const task = document.getElementById('current-task');
    const update = document.getElementById('last-update');
    const model = document.getElementById('model-info');
    const context = document.getElementById('context-info');
    const subAgents = document.getElementById('sub-agents');
    
    // Status badge
    badge.textContent = liveStatus.status;
    badge.className = 'status-badge ' + (liveStatus.online ? 'online' : '');
    
    // Current task
    task.textContent = liveStatus.currentTask || 'Warte auf Aufgaben...';
    
    // Last update
    const updateTime = new Date(liveStatus.lastUpdate);
    const now = new Date();
    const diffSec = Math.floor((now - updateTime) / 1000);
    let timeAgo = 'gerade eben';
    if (diffSec > 60) timeAgo = `vor ${Math.floor(diffSec / 60)} Min`;
    if (diffSec > 3600) timeAgo = `vor ${Math.floor(diffSec / 3600)} Std`;
    update.textContent = `Letztes Update: ${timeAgo}`;
    
    // Model info
    model.textContent = `Model: ${liveStatus.model || '—'}`;
    context.textContent = `Context: ${liveStatus.contextUsage || 0}%`;
    
    // Sub-agents
    if (subAgents) subAgents.textContent = liveStatus.subAgents || 0;
}

// Render current date
function renderDate() {
    const now = new Date();
    const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    document.getElementById('current-date').textContent = now.toLocaleDateString('de-DE', options);
}

// Render stats
function renderStats() {
    const seppTasks = data.tasks.sepp;
    const chrisTasks = data.tasks.chris;
    
    const doneToday = seppTasks.filter(t => t.status === 'done' && t.completed === '2026-01-31').length;
    const openSepp = seppTasks.filter(t => t.status !== 'done').length;
    const blocked = seppTasks.filter(t => t.status === 'blocked').length;
    
    document.getElementById('tasks-done-today').textContent = doneToday;
    document.getElementById('tasks-open-sepp').textContent = openSepp;
    document.getElementById('tasks-blocked').textContent = blocked;
}

// Render active tasks (Sepp)
function renderActiveTasks() {
    const container = document.getElementById('active-tasks');
    const activeTasks = data.tasks.sepp.filter(t => t.status !== 'done').slice(0, 5);
    
    container.innerHTML = activeTasks.map(task => createTaskItem(task)).join('');
}

// Render Chris tasks
function renderChrisTasks() {
    const container = document.getElementById('chris-tasks');
    const tasks = data.tasks.chris.filter(t => t.status !== 'done' && t.status !== 'backlog').slice(0, 5);
    
    container.innerHTML = tasks.map(task => createTaskItem(task, 'chris')).join('');
}

// Create task item HTML
function createTaskItem(task, owner = 'sepp') {
    const isDone = task.status === 'done';
    const badgeClass = task.status === 'blocked' ? 'blocked' : task.priority;
    const badgeText = task.status === 'blocked' ? 'Blockiert' : task.priority.toUpperCase();
    
    return `
        <div class="task-item ${isDone ? 'done' : ''}" data-id="${task.id}">
            <div class="task-checkbox" onclick="toggleTask('${task.id}', '${owner}')"></div>
            <div class="task-content">
                <div class="task-title">${task.title}</div>
                <div class="task-meta">${task.id} · ${data.projects[task.project]?.name || task.project}</div>
            </div>
            <span class="task-badge ${badgeClass}">${badgeText}</span>
        </div>
    `;
}

// Toggle task status
function toggleTask(taskId, owner) {
    const taskList = data.tasks[owner];
    const task = taskList.find(t => t.id === taskId);
    if (task) {
        task.status = task.status === 'done' ? 'todo' : 'done';
        if (task.status === 'done') {
            task.completed = new Date().toISOString().split('T')[0];
        } else {
            delete task.completed;
        }
        renderAll();
    }
}

// Render projects
function renderProjects() {
    const container = document.getElementById('project-list');
    
    container.innerHTML = Object.entries(data.projects).map(([key, project]) => `
        <div class="project-item">
            <div class="project-color" style="background: ${project.color}"></div>
            <div class="project-info">
                <div class="project-name">${project.name}</div>
                <div class="project-progress-bar">
                    <div class="project-progress-fill" style="width: ${project.progress}%; background: ${project.color}"></div>
                </div>
            </div>
            <div class="project-percent">${project.progress}%</div>
        </div>
    `).join('');
}

// Render activity
function renderActivity() {
    const container = document.getElementById('activity-list');
    
    // Use live activities if available, fallback to static
    const activities = liveStatus?.activities?.slice(0, 5) || data.activity.slice(0, 5);
    
    container.innerHTML = activities.map(activity => createActivityItem(activity, false)).join('');
}

// Create activity item HTML
function createActivityItem(activity, detailed = false) {
    const time = new Date(activity.timestamp);
    const timeStr = time.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    
    // Determine icon based on type
    let iconClass = 'task';
    let icon = '⚡';
    
    if (activity.type === 'tool_call') {
        iconClass = 'file';
        icon = '🔧';
    } else if (activity.type === 'user_message') {
        iconClass = 'message';
        icon = '💬';
    } else if (activity.type === 'response') {
        iconClass = 'task';
        icon = '↩';
    } else if (activity.action?.includes('task')) {
        iconClass = 'task';
        icon = '✓';
    } else if (activity.action?.includes('file')) {
        iconClass = 'file';
        icon = '📄';
    }
    
    const description = activity.description || activity.action || '';
    const details = activity.details || '';
    const toolBadge = activity.tool ? `<span class="activity-tool">${activity.tool}</span>` : '';
    
    if (detailed) {
        return `
            <div class="activity-item detailed">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <span class="activity-time">${timeStr}</span>
                    <div class="activity-icon ${iconClass}">${icon}</div>
                    <span class="activity-text">${description}${toolBadge}</span>
                </div>
                ${details ? `<div class="activity-details">${details}</div>` : ''}
            </div>
        `;
    }
    
    return `
        <div class="activity-item">
            <span class="activity-time">${timeStr}</span>
            <div class="activity-icon ${iconClass}">${icon}</div>
            <span class="activity-text">${description}</span>
        </div>
    `;
}

// Render all tasks (Tasks View)
function renderAllTasks(filter = 'all') {
    const container = document.getElementById('all-tasks');
    let tasks = [];
    
    if (filter === 'all' || filter === 'sepp') {
        tasks = tasks.concat(data.tasks.sepp.map(t => ({...t, owner: 'sepp'})));
    }
    if (filter === 'all' || filter === 'chris') {
        tasks = tasks.concat(data.tasks.chris.map(t => ({...t, owner: 'chris'})));
    }
    if (filter === 'done') {
        tasks = tasks.filter(t => t.status === 'done');
    } else if (filter !== 'all') {
        tasks = tasks.filter(t => t.status !== 'done');
    }
    
    // Sort: in_progress first, then todo, then blocked, then backlog, then done
    const statusOrder = { 'in_progress': 0, 'todo': 1, 'blocked': 2, 'backlog': 3, 'done': 4 };
    tasks.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);
    
    container.innerHTML = tasks.map(task => createTaskItem(task, task.owner)).join('');
}

// Render projects detail (Projects View)
function renderProjectsDetail() {
    const container = document.getElementById('projects-detail');
    
    container.innerHTML = Object.entries(data.projects).map(([key, project]) => {
        const projectTasks = [
            ...data.tasks.sepp.filter(t => t.project === key),
            ...data.tasks.chris.filter(t => t.project === key)
        ];
        const openTasks = projectTasks.filter(t => t.status !== 'done');
        
        return `
            <div class="project-card">
                <div class="project-card-header">
                    <div class="project-card-color" style="background: ${project.color}"></div>
                    <span class="project-card-name">${project.name}</span>
                    <span class="project-card-status">${project.status}</span>
                </div>
                <div class="project-card-progress">
                    <div class="project-card-progress-label">
                        <span>Fortschritt</span>
                        <span>${project.progress}%</span>
                    </div>
                    <div class="project-card-bar">
                        <div class="project-card-fill" style="width: ${project.progress}%; background: ${project.color}"></div>
                    </div>
                </div>
                <div class="project-card-tasks">
                    <h4>Offene Tasks (${openTasks.length})</h4>
                    <div class="task-list">
                        ${openTasks.slice(0, 3).map(task => createTaskItem(task, task.owner || 'sepp')).join('')}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Render full activity (Activity View)
function renderFullActivity() {
    const container = document.getElementById('full-activity');
    
    // Use live activities if available
    const activities = liveStatus?.activities || data.activity;
    
    container.innerHTML = activities.map(activity => createActivityItem(activity, true)).join('');
}

// Navigation
document.querySelectorAll('.nav-item[data-view]').forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const viewId = item.dataset.view;
        
        document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');
        
        document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
        document.getElementById(`view-${viewId}`).classList.add('active');
        
        const titles = {
            'overview': 'Übersicht',
            'tasks': 'Tasks',
            'projects': 'Projekte',
            'activity': 'Aktivität'
        };
        document.getElementById('page-title').textContent = titles[viewId];
    });
});

// Panel links
document.querySelectorAll('.panel-link[data-view]').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const viewId = link.dataset.view;
        document.querySelector(`.nav-item[data-view="${viewId}"]`).click();
    });
});

// Tabs
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        renderAllTasks(tab.dataset.filter);
    });
});

// Refresh button
document.getElementById('refresh-btn').addEventListener('click', loadData);

// Initialize
loadData();
