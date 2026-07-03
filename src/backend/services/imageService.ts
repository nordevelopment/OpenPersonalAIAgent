/**
 * Image Service - AI Image Generation using Together/XAI APIs
 * Author: Norayr Petrosyan
 */

import { config } from '../config.js';
import axios from 'axios';
import nodePath from 'node:path';
import nodeFs from 'node:fs';
import crypto from 'node:crypto';

// ==================== Types ====================

interface ImageGenerationResponse {
  relativePath: string; // Relative path from public directory (e.g., /storage/generated/image.png)
  fullPath: string; // Full system path (e.g., E:\AILab\NodeProjects\talktoaimeApp\public\storage\generated\image.png)
}

interface TogetherImageResponse {
  id?: string;
  data?: Array<{
    url?: string;
    base64?: string;
    file_name?: string;
    content_type?: string;
  }>;
}

interface XAIImageResponse {
  id?: string;
  data?: Array<{
    url?: string;
    b64_json?: string;
    revised_prompt?: string;
  }>;
}

interface TogetherPayload {
  model: string;
  prompt: string;
  n: number;
  steps?: number;
  width?: number;
  height?: number;
  aspect_ratio?: string;
}

interface XAIPayload {
  model: string;
  prompt: string;
  n: number;
  response_format: 'url' | 'b64_json';
  aspect_ratio?: string;
}

// ==================== Constants ====================

const VALID_ASPECT_RATIOS = [
  '1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3',
  '2:1', '1:2', '20:9', '9:20'
] as const;

const DEFAULT_ASPECT_RATIO: string = '2:3';

const TOGETHER_SIZES = [
  { ratio: '1:1', width: 1024, height: 1024 },
  { ratio: '16:9', width: 1344, height: 768 },
  { ratio: '9:16', width: 768, height: 1344 },
  { ratio: '4:3', width: 1152, height: 864 },
  { ratio: '3:4', width: 864, height: 1152 },
  { ratio: '3:2', width: 1200, height: 800 },
  { ratio: '2:3', width: 800, height: 1200 },
] as const;

export class ImageService {

  constructor() {
    if (!nodeFs.existsSync(config.generatedImagesDir)) {
      nodeFs.mkdirSync(config.generatedImagesDir, { recursive: true });
    }
    // console.log('[Image] Image service initialized', config.generatedImagesDir);
  }

  /**
   * Generate image using AI
   */
  async generateImage(
    prompt: string,
    aspectRatio: string = DEFAULT_ASPECT_RATIO,
    steps?: number,
    provider: 'together' | 'xai' = 'together'
  ): Promise<ImageGenerationResponse> {
    if (!prompt?.trim()) {
      throw new Error('Prompt cannot be empty');
    }

    this.validateAspectRatio(aspectRatio);

    const hasTogether = !!config.images.together?.key;
    const hasXai = !!config.images.xai?.key;

    if (!hasTogether && !hasXai) {
      throw new Error('To generate images, you need to configure API keys (Together AI or X.AI) in the system settings.');
    }

    let activeProvider: 'together' | 'xai' = provider;

    if (provider === 'xai') {
      if (hasXai) {
        activeProvider = 'xai';
      } else if (hasTogether) {
        activeProvider = 'together';
      }
    } else {
      if (hasTogether) {
        activeProvider = 'together';
      } else if (hasXai) {
        activeProvider = 'xai';
      }
    }

    if (activeProvider === 'xai') {
      return this.generateWithXAI(prompt, aspectRatio);
    } else {
      const togetherSteps = steps !== undefined ? steps : (config.images.together as any).steps;
      return this.generateWithTogether(prompt, aspectRatio, togetherSteps);
    }
  }

  /**
   * List all generated images
   */
  async listGeneratedImages(): Promise<Array<{ name: string, url: string, date: Date, size: number }>> {
    try {
      const files = nodeFs.readdirSync(config.generatedImagesDir);
      const images = files
        .filter(file => /\.(png|jpg|jpeg|webp)$/i.test(file))
        .map(file => {
          const filepath = nodePath.join(config.generatedImagesDir, file);
          const stats = nodeFs.statSync(filepath);
          return {
            name: file,
            url: `/storage/generated/${file}`,
            date: stats.mtime,
            size: stats.size
          };
        })
        .sort((a, b) => b.date.getTime() - a.date.getTime());

      return images;
    } catch (error) {
      console.error('[Image] List Error:', error);
      return [];
    }
  }

  /**
   * Delete a generated image
   */
  async deleteImage(filename: string): Promise<void> {
    const safeFilename = nodePath.basename(filename);
    const filepath = nodePath.join(config.generatedImagesDir, safeFilename);

    if (nodeFs.existsSync(filepath)) {
      nodeFs.unlinkSync(filepath);
    } else {
      throw new Error('File not found');
    }
  }

  private validateAspectRatio(aspectRatio: string): void {
    if (!VALID_ASPECT_RATIOS.includes(aspectRatio as typeof VALID_ASPECT_RATIOS[number])) {
      console.warn(`[Image] Warning: Aspect ratio "${aspectRatio}" is not in the recommended list.`);
    }
  }

