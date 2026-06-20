import dotenv from 'dotenv';
dotenv.config();

export const config = {
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  PORT: process.env.PORT || 3000,
  HOST: process.env.HOST || '127.0.0.1',
  ENV: process.env.NODE_ENV || 'local',
  AI_DEFAULT_MODEL: process.env.AI_DEFAULT_MODEL || 'Qwen/Qwen3-30B-A3B-Instruct-2507',
  AI_EMBEDDING_MODEL: process.env.AI_EMBEDDING_MODEL || 'Qwen/Qwen3-Embedding-8B',
  AI_API_KEY: process.env.AI_API_KEY || '',
  AI_API_URL: process.env.AI_API_URL || '',
  AI_MAX_HISTORY_MESSAGES: process.env.AI_MAX_HISTORY_MESSAGES || 30,
  AI_TEMPERATURE: process.env.AI_TEMPERATURE || 0.2,
  AI_MAX_TOKENS: process.env.AI_MAX_TOKENS || 8192,
  AI_TOP_P: process.env.AI_TOP_P || 0.9,
  AI_TIMEOUT: 180000,
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || '',

  default_agent: 'main_agent',

  images: {
    defaultProvider: process.env.IMAGE_DEFAULT_PROVIDER || 'together',
    together: {
      key: process.env.TOGETHER_API_KEY || '',
      url: process.env.TOGETHER_API_URL || 'https://api.together.xyz/v1/images/generations',
      model: process.env.TOGETHER_IMAGE_MODEL || 'black-forest-labs/FLUX.1-schnell'
    },
    xai: {
      key: process.env.XAI_API_KEY || '',
      url: process.env.XAI_API_URL || 'https://api.x.ai/v1/images/generations',
      model: process.env.XAI_IMAGE_MODEL || 'grok-imagine-image'
    }
  },

  storageDir: 'storage',
  generatedImagesDir: 'storage/generated'
};