import express from 'express';
import multer from 'multer';
import { storageService } from '../services/supabase-storage.js';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        // Check file type
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'), false);
        }
    }
});

// GET /api/storage/info - Get storage information
router.get('/info', async (req, res) => {
    try {
        await storageService.initialize();
        
        res.json({
            success: true,
            data: {
                message: 'Supabase Storage is configured',
                bucketName: 'product-images',
                maxFileSize: '5MB',
                allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
            }
        });
    } catch (error) {
        console.error('Storage info error:', error);
        res.status(500).json({
            success: false,
            error: 'Storage not available',
            message: error.message
        });
    }
});

// POST /api/storage/bucket - Create storage bucket
router.post('/bucket', async (req, res) => {
    try {
        const result = await storageService.createBucket();
        
        res.json({
            success: true,
            data: result,
            message: 'Storage bucket ready'
        });
    } catch (error) {
        console.error('Bucket creation error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create bucket',
            message: error.message
        });
    }
});

// POST /api/storage/upload - Upload image to storage
router.post('/upload', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No file provided',
                message: 'Please provide an image file'
            });
        }

        const { productId, folder = 'products', fileName } = req.body;
        
        if (!productId && !fileName) {
            return res.status(400).json({
                success: false,
                error: 'Missing parameters',
                message: 'Either productId or fileName is required'
            });
        }

        // Generate file name
        const fileExtension = req.file.originalname.split('.').pop() || 'jpg';
        const finalFileName = fileName || `main.${fileExtension}`;
        const finalFolder = productId ? `${folder}/${productId}` : folder;

        // Upload to storage
        const uploadResult = await storageService.uploadImage(
            req.file.buffer,
            finalFileName,
            finalFolder
        );

        // Get public URL
        const filePath = finalFolder ? `${finalFolder}/${finalFileName}` : finalFileName;
        const publicUrl = storageService.getPublicUrl(filePath);

        res.json({
            success: true,
            data: {
                fileName: finalFileName,
                filePath: filePath,
                publicUrl: publicUrl,
                uploadResult: uploadResult
            }
        });

    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            success: false,
            error: 'Upload failed',
            message: error.message
        });
    }
});

// GET /api/storage/images - List images in storage
router.get('/images', async (req, res) => {
    try {
        const { folder = '' } = req.query;
        
        const images = await storageService.listImages(folder);
        
        // Add public URLs to each image
        const imagesWithUrls = images.map(image => ({
            ...image,
            publicUrl: storageService.getPublicUrl(folder ? `${folder}/${image.name}` : image.name)
        }));

        res.json({
            success: true,
            data: imagesWithUrls,
            folder: folder
        });

    } catch (error) {
        console.error('List images error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to list images',
            message: error.message
        });
    }
});

// DELETE /api/storage/image/:filePath - Delete image from storage
router.delete('/image/*', async (req, res) => {
    try {
        // Extract file path from URL (everything after /image/)
        const filePath = req.params[0];
        
        if (!filePath) {
            return res.status(400).json({
                success: false,
                error: 'No file path provided'
            });
        }

        await storageService.deleteImage(filePath);

        res.json({
            success: true,
            message: `Image ${filePath} deleted successfully`
        });

    } catch (error) {
        console.error('Delete image error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete image',
            message: error.message
        });
    }
});

// GET /api/storage/url/:productId - Get storage URL for product
router.get('/url/:productId', (req, res) => {
    try {
        const { productId } = req.params;
        const { imageName = 'main.jpg' } = req.query;
        
        const url = storageService.getProductImageUrl(productId, imageName);
        
        res.json({
            success: true,
            data: {
                productId: productId,
                imageName: imageName,
                url: url
            }
        });

    } catch (error) {
        console.error('Get URL error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate URL',
            message: error.message
        });
    }
});

export default router;
