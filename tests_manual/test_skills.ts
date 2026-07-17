import { AIClient } from '../src/backend/ai/AIClient.js';

function runTest() {
  const client = new AIClient();

  const testCases = [
    {
      query: "Привет, как дела?",
      expectedSkills: []
    },
    {
      query: "Напиши классный код на typescript",
      expectedSkills: ["CODING"]
    },
    {
      query: "Переведи этот текст на английский язык",
      expectedSkills: ["TRANSLATOR"]
    },
    {
      query: "Сделай рефакторинг функции и потом переведи её описание на english",
      expectedSkills: ["CODING", "TRANSLATOR"]
    },
    {
      query: "создай лендинг страницу для меня как разработчика ИИ агентов",
      expectedSkills: ["WEB_DESIGN"]
    },
    {
      query: "объясни как работает квантовый компьютер простыми словами",
      expectedSkills: ["LEARNING_TUTOR"]
    }
  ];

  console.log("=== ТЕСТИРОВАНИЕ ДИНАМИЧЕСКИХ НАВЫКОВ ===");

  for (const tc of testCases) {
    console.log(`\nЗапрос: "${tc.query}"`);
    const result = client.getMatchingSkills('main_agent', tc.query);
    
    // Проверяем, какие навыки подгрузились
    const loadedSkills: string[] = [];
    if (result.includes("SKILL: CODING")) loadedSkills.push("CODING");
    if (result.includes("SKILL: TRANSLATOR")) loadedSkills.push("TRANSLATOR");
    if (result.includes("SKILL: WEB_DESIGN")) loadedSkills.push("WEB_DESIGN");
    if (result.includes("SKILL: LEARNING_TUTOR")) loadedSkills.push("LEARNING_TUTOR");

    console.log(`Подгруженные навыки: [${loadedSkills.join(', ')}]`);
    
    const matches = tc.expectedSkills.every(s => loadedSkills.includes(s)) && 
                    loadedSkills.every(s => tc.expectedSkills.includes(s));
                    
    if (matches) {
      console.log("✅ ТЕСТ ПРОЙДЕН");
    } else {
      console.log(`❌ ОШИБКА: Ожидалось [${tc.expectedSkills.join(', ')}], но получили [${loadedSkills.join(', ')}]`);
    }
  }
}

runTest();
