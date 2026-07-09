/**
 * AITools.ts - Tools/functions for AI
 * Responsible for executing functions that AI can call
 * Author: Norayr Petrosyan
 */

import { FileSystemManager } from "../services/FileSystemManager.js";
import { WebPageContent } from "../services/WebPageContent.js";
import { imageService } from "../services/imageService.js";
import { MemoryManager } from "./MemoryManager.js";

export interface ToolCall {
  name: string;
  arguments: Record<string, unknown>;
}

export interface ToolResult {
  name: string;
  result: unknown;
}

export class AITools {
  private fsManager = new FileSystemManager();
  private webPage = new WebPageContent();

  constructor(private memoryManager?: MemoryManager) {}
  /**
   * Execute a tool
   * @param toolCall - tool call from AI
   * @returns execution result
   */

  async executeTool(toolCall: ToolCall, sessionId?: string): Promise<ToolResult> {
    const { name, arguments: args } = toolCall;
    const p = args.path as string;

    try {
      let result: any;
      switch (name) {
        case 'read_file':
          result = await this.fsManager.readFile(p, { encoding: args.encoding as BufferEncoding });
          break;
        case 'write_file':
          await this.fsManager.writeFile(p, args.content as string);
          result = "File written successfully.";
          break;
        case 'list_directory':
          result = await this.fsManager.listDirectory(p);
          break;
        case 'delete_item':
          if (args.recursive) await this.fsManager.deleteDirectory(p, true);
          else await this.fsManager.deleteFile(p);
          result = "Object deleted successfully.";
          break;
        case 'move_or_rename':
          await this.fsManager.moveFile(args.source as string, args.destination as string);
          result = "Move/rename completed successfully.";
          break;
        case 'get_file_info':
          result = await this.fsManager.getStats(p);
          break;
        case 'fetch_web_page':
          result = await this.webPage.fetchPage({
            url: args.url as string
          });
          break;
        case 'generate_image':
          result = await imageService.generateImage(
            args.prompt as string,
            args.aspectRatio as string | undefined,
            args.steps as number | undefined,
            args.provider as 'together' | 'xai' | undefined
          );
          break;
        case 'save_memory':
          if (!this.memoryManager) throw new Error("MemoryManager is not configured on this agent.");
          if (!sessionId) throw new Error("Session ID is required for memory operations.");
          result = await this.memoryManager.saveMemory(
            sessionId,
            args.key as string,
            args.value as string,
            (args.category as string) || 'personal'
          );
          break;
        case 'search_memories':
          if (!this.memoryManager) throw new Error("MemoryManager is not configured on this agent.");
          if (!sessionId) throw new Error("Session ID is required for memory operations.");
          const searchResults = await this.memoryManager.searchMemories(
            sessionId,
            args.query as string,
            (args.limit as number) || 5
          );
          result = searchResults.map(r => ({
            key: r.memory.key,
            value: r.memory.value,
            category: r.memory.category,
            similarity: r.similarity
          }));
          break;
        case 'delete_memory':
          if (!this.memoryManager) throw new Error("MemoryManager is not configured on this agent.");
          if (!sessionId) throw new Error("Session ID is required for memory operations.");
          await this.memoryManager.deleteMemoryByKey(sessionId, args.key as string);
          result = `Memory with key '${args.key}' deleted successfully.`;
          break;
        default:
          throw new Error(`Tool ${name} is not implemented.`);
      }

      return { name, result };
    } catch (error) {
      return { name, result: `Error executing tool: ${(error as Error).message}` };
    }
  }

