class AgentEditor {
    constructor() {
        this.agentId = document.getElementById('currentAgentId').dataset.agentId;
        this.btnSaveChanges = document.getElementById('btnSaveChanges');
        this.btnBackToChat = document.getElementById('btnBackToChat');
        this.tabButtons = document.querySelectorAll('.editor-tab-btn');
        this.tabContents = document.querySelectorAll('.editor-tab-content');
        this.textareas = document.querySelectorAll('.editor-textarea');
        this.saveStatus = document.getElementById('saveStatus');
        this.charCount = document.getElementById('editorCharCount');

        this.originalContents = {};
        this.currentContents = {};
        this.activeFile = null;

        this.init();
    }

    init() {
        // Initialize contents
        this.textareas.forEach(textarea => {
            const file = textarea.id.replace('textarea-', '').replace('_', '.');
            const content = textarea.value;
            this.originalContents[file] = content;
            this.currentContents[file] = content;

            // Find active file
            const parentContent = textarea.closest('.editor-tab-content');
            if (parentContent.classList.contains('active')) {
                this.activeFile = file;
            }

            // Track changes on input
            textarea.addEventListener('input', () => {
                this.currentContents[file] = textarea.value;
                this.updateChangeIndicators();
                this.updateStats();
            });

            // Tab key support in textarea
            textarea.addEventListener('keydown', (e) => {
                if (e.key === 'Tab') {
                    e.preventDefault();
                    const start = textarea.selectionStart;
                    const end = textarea.selectionEnd;
                    textarea.value = textarea.value.substring(0, start) + '    ' + textarea.value.substring(end);
                    textarea.selectionStart = textarea.selectionEnd = start + 4;
                    // Trigger input event to update contents
                    textarea.dispatchEvent(new Event('input'));
                }
            });
        });

        // Tab buttons functionality
        this.tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetFile = btn.dataset.file;
                this.switchTab(targetFile);
            });
        });

        // Save and back buttons
        if (this.btnSaveChanges) {
            this.btnSaveChanges.addEventListener('click', () => this.saveChanges());
        }

        if (this.btnBackToChat) {
            this.btnBackToChat.addEventListener('click', () => this.goBack());
        }

        this.updateStats();
    }

    switchTab(file) {
        this.activeFile = file;

        // Update tab buttons active state
        this.tabButtons.forEach(btn => {
            if (btn.dataset.file === file) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Update tab contents visibility
        const contentId = 'content-' + file.replace('.', '_');
        this.tabContents.forEach(content => {
            if (content.id === contentId) {
                content.style.display = 'block';
                content.classList.add('active');
                // Focus the textarea
                const textarea = content.querySelector('.editor-textarea');
                if (textarea) textarea.focus();
            } else {
                content.style.display = 'none';
                content.classList.remove('active');
            }
        });

        this.updateStats();
    }

    hasUnsavedChanges() {
        for (const file in this.originalContents) {
            if (this.originalContents[file] !== this.currentContents[file]) {
                return true;
            }
        }
        return false;
    }

    updateChangeIndicators() {
        let anyChanges = false;

        for (const file in this.originalContents) {
            const indicatorId = 'indicator-' + file.replace('.', '_');
            const indicator = document.getElementById(indicatorId);
            const isChanged = this.originalContents[file] !== this.currentContents[file];

            if (indicator) {
                indicator.style.display = isChanged ? 'inline-block' : 'none';
            }

            if (isChanged) {
                anyChanges = true;
            }
        }

        if (anyChanges) {
            this.saveStatus.textContent = 'UNSAVED CHANGES DETECTED';
            this.saveStatus.style.color = 'var(--cyber-secondary)';
        } else {
            this.saveStatus.textContent = 'ALL FILES SAVED';
            this.saveStatus.style.color = 'var(--cyber-primary)';
        }
    }

    updateStats() {
        if (!this.activeFile) return;

        const content = this.currentContents[this.activeFile] || '';
        const lines = content.split('\n').length;
        const chars = content.length;

        this.charCount.textContent = `LINES: ${lines} | CHARS: ${chars}`;
    }

    async saveChanges() {
        if (!this.hasUnsavedChanges()) {
            alert('No changes to save.');
            return;
        }

        this.btnSaveChanges.disabled = true;
        this.saveStatus.textContent = 'SAVING CONFIGURATION...';
        this.saveStatus.style.color = '#ffaa00';

        try {
            const response = await fetch(`/api/agents/${this.agentId}/files`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    files: this.currentContents
                })
            });

            if (!response.ok) {
                throw new Error('NEURAL TRANSMISSION ERROR');
            }

            const data = await response.json();
            if (data.success) {
                // Update original contents to match saved state
                for (const file in this.currentContents) {
                    this.originalContents[file] = this.currentContents[file];
                }
                this.updateChangeIndicators();
                this.saveStatus.textContent = 'ALL FILES SAVED SUCCESSFULLY';
                this.saveStatus.style.color = 'var(--cyber-primary)';
                setTimeout(() => {
                    if (!this.hasUnsavedChanges()) {
                        this.saveStatus.textContent = 'ALL FILES SAVED';
                        this.saveStatus.style.color = 'var(--cyber-primary)';
                    }
                }, 3000);
            } else {
                throw new Error(data.message || 'Unknown save error');
            }
        } catch (error) {
            console.error('Error saving agent files:', error);
            this.saveStatus.textContent = `CRITICAL ERROR: ${error.message.toUpperCase()}`;
            this.saveStatus.style.color = '#ff0055';
            alert(`Failed to save files: ${error.message}`);
        } finally {
            this.btnSaveChanges.disabled = false;
        }
    }

    goBack() {
        if (this.hasUnsavedChanges()) {
            if (!confirm('You have unsaved changes. Are you sure you want to discard them and return to the chat?')) {
                return;
            }
        }
        window.location.href = '/';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.editorApp = new AgentEditor();
});
