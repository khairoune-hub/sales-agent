# Supabase Storage Integration Guide

## Overview
The sales agent system now supports Supabase Storage for managing product images instead of relying on external services like Unsplash. This provides better control, reliability, and performance.

## Features Added

### 1. Supabase Storage Service
**File: `/backend/services/supabase-storage.js`**

- ✅ Storage client initialization
- ✅ Bucket creation and management
- ✅ Image upload functionality
- ✅ Public URL generation
- ✅ File listing and deletion
- ✅ Helper methods for product/variant images

### 2. Image Migration Tool
**File: `/migrate-images.js`**

- ✅ Downloads existing Unsplash images
- ✅ Uploads them to Supabase Storage
- ✅ Generates SQL update script
- ✅ Organizes images in structured folders

### 3. Storage API Endpoints
**File: `/backend/routes/storage.js`**

- ✅ `GET /api/storage/info` - Storage information
- ✅ `POST /api/storage/bucket` - Create storage bucket
- ✅ `POST /api/storage/upload` - Upload images
- ✅ `GET /api/storage/images` - List images
- ✅ `DELETE /api/storage/image/*` - Delete images
- ✅ `GET /api/storage/url/:productId` - Get product image URL

### 4. Enhanced Product Service
**File: `/backend/services/supabase.js`**

- ✅ `enhanceProductWithStorageUrls()` method
- ✅ Automatic fallback to storage URLs
- ✅ Enhanced search results with storage images
- ✅ Backward compatibility with existing URLs

## Storage Structure

```
📁 product-images/ (Supabase bucket)
├── 📁 products/
│   ├── 📁 {product-id-1}/
│   │   ├── 📷 main.jpg (primary image)
│   │   ├── 📷 image-2.jpg
│   │   ├── 📷 image-3.jpg
│   │   └── 📁 variants/
│   │       ├── 📁 {variant-id-1}/
│   │       │   └── 📷 main.jpg
│   │       └── 📁 {variant-id-2}/
│   │           └── 📷 main.jpg
│   └── 📁 {product-id-2}/
│       └── 📷 main.jpg
└── 📁 categories/
    ├── 📁 soutien-gorge/
    │   └── 📷 main.jpg
    ├── 📁 culottes/
    │   └── 📷 main.jpg
    └── 📁 ensembles/
        └── 📷 main.jpg
```

## Setup Instructions

### 1. Configure Supabase Storage
Ensure your `.env` has Supabase credentials:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key
```

### 2. Create Storage Bucket
```bash
# Option 1: Using the migration tool
node migrate-images.js --structure

# Option 2: Using API
curl -X POST http://localhost:8787/api/storage/bucket
```

### 3. Migrate Existing Images
```bash
# Download Unsplash images and upload to Supabase
node migrate-images.js --migrate
```

This will:
1. Download all Unsplash images from your database
2. Upload them to Supabase Storage
3. Generate `update-image-urls.sql` script
4. Run the SQL script in Supabase to update URLs

### 4. Update Database URLs
Run the generated SQL script in your Supabase SQL editor:
```sql
-- Example of generated updates
UPDATE product_images SET image_url = 'https://your-project.supabase.co/storage/v1/object/public/product-images/products/123/main.jpg' WHERE id = 'image-id-1';
-- ... more updates
```

## API Usage Examples

### Upload New Product Image
```bash
curl -X POST http://localhost:8787/api/storage/upload \
  -F "image=@/path/to/image.jpg" \
  -F "productId=123" \
  -F "fileName=main.jpg"
```

### Get Product Image URL
```bash
curl http://localhost:8787/api/storage/url/123?imageName=main.jpg
```

### List Images in Storage
```bash
curl http://localhost:8787/api/storage/images?folder=products/123
```

### Delete Image
```bash
curl -X DELETE http://localhost:8787/api/storage/image/products/123/main.jpg
```

## Frontend Integration

### Enhanced Product Search
Products now include enhanced image data:
```javascript
const products = await fetch('/api/products/search?q=lingerie').then(r => r.json());

products.data.forEach(product => {
    console.log('Product Images:', product.product_images);
    console.log('Primary Image:', product.image_url);
    // Images are now served from Supabase Storage
});
```

### Upload New Images
```javascript
const formData = new FormData();
formData.append('image', fileInput.files[0]);
formData.append('productId', '123');
formData.append('fileName', 'main.jpg');

const response = await fetch('/api/storage/upload', {
    method: 'POST',
    body: formData
});

const result = await response.json();
console.log('Image URL:', result.data.publicUrl);
```

## Benefits

### 1. **Better Performance**
- Images served from Supabase CDN
- Optimized delivery
- Consistent availability

### 2. **Full Control**
- Upload custom product images
- Organized folder structure
- Easy management through API

### 3. **Scalability**
- No external dependencies
- Unlimited storage (based on plan)
- Automatic backups

### 4. **SEO & Branding**
- Custom URLs under your domain
- Better image optimization
- Consistent branding

## Migration Status

### ✅ Completed
- Storage service implementation
- API endpoints
- Migration tool
- Enhanced product service
- Backward compatibility

### 🔄 Next Steps (Optional)
1. Run image migration: `node migrate-images.js --migrate`
2. Update database with generated SQL script
3. Upload additional custom product images
4. Test storage functionality

### 📝 Usage
The system automatically uses storage URLs when available and falls back to existing URLs for compatibility. New products will use Supabase Storage by default.

## Testing

### Test Storage Setup
```bash
# Check if storage is working
curl http://localhost:8787/api/storage/info

# Create bucket
curl -X POST http://localhost:8787/api/storage/bucket

# List images
curl http://localhost:8787/api/storage/images
```

### Test with Sales Agent
The sales agent will automatically use the new storage images when sending product images to customers via Messenger or WhatsApp.

## Support

### Troubleshooting
1. **Storage not initialized**: Check Supabase credentials in `.env`
2. **Upload failed**: Ensure bucket exists and file size < 5MB
3. **Images not showing**: Verify bucket is public and URLs are correct

### File Formats Supported
- JPEG (.jpg, .jpeg)
- PNG (.png)
- WebP (.webp)
- GIF (.gif)

### Size Limits
- Maximum file size: 5MB
- Recommended: 800x600px for product images
- Format: JPEG for better compression

The storage integration is now complete and ready to use! 🚀