  private async generateWithTogether(
    prompt: string,
    aspectRatio: string,
    steps?: number
  ): Promise<ImageGenerationResponse> {
    if (!config.images.together?.key) {
      throw new Error('Together API key not configured');
    }

    const payload: TogetherPayload = {
      model: config.images.together.model,
      prompt,
      n: 1,
      width: TOGETHER_SIZES.find(s => s.ratio === aspectRatio)?.width || 1024,
      height: TOGETHER_SIZES.find(s => s.ratio === aspectRatio)?.height || 1024
    };

    if (steps !== undefined) {
      payload.steps = steps;
    }

    try {
      console.log('[Image] Generating with Together:', prompt.slice(0, 50) + '...');

      const response = await axios.post<TogetherImageResponse>(
        config.images.together.url!,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${config.images.together.key}`,
            'Content-Type': 'application/json'
          },
          timeout: 45000 // 45 seconds timeout for image generation
        }
      );

      const imageData = response.data.data?.[0];
      if (!imageData) {
        throw new Error('No image data received from Together');
      }

      const imageUrl = imageData.url || this.base64ToDataUrl(imageData.base64 ?? '');
      const localPath = await this.downloadImage(imageUrl);
      const relativePath = '/storage/generated/' + nodePath.basename(localPath);

      console.log('[Image] Generated:', localPath);

      return {
        relativePath: relativePath,
        fullPath: localPath
      };
    } catch (error) {
      const axiosError = error as any;
      const errorMessage = axiosError.response?.data
        ? JSON.stringify(axiosError.response.data)
        : (error as Error).message;
      console.error('[Image] Together API Error:', errorMessage);
      throw new Error(`Image generation failed: ${errorMessage}`);
    }
  }

  private async generateWithXAI(
    prompt: string,
    aspectRatio: string
  ): Promise<ImageGenerationResponse> {
    if (!config.images.xai?.key) {
      throw new Error('XAI API key not configured');
    }

    const payload: XAIPayload = {
      model: config.images.xai.model,
      prompt,
      n: 1,
      response_format: 'url',
      aspect_ratio: aspectRatio
    };

    try {
      console.log('[Image] Generating with XAI:', prompt.slice(0, 50) + '...');

      const response = await axios.post<XAIImageResponse>(
        config.images.xai.url!,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${config.images.xai.key}`,
            'Content-Type': 'application/json'
          },
          timeout: 45000 // 45 seconds timeout for image generation
        }
      );

      const imageData = response.data.data?.[0];
      if (!imageData?.url) {
        throw new Error('No image URL received from XAI');
      }

      const localPath = await this.downloadImage(imageData.url);
      const relativePath = '/storage/generated/' + nodePath.basename(localPath);

      console.log('[Image] Generated:', localPath);

      return {
        relativePath: relativePath,
        fullPath: localPath
      };
    } catch (error) {
      const axiosError = error as any;
      const errorMessage = axiosError.response?.data
        ? JSON.stringify(axiosError.response.data)
        : (error as Error).message;
      console.error('[Image] XAI API Error:', errorMessage);
      throw new Error(`Image generation failed: ${errorMessage}`);
    }
  }

  private async downloadImage(imageUrl: string): Promise<string> {
    const filename = `img_${crypto.randomUUID()}.png`;
    const filepath = nodePath.join(config.generatedImagesDir, filename);

    try {
      if (imageUrl.startsWith('data:')) {
        const base64Data = imageUrl.split(',')[1];
        const buffer = Buffer.from(base64Data, 'base64');
        nodeFs.writeFileSync(filepath, buffer);
        return filepath;
      }

      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 30000
      });

      nodeFs.writeFileSync(filepath, Buffer.from(response.data));
      return filepath;
    } catch (error) {
      console.error('[Image] Download Error:', error);
      throw new Error('Failed to download/save image');
    }
  }

  private base64ToDataUrl(base64: string, mimeType = 'image/png'): string {
    return `data:${mimeType};base64,${base64}`;
  }

  /**
   * Get image as base64 for AI vision
   */
  async getImageAsBase64(imagePath: string): Promise<string> {
    const fullPath = imagePath.startsWith('/storage/')
      ? nodePath.join(process.cwd(), imagePath)
      : imagePath;

    // Security check: prevent path traversal attacks
    const normalizedPath = nodePath.normalize(fullPath);
    const projectRoot = nodePath.normalize(process.cwd());

    if (!normalizedPath.startsWith(projectRoot)) {
      throw new Error('Invalid image path: path traversal detected');
    }

    const buffer = nodeFs.readFileSync(normalizedPath);
    return buffer.toString('base64');
  }

  /**
   * Delete old images (cleanup)
   */
  cleanupOldImages(maxAgeHours = 24): void {
    try {
      const now = Date.now();
      const maxAgeMs = maxAgeHours * 60 * 60 * 1000;

      const files = nodeFs.readdirSync(config.generatedImagesDir);
      let deletedCount = 0;

      for (const file of files) {
        const filepath = nodePath.join(config.generatedImagesDir, file);
        const stats = nodeFs.statSync(filepath);

        if (now - stats.mtimeMs > maxAgeMs) {
          nodeFs.unlinkSync(filepath);
          deletedCount++;
        }
      }

      if (deletedCount > 0) {
        console.log(`[Image] Cleaned up ${deletedCount} old images`);
      }
    } catch (error) {
      console.error('[Image] Cleanup Error:', error);
    }
  }
}

// Export singleton
export const imageService = new ImageService();
