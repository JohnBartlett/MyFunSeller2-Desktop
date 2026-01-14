# Claude AI Auto-Fill Setup Guide

MyFunSeller2 now includes AI-powered auto-fill functionality that can analyze your product images and automatically fill in item details.

## Features

When you upload images to a new item, Claude AI can automatically extract:
- **Title**: Product name and description
- **Description**: Detailed product information
- **Category**: Best-fit category from 21 options
- **Condition**: Estimated condition (new, like new, good, fair, poor)
- **Price**: Suggested resale price in USD
- **Brand**: Brand name if visible
- **Color**: Primary color
- **Size**: Size information for clothing or dimensions
- **Weight**: Estimated shipping weight

## Setup Instructions

### 1. Get Your API Key

1. Visit [https://console.anthropic.com/](https://console.anthropic.com/)
2. Sign up or log in to your account
3. Navigate to **API Keys** section
4. Click **Create Key** to generate a new API key
5. Copy the key (it starts with `sk-ant-...`)

### 2. Configure the Application

1. In the root directory of MyFunSeller2 (`C:\Users\johnb\MyFunSeller2`), create a file named `.env`
2. Add your API key to the file:

```env
ANTHROPIC_API_KEY=sk-ant-api03-your-actual-key-here
```

3. Save the file
4. Restart the application

### 3. Using Auto-Fill

1. Click **Add Item** or edit an existing item
2. Upload one or more product images (up to 10)
3. Click the **Auto-fill with AI** button (appears when images are uploaded)
4. Wait a few seconds while Claude analyzes your images
5. Review and adjust the auto-filled information as needed
6. Save your item

## API Costs

- Claude AI charges per API request based on image size
- Typical cost: ~$0.01-0.05 per item analysis (depending on image count/size)
- The service uses Claude 3.5 Sonnet model
- Budget accordingly if processing many items

## Pricing Tiers

Visit [Anthropic Pricing](https://www.anthropic.com/pricing) for current rates:
- **Free Tier**: Limited credits for testing
- **Pay-as-you-go**: Charges based on usage
- **Pro Plan**: Higher rate limits

## Troubleshooting

### "Claude AI is not configured" error
- Ensure `.env` file exists in the project root
- Check that your API key is correct and starts with `sk-ant-`
- Restart the application after creating/editing `.env`

### "Failed to analyze images" error
- Check your internet connection
- Verify your API key is valid and has remaining credits
- Ensure images are in supported formats (JPG, PNG, WebP, GIF)
- Try with fewer images (max 5 are analyzed)

### Auto-fill button doesn't appear
- Upload at least one image first
- Ensure Claude AI is configured (see above)
- Check browser console for errors (F12)

## Privacy & Data

- Images are sent to Anthropic's API for analysis
- Anthropic's data usage policy: [https://www.anthropic.com/legal](https://www.anthropic.com/legal)
- Images are not stored by Anthropic after analysis
- Your API key and data remain private

## Optional: Disable AI Features

To disable AI features:
1. Delete or rename the `.env` file
2. Restart the application
3. The Auto-fill button will not appear

---

**Questions?** Open an issue on GitHub or contact support.
