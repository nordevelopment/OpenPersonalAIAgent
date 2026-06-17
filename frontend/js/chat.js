class AIAgentChat {
    constructor() {
        this.chatMessages = document.getElementById('chatMessages');
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendButton');
        this.typingIndicator = document.getElementById('typingIndicator');
        this.sessionId = null;
        this.messageCount = 1;
        this.statusElement = document.getElementById('system-status');

        this.btnClearChat = document.getElementById('btnClearChat');
        this.btnClearMemory = document.getElementById('btnClearMemory');
        this.btnNewChat = document.getElementById('btnNewChat');
        this.sessionsList = document.getElementById('sessionsList');
        this.agentSelector = document.getElementById('agentSelector');
        this.init();
    }

    async init() {
        await this.getCurrentSession();

        this.sendButton.addEventListener('click', () => this.sendMessage());
        this.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Auto-resize textarea
        this.messageInput.addEventListener('input', () => {
            this.messageInput.style.height = 'auto';
            this.messageInput.style.height = this.messageInput.scrollHeight + 'px';
        });
        this.btnClearChat.addEventListener('click', () => this.clearChat());
        this.btnClearMemory.addEventListener('click', () => this.clearMemory());
        this.btnNewChat.addEventListener('click', () => this.createNewChat());
        this.initializeServices();

        // Ждем загрузки истории и сессий
        await this.loadAgents();
        await this.getHistory();
        await this.getSessions();

        // Setup marked options
        marked.use({
            breaks: true,
            gfm: true,
        });

        // Custom renderer for links to open in new tab
        const renderer = new marked.Renderer();
        renderer.link = function (href, title, text) {
            return `<a href="${href}" title="${title || ''}" target="_blank" rel="noopener noreferrer">${text}</a>`;
        };
        marked.setOptions({ renderer });
    }


    async getCurrentSession() {
        try {
            const response = await fetch('/api/sessions/current', {
                method: 'GET',
            });

            if (!response.ok) {
                console.error('Failed to get current session:', response.status);
                return;
            }

            const data = await response.json();
            console.log('Session API response:', data);
            this.sessionId = data.sessionId;
            console.log('Current session:', this.sessionId);
        } catch (error) {
            console.error('Failed to get current session:', error);
        }
    }

    async createNewChat() {
        try {
            const agentId = this.agentSelector.value;
            const response = await fetch('/api/sessions/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ agentId }),
            });
            const data = await response.json();
            if (data.success) {
                this.sessionId = data.sessionId;
                this.chatMessages.innerHTML = '';
                this.getHistory();
                this.getSessions();
            }
        } catch (error) {
            console.error('Failed to create new chat:', error);
        }
    }

    async deleteSession(sessionId) {
        if (!confirm('Are you sure you want to delete this session? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await fetch(`/api/sessions/${sessionId}`, {
                method: 'DELETE',
            });
            const data = await response.json();
            if (data.success) {
                // Если удалили текущую сессию, создаем новую
                if (sessionId === this.sessionId) {
                    await this.createNewChat();
                } else {
                    this.getSessions();
                }
            }
        } catch (error) {
            console.error('Failed to delete session:', error);
        }
    }

    async switchSession(sessionId) {
        try {
            const response = await fetch('/api/sessions/switch', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ sessionId }),
            });

            const data = await response.json();
            if (data.success) {
                this.sessionId = sessionId;
                this.chatMessages.innerHTML = '';
                await this.getHistory();
                await this.getSessions();
            } else {
                console.error('Failed to switch session:', data.message);
            }
        } catch (error) {
            console.error('Failed to switch session:', error);
        }
    }

    async initializeServices() {
        try {
            const response = await fetch('/api/health', {
                method: 'GET',
            });

            this.updateStatus(response);

        } catch (error) {
            this.updateStatus('CONNECTION FAILED');
        }
    }

    updateStatus(response) {
        console.log('Status:', response);
        if (response.status === 200) {
            this.statusElement.textContent = 'ONLINE :: READY';
            this.statusElement.classList.add('cyber-text-glow');
        } else {
            this.statusElement.textContent = 'CRITICAL :: CONNECTION_LOST :: RETRYING...';
            this.statusElement.classList.remove('cyber-text-glow');
        }
    }

    async sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message) return;

        console.log('Sending message:', { message, sessionId: this.sessionId });
        this.addMessage(message, 'user');
        this.messageInput.value = '';
        this.messageInput.style.height = 'auto';
        this.showTyping();

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    sessionId: this.sessionId,
                }),
            });

            if (!response.ok) {
                throw new Error('NEURAL TRANSMISSION FAILED');
            }

            const data = await response.json();
            console.log('Chat response:', data);
            this.hideTyping();
            this.addMessage(data.message, 'agent', data.reasoning || null);

        } catch (error) {
            console.error('Chat error:', error);
            this.hideTyping();
            this.addMessage('⚠️ NEURAL INTERFACE ERROR. Retry transmission.', 'agent');
        }
    }

    addMessage(content, type, reasoning = null) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;

        // Parse markdown for agent messages
        const parsedContent = type === 'agent' ? marked.parse(content) : content;

        let reasoningHtml = '';
        if (reasoning && type === 'agent') {
            reasoningHtml = `
                <div class="reasoning-box">
                    <div class="reasoning-title">NEURAL_REASONING</div>
                    <div class="reasoning-content">${marked.parse(reasoning)}</div>
                </div>
            `;
        }

        messageDiv.innerHTML = `
            <div class="message-box">
                <div class="message-content">
                    ${parsedContent}
                    ${reasoningHtml}
                </div>
            </div>
        `;

        this.chatMessages.appendChild(messageDiv);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    showTyping() {
        this.typingIndicator.classList.add('active');
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    hideTyping() {
        this.typingIndicator.classList.remove('active');
    }

    async loadAgents() {
        try {
            const response = await fetch('/api/agents', {
                method: 'GET',
            });

            if (!response.ok) {
                console.error('Failed to load agents:', response.status);
                return;
            }

            const data = await response.json();
            console.log('Agents data:', data);

            if (data.agents && Array.isArray(data.agents)) {
                this.agentSelector.innerHTML = '';
                data.agents.forEach(agent => {
                    const option = document.createElement('option');
                    option.value = agent;
                    option.textContent = agent.replace('_', ' ').toUpperCase();
                    this.agentSelector.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Error loading agents:', error);
        }
    }

    async getHistory() {
        if (!this.sessionId) {
            console.log('No sessionId, skipping history load');
            return;
        }

        try {
            const response = await fetch('/api/chat/get_history', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: '',
                    sessionId: this.sessionId,
                }),
            });

            if (!response.ok) {
                console.error('Failed to get history:', response.status);
                return;
            }

            const data = await response.json();
            console.log('History data:', data);

            if (data.history && Array.isArray(data.history)) {
                data.history.forEach(message => {
                    const type = message.role === 'assistant' ? 'agent' : 'user';
                    this.addMessage(message.content, type, message.reasoning);
                });
            }

            return data.history;
        } catch (error) {
            console.error('Error loading history:', error);
        }
    }

    async getSessions() {
        try {
            const response = await fetch('/api/sessions', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                console.error('Failed to get sessions:', response.status);
                return;
            }

            const data = await response.json();
            console.log('Sessions data:', data);

            // Очищаем список перед добавлением
            this.sessionsList.innerHTML = '';

            if (data.sessions && Array.isArray(data.sessions)) {
                data.sessions.forEach(session => {
                    const isCurrentSession = session.id === this.sessionId;
                    const sessionDiv = document.createElement('div');
                    sessionDiv.className = `session-item ${isCurrentSession ? 'active' : ''}`;
                    sessionDiv.dataset.sessionId = session.id;

                    const date = new Date(session.created_at).toLocaleString('ru-RU');
                    const shortId = session.id.substring(0, 20) + '...';

                    sessionDiv.innerHTML = `
                        <div class="session-info">
                            <div class="session-time">[${date}]</div>
                            <div class="session-id">${shortId}</div>
                        </div>
                        <div class="session-actions">
                            <button class="session-delete" data-session-id="${session.id}" title="PURGE SESSION">×</button>
                        </div>
                    `;

                    // Клик по сессии для переключения
                    sessionDiv.addEventListener('click', (e) => {
                        if (!e.target.classList.contains('session-delete')) {
                            this.switchSession(session.id);
                        }
                    });

                    // Клик по кнопке удаления
                    const deleteBtn = sessionDiv.querySelector('.session-delete');
                    deleteBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.deleteSession(session.id);
                    });

                    this.sessionsList.appendChild(sessionDiv);
                });
            }

            return data.sessions;
        } catch (error) {
            console.error('Error loading sessions:', error);
        }
    }

    async clearChat() {
        const response = await fetch('/api/chat/clear_history', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ sessionId: this.sessionId }),
        });

        const data = await response.json();
        if (!data.success) {
            throw new Error('Failed to clear chat');
        }

        this.chatMessages.innerHTML = '';
    }

    async clearMemory() {
        if (!confirm('Are you sure you want to clear all memory? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await fetch('/api/memory/clear', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({}),
            });

            const data = await response.json();
            if (!data.success) {
                throw new Error('Failed to clear memory');
            }

            // Создать новую сессию
            await this.createNewChat();
        } catch (error) {
            console.error('Memory clear error:', error);
            alert('Failed to clear memory. Please try again.');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.chatApp = new AIAgentChat();
});
