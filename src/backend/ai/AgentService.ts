/**
 * AgentService.ts - Сервис для работы с описаниями агентов
 * Позволяет получать список доступных агентов и их конфигурации
 * Author: Norayr Petrosyan
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class AgentService {
    private baseAgentsPath: string;

    constructor() {
        // Путь к папке agents в корне проекта
        this.baseAgentsPath = path.join(__dirname, '../../../agents');
    }

    /**
     * Получить список доступных агентов (названия папок в директории agents)
     */
    async getAvailableAgents(): Promise<string[]> {
        if (!fs.existsSync(this.baseAgentsPath)) {
            console.warn(`AgentService: Directory not found: ${this.baseAgentsPath}`);
            return [];
        }

        const entries = fs.readdirSync(this.baseAgentsPath, { withFileTypes: true });
        return entries
            .filter(entry => entry.isDirectory())
            .map(entry => entry.name);
    }

    /**
     * Проверить существование агента
     * @param agentId - ID агента (название папки)
     */
    async agentExists(agentId: string): Promise<boolean> {
        const agentPath = path.join(this.baseAgentsPath, agentId);
        return fs.existsSync(agentPath) && fs.lstatSync(agentPath).isDirectory();
    }
}
