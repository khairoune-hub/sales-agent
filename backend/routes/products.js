import express from 'express';
import { dbUtils } from '../models/database.js';

const router = express.Router();

// GET /api/products - Get all products
router.get('/', (req, res) => {
    try {
        const { category, limit, offset } = req.query;
        let products = dbUtils.getAllProducts();
        
        // Filter by category if specified
        if (category) {
            products = dbUtils.getProductsByCategory(category);
        }
        
        // Apply pagination
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
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch products',
            message: error.message
        });
    }
});

// GET /api/products/search - Search products
router.get('/search', (req, res) => {
    try {
        const { q, category, minPrice, maxPrice } = req.query;
        
        if (!q) {
            return res.status(400).json({
                success: false,
                error: 'Search query is required',
                message: 'Please provide a search query using the "q" parameter'
            });
        }
        
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
            resultsCount: products.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Search failed',
            message: error.message
        });
    }
});

// GET /api/products/categories - Get all product categories
router.get('/categories', (req, res) => {
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
            data: categoriesWithCounts
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch categories',
            message: error.message
        });
    }
});

// GET /api/products/:id - Get product by ID
router.get('/:id', (req, res) => {
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
            data: product
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch product',
            message: error.message
        });
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
router.get('/:id/availability', (req, res) => {
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
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to check availability',
            message: error.message
        });
    }
});

export default router; 