  /**
   * Get available tools in OpenAI Function Calling format
   * @returns Array of tool descriptions
   */
  getAvailableTools() {
    return [
      {
        type: 'function',
        function: {
          name: 'read_file',
          description: 'Reads the contents of a text file. All paths must be within workspace/ (e.g., project/file.txt).',
          parameters: {
            type: 'object',
            properties: {
              path: { type: 'string', description: 'The path to the file relative to the workspace or the absolute path within the workspace' },
              encoding: { type: 'string', enum: ['utf8', 'base64'], default: 'utf8' }
            },
            required: ['path']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'write_file',
          description: "Creates or overwrites a file. Creates directories if they don't exist. All paths must be within workspace/ (e.g., project/file.txt).",
          parameters: {
            type: 'object',
            properties: {
              path: { type: 'string', description: 'The path to the file relative to the workspace or the absolute path within the workspace' },
              content: { type: 'string', description: 'The text content of the file' }
            },
            required: ['path', 'content']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'list_directory',
          description: 'Shows a list of files and folders in the specified directory. All paths must be within workspace/.',
          parameters: {
            type: 'object',
            properties: {
              path: { type: 'string', description: 'The path to the directory relative to the workspace or the absolute path within the workspace' }
            },
            required: ['path']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'delete_item',
          description: 'Deletes a file or directory. All paths must be within workspace/.',
          parameters: {
            type: 'object',
            properties: {
              path: { type: 'string', description: 'The path to the object to delete (within workspace)' },
              recursive: { type: 'boolean', description: 'Whether to delete recursively (for directories)' }
            },
            required: ['path']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'move_or_rename',
          description: 'Moves or renames a file or directory. All paths must be within workspace/.',
          parameters: {
            type: 'object',
            properties: {
              source: { type: 'string', description: 'From where (within workspace)' },
              destination: { type: 'string', description: 'To where (within workspace)' }
            },
            required: ['source', 'destination']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'get_file_info',
          description: 'Gets information about a file: size, modification date, type. All paths must be within workspace/.',
          parameters: {
            type: 'object',
            properties: {
              path: { type: 'string', description: 'The path to the object (within workspace)' }
            },
            required: ['path']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'fetch_web_page',
          description: 'Gets the HTML cleaned web page content. Supports JSON responses from APIs.',
          parameters: {
            type: 'object',
            properties: {
              url: { type: 'string', description: 'URL of the page to retrieve' }
            },
            required: ['url']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'generate_image',
          description: 'Generates an image from a text prompt using AI. Returns the relative path. IMPORTANT: You MUST display the generated image in your response using markdown syntax: ![Caption](relative_path).',
          parameters: {
            type: 'object',
            properties: {
              prompt: { type: 'string', description: 'The detailed description of the image to generate.' },
              aspectRatio: {
                type: 'string',
                enum: ['1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3'],
                default: '2:3',
                description: 'The aspect ratio of the generated image.'
              },
              steps: {
                type: 'integer',
                minimum: 1,
                maximum: 50,
                default: 25,
                description: 'The number of inference steps (quality/time trade-off).'
              },
              provider: {
                type: 'string',
                enum: ['together', 'xai'],
                default: 'together',
                description: 'The image generation provider.'
              }
            },
            required: ['prompt']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'save_memory',
          description: 'Saves or updates an important fact about the user, preference, or context in long-term memory.',
          parameters: {
            type: 'object',
            properties: {
              key: { type: 'string', description: 'Short snake_case unique key for the memory (e.g. user_name, favorite_pizza).' },
              value: { type: 'string', description: 'The description/value to remember.' },
              category: {
                type: 'string',
                enum: ['personal', 'preference', 'event', 'goal', 'task', 'information', 'intention', 'fact', 'context'],
                default: 'personal',
                description: 'Category classification.'
              }
            },
            required: ['key', 'value']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'search_memories',
          description: 'Searches stored memories semantically or using keyword matches for relevant information.',
          parameters: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'The topic, keyword, or query to search for.' },
              limit: { type: 'integer', default: 5, description: 'Max results to return.' }
            },
            required: ['query']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'delete_memory',
          description: 'Deletes a specific fact from memory using its key.',
          parameters: {
            type: 'object',
            properties: {
              key: { type: 'string', description: 'The exact key of the memory to delete.' }
            },
            required: ['key']
          }
        }
      }
    ];
  }
}
