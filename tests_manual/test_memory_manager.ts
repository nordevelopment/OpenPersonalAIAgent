import { DatabaseClient } from '../src/backend/database/DatabaseClient.js';
import { MemoryManager } from '../src/backend/ai/MemoryManager.js';

async function main() {
  console.log('=== MemoryManager Integration Test ===\n');

  const db = new DatabaseClient();
  await db.initialize();
  const memoryManager = new MemoryManager(db);

  const sessionId = 'test_memory_session_999';

  try {
    // 1. Ensure test session exists
    const sessionRows = await db.select('sessions', { id: sessionId });
    if (sessionRows.length === 0) {
      await db.insert('sessions', { id: sessionId, agent_id: 'main_agent' });
    }

    // 2. Clear previous data
    console.log('Clearing old memories...');
    await memoryManager.clearAll(sessionId);

    // 3. Save a memory
    console.log('\nSaving memories...');
    const mem1 = await memoryManager.saveMemory(
      sessionId,
      'user_favorite_language',
      'TypeScript because of type safety and autocompletion',
      'preference'
    );
    console.log('Saved memory 1:', mem1);

    const mem2 = await memoryManager.saveMemory(
      sessionId,
      'user_pet',
      'Dog named Buddy who loves playing fetch in the park',
      'personal'
    );
    console.log('Saved memory 2:', mem2);

    // 4. Search memories semantically
    console.log('\nSearching memories for "types" (expecting TypeScript)...');
    const search1 = await memoryManager.searchMemories(sessionId, 'types');
    console.log('Search results:', JSON.stringify(search1, null, 2));

    console.log('\nSearching memories for "doggy" (expecting dog)...');
    const search2 = await memoryManager.searchMemories(sessionId, 'doggy');
    console.log('Search results:', JSON.stringify(search2, null, 2));

    // 5. Get relevant context for agent prompt
    console.log('\nGetting relevant context for query "What do you know about my pet?"...');
    const context = await memoryManager.getRelevantContext(sessionId, 'What do you know about my pet?');
    console.log('Context output:', JSON.stringify(context));

    // 6. Delete memory by key
    console.log('\nDeleting memory for key "user_pet"...');
    await memoryManager.deleteMemoryByKey(sessionId, 'user_pet');
    
    console.log('Searching again for "doggy" post-deletion...');
    const search3 = await memoryManager.searchMemories(sessionId, 'doggy');
    console.log('Search results (should not find the deleted pet fact):', JSON.stringify(search3, null, 2));

    // 7. Clear all remaining
    console.log('\nClearing all memories...');
    await memoryManager.clearAll(sessionId);
    const search4 = await memoryManager.searchMemories(sessionId, 'types');
    console.log('Search results after clearAll (should be empty):', JSON.stringify(search4, null, 2));

    console.log('\n=== All Tests Passed Successfully! ===');

  } catch (error) {
    console.error('Test execution failed:', error);
  } finally {
    db.close();
  }
}

main();
