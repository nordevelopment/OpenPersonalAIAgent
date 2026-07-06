import fs from 'fs';

/**
 * Safely updates or appends key-value pairs in a .env file.
 * Preserves comments and non-modified lines.
 * 
 * @param filePath - Absolute path to the .env file
 * @param updates - Object containing keys and their new string values
 */
export function updateEnvFile(filePath: string, updates: Record<string, string>): void {
  let content = '';
  if (fs.existsSync(filePath)) {
    content = fs.readFileSync(filePath, 'utf-8');
  }

  const lines = content.split(/\r?\n/);
  const updatedKeys = new Set<string>();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines and comments
    if (!line || line.startsWith('#') || !line.includes('=')) {
      continue;
    }

    const eqIndex = lines[i].indexOf('=');
    const key = lines[i].substring(0, eqIndex).trim();

    if (updates[key] !== undefined) {
      const val = updates[key];
      // Wrap in double quotes if there are spaces in value
      const safeVal = val.includes(' ') && !val.startsWith('"') ? `"${val}"` : val;
      lines[i] = `${key}=${safeVal}`;
      updatedKeys.add(key);
    }
  }

  // Append new keys that were not found in the file
  const newLines: string[] = [];
  for (const [key, val] of Object.entries(updates)) {
    if (!updatedKeys.has(key)) {
      const safeVal = val.includes(' ') && !val.startsWith('"') ? `"${val}"` : val;
      newLines.push(`${key}=${safeVal}`);
    }
  }

  if (newLines.length > 0) {
    // If the last line of the file is not empty, add a newline before appending
    if (lines.length > 0 && lines[lines.length - 1].trim() !== '') {
      lines.push('');
    }
    lines.push(...newLines);
  }

  fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');
}
