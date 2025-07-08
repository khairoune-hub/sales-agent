import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client for storage operations
let storageClient = null;
let isStorageInitialized = false;

const initializeStorage = () => {
    if (isStorageInitialized) {
        return storageClient;
    }

    console.log('\n📁 Supabase Storage Service Initialization:');
    console.log('============================================');
    console.log(`- SUPABASE_URL exists: ${!!process.env.SUPABASE_URL}`);
    console.log(`- SUPABASE_SERVICE_KEY exists: ${!!process.env.SUPABASE_SERVICE_KEY}`);
    
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
        console.error('❌ Missing Supabase configuration for storage');
        storageClient = null;
    } else {
        try {
            storageClient = createClient(
                process.env.SUPABASE_URL,
                process.env.SUPABASE_SERVICE_KEY,
                {
                    auth: {
                        autoRefreshToken: false,
                        persistSession: false
                    }
                }
            );
            console.log('✅ Supabase storage client initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize Supabase storage client:', error.message);
            storageClient = null;
        }
    }
    
    console.log('============================================\n');
    isStorageInitialized = true;
    return storageClient;
};

// Get storage client
const getStorageClient = () => {
    if (!storageClient) {
        initializeStorage();
    }
    return storageClient;
};

// Storage bucket name for product images
const PRODUCT_IMAGES_BUCKET = 'product-images';

// ===================================
// STORAGE SERVICES
// ===================================

export const storageService = {
    // Initialize storage service
    initialize: initializeStorage,

    // Get storage client
    getClient: getStorageClient,

    // Create storage bucket if it doesn't exist
    async createBucket() {
        const client = getStorageClient();
        if (!client) throw new Error('Supabase storage not initialized');

        try {
            // Check if bucket exists
            const { data: buckets, error: listError } = await client.storage.listBuckets();
            
            if (listError) {
                console.error('Error listing buckets:', listError);
                throw listError;
            }

            const bucketExists = buckets.some(bucket => bucket.name === PRODUCT_IMAGES_BUCKET);
            
            if (!bucketExists) {
                console.log(`📁 Creating storage bucket: ${PRODUCT_IMAGES_BUCKET}`);
                
                const { data, error } = await client.storage.createBucket(PRODUCT_IMAGES_BUCKET, {
                    public: true, // Make bucket public for easy image access
                    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
                    fileSizeLimit: 5242880 // 5MB limit
                });

                if (error) {
                    console.error('Error creating bucket:', error);
                    throw error;
                }

                console.log(`✅ Storage bucket '${PRODUCT_IMAGES_BUCKET}' created successfully`);
                return data;
            } else {
                console.log(`✅ Storage bucket '${PRODUCT_IMAGES_BUCKET}' already exists`);
                return { message: 'Bucket already exists' };
            }
        } catch (error) {
            console.error('Error in createBucket:', error);
            throw error;
        }
    },

    // Upload image to storage
    async uploadImage(file, fileName, folder = '') {
        const client = getStorageClient();
        if (!client) throw new Error('Supabase storage not initialized');

        try {
            const filePath = folder ? `${folder}/${fileName}` : fileName;
            
            // Determine MIME type from file extension
            const fileExtension = fileName.split('.').pop().toLowerCase();
            let contentType = 'image/jpeg'; // Default
            
            switch (fileExtension) {
                case 'png':
                    contentType = 'image/png';
                    break;
                case 'webp':
                    contentType = 'image/webp';
                    break;
                case 'gif':
                    contentType = 'image/gif';
                    break;
                case 'jpg':
                case 'jpeg':
                default:
                    contentType = 'image/jpeg';
                    break;
            }
            
            const { data, error } = await client.storage
                .from(PRODUCT_IMAGES_BUCKET)
                .upload(filePath, file, {
                    contentType: contentType,
                    cacheControl: '3600',
                    upsert: true // Overwrite if exists
                });

            if (error) {
                console.error('Error uploading image:', error);
                throw error;
            }

            console.log(`✅ Image uploaded successfully: ${filePath}`);
            return data;
        } catch (error) {
            console.error('Error in uploadImage:', error);
            throw error;
        }
    },

    // Get public URL for an image
    getPublicUrl(filePath) {
        const client = getStorageClient();
        if (!client) throw new Error('Supabase storage not initialized');

        try {
            const { data } = client.storage
                .from(PRODUCT_IMAGES_BUCKET)
                .getPublicUrl(filePath);

            return data.publicUrl;
        } catch (error) {
            console.error('Error getting public URL:', error);
            throw error;
        }
    },

    // List images in storage
    async listImages(folder = '') {
        const client = getStorageClient();
        if (!client) throw new Error('Supabase storage not initialized');

        try {
            const { data, error } = await client.storage
                .from(PRODUCT_IMAGES_BUCKET)
                .list(folder);

            if (error) {
                console.error('Error listing images:', error);
                throw error;
            }

            return data;
        } catch (error) {
            console.error('Error in listImages:', error);
            throw error;
        }
    },

    // Delete image from storage
    async deleteImage(filePath) {
        const client = getStorageClient();
        if (!client) throw new Error('Supabase storage not initialized');

        try {
            const { data, error } = await client.storage
                .from(PRODUCT_IMAGES_BUCKET)
                .remove([filePath]);

            if (error) {
                console.error('Error deleting image:', error);
                throw error;
            }

            console.log(`✅ Image deleted successfully: ${filePath}`);
            return data;
        } catch (error) {
            console.error('Error in deleteImage:', error);
            throw error;
        }
    },

    // Helper function to generate storage-based image URLs for products
    getProductImageUrl(productId, imageName = 'main.jpg') {
        return this.getPublicUrl(`products/${productId}/${imageName}`);
    },

    // Helper function to generate variant image URLs
    getVariantImageUrl(productId, variantId, imageName = 'main.jpg') {
        return this.getPublicUrl(`products/${productId}/variants/${variantId}/${imageName}`);
    },

    // Generate category image URL
    getCategoryImageUrl(categorySlug, imageName = 'main.jpg') {
        return this.getPublicUrl(`categories/${categorySlug}/${imageName}`);
    }
};

export default storageService;
