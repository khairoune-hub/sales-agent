# 📸 Product Image Sending Guide

## Overview
Your sales agent can now **send product images** to customers when they request to see a product. This feature works with both **Facebook Messenger** and **WhatsApp Business API**.

## 🚀 How It Works

### User Request Flow
1. **Customer asks**: "Can you show me the honey product?" or "I need an image of miel pur biologique"
2. **AI processes**: The assistant recognizes the request for a product image
3. **AI calls function**: `send_product_image` function is triggered
4. **Image sent**: Product image is automatically sent to the customer
5. **Caption included**: Product details and price are included with the image

### Technical Flow
```
Customer Message → AI Processing → Function Call → Image Database → Platform API → Image Sent
```

## 📋 Available Product Images

### Current Products with Images
- **Miel Pur Biologique** (500g) - 24.99€
- **Poudre de Protéines Bio** (Vanille) - 45.99€  
- **Thé Vert Biologique** (50 sachets) - 18.99€
- **Complexe Multivitamines Bio** - 32.99€
- **Huile de Poisson Oméga-3 Bio** - 28.99€
- **Huile de Noix de Coco Biologique** (500ml) - 22.99€
- **Comprimés de Spiruline Bio** - 35.99€
- **Graines de Chia Biologiques** (250g) - 16.99€

### Image Features
- **High Quality**: 800px width, professional product photos
- **Source**: Unsplash stock photos optimized for each product
- **Captions**: Include product name, price, and key benefits
- **Emojis**: Visual icons for each product category

## 🛠️ Technical Implementation

### New AI Function
```javascript
{
    name: 'send_product_image',
    description: 'Send a product image to the user when they request to see a product',
    parameters: {
        type: 'object',
        properties: {
            product_name: {
                type: 'string',
                description: 'Name of the product to show image for'
            },
            product_id: {
                type: 'string',
                description: 'ID of the product (optional)'
            }
        },
        required: ['product_name']
    }
}
```

### Image Database Structure
```javascript
const PRODUCT_IMAGES = {
    'miel-pur-biologique': {
        url: 'https://images.unsplash.com/photo-1558642891-54be180ea339?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        alt: 'Miel Pur Biologique 500g',
        caption: '🍯 Miel Pur Biologique (500g) - 24.99€\nAntibactérien naturel et source d\'énergie pure'
    }
    // ... more products
};
```

### Platform Integration

#### Facebook Messenger
```javascript
// Send image with attachment
const message = {
    attachment: {
        type: 'image',
        payload: {
            url: imageUrl,
            is_reusable: true
        }
    }
};
```

#### WhatsApp Business API
```javascript
// Send image with caption
const messageData = {
    messaging_product: 'whatsapp',
    to: to,
    type: 'image',
    image: {
        link: imageUrl,
        caption: caption
    }
};
```

## 📱 Usage Examples

### Trigger Phrases
Customers can request images using various phrases:
- "Show me the honey product"
- "I need an image of miel pur biologique"
- "Can you send me a picture of the protein powder?"
- "What does the spirulina look like?"
- "Image of omega-3 supplements"

### AI Response Process
1. **Recognition**: AI identifies the image request
2. **Product Search**: Finds matching product in image database
3. **Image Preparation**: Retrieves image URL and caption
4. **Response**: Returns structured JSON with image data
5. **Delivery**: Webhook sends image via appropriate platform

## 🔧 Configuration

### Environment Variables
No additional environment variables required. Uses existing:
- `MESSENGER_ACCESS_TOKEN` - For Facebook Messenger
- `WHATSAPP_ACCESS_TOKEN` - For WhatsApp Business API

### Image Storage
Currently uses **Unsplash CDN** for reliable image delivery:
- **Pros**: Fast, reliable, high-quality images
- **Cons**: External dependency
- **Future**: Can be replaced with your own image storage

## 🎯 Error Handling

### Graceful Fallbacks
- **Image not found**: Sends text message with product info
- **Network error**: Falls back to text description
- **Platform API error**: Sends apology message

