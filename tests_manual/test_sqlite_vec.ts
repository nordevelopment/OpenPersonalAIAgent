import { DatabaseClient } from '../src/backend/database/DatabaseClient.js';

async function main() {
  console.log('Testing sqlite-vec database client integration...');
  const db = new DatabaseClient();
  await db.initialize();

  try {
    // 1. Clear any existing memories for a test session
    const sessionId = 'test_session_123';
    
    // Ensure session exists
    const sessionRows = await db.select('sessions', { id: sessionId });
    if (sessionRows.length === 0) {
      await db.insert('sessions', { id: sessionId, agent_id: 'main_agent' });
    }

    await db.run('DELETE FROM vec_memories WHERE rowid IN (SELECT id FROM memories WHERE session_id = ?)', [sessionId]);
    await db.run('DELETE FROM memories WHERE session_id = ?', [sessionId]);

    console.log('Database cleared for test session.');

    // 2. Insert dummy memory
    const key = 'user_hobby';
    const value = 'programming in TypeScript';
    const category = 'preference';
    const content = `${key}: ${value}`;

    // Get a dummy embedding of 4096 dimensions
    const dummyEmbedding = new Array(4096).fill(0);
    dummyEmbedding[0] = 0.5;
    dummyEmbedding[1] = -0.5;
    dummyEmbedding[2] = 0.1;

    // Insert into memories
    const memoryId = await db.insert('memories', {
      session_id: sessionId,
      key,
      value,
      category,
      content,
    });

    console.log('Inserted memory text. Row ID:', memoryId);

    // Serialize embedding
    const buffer = Buffer.alloc(4096 * 4);
    for (let i = 0; i < 4096; i++) {
      buffer.writeFloatLE(dummyEmbedding[i] || 0, i * 4);
    }

    // Insert into vec_memories
    await db.run('INSERT INTO vec_memories(rowid, embedding) VALUES (CAST(? AS INTEGER), ?)', [memoryId, buffer]);
    console.log('Inserted embedding.');

    // 3. Query using cosine similarity
    const queryEmbedding = new Array(4096).fill(0);
    queryEmbedding[0] = 0.45;
    queryEmbedding[1] = -0.48;
    queryEmbedding[2] = 0.08;

    const queryBuffer = Buffer.alloc(4096 * 4);
    for (let i = 0; i < 4096; i++) {
      queryBuffer.writeFloatLE(queryEmbedding[i] || 0, i * 4);
    }

    const sql = `
      SELECT 
        m.*, 
        1 - vec_distance_cosine(vm.embedding, ?) as similarity
      FROM memories m
      JOIN vec_memories vm ON m.id = vm.rowid
      WHERE m.session_id = ?
      ORDER BY similarity DESC
      LIMIT ?
    `;

    const result = await db.query(sql, [queryBuffer, sessionId, 5]);
    console.log('Query results:', JSON.stringify(result.rows, null, 2));

  } catch (error) {
    console.error('Vector search test failed:', error);
  } finally {
    db.close();
  }
}

main();
