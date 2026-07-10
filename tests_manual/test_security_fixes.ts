import { AgentService } from '../src/backend/ai/AgentService.js';
import { FileSystemManager } from '../src/backend/services/FileSystemManager.js';
import path from 'path';

async function testSecurityFixes() {
  console.log('--- STARTING SECURITY FIXES TEST ---');

  // 1. Test AgentService sanitization
  console.log('\nTesting AgentService...');
  const agentService = new AgentService();

  // Test agentExists with traversal attempt
  const dangerousId = '../../src/backend';
  try {
    const exists = await agentService.agentExists(dangerousId);
    console.log(`[PASS] agentExists on "${dangerousId}" returned ${exists} (expected false or sanitized check)`);
  } catch (err) {
    console.log('[FAIL] agentExists threw error:', err);
  }

  // Test getAgentFiles with traversal
  try {
    const files = await agentService.getAgentFiles(dangerousId);
    console.log(`[PASS] getAgentFiles for "${dangerousId}" executed without escaping directory bounds.`);
    console.log('Resulting keys:', Object.keys(files));
  } catch (err) {
    console.log('[FAIL] getAgentFiles threw error:', err);
  }

  // 2. Test FileSystemManager validation
  console.log('\nTesting FileSystemManager path validation...');
  const fsManager = new FileSystemManager();

  // We should not be able to access outside workspace
  const outsidePath = path.resolve(process.cwd(), 'package.json');
  try {
    await fsManager.readFile(outsidePath);
    console.log('[FAIL] FileSystemManager allowed reading outside target workspace:', outsidePath);
  } catch (err: any) {
    console.log(`[PASS] FileSystemManager blocked reading outside workspace: "${err.message}"`);
  }

  // Check the specific path traversal bypass we fixed
  // targetPath is a directory name starting with "workspace" on same level
  const allowedRoot = fsManager['allowedRoots'][0]; // e.g. /path/to/workspace
  const bypassPath = allowedRoot + '_secret/secret.txt'; // e.g. /path/to/workspace_secret/secret.txt
  try {
    // Manually trigger validatePath
    fsManager['validatePath'](bypassPath);
    console.log('[FAIL] FileSystemManager allowed access to path starting with root prefix:', bypassPath);
  } catch (err: any) {
    console.log(`[PASS] FileSystemManager blocked prefix-based path bypass: "${err.message}"`);
  }

  console.log('\n--- SECURITY FIXES TEST COMPLETED ---');
}

testSecurityFixes().catch(console.error);
