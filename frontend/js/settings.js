class SystemSettings {
    constructor() {
        this.btnBackToChat = document.getElementById('btnBackToChat');
        this.btnSaveSettings = document.getElementById('btnSaveSettings');
        this.setupWarningBanner = document.getElementById('setupWarningBanner');
        
        this.settingsAiApiKey = document.getElementById('settingsAiApiKey');
        this.settingsAiApiUrl = document.getElementById('settingsAiApiUrl');
        this.settingsAiDefaultModel = document.getElementById('settingsAiDefaultModel');
        this.settingsTelegramToken = document.getElementById('settingsTelegramToken');
        this.settingsTogetherApiKey = document.getElementById('settingsTogetherApiKey');
        this.settingsXaiApiKey = document.getElementById('settingsXaiApiKey');

        this.init();
    }

    init() {
        if (this.btnBackToChat) {
            this.btnBackToChat.addEventListener('click', () => {
                window.location.href = '/';
            });
        }
        if (this.btnSaveSettings) {
            this.btnSaveSettings.addEventListener('click', () => this.saveSettings());
        }

        // Load existing settings and check status
        this.loadSettings();
    }

    async loadSettings() {
        try {
            const response = await fetch('/api/settings');
            if (response.ok) {
                const settings = await response.json();
                
                // Show warning banner if key is missing
                if (!settings.hasAiApiKey) {
                    if (this.setupWarningBanner) this.setupWarningBanner.style.display = 'block';
                } else {
                    if (this.setupWarningBanner) this.setupWarningBanner.style.display = 'none';
                }

                // Set placeholders and values
                this.settingsAiApiUrl.value = settings.aiApiUrl || '';
                this.settingsAiDefaultModel.value = settings.aiDefaultModel || 'qwen/qwen3.5-flash-02-23';

                this.settingsAiApiKey.value = '';
                this.settingsAiApiKey.placeholder = settings.hasAiApiKey ? '****** (configured)' : 'Enter OpenRouter API Key';
                
                this.settingsTelegramToken.value = '';
                this.settingsTelegramToken.placeholder = settings.hasTelegramBotToken ? '****** (configured)' : 'Enter Telegram Bot Token';

                this.settingsTogetherApiKey.value = '';
                this.settingsTogetherApiKey.placeholder = settings.hasTogetherApiKey ? '****** (configured)' : 'Enter Together AI API Key';

                this.settingsXaiApiKey.value = '';
                this.settingsXaiApiKey.placeholder = settings.hasXaiApiKey ? '****** (configured)' : 'Enter X.AI API Key';
            }
        } catch (err) {
            console.error('Error loading settings:', err);
            alert('Failed to load system configuration.');
        }
    }

    async saveSettings() {
        const aiApiKey = this.settingsAiApiKey.value.trim();
        const aiApiUrl = this.settingsAiApiUrl.value.trim();
        const aiDefaultModel = this.settingsAiDefaultModel.value.trim();
        const telegramBotToken = this.settingsTelegramToken.value.trim();
        const togetherApiKey = this.settingsTogetherApiKey.value.trim();
        const xaiApiKey = this.settingsXaiApiKey.value.trim();

        const payload = {};
        if (aiApiKey !== '') payload.aiApiKey = aiApiKey === '-' ? '' : aiApiKey;
        if (aiApiUrl !== '') payload.aiApiUrl = aiApiUrl;
        if (aiDefaultModel !== '') payload.aiDefaultModel = aiDefaultModel;
        if (telegramBotToken !== '') payload.telegramBotToken = telegramBotToken === '-' ? '' : telegramBotToken;
        if (togetherApiKey !== '') payload.togetherApiKey = togetherApiKey === '-' ? '' : togetherApiKey;
        if (xaiApiKey !== '') payload.xaiApiKey = xaiApiKey === '-' ? '' : xaiApiKey;

        // If no changes, just go back to chat
        if (Object.keys(payload).length === 0) {
            window.location.href = '/';
            return;
        }

        this.btnSaveSettings.disabled = true;
        this.btnSaveSettings.textContent = 'SAVING...';

        try {
            const response = await fetch('/api/settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();
            if (data.success) {
                alert('Configuration saved successfully!');
                window.location.href = '/'; // Go back to main chat
            } else {
                throw new Error(data.message || 'Failed to save settings');
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            alert(`Error saving configuration: ${error.message}`);
        } finally {
            this.btnSaveSettings.disabled = false;
            this.btnSaveSettings.textContent = 'SAVE CONFIG';
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.systemSettings = new SystemSettings();
});
