import { DatabaseClient } from '../src/backend/database/DatabaseClient.js';

async function main() {
  const db = new DatabaseClient('./database.sqlite');
  
  try {
    const sessionQuery = `
      SELECT session_id, max(created_at) as last_msg_time 
      FROM messages 
      GROUP BY session_id 
      ORDER BY last_msg_time DESC 
      LIMIT 1
    `;
    const sessionRes = await db.query(sessionQuery);
    
    if (sessionRes.rows.length === 0) {
      console.log("No messages found.");
      return;
    }
    
    const sessionId = (sessionRes.rows[0] as any).session_id;
    console.log(`=== BRIEF HISTORY FOR SESSION: ${sessionId} ===\n`);
    
    const messagesQuery = `
      SELECT id, role, content, tool_call_id, tool_calls, created_at 
      FROM messages 
      WHERE session_id = ? 
      ORDER BY id ASC
    `;
    const messagesRes = await db.query(messagesQuery, [sessionId]);
    
    for (const msg of messagesRes.rows as any[]) {
      console.log(`[ID: ${msg.id}] [${msg.role.toUpperCase()}] (${msg.created_at})`);
      if (msg.tool_call_id) {
        console.log(`  -> Response to Tool Call ID: ${msg.tool_call_id}`);
      }
      if (msg.tool_calls) {
        console.log(`  -> Requested Tool Calls: ${msg.tool_calls}`);
      }
      const preview = msg.content ? msg.content.substring(0, 150).replace(/\n/g, ' ') : '';
      console.log(`  -> Content Preview: ${preview}...`);
      console.log("-".repeat(80));
    }
    
  } catch (error: any) {
    console.error("Error reading history:", error.message);
  } finally {
    db.close();
  }
}

main();
