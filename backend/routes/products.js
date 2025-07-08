import express from 'express';
import { dbUtils } from '../models/database.js';
import { productService, categoryService } from '../services/supabase.js';

const router = express.Router();

// GET /api/products - Get all products
router.get('/', async (req, res) => {
    try {
        const { category, limit, offset, featured, inStockOnly } = req.query;
        
        const filters = {
            category: category || null,
            featured: featured === 'true' ? true : (featured === 'false' ? false : null),
            inStockOnly: inStockOnly === 'true',
            limit: parseInt(limit) || 50,
            offset: parseInt(offset) || 0
        };
        
        const products = await productService.getProducts(filters);
        
        res.json({
            success: true,
            data: products,
            pagination: {
                offset: filters.offset,
                limit: filters.limit,
                hasMore: products.length === filters.limit
            }
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        
        // Fallback to in-memory database if Supabase fails
        try {
            const { category, limit, offset } = req.query;
            let products = dbUtils.getAllProducts();
            
            if (category) {
                products = dbUtils.getProductsByCategory(category);
            }
            
            const startIndex = parseInt(offset) || 0;
            const limitNum = parseInt(limit) || products.length;
            const paginatedProducts = products.slice(startIndex, startIndex + limitNum);
            
            res.json({
                success: true,
                data: paginatedProducts,
                pagination: {
                    total: products.length,
                    offset: startIndex,
                    limit: limitNum,
                    hasMore: startIndex + limitNum < products.length
                },
                source: 'fallback'
            });
        } catch (fallbackError) {
            res.status(500).json({
                success: false,
                error: 'Failed to fetch products',
                message: error.message
            });
        }
    }
});

// GET /api/products/search - Search products (with basic variant support)
router.get('/search', async (req, res) => {
    try {
        const { q, category, language, limit, include_variants = 'true' } = req.query;
        
        if (!q) {
            return res.status(400).json({
                success: false,
                error: 'Search query is required',
                message: 'Please provide a search query using the "q" parameter'
            });
        }
        
        const filters = {
            category: category || null,
            language: language || 'fr',
            limit: parseInt(limit) || 10
        };
        
        // Use the enhanced search that includes variant data by default
        const products = await productService.searchProducts(q, filters);
        
        res.json({
            success: true,
            data: products,
            searchQuery: q,
            resultsCount: products.length,
            filters: filters
        });
    } catch (error) {
        console.error('Error searching products:', error);
        
        // Fallback to in-memory database search
        try {
            const { q, category, minPrice, maxPrice } = req.query;
            let products = dbUtils.searchProducts(q);
            
            // Additional filters
            if (category) {
                products = products.filter(product => 
                    product.category.toLowerCase() === category.toLowerCase()
                );
            }
            
            if (minPrice) {
                products = products.filter(product => product.price >= parseFloat(minPrice));
            }
            
            if (maxPrice) {
                products = products.filter(product => product.price <= parseFloat(maxPrice));
            }
            
            res.json({
                success: true,
                data: products,
                searchQuery: q,
                resultsCount: products.length,
                source: 'fallback'
            });
        } catch (fallbackError) {
            res.status(500).json({
                success: false,
                error: 'Search failed',
                message: error.message
            });
        }
    }
});

// GET /api/products/categories - Get all product categories
router.get('/categories', async (req, res) => {
    try {
        const categories = await categoryService.getCategoriesWithCounts();
        
        const categoriesWithCounts = categories.map(category => ({
            id: category.id,
            name: category.name,
            nameAr: category.name_ar,
            slug: category.slug,
            description: category.description,
            descriptionAr: category.description_ar,
            count: category.products?.[0]?.count || 0,
            imageUrl: category.image_url,
            sortOrder: category.sort_order
        }));
        
        res.json({
            success: true,
            data: categoriesWithCounts
        });
    } catch (error) {
        console.error('Error fetching categories:', error);
        
        // Fallback to in-memory database
        try {
            const categories = dbUtils.getCategories();
            const categoriesWithCounts = categories.map(category => {
                const products = dbUtils.getProductsByCategory(category);
                return {
                    name: category,
                    nameAr: products[0]?.categoryAr || category,
                    count: products.length,
                    products: products.map(p => ({ id: p.id, name: p.name, nameAr: p.nameAr }))
                };
            });
            
            res.json({
                success: true,
                data: categoriesWithCounts,
                source: 'fallback'
            });
        } catch (fallbackError) {
            res.status(500).json({
                success: false,
                error: 'Failed to fetch categories',
                message: error.message
            });
        }
    }
});

// GET /api/products/:id - Get product by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const product = await productService.getProductById(id);
        
        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Product not found',
                message: `Product with ID "${id}" does not exist`
            });
        }
        
        // Increment product view count (async, don't wait for result)
        productService.incrementProductViews(id).catch(error => {
            console.warn('Failed to increment product views:', error.message);
        });
        
        res.json({
            success: true,
            data: product
        });
    } catch (error) {
        console.error('Error fetching product:', error);
        
        // Fallback to in-memory database
        try {
            const { id } = req.params;
            const product = dbUtils.getProductById(id);
            
            if (!product) {
                return res.status(404).json({
                    success: false,
                    error: 'Product not found',
                    message: `Product with ID "${id}" does not exist`
                });
            }
            
            // Increment product view count
            dbUtils.incrementProductView(id);
            
            res.json({
                success: true,
                data: product,
                source: 'fallback'
            });
        } catch (fallbackError) {
            res.status(500).json({
                success: false,
                error: 'Failed to fetch product',
                message: error.message
            });
        }
    }
});

