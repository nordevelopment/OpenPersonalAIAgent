class TaskManager {
    constructor() {
        this.tasksTableBody = document.getElementById('tasksTableBody');
        this.btnOpenAddTask = document.getElementById('btnOpenAddTask');
        this.btnRunTasks = document.getElementById('btnRunTasks');
        
        // Modal elements (Add/Edit)
        this.taskModal = document.getElementById('taskModal');
        this.modalTitle = document.getElementById('modalTitle');
        this.taskFormId = document.getElementById('taskFormId');
        this.taskFormTitle = document.getElementById('taskFormTitle');
        this.taskFormStatus = document.getElementById('taskFormStatus');
        this.taskFormRunAt = document.getElementById('taskFormRunAt');
        this.btnCancelModal = document.getElementById('btnCancelModal');
        this.btnSaveTask = document.getElementById('btnSaveTask');

        // Modal elements (Result View)
        this.resultModal = document.getElementById('resultModal');
        this.resultModalInstruction = document.getElementById('resultModalInstruction');
        this.resultModalOutput = document.getElementById('resultModalOutput');
        this.btnCloseResultModal = document.getElementById('btnCloseResultModal');

        this.refreshInterval = null;
        this.tasks = [];

        this.init();
    }

    init() {
        if (this.btnOpenAddTask) {
            this.btnOpenAddTask.addEventListener('click', () => this.openAddModal());
        }
        if (this.btnRunTasks) {
            this.btnRunTasks.addEventListener('click', () => this.runReadyTasks());
        }
        if (this.btnCancelModal) {
            this.btnCancelModal.addEventListener('click', () => this.closeModal());
        }
        if (this.btnSaveTask) {
            this.btnSaveTask.addEventListener('click', () => this.saveTask());
        }
        if (this.btnCloseResultModal) {
            this.btnCloseResultModal.addEventListener('click', () => this.closeResultModal());
        }

        // Close modals on clicking backdrop
        window.addEventListener('click', (e) => {
            if (e.target === this.taskModal) this.closeModal();
            if (e.target === this.resultModal) this.closeResultModal();
        });

        this.loadTasks();
    }

    async loadTasks() {
        try {
            const response = await fetch('/api/tasks');
            if (response.ok) {
                const data = await response.json();
                this.tasks = data.tasks || [];
                this.renderTasksTable();
                this.checkRunningState();
            }
        } catch (err) {
            console.error('Error loading tasks:', err);
            this.tasksTableBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; color: var(--cyber-secondary); padding: 40px;">
                        ERROR LOADING TASKS FROM SERVER.
                    </td>
                </tr>
            `;
        }
    }

    renderTasksTable() {
        if (this.tasks.length === 0) {
            this.tasksTableBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; color: rgba(255,255,255,0.4); padding: 40px;">
                        NO TASKS AVAILABLE. CREATE ONE TO START.
                    </td>
                </tr>
            `;
            return;
        }

        this.tasksTableBody.innerHTML = '';
        this.tasks.forEach(task => {
            const tr = document.createElement('tr');
            
            // Format dates
            const createdDate = new Date(task.created_at).toLocaleString();
            let scheduledDate = 'Immediate';
            if (task.run_at) {
                scheduledDate = new Date(task.run_at).toLocaleString();
            }

            // Status Badge
            const statusClass = `status-${task.status}`;
            const statusLabel = task.status === 'ready' ? 'Ready for run' : task.status;

            // Result preview
            let resultHtml = '<span style="color: rgba(255,255,255,0.3)">Empty</span>';
            if (task.result) {
                const text = task.result.replace(/</g, "&lt;").replace(/>/g, "&gt;");
                resultHtml = `<div class="task-result-cell" onclick="window.taskManager.viewResult(${task.id})">${text}</div>`;
            }

            tr.innerHTML = `
                <td>${task.id}</td>
                <td>
                    <div class="task-title-cell" title="${task.title.replace(/"/g, '&quot;')}">
                        ${task.title.replace(/</g, "&lt;").replace(/>/g, "&gt;")}
                    </div>
                </td>
                <td>
                    <span class="status-badge ${statusClass}">${statusLabel}</span>
                </td>
                <td style="font-size: 12px; color: #00ffff;">${scheduledDate}</td>
                <td>${resultHtml}</td>
                <td>
                    <div class="actions-cell">
                        <button class="cyber-btn btn-mini" onclick="window.taskManager.openEditModal(${task.id})">EDIT</button>
                        <button class="cyber-btn cyber-btn--magenta btn-mini" onclick="window.taskManager.deleteTask(${task.id})">DELETE</button>
                    </div>
                </td>
            `;
            this.tasksTableBody.appendChild(tr);
        });
    }

    checkRunningState() {
        const hasRunning = this.tasks.some(t => t.status === 'running');
        if (hasRunning) {
            if (!this.refreshInterval) {
                console.log('Running tasks detected. Starting auto-refresh...');
                this.refreshInterval = setInterval(() => this.loadTasks(), 3000);
            }
        } else {
            if (this.refreshInterval) {
                console.log('No running tasks. Stopping auto-refresh.');
                clearInterval(this.refreshInterval);
                this.refreshInterval = null;
            }
        }
    }

    openAddModal() {
        this.modalTitle.textContent = 'CREATE NEW TASK';
        this.taskFormId.value = '';
        this.taskFormTitle.value = '';
        this.taskFormStatus.value = 'ready';
        this.taskFormStatus.disabled = false;
        this.taskFormRunAt.value = '';
        this.taskModal.style.display = 'flex';
    }

    openEditModal(id) {
        const task = this.tasks.find(t => t.id === id);
        if (!task) return;

        this.modalTitle.textContent = `EDIT TASK #${task.id}`;
        this.taskFormId.value = task.id;
        this.taskFormTitle.value = task.title;
        this.taskFormStatus.value = task.status;
        
        // Prevent manual override to 'running'
        if (task.status === 'running') {
            this.taskFormStatus.disabled = true;
        } else {
            this.taskFormStatus.disabled = false;
        }

        // Format datetime-local value
        if (task.run_at) {
            const date = new Date(task.run_at);
            // offset timezone to match local input format YYYY-MM-DDThh:mm
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            this.taskFormRunAt.value = `${year}-${month}-${day}T${hours}:${minutes}`;
        } else {
            this.taskFormRunAt.value = '';
        }

        this.taskModal.style.display = 'flex';
    }

    closeModal() {
        this.taskModal.style.display = 'none';
    }

    viewResult(id) {
        const task = this.tasks.find(t => t.id === id);
        if (!task || !task.result) return;

        this.resultModalInstruction.textContent = task.title;
        this.resultModalOutput.textContent = task.result;
        this.resultModal.style.display = 'flex';
    }

    closeResultModal() {
        this.resultModal.style.display = 'none';
    }

    async saveTask() {
        const id = this.taskFormId.value;
        const title = this.taskFormTitle.value.trim();
        const status = this.taskFormStatus.value;
        const runAtVal = this.taskFormRunAt.value;

        if (!title) {
            alert('Please enter an instruction!');
            return;
        }

        const run_at = runAtVal ? new Date(runAtVal).toISOString() : null;
        const payload = { title, status, run_at };

        this.btnSaveTask.disabled = true;
        this.btnSaveTask.textContent = 'SAVING...';

        try {
            let response;
            if (id) {
                response = await fetch(`/api/tasks/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            } else {
                response = await fetch('/api/tasks', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            }

            if (response.ok) {
                this.closeModal();
                await this.loadTasks();
            } else {
                const errData = await response.json();
                alert(`Error saving task: ${errData.message}`);
            }
        } catch (err) {
            console.error('Error saving task:', err);
            alert('Failed to save task.');
        } finally {
            this.btnSaveTask.disabled = false;
            this.btnSaveTask.textContent = 'SAVE TASK';
        }
    }

    async deleteTask(id) {
        if (!confirm(`Are you sure you want to delete task #${id}?`)) return;

        try {
            const response = await fetch(`/api/tasks/${id}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                await this.loadTasks();
            } else {
                alert('Failed to delete task.');
            }
        } catch (err) {
            console.error('Error deleting task:', err);
            alert('Failed to delete task.');
        }
    }

    async runReadyTasks() {
        this.btnRunTasks.disabled = true;
        this.btnRunTasks.textContent = 'LAUNCHING...';

        try {
            const response = await fetch('/api/tasks/run', {
                method: 'POST'
            });

            if (response.ok) {
                const data = await response.json();
                alert(data.message);
                await this.loadTasks();
            } else {
                alert('Failed to run tasks.');
            }
        } catch (err) {
            console.error('Error starting tasks:', err);
            alert('Failed to start execution.');
        } finally {
            this.btnRunTasks.disabled = false;
            this.btnRunTasks.textContent = 'RUN READY TASKS ⚡';
        }
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    window.taskManager = new TaskManager();
});
