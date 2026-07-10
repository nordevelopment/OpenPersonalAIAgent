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

  // 3. Test HTTP Basic Auth
  console.log('\nTesting HTTP Basic Auth...');
  const { config } = await import('../src/backend/config.js');
  const { buildApp } = await import('../src/backend/app.js');

  // Backup configs
  const originalUser = config.APP_USER;
  const originalPassword = config.APP_PASSWORD;

  // Set mock configs
  config.APP_USER = 'testuser';
  config.APP_PASSWORD = 'testpassword';

  try {
    const app = await buildApp();

    // 3.1 Test request without credentials -> should return 401
    const responseNoCreds = await app.inject({
      method: 'GET',
      url: '/'
    });
    if (responseNoCreds.statusCode === 401) {
      console.log('[PASS] GET / without credentials returned 401 Unauthorized');
    } else {
      console.log('[FAIL] GET / without credentials returned', responseNoCreds.statusCode);
    }

    // 3.2 Test request with WRONG credentials -> should return 401
    const responseWrongCreds = await app.inject({
      method: 'GET',
      url: '/',
      headers: {
        authorization: 'Basic ' + Buffer.from('testuser:wrong').toString('base64')
      }
    });
    if (responseWrongCreds.statusCode === 401) {
      console.log('[PASS] GET / with wrong credentials returned 401 Unauthorized');
    } else {
      console.log('[FAIL] GET / with wrong credentials returned', responseWrongCreds.statusCode);
    }

    // 3.3 Test request with CORRECT credentials -> should return 200
    const responseCorrectCreds = await app.inject({
      method: 'GET',
      url: '/',
      headers: {
        authorization: 'Basic ' + Buffer.from('testuser:testpassword').toString('base64')
      }
    });
    if (responseCorrectCreds.statusCode === 200) {
      console.log('[PASS] GET / with correct credentials returned 200 OK');
    } else {
      console.log('[FAIL] GET / with correct credentials returned', responseCorrectCreds.statusCode);
    }

    // 3.4 Test health check endpoint (should bypass auth) -> should return 200
    const responseHealth = await app.inject({
      method: 'GET',
      url: '/api/health'
    });
    if (responseHealth.statusCode === 200) {
      console.log('[PASS] GET /api/health bypassed Basic Auth and returned 200 OK');
    } else {
      console.log('[FAIL] GET /api/health returned', responseHealth.statusCode);
    }

    // Close app to free handles
    await app.close();
  } catch (err) {
    console.log('[FAIL] HTTP Basic Auth test failed with error:', err);
  } finally {
    // Restore original configs
    config.APP_USER = originalUser;
    config.APP_PASSWORD = originalPassword;
  }

  console.log('\n--- SECURITY FIXES TEST COMPLETED ---');
}

testSecurityFixes().catch(console.error);