// GET /api/products/category/:category - Get products by category
router.get('/category/:category', (req, res) => {
    try {
        const { category } = req.params;
        const products = dbUtils.getProductsByCategory(decodeURIComponent(category));
        
        res.json({
            success: true,
            data: products,
            category: decodeURIComponent(category),
            count: products.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch products by category',
            message: error.message
        });
    }
});

// GET /api/products/:id/related - Get related products
router.get('/:id/related', (req, res) => {
    try {
        const { id } = req.params;
        const product = dbUtils.getProductById(id);
        
        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }
        
        // Get products from the same category, excluding the current product
        const relatedProducts = dbUtils.getProductsByCategory(product.category)
            .filter(p => p.id !== id)
            .slice(0, 4); // Limit to 4 related products
        
        res.json({
            success: true,
            data: relatedProducts,
            productId: id,
            category: product.category
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch related products',
            message: error.message
        });
    }
});

// GET /api/products/:id/availability - Check product availability
router.get('/:id/availability', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Get product availability from Supabase
        const availability = await productService.getProductAvailability(id);
        
        if (!availability) {
            return res.status(404).json({
                success: false,
                error: 'Product not found',
                message: `Product with ID "${id}" does not exist`
            });
        }
        
        res.json({
            success: true,
            data: availability
        });
    } catch (error) {
        console.error('Error checking product availability:', error);
        
        // Fallback to in-memory database
        try {
            const { id } = req.params;
            const { quantity = 1 } = req.query;
            const product = dbUtils.getProductById(id);
            
            if (!product) {
                return res.status(404).json({
                    success: false,
                    error: 'Product not found'
                });
            }
            
            const requestedQuantity = parseInt(quantity);
            const isAvailable = product.stock >= requestedQuantity;
            
            res.json({
                success: true,
                data: {
                    productId: id,
                    productName: product.name,
                    requestedQuantity,
                    currentStock: product.stock,
                    isAvailable,
                    maxAvailable: product.stock,
                    status: product.stock === 0 ? 'out_of_stock' : 
                           product.stock < 5 ? 'low_stock' : 'in_stock'
                },
                source: 'fallback'
            });
        } catch (fallbackError) {
            res.status(500).json({
                success: false,
                error: 'Failed to check availability',
                message: error.message
            });
        }
    }
});

// GET /api/products/:id/variants - Get all variants for a product
router.get('/:id/variants', async (req, res) => {
    try {
        const { id } = req.params;
        const { available_only = 'true' } = req.query;
        
        const variants = await productService.getProductVariants(id, available_only === 'true');
        
        res.json({
            success: true,
            data: variants,
            productId: id,
            count: variants.length
        });
    } catch (error) {
        console.error('Error fetching product variants:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch product variants',
            message: error.message
        });
    }
});

// GET /api/products/:id/options - Get available colors and sizes for a product
router.get('/:id/options', async (req, res) => {
    try {
        const { id } = req.params;
        
        const options = await productService.getProductOptions(id);
        
        res.json({
            success: true,
            data: options,
            productId: id
        });
    } catch (error) {
        console.error('Error fetching product options:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch product options',
            message: error.message
        });
    }
});

// GET /api/products/:id/variant - Get specific variant by color and size
router.get('/:id/variant', async (req, res) => {
    try {
        const { id } = req.params;
        const { color, size } = req.query;
        
        const variants = await productService.getSpecificVariant(id, color, size);
        
        if (!variants || variants.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Variant not found',
                message: `No variant found for product ${id}${color ? ` with color "${color}"` : ''}${size ? ` and size "${size}"` : ''}`
            });
        }
        
        res.json({
            success: true,
            data: variants.length === 1 ? variants[0] : variants,
            productId: id,
            filters: { color, size }
        });
    } catch (error) {
        console.error('Error fetching specific variant:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch specific variant',
            message: error.message
        });
    }
});

// GET /api/products/search/variants - Advanced search with variant filtering
router.get('/search/variants', async (req, res) => {
    try {
        const { q, category, color, size, price_min, price_max, language, limit } = req.query;
        
        if (!q) {
            return res.status(400).json({
                success: false,
                error: 'Search query is required',
                message: 'Please provide a search query using the "q" parameter'
            });
        }
        
        const filters = {
            category: category || null,
            color: color || null,
            size: size || null,
            price_min: price_min ? parseFloat(price_min) : null,
            price_max: price_max ? parseFloat(price_max) : null,
            language: language || 'fr',
            limit: parseInt(limit) || 10
        };
        
        const products = await productService.searchProductsWithVariants(q, filters);
        
        res.json({
            success: true,
            data: products,
            searchQuery: q,
            resultsCount: products.length,
            filters: filters
        });
    } catch (error) {
        console.error('Error searching products with variants:', error);
        res.status(500).json({
            success: false,
            error: 'Advanced search failed',
            message: error.message
        });
    }
});

export default router;