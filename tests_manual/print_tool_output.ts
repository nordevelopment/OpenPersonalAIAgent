import { DatabaseClient } from '../src/backend/database/DatabaseClient.js';

async function main() {
  const db = new DatabaseClient('./database.sqlite');
  
  try {
    const query = `
      SELECT id, role, content, created_at 
      FROM messages 
      WHERE role = 'tool'
      ORDER BY id DESC 
      LIMIT 2
    `;
    const res = await db.query(query);
    
    for (const row of res.rows as any[]) {
      console.log(`=== TOOL RESPONSE ID: ${row.id} (${row.created_at}) ===`);
      const lines = row.content.split('\n');
      console.log("FIFINE search results in this response:");
      lines.forEach((line: string) => {
        if (line.toLowerCase().includes('fifine') || line.includes('669')) {
          console.log("  ->", line);
        }
      });
      console.log("\n" + "=".repeat(80) + "\n");
    }
  } catch (err: any) {
    console.error("Error:", err.message);
  } finally {
    db.close();
  }
}

main();
