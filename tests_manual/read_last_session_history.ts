import { DatabaseClient } from '../src/backend/database/DatabaseClient.js';

async function main() {
  const db = new DatabaseClient('./database.sqlite');
  
  try {
    // Get last session ID based on the most recent message
    const sessionQuery = `
      SELECT session_id, max(created_at) as last_msg_time 
      FROM messages 
      GROUP BY session_id 
      ORDER BY last_msg_time DESC 
      LIMIT 1
    `;
    const sessionRes = await db.query(sessionQuery);
    
    if (sessionRes.rows.length === 0) {
      console.log("Сообщения не найдены в базе данных.");
      return;
    }
    
    const sessionId = (sessionRes.rows[0] as any).session_id;
    console.log(`=== ПОСЛЕДНЯЯ СЕССИЯ: ${sessionId} ===\n`);
    
    // Get messages for this session
    const messagesQuery = `
      SELECT role, content, created_at 
      FROM messages 
      WHERE session_id = ? 
      ORDER BY created_at ASC
    `;
    const messagesRes = await db.query(messagesQuery, [sessionId]);
    
    for (const msg of messagesRes.rows as any[]) {
      console.log(`[${msg.role.toUpperCase()}] (${msg.created_at})`);
      console.log(msg.content);
      console.log("-".repeat(80));
    }
    
  } catch (error: any) {
    console.error("Ошибка при чтении истории:", error.message);
  } finally {
    db.close();
  }
}

main();
