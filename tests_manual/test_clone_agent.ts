import { AgentService } from '../src/backend/ai/AgentService.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log("=== ТЕСТИРОВАНИЕ КЛОНИРОВАНИЯ АГЕНТА И НАВЫКОВ ===");
  const service = new AgentService();
  const testAgentId = 'test_temp_agent';

  try {
    // Clean up if existed
    if (await service.agentExists(testAgentId)) {
      console.log(`Удаляем старого тестового агента...`);
      await service.deleteAgent(testAgentId);
    }

    console.log(`Создаем агента "${testAgentId}"...`);
    await service.createAgent(testAgentId);

    const destSkillsDir = path.join(__dirname, `../agents/${testAgentId}/skills`);
    if (fs.existsSync(destSkillsDir) && fs.readdirSync(destSkillsDir).length > 0) {
      console.log("✅ Клонирование навыков успешно: папка skills скопирована и заполнена!");
      console.log("Содержимое папки:", fs.readdirSync(destSkillsDir));
    } else {
      console.error("❌ ОШИБКА: Папка skills отсутствует или пуста у нового агента!");
    }

  } catch (error: any) {
    console.error("❌ Тест упал с ошибкой:", error.message);
  } finally {
    // Cleanup
    if (await service.agentExists(testAgentId)) {
      console.log(`Удаляем временного тестового агента...`);
      await service.deleteAgent(testAgentId);
    }
  }
}

main();
