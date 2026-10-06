/**
 * META MUSE INTEGRATION
 * Generate product images dynamically during customer conversations
 *
 * When a customer asks about Wagyu or Biltong, Muse generates:
 * - Product photography
 * - Lifestyle images
 * - Recipe inspiration
 * - Preparation guides
 */

const axios = require('axios');

const MUSE_API_KEY = process.env.META_MUSE_API_KEY;
const MUSE_API_URL = 'https://api.meta.com/muse/v1';

/**
 * Generate product image based on product name and context
 */
async function generateProductImage(productName, context = {}) {
  try {
    if (!MUSE_API_KEY) {
      console.warn('⚠️ META_MUSE_API_KEY not set. Skipping image generation.');
      return null;
    }

    // Map products to Muse prompts
    const prompts = {
      'wagyu': `Premium Japanese A5 Wagyu beef ribeye, beautifully marbled, professional food photography, studio lighting, white plate, minimalist background, Michelin-star quality`,
      'biltong': `Artisanal South African biltong sliced, premium dry-cured beef, professional food styling, warm lighting, rustic wooden board, appetizing presentation`,
      'sirloin': `Grade A sirloin steak, perfectly aged, professional butcher photography, studio setting, elegant plating`,
      'restaurant-supply': `Premium meat cuts for restaurant use, professional kitchen setting, various cuts displayed, professional butcher photography`,
    };

    // Get the most relevant prompt
    let prompt = prompts[productName.toLowerCase()] ||
                 `Premium ${productName} meat product, professional food photography, artisanal presentation`;

    // Add context if provided
    if (context.style) {
      prompt += `, ${context.style} style`;
    }
    if (context.occasion) {
      prompt += `, for ${context.occasion}`;
    }

    console.log(`🎨 Generating Muse image for: ${productName}`);
    console.log(`   Prompt: ${prompt}`);

    // Call Meta Muse API
    const response = await axios.post(
      `${MUSE_API_URL}/generate`,
      {
        prompt: prompt,
        width: 512,
        height: 512,
        num_images: 1,
        quality: 'high',
        style: 'photorealistic',
      },
      {
        headers: {
          'Authorization': `Bearer ${MUSE_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data.images && response.data.images.length > 0) {
      const imageUrl = response.data.images[0];
      console.log(`✅ Generated image: ${imageUrl}`);
      return imageUrl;
    }

    return null;
  } catch (error) {
    console.error('Muse generation error:', error.message);
    // Graceful fallback - don't break conversation
    return null;
  }
}

/**
 * Generate lifestyle/recipe image for product suggestions
 */
async function generateLifestyleImage(productName, occasion = 'dinner party') {
  try {
    if (!MUSE_API_KEY) return null;

    const lifestylePrompts = {
      'wagyu': `Family enjoying premium Wagyu steak dinner, elegant table setting, warm lighting, high-end restaurant ambiance, professional food photography`,
      'biltong': `Friends at a South African braai (BBQ) enjoying premium biltong snacks, sunset, festive atmosphere, premium quality`,
      'premium-cuts': `Chef preparing premium meat cuts in upscale kitchen, professional techniques, beautiful plating, Michelin-star presentation`,
    };

    const prompt = lifestylePrompts[productName.toLowerCase()] ||
                  `Elegant dining experience with ${productName}, premium presentation, special occasion`;

    const response = await axios.post(
      `${MUSE_API_URL}/generate`,
      {
        prompt: prompt,
        width: 512,
        height: 512,
        num_images: 1,
        quality: 'high',
        style: 'photorealistic',
      },
      {
        headers: {
          'Authorization': `Bearer ${MUSE_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data.images?.[0] || null;
  } catch (error) {
    console.error('Lifestyle image generation error:', error.message);
    return null;
  }
}

/**
 * Generate preparation/recipe guide image
 */
async function generateRecipeImage(productName, cookingMethod = 'grilled') {
  try {
    if (!MUSE_API_KEY) return null;

    const recipePrompts = {
      'wagyu': `Beautiful Wagyu steak cooking guide, seared medium-rare, butter basting, herbs, professional kitchen, step-by-step visual`,
      'biltong': `Traditional South African biltong sliced on wooden board, ready to serve, artisanal presentation, mouth-watering`,
      'sirloin': `Perfect sirloin preparation, professionally plated with vegetables, restaurant quality, appetizing lighting`,
    };

    const prompt = recipePrompts[productName.toLowerCase()] ||
                  `Step-by-step ${cookingMethod} preparation of ${productName}, professional culinary photography`;

    const response = await axios.post(
      `${MUSE_API_URL}/generate`,
      {
        prompt: prompt,
        width: 512,
        height: 512,
        num_images: 1,
        quality: 'high',
        style: 'photorealistic',
      },
      {
        headers: {
          'Authorization': `Bearer ${MUSE_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data.images?.[0] || null;
  } catch (error) {
    console.error('Recipe image generation error:', error.message);
    return null;
  }
}

/**
 * Batch generate images for product showcase
 */
async function generateProductShowcase(productName) {
  try {
    if (!MUSE_API_KEY) return { product: null, lifestyle: null, recipe: null };

    console.log(`📸 Generating product showcase for: ${productName}`);

    // Generate all images in parallel
    const [productImg, lifestyleImg, recipeImg] = await Promise.all([
      generateProductImage(productName),
      generateLifestyleImage(productName),
      generateRecipeImage(productName),
    ]);

    return {
      product: productImg,
      lifestyle: lifestyleImg,
      recipe: recipeImg,
      generated_at: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Showcase generation error:', error.message);
    return { product: null, lifestyle: null, recipe: null };
  }
}

/**
 * Smart image generation based on conversation context
 * Analyzes what the customer asked and generates relevant images
 */
async function generateContextualImages(userMessage, productName) {
  try {
    if (!MUSE_API_KEY) return [];

    const images = [];

    // Product image - always generate
    const productImg = await generateProductImage(productName);
    if (productImg) {
      images.push({
        type: 'product',
        url: productImg,
        caption: `Premium ${productName}`,
      });
    }

    // Lifestyle if they ask about occasions/entertaining
    if (userMessage.toLowerCase().match(/dinner|party|entertaining|guests|special|occasion/)) {
      const lifestyleImg = await generateLifestyleImage(productName);
      if (lifestyleImg) {
        images.push({
          type: 'lifestyle',
          url: lifestyleImg,
          caption: `Perfect for special occasions`,
        });
      }
    }

    // Recipe/preparation if they ask how to cook
    if (userMessage.toLowerCase().match(/cook|prepare|how|recipe|grill|fry|sear|bbq/)) {
      const recipeImg = await generateRecipeImage(productName);
      if (recipeImg) {
        images.push({
          type: 'recipe',
          url: recipeImg,
          caption: `Premium preparation guide`,
        });
      }
    }

    return images;
  } catch (error) {
    console.error('Contextual image generation error:', error.message);
    return [];
  }
}

module.exports = {
  generateProductImage,
  generateLifestyleImage,
  generateRecipeImage,
  generateProductShowcase,
  generateContextualImages,
};
