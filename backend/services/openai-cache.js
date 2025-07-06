// Cache utilities for OpenAI service to use Supabase data
import { productService } from './supabase.js';
import { dbUtils } from '../models/database.js';

// Cache for product data
let productCache = {
    products: null,
    categories: null,
    lastFetch: null,
    cacheTimeout: 5 * 60 * 1000 // 5 minutes
};

// Helper function to check if cache is valid
const isCacheValid = () => {
    return productCache.lastFetch && 
           (Date.now() - productCache.lastFetch) < productCache.cacheTimeout;
};

// Helper function to get products from Supabase with caching
export const getCachedProducts = async () => {
    if (isCacheValid() && productCache.products) {
        console.log('📦 Using cached products data');
        return productCache.products;
    }
    
    try {
        console.log('🔄 Fetching fresh products data from Supabase...');
        const products = await productService.getProducts({
            active: true,
            limit: 100 // Get more products for better coverage
        });
        
        // Update cache
        productCache.products = products;
        productCache.lastFetch = Date.now();
        
        console.log(`✅ Cached ${products.length} products from Supabase`);
        return products;
    } catch (error) {
        console.warn('⚠️ Failed to fetch from Supabase, falling back to in-memory data:', error.message);
        // Fallback to in-memory data if Supabase fails
        return dbUtils.getAllProducts();
    }
};

// Helper function to search products with caching
export const searchCachedProducts = async (query, category = null) => {
    try {
        console.log(`🔍 Searching products: query="${query}", category="${category}"`);
        
        // Try Supabase search first (more sophisticated)
        if (query) {
            const searchResults = await productService.searchProducts(query, {
                category: category,
                language: 'fr',
                limit: 20
            });
            console.log(`✅ Found ${searchResults.length} products via Supabase search`);
            return searchResults;
        }
        
        // If no query, get cached products and filter by category
        const products = await getCachedProducts();
        
        if (category) {
            const filtered = products.filter(product => 
                product.categories?.slug === category ||
                product.categories?.name?.toLowerCase().includes(category.toLowerCase())
            );
            console.log(`✅ Filtered ${filtered.length} products by category: ${category}`);
            return filtered;
        }
        
        return products;
        
    } catch (error) {
        console.warn('⚠️ Search failed, falling back to in-memory search:', error.message);
        // Fallback to in-memory search
        return query 
            ? dbUtils.searchProducts(query)
            : category 
                ? dbUtils.getProductsByCategory(category)
                : dbUtils.getAllProducts();
    }
};

// Helper function to search products with variant filters and caching
export const searchCachedProductsWithVariants = async (query, filters = {}) => {
    const { category, color, size, price_min, price_max } = filters;
    
    try {
        console.log(`🔍 Searching products with variants: query="${query}", filters=`, filters);
        
        // Use the enhanced variant-aware search if filters are provided
        if (color || size || price_min || price_max) {
            const searchResults = await productService.searchProductsWithVariants(query, {
                category: category,
                color: color,
                size: size,
                price_min: price_min,
                price_max: price_max,
                language: 'fr',
                limit: 15
            });
            console.log(`✅ Found ${searchResults.length} products via variant-aware search`);
            return searchResults;
        }
        
        // Fall back to regular search for basic queries
        return await searchCachedProducts(query, category);
        
    } catch (error) {
        console.warn('⚠️ Variant search failed, falling back to basic search:', error.message);
        return await searchCachedProducts(query, category);
    }
};

// Helper function to get single product by ID
export const getCachedProductById = async (productId) => {
    try {
        // Try Supabase first
        const product = await productService.getProductById(productId);
        if (product) {
            console.log(`✅ Product found via Supabase: ${product.name}`);
            return product;
        }
    } catch (error) {
        console.warn('⚠️ Supabase getProductById failed, trying in-memory:', error.message);
    }
    
    // Fallback to in-memory
    return dbUtils.getProductById(productId);
};

// Clear cache function
export const clearProductCache = () => {
    productCache.products = null;
    productCache.lastFetch = null;
    console.log('🧹 Product cache cleared');
};
