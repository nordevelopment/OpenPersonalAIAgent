import { config } from '../src/backend/config.js';
import axios from 'axios';

async function main() {
  console.log('Testing embeddings API...');
  console.log('API URL:', config.AI_API_URL);
  console.log('Embedding model:', config.AI_EMBEDDING_MODEL);

  const embeddingUrl = config.AI_API_URL.replace('/chat/completions', '/embeddings') || 'https://openrouter.ai/api/v1/embeddings';
  console.log('Target URL:', embeddingUrl);

  if (!config.AI_API_KEY) {
    console.error('No API key found in config!');
    return;
  }

  try {
    const response = await axios.post(
      embeddingUrl,
      {
        model: config.AI_EMBEDDING_MODEL,
        input: 'Hello world'
      },
      {
        headers: {
          'Authorization': `Bearer ${config.AI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    console.log('Response status:', response.status);
    const data = response.data;
    if (data && data.data && data.data[0]) {
      const embedding = data.data[0].embedding;
      console.log('Successfully retrieved embedding!');
      console.log('Length (dimension):', embedding.length);
      console.log('Sample values:', embedding.slice(0, 5));
    } else {
      console.log('Unexpected response structure:', JSON.stringify(data, null, 2));
    }
  } catch (error: any) {
    console.error('API call failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

main();