### Error Messages
- French: "Désolé, je ne peux pas envoyer l'image pour le moment."
- Arabic: Available for future implementation

## 🚦 Testing

### Test Commands
Try these messages with your sales agent:
1. "I need an image for miel pur biologique product"
2. "Show me the protein powder"
3. "Can you send me a picture of the spirulina?"
4. "What does the omega-3 supplement look like?"

### Expected Response
1. **Function Call**: `send_product_image` is triggered
2. **Image Search**: Product found in database
3. **Image Sent**: Product image delivered to customer
4. **Caption**: Product details and price included

## 🔄 Monitoring

### Log Messages
Watch for these logs in your server console:
```
🖼️ Looking for image for product: [product_name]
✅ Image found for [product_name]: [image_url]
📤 AI requested to send image: [image_url]
✅ Image sent successfully to [user_id]
```

### Success Indicators
- Function call logged successfully
- Image URL retrieved from database
- Platform API returns success response
- User receives image with caption

## 📈 Future Enhancements

### Planned Features
1. **Local Image Storage**: Store images on your server
2. **Image Variants**: Multiple views per product
3. **Bulk Image Sending**: Send multiple product images
4. **Image Analytics**: Track which images are sent most
5. **Dynamic Captions**: Personalized messages based on user

### Adding New Products
To add a new product image:
1. Add entry to `PRODUCT_IMAGES` object in `openai.js`
2. Include: `url`, `alt`, `caption`
3. Use product ID as key (normalized name)
4. Test with customer requests

### Custom Image Storage
To use your own images:
1. Upload images to your server/CDN
2. Update `PRODUCT_IMAGES` URLs
3. Ensure images are publicly accessible
4. Consider image optimization for mobile

## 🛡️ Security Considerations

### Image Sources
- **Unsplash**: Trusted CDN with high availability
- **HTTPS**: All images served over secure connections
- **No Local Storage**: Images not stored on your server

### Data Privacy
- **No User Images**: Only product images are sent
- **No Personal Data**: Images don't contain customer information
- **Compliance**: Follows platform policies for image sharing

## 💡 Best Practices

### Image Quality
- **Resolution**: 800px width for optimal mobile viewing
- **Format**: JPEG/PNG for broad compatibility
- **Size**: Under 5MB for fast delivery
- **Compression**: Optimized for web delivery

### Caption Writing
- **Concise**: Include product name, price, key benefit
- **Emojis**: Use relevant emojis for visual appeal
- **Languages**: Currently French, Arabic support planned
- **Formatting**: Use line breaks for readability

### Performance
- **CDN Usage**: Leverage CDN for global delivery
- **Caching**: Images cached by platforms
- **Fallbacks**: Always provide text alternative
- **Monitoring**: Track delivery success rates

## 🔍 Troubleshooting

### Common Issues

#### Function Not Triggered
- Check AI assistant configuration
- Verify function is registered in OpenAI assistant
- Test with explicit product requests

#### Image Not Found
- Verify product name matches database key
- Check normalization logic in `findProductImage`
- Add logging for product search attempts

#### Platform API Errors
- Confirm access tokens are valid
- Check platform-specific image requirements
- Verify webhook endpoints are functioning

#### Network Issues
- Monitor CDN availability
- Implement retry logic for failed deliveries
- Consider backup image sources

### Debug Steps
1. **Check Logs**: Look for function call attempts
2. **Test Product Search**: Verify product exists in database
3. **Validate URLs**: Ensure image URLs are accessible
4. **Platform Testing**: Test direct API calls
5. **User Feedback**: Ask customers about image receipt

## 📞 Support

For issues with the image sending feature:
1. Check server logs for error messages
2. Verify product names match database entries
3. Test with different product requests
4. Monitor platform API responses
5. Contact support with specific error logs

---

**Note**: This feature enhances the customer experience by providing visual product information, leading to better engagement and potentially higher conversion rates. 