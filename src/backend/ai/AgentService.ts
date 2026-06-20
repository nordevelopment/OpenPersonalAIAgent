/**
 * AgentService.ts - Service for working with agent descriptions
 * Allows you to get a list of available agents and their configurations
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
        // Path to agents folder in project root
        this.baseAgentsPath = path.join(__dirname, '../../../agents');
    }

    /**
     * Get list of available agents (folder names in agents directory)
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
     * Check if agent exists
     * @param agentId - agent ID (folder name)
     */
    async agentExists(agentId: string): Promise<boolean> {
        const agentPath = path.join(this.baseAgentsPath, agentId);
        return fs.existsSync(agentPath) && fs.lstatSync(agentPath).isDirectory();
    }
}
