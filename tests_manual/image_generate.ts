import { ImageService } from '../src/backend/services/imageService.js';

const imageService = new ImageService();

async function test() {
  console.log('Starting image generation test...');
  const prompt = "A captivating, ultra-detailed collaged portrait featuring multiple diverse, stunningly attractive companion girls. The central focus is a beautiful female with subtly embedded in her skin, wearing fashion. Surrounding her are stylized panels and floating holographic displays showcasing profiles of other different girls (different hair colors, ethnicities, styles). Soft, neon purple, cyan, and deep pink lighting bathes the entire scene, creating a sense of intimate fantasy and advanced technology. The background is a slightly blurred, neon-lit digital cityscape. Digital art style, intricate details, high quality resolution, cinematic lighting, conceptual art, digital art";
  const result = await imageService.generateImage(prompt, '3:2', 24);
  console.log(result);
}

test();
