import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';
import heicConvert from 'heic-convert';

export interface ItemAnalysis {
  title: string;
  description: string;
  category: string;
  condition: 'new' | 'like_new' | 'good' | 'fair' | 'poor';
  price: number;
  brand?: string;
  color?: string;
  size?: string;
  weight?: number;
  confidence: number;
}

export interface UserCorrections {
  title?: string;
  description?: string;
  category?: string;
  condition?: string;
  price?: number;
  brand?: string;
  color?: string;
  size?: string;
  weight?: number;
}

export class ClaudeService {
  private client: Anthropic | null = null;
  private isConfigured = false;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey || apiKey === 'your_api_key_here') {
      console.warn('Claude AI not configured. Please set ANTHROPIC_API_KEY in .env file');
      this.isConfigured = false;
      return;
    }

    try {
      this.client = new Anthropic({
        apiKey: apiKey,
      });
      this.isConfigured = true;
      console.log('Claude AI service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Claude AI service:', error);
      this.isConfigured = false;
    }
  }

  /**
   * Check if the service is properly configured
   */
  public isReady(): boolean {
    return this.isConfigured && this.client !== null;
  }

  /**
   * Analyze images and return item details
   */
  public async analyzeImages(imagePaths: string[], userCorrections?: UserCorrections): Promise<ItemAnalysis> {
    if (!this.isReady()) {
      throw new Error('Claude AI service is not configured. Please set ANTHROPIC_API_KEY in .env file');
    }

    if (imagePaths.length === 0) {
      throw new Error('No images provided for analysis');
    }

    // Read and encode images
    const imageContents = await this.prepareImages(imagePaths.slice(0, 5)); // Max 5 images

    // Create the prompt
    const prompt = this.buildAnalysisPrompt(userCorrections);

    try {
      const message = await this.client!.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: [
              ...imageContents,
              {
                type: 'text',
                text: prompt,
              },
            ],
          },
        ],
      });

      // Parse the response
      const responseText = message.content
        .filter((block) => block.type === 'text')
        .map((block: any) => block.text)
        .join('\n');

      return this.parseResponse(responseText);
    } catch (error: any) {
      console.error('Claude AI analysis failed:', error);
      throw new Error(`Failed to analyze images: ${error.message}`);
    }
  }

  /**
   * Prepare images for Claude API
   */
  private async prepareImages(imagePaths: string[]): Promise<any[]> {
    const imageContents: any[] = [];
    // Claude API has a 5 MB limit for base64 images
    // Base64 encoding increases size by ~33%, so target 3.5 MB raw image max
    const MAX_IMAGE_SIZE = 3.5 * 1024 * 1024; // 3.5 MB

    for (const imagePath of imagePaths) {
      try {
        console.log(`Processing image: ${imagePath}`);

        // Check if file exists
        if (!fs.existsSync(imagePath)) {
          console.error(`File does not exist: ${imagePath}`);
          continue;
        }

        const ext = path.extname(imagePath).toLowerCase();
        console.log(`File extension: ${ext}`);

        let imageBuffer: Buffer;
        let mediaType: string;

        // Convert HEIC/HEIF to JPEG for Claude API compatibility
        if (ext === '.heic' || ext === '.heif') {
          console.log('Converting HEIC/HEIF to JPEG...');
          try {
            const heicBuffer = fs.readFileSync(imagePath);
            console.log(`Read HEIC file, size: ${heicBuffer.length} bytes`);

            const outputBuffer = await heicConvert({
              buffer: heicBuffer,
              format: 'JPEG',
              quality: 0.9,
            });
            console.log(`Converted to JPEG, size: ${outputBuffer.length} bytes`);

            imageBuffer = Buffer.from(outputBuffer);
            mediaType = 'image/jpeg';
          } catch (heicError) {
            console.error('HEIC conversion error:', heicError);
            throw heicError;
          }
        } else {
          // Read the image file directly
          console.log('Reading image file directly...');
          imageBuffer = fs.readFileSync(imagePath);
          console.log(`Read image file, size: ${imageBuffer.length} bytes`);

          // Determine media type from file extension
          const mediaTypeMap: Record<string, string> = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.webp': 'image/webp',
          };
          mediaType = mediaTypeMap[ext] || 'image/jpeg';
        }

        // Compress image if needed to stay under Claude's 5 MB base64 limit
        if (imageBuffer.length > MAX_IMAGE_SIZE) {
          console.log(`Image too large (${imageBuffer.length} bytes), compressing...`);

          // Use Sharp to resize and compress
          imageBuffer = await sharp(imageBuffer)
            .resize(1920, 1920, {
              fit: 'inside',
              withoutEnlargement: true,
            })
            .jpeg({
              quality: 85,
              progressive: true,
            })
            .toBuffer();

          mediaType = 'image/jpeg';
          console.log(`Compressed to ${imageBuffer.length} bytes`);
        }

        const base64Image = imageBuffer.toString('base64');
        console.log(`Encoded to base64, length: ${base64Image.length}`);

        // Final safety check
        if (base64Image.length > 5 * 1024 * 1024) {
          console.warn(`Image still too large after compression, skipping: ${imagePath}`);
          continue;
        }

        imageContents.push({
          type: 'image',
          source: {
            type: 'base64',
            media_type: mediaType,
            data: base64Image,
          },
        });

        console.log(`Successfully processed image: ${imagePath}`);
      } catch (error) {
        console.error(`Failed to read image ${imagePath}:`, error);
        console.error('Error details:', error instanceof Error ? error.message : String(error));
        // Continue with other images
      }
    }

    if (imageContents.length === 0) {
      throw new Error('Failed to read any images');
    }

    console.log(`Successfully prepared ${imageContents.length} images for Claude API`);
    return imageContents;
  }

  /**
   * Build the analysis prompt
   */
  private buildAnalysisPrompt(userCorrections?: UserCorrections): string {
    let promptPrefix = '';

    if (userCorrections) {
      promptPrefix = `IMPORTANT: The user has already reviewed the images and provided corrections. You MUST use their corrections EXACTLY as provided. Do NOT change these fields:\n\n`;

      if (userCorrections.title) promptPrefix += `- Title: "${userCorrections.title}" (DO NOT CHANGE)\n`;
      if (userCorrections.description) promptPrefix += `- Description: "${userCorrections.description}" (DO NOT CHANGE)\n`;
      if (userCorrections.category) promptPrefix += `- Category: "${userCorrections.category}" (DO NOT CHANGE)\n`;
      if (userCorrections.condition) promptPrefix += `- Condition: "${userCorrections.condition}" (DO NOT CHANGE)\n`;
      if (userCorrections.price !== undefined) promptPrefix += `- Price: $${userCorrections.price} (DO NOT CHANGE)\n`;
      if (userCorrections.brand) promptPrefix += `- Brand: "${userCorrections.brand}" (DO NOT CHANGE)\n`;
      if (userCorrections.color) promptPrefix += `- Color: "${userCorrections.color}" (DO NOT CHANGE)\n`;
      if (userCorrections.size) promptPrefix += `- Size: "${userCorrections.size}" (DO NOT CHANGE)\n`;
      if (userCorrections.weight !== undefined) promptPrefix += `- Weight: ${userCorrections.weight} lbs (DO NOT CHANGE)\n`;

      promptPrefix += `\nYou should ONLY analyze and improve fields that the user has NOT provided. Use the user's corrections as the foundation and enhance the remaining fields based on the images.\n\n`;
    }

    return `${promptPrefix}You are an expert at analyzing product images for online resale listings. ${userCorrections ? 'Building on the user-provided information above, ' : ''}Analyze the provided image(s) and ${userCorrections ? 'complete/refine' : 'extract'} the following information:

1. **Title**: A clear, descriptive product title (max 80 characters)
2. **Description**: A detailed description highlighting key features, condition, and any defects (2-3 sentences)
3. **Category**: Choose ONE category from: Electronics, Clothing, Home & Garden, Sports, Toys, Books, Music, Movies, Video Games, Health & Beauty, Automotive, Collectibles, Art, Jewelry, Furniture, Appliances, Tools, Pet Supplies, Office, Baby & Kids, Other
4. **Condition**: Assess the condition: new, like_new, good, fair, or poor
5. **Price**: Suggest a fair resale price in USD
6. **Brand**: Extract the brand name if visible
7. **Color**: Identify the primary color
8. **Size**: Extract size information if applicable (clothing size, dimensions, etc.)
9. **Weight**: Estimate shipping weight in pounds if possible
10. **Confidence**: Rate your confidence in this analysis from 0-100

Respond ONLY with a valid JSON object in this exact format:
{
  "title": "string",
  "description": "string",
  "category": "string",
  "condition": "good",
  "price": 25.00,
  "brand": "string or null",
  "color": "string or null",
  "size": "string or null",
  "weight": 1.5 or null,
  "confidence": 85
}

Do not include any text before or after the JSON object.`;
  }

  /**
   * Parse Claude's response into ItemAnalysis
   */
  private parseResponse(responseText: string): ItemAnalysis {
    try {
      // Extract JSON from response (in case there's extra text)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Validate and normalize the response
      return {
        title: parsed.title || 'Untitled Item',
        description: parsed.description || '',
        category: this.normalizeCategory(parsed.category),
        condition: this.normalizeCondition(parsed.condition),
        price: typeof parsed.price === 'number' ? parsed.price : 0,
        brand: parsed.brand || undefined,
        color: parsed.color || undefined,
        size: parsed.size || undefined,
        weight: typeof parsed.weight === 'number' ? parsed.weight : undefined,
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 50,
      };
    } catch (error) {
      console.error('Failed to parse Claude response:', responseText);
      throw new Error('Failed to parse AI response. Please try again.');
    }
  }

  /**
   * Normalize category to valid values
   */
  private normalizeCategory(category: string): string {
    const validCategories = [
      'Electronics',
      'Clothing',
      'Home & Garden',
      'Sports',
      'Toys',
      'Books',
      'Music',
      'Movies',
      'Video Games',
      'Health & Beauty',
      'Automotive',
      'Collectibles',
      'Art',
      'Jewelry',
      'Furniture',
      'Appliances',
      'Tools',
      'Pet Supplies',
      'Office',
      'Baby & Kids',
      'Other',
    ];

    const normalized = validCategories.find(
      (c) => c.toLowerCase() === category.toLowerCase()
    );

    return normalized || 'Other';
  }

  /**
   * Normalize condition to valid values
   */
  private normalizeCondition(condition: string): 'new' | 'like_new' | 'good' | 'fair' | 'poor' {
    const conditionMap: Record<string, 'new' | 'like_new' | 'good' | 'fair' | 'poor'> = {
      new: 'new',
      'like new': 'like_new',
      like_new: 'like_new',
      'like-new': 'like_new',
      good: 'good',
      fair: 'fair',
      poor: 'poor',
    };

    const normalized = conditionMap[condition.toLowerCase().replace(/_/g, ' ')];
    return normalized || 'good';
  }
}

// Singleton instance
let claudeService: ClaudeService | null = null;

export function getClaudeService(): ClaudeService {
  if (!claudeService) {
    claudeService = new ClaudeService();
  }
  return claudeService;
}
