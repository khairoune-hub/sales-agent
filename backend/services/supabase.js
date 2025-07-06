import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { storageService } from './supabase-storage.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Supabase client will be initialized lazily
let supabase = null;
let isInitialized = false;

// Initialize Supabase client
const initializeSupabase = () => {
    if (isInitialized) {
        return supabase;
    }

    console.log('\n🔧 Supabase Service Initialization:');
    console.log('==================================');
    console.log(`- SUPABASE_URL exists: ${!!process.env.SUPABASE_URL}`);
    console.log(`- SUPABASE_SERVICE_KEY exists: ${!!process.env.SUPABASE_SERVICE_KEY}`);
    
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
        console.error('❌ Missing Supabase configuration. Please set SUPABASE_URL and SUPABASE_SERVICE_KEY');
        supabase = null;
    } else {
        try {
            supabase = createClient(
                process.env.SUPABASE_URL,
                process.env.SUPABASE_SERVICE_KEY,
                {
                    auth: {
                        autoRefreshToken: false,
                        persistSession: false
                    }
                }
            );
            console.log('✅ Supabase client initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize Supabase client:', error.message);
            supabase = null;
        }
    }
    
    console.log('==================================\n');
    isInitialized = true;
    return supabase;
};

// Get Supabase client
const getSupabase = () => {
    if (!supabase) {
        initializeSupabase();
    }
    return supabase;
};

// ===================================
// PRODUCT SERVICES
// ===================================

export const productService = {
    // Get all products with optional filters
    async getProducts(filters = {}) {
        const client = getSupabase();
        if (!client) throw new Error('Supabase not initialized');

        const { 
            category, 
            active = true, 
            featured = null, 
            inStockOnly = false, 
            limit = 50, 
            offset = 0 
        } = filters;

        let query = client
            .from('products')
            .select(`
                *,
                categories (
                    id,
                    name,
                    name_ar,
                    slug
                ),
                product_images (
                    id,
                    image_url,
                    alt_text,
                    is_primary
                ),
                product_variants (
                    id,
                    size,
                    color,
                    color_ar,
                    price,
                    stock_quantity,
                    variant_sku,
                    is_available
                )
            `)
            .eq('is_active', active)
            .order('is_featured', { ascending: false })
            .order('sales_count', { ascending: false })
            .range(offset, offset + limit - 1);

        if (category) {
            query = query.eq('categories.slug', category);
        }

        if (featured !== null) {
            query = query.eq('is_featured', featured);
        }

        if (inStockOnly) {
            query = query.gt('stock_quantity', 0);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching products:', error);
            throw error;
        }

        return data;
    },

    // Alias for compatibility with existing code
    async getAllProducts(filters = {}) {
        return this.getProducts(filters);
    },

    // Get single product by ID
    async getProductById(id) {
        const client = getSupabase();
        if (!client) throw new Error('Supabase not initialized');

        const { data, error } = await client
            .from('products')
            .select(`
                *,
                categories (
                    id,
                    name,
                    name_ar,
                    slug
                ),
                product_images (
                    id,
                    image_url,
                    alt_text,
                    is_primary,
                    sort_order
                ),
                product_variants (
                    id,
                    size,
                    color,
                    color_ar,
                    price,
                    stock_quantity,
                    is_available
                )
            `)
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching product:', error);
            throw error;
        }

        // Enhance product with storage URLs
        return this.enhanceProductWithStorageUrls(data);
    },

    // Search products
    async searchProducts(searchQuery, filters = {}) {
        const client = getSupabase();
        if (!client) throw new Error('Supabase not initialized');

        // Use fallback method directly since it includes product_images properly
        // The RPC function only returns image_url, not the full product_images array
        return await this.searchProductsFallback(searchQuery, filters);
        
        /* Original RPC approach - commenting out due to image data issues
        try {
            const { data, error } = await client
                .rpc('search_products', {
                    search_query: searchQuery,
                    category_filter: filters.category || null,
                    language_filter: filters.language || 'fr',
                    max_results: filters.limit || 10
                });

            if (error) {
                console.error('Error searching products with RPC:', error);
                
                // If it's a function structure error, fall back to direct query
                if (error.code === '42804' || error.message.includes('does not match function result type')) {
                    console.log('🔄 Falling back to direct query due to function type mismatch');
                    return await this.searchProductsFallback(searchQuery, filters);
                }
                
                throw error;
            }

            return data;
        } catch (rpcError) {
            console.error('RPC search failed, using fallback:', rpcError.message);
            return await this.searchProductsFallback(searchQuery, filters);
        }
        */
    },

    // Fallback search method using direct queries
    async searchProductsFallback(searchQuery, filters = {}) {
        const client = getSupabase();
        if (!client) throw new Error('Supabase not initialized');

        let query = client
            .from('products')
            .select(`
                id,
                name,
                name_ar,
                description,
                base_price,
                sale_price,
                stock_quantity,
                categories (
                    name
                ),
                product_images (
                    image_url,
                    is_primary
                ),
                product_variants (
                    id,
                    size,
                    color,
                    color_ar,
                    price,
                    stock_quantity,
                    variant_sku,
                    is_available
                )
            `)
            .eq('is_active', true);

        // Add search conditions
        if (searchQuery) {
            query = query.or(
                `name.ilike.%${searchQuery}%,name_ar.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`
            );
        }

        // Add category filter
        if (filters.category) {
            query = query.eq('categories.slug', filters.category);
        }

        // Add ordering and limit
        query = query
            .order('is_featured', { ascending: false })
            .order('sales_count', { ascending: false })
            .limit(filters.limit || 10);

        const { data, error } = await query;

        if (error) {
            console.error('Error in fallback search:', error);
            throw error;
        }

        // Transform data to match expected format but preserve product_images and variants
        return data.map(product => {
            // Enhance product with storage URLs first
            const enhancedProduct = this.enhanceProductWithStorageUrls(product);
            
            // Calculate available variants info
            const availableVariants = enhancedProduct.product_variants?.filter(v => v.is_available && v.stock_quantity > 0) || [];
            const availableColors = [...new Set(availableVariants.map(v => ({ 
                name: v.color, 
                name_ar: v.color_ar,
                available: true 
            })))];
            const availableSizes = [...new Set(availableVariants.map(v => v.size))].filter(Boolean);
            
            // Get price range from variants
            const variantPrices = availableVariants.map(v => v.price).filter(Boolean);
            const minVariantPrice = variantPrices.length > 0 ? Math.min(...variantPrices) : null;
            const maxVariantPrice = variantPrices.length > 0 ? Math.max(...variantPrices) : null;
            
            // Use variant price range if available, otherwise use base product price
            const finalPrice = minVariantPrice || enhancedProduct.sale_price || enhancedProduct.base_price;
            const priceRange = (minVariantPrice && maxVariantPrice && minVariantPrice !== maxVariantPrice) 
                ? `${minVariantPrice} - ${maxVariantPrice}` 
                : finalPrice;

            return {
                id: enhancedProduct.id,
                name: enhancedProduct.name,
                name_ar: enhancedProduct.name_ar,
                description: enhancedProduct.description,
                price: finalPrice,
                price_range: priceRange,
                base_price: enhancedProduct.base_price,
                sale_price: enhancedProduct.sale_price,
                stock_quantity: enhancedProduct.stock_quantity,
                category_name: enhancedProduct.categories?.name || null,
                // Keep the full product_images array for image functionality (now with storage URLs)
                product_images: enhancedProduct.product_images || [],
                // Also include flat image_url for backward compatibility
                image_url: enhancedProduct.product_images?.find(img => img.is_primary)?.image_url || 
                          enhancedProduct.product_images?.[0]?.image_url || null,
                is_in_stock: enhancedProduct.stock_quantity > 0 || availableVariants.length > 0,
                // Add variant information
                has_variants: (enhancedProduct.product_variants?.length || 0) > 0,
                available_variants: availableVariants,
                available_colors: availableColors,
                available_sizes: availableSizes,
                variant_count: availableVariants.length,
                relevance_score: 1.0 // Default score for fallback
            };
        });
    },

    // Get product availability
    async getProductAvailability(productId) {
        const client = getSupabase();
        if (!client) throw new Error('Supabase not initialized');

        const { data, error } = await client
            .rpc('get_product_availability', {
                product_id: productId
            });

        if (error) {
            console.error('Error checking product availability:', error);
            throw error;
        }

        return data[0] || null;
    },

    // Update product stock
    async updateProductStock(productId, newStock) {
        const client = getSupabase();
        if (!client) throw new Error('Supabase not initialized');

        const { data, error } = await client
            .from('products')
            .update({ stock_quantity: newStock })
            .eq('id', productId)
            .select();

        if (error) {
            console.error('Error updating product stock:', error);
            throw error;
        }

        return data[0];
    },

    // Increment product views
    async incrementProductViews(productId) {
        const client = getSupabase();
        if (!client) throw new Error('Supabase not initialized');

        const { data, error } = await client
            .rpc('increment', {
                table_name: 'products',
                row_id: productId,
                column_name: 'views_count'
            });

        if (error) {
            console.error('Error incrementing product views:', error);
            // Don't throw error for view tracking failures
        }

        return data;
    },

    // Get product variants for a specific product
    async getProductVariants(productId, availableOnly = true) {
        const client = getSupabase();
        if (!client) throw new Error('Supabase not initialized');

        let query = client
            .from('product_variants')
            .select(`
                id,
                size,
                color,
                color_ar,
                price,
                stock_quantity,
                variant_sku,
                is_available,
                product_id
            `)
            .eq('product_id', productId)
            .order('color')
            .order('size');

        if (availableOnly) {
            query = query.eq('is_available', true).gt('stock_quantity', 0);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching product variants:', error);
            throw error;
        }

        return data;
    },

    // Get available colors and sizes for a product
    async getProductOptions(productId) {
        const client = getSupabase();
        if (!client) throw new Error('Supabase not initialized');

        const variants = await this.getProductVariants(productId, true);

        const colors = [...new Set(variants.map(v => ({
            name: v.color,
            name_ar: v.color_ar,
            available_sizes: variants.filter(vr => vr.color === v.color).map(vr => vr.size)
        })))];

        const sizes = [...new Set(variants.map(v => v.size))].filter(Boolean);

        const priceRange = variants.length > 0 ? {
            min: Math.min(...variants.map(v => v.price)),
            max: Math.max(...variants.map(v => v.price))
        } : null;

        return {
            colors,
            sizes,
            price_range: priceRange,
            total_variants: variants.length,
            variants
        };
    },

    // Get specific variant by product ID, color, and size
    async getSpecificVariant(productId, color = null, size = null) {
        const client = getSupabase();
        if (!client) throw new Error('Supabase not initialized');

        let query = client
            .from('product_variants')
            .select('*')
            .eq('product_id', productId)
            .eq('is_available', true)
            .gt('stock_quantity', 0);

        if (color) {
            query = query.eq('color', color);
        }

        if (size) {
            query = query.eq('size', size);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching specific variant:', error);
            throw error;
        }

        return data;
    },

    // Helper method to ensure product images use Supabase Storage URLs
    enhanceProductWithStorageUrls(product) {
        if (!product) return product;

        // If product has no images, generate fallback URLs from storage
        if (!product.product_images || product.product_images.length === 0) {
            const fallbackUrl = storageService.getProductImageUrl(product.id, 'main.jpg');
            product.product_images = [{
                id: null,
                image_url: fallbackUrl,
                alt_text: product.name,
                is_primary: true,
                sort_order: 1
            }];
        } else {
            // Enhance existing images with storage URLs if they're still using external URLs
            product.product_images = product.product_images.map(image => {
                if (image.image_url && (image.image_url.includes('unsplash.com') || !image.image_url.includes('supabase'))) {
                    // Generate storage URL as fallback
                    const storageUrl = storageService.getProductImageUrl(product.id, 'main.jpg');
                    return {
                        ...image,
                        image_url: storageUrl,
                        fallback_url: image.image_url // Keep original as fallback
                    };
                }
                return image;
            });
        }

        return product;
    },

    // Search products with variant-specific filtering
    async searchProductsWithVariants(searchQuery, filters = {}) {
        const client = getSupabase();
        if (!client) throw new Error('Supabase not initialized');

        const { color, size, price_min, price_max, ...otherFilters } = filters;

        // First get products matching the basic search
        const products = await this.searchProductsFallback(searchQuery, otherFilters);

        // If no variant-specific filters, return as is
        if (!color && !size && !price_min && !price_max) {
            return products;
        }

        // Filter products based on variant availability
        const filteredProducts = products.filter(product => {
            if (!product.has_variants) return false;

            const matchingVariants = product.available_variants.filter(variant => {
                let matches = true;

                if (color && variant.color !== color) matches = false;
                if (size && variant.size !== size) matches = false;
                if (price_min && variant.price < price_min) matches = false;
                if (price_max && variant.price > price_max) matches = false;

                return matches;
            });

            if (matchingVariants.length > 0) {
                // Update the product to show only matching variants
                product.available_variants = matchingVariants;
                product.available_colors = [...new Set(matchingVariants.map(v => ({ 
                    name: v.color, 
                    name_ar: v.color_ar 
                })))];
                product.available_sizes = [...new Set(matchingVariants.map(v => v.size))];
                product.variant_count = matchingVariants.length;

                // Update price to reflect filtered variants
                const variantPrices = matchingVariants.map(v => v.price);
                product.price = Math.min(...variantPrices);
                product.price_range = variantPrices.length > 1 
                    ? `${Math.min(...variantPrices)} - ${Math.max(...variantPrices)}`
                    : product.price;

                return true;
            }

            return false;
        });

        return filteredProducts;
    }
};

// ===================================
// CATEGORY SERVICES
// ===================================

export const categoryService = {
    // Get all categories
    async getCategories(activeOnly = true) {
        const client = getSupabase();
        if (!client) throw new Error('Supabase not initialized');

        let query = client
            .from('categories')
            .select('*')
            .order('sort_order')
            .order('name');

        if (activeOnly) {
            query = query.eq('is_active', true);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching categories:', error);
            throw error;
        }

        return data;
    },

    // Get categories with product counts
    async getCategoriesWithCounts() {
        const client = getSupabase();
        if (!client) throw new Error('Supabase not initialized');

        const { data, error } = await client
            .from('categories')
            .select(`
                *,
                products(count)
            `)
            .eq('is_active', true)
            .order('sort_order')
            .order('name');

        if (error) {
            console.error('Error fetching categories with counts:', error);
            throw error;
        }

        return data;
    }
};

// ===================================
// CUSTOMER SERVICES
// ===================================

export const customerService = {
    // Get or create customer
    async getOrCreateCustomer(platformId, platformType, customerData = {}) {
        const client = getSupabase();
        if (!client) throw new Error('Supabase not initialized');

        // First try to get existing customer
        const { data: existingCustomer, error: fetchError } = await client
            .from('customers')
            .select('*')
            .eq('platform_id', platformId)
            .eq('platform_type', platformType)
            .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
            console.error('Error fetching customer:', fetchError);
            throw fetchError;
        }

        if (existingCustomer) {
            // Update last contact date
            await client
                .from('customers')
                .update({ last_contact_date: new Date().toISOString() })
                .eq('id', existingCustomer.id);

            return existingCustomer;
        }

        // Create new customer
        const { data: newCustomer, error: createError } = await client
            .from('customers')
            .insert({
                platform_id: platformId,
                platform_type: platformType,
                name: customerData.name || null,
                phone: customerData.phone || null,
                email: customerData.email || null,
                wilaya: customerData.wilaya || null,
                address: customerData.address || null,
                preferred_language: customerData.language || 'fr'
            })
            .select()
            .single();

        if (createError) {
            console.error('Error creating customer:', createError);
            throw createError;
        }

        return newCustomer;
    },

    // Update customer information
    async updateCustomer(customerId, updates) {
        const client = getSupabase();
        if (!client) throw new Error('Supabase not initialized');

        const { data, error } = await client
            .from('customers')
            .update(updates)
            .eq('id', customerId)
            .select()
            .single();

        if (error) {
            console.error('Error updating customer:', error);
            throw error;
        }

        return data;
    },

    // Get customer by ID
    async getCustomerById(customerId) {
        const client = getSupabase();
        if (!client) throw new Error('Supabase not initialized');

        const { data, error } = await client
            .from('customers')
            .select('*')
            .eq('id', customerId)
            .single();

        if (error) {
            console.error('Error fetching customer:', error);
            throw error;
        }

        return data;
    },

    // Get customer order history
    async getCustomerOrderHistory(customerId, limit = 10) {
        const client = getSupabase();
        if (!client) throw new Error('Supabase not initialized');

        const { data, error } = await client
            .from('orders')
            .select(`
                *,
                order_items (
                    *,
                    products (
                        id,
                        name,
                        name_ar
                    )
                )
            `)
            .eq('customer_id', customerId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('Error fetching customer order history:', error);
            throw error;
        }

        return data;
    }
};

// ===================================
// ORDER SERVICES
// ===================================

export const orderService = {
    // Create order with inventory check
    async createOrder(customerData, items, orderData = {}) {
        const client = getSupabase();
        if (!client) throw new Error('Supabase not initialized');

        // Get or create customer
        const customer = await customerService.getOrCreateCustomer(
            customerData.platformId,
            customerData.platformType,
            customerData
        );

        // Create order using the stored procedure
        const { data, error } = await client
            .rpc('create_order_with_inventory_check', {
                p_customer_id: customer.id,
                p_platform_type: customerData.platformType,
                p_items: items,
                p_shipping_address: orderData.shippingAddress || null,
                p_wilaya: orderData.wilaya || null,
                p_phone: orderData.phone || null,
                p_notes: orderData.notes || null
            });

        if (error) {
            console.error('Error creating order:', error);
            throw error;
        }

        const result = data[0];
        
        if (!result.success) {
            throw new Error(result.message);
        }

        return await this.getOrderById(result.order_id);
    },

    // Get order by ID
    async getOrderById(orderId) {
        const client = getSupabase();
        if (!client) throw new Error('Supabase not initialized');

        const { data, error } = await client
            .from('orders')
            .select(`
                *,
                customers (
                    id,
                    name,
                    phone,
                    email,
                    platform_type
                ),
                order_items (
                    *,
                    products (
                        id,
                        name,
                        name_ar,
                        sku
                    )
                )
            `)
            .eq('id', orderId)
            .single();

        if (error) {
            console.error('Error fetching order:', error);
            throw error;
        }

        return data;
    },

    // Get orders with filters
    async getOrders(filters = {}) {
        const client = getSupabase();
        if (!client) throw new Error('Supabase not initialized');

        const { 
            status = null, 
            customerId = null, 
            platformType = null,
            dateFrom = null,
            dateTo = null,
            limit = 50, 
            offset = 0 
        } = filters;

        let query = client
            .from('orders')
            .select(`
                *,
                customers (
                    id,
                    name,
                    phone,
                    platform_type
                ),
                order_items (
                    quantity,
                    total_price,
                    products (
                        name,
                        name_ar
                    )
                )
            `)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (status) {
            query = query.eq('status', status);
        }

        if (customerId) {
            query = query.eq('customer_id', customerId);
        }

        if (platformType) {
            query = query.eq('platform_type', platformType);
        }

        if (dateFrom) {
            query = query.gte('created_at', dateFrom);
        }

        if (dateTo) {
            query = query.lte('created_at', dateTo);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching orders:', error);
            throw error;
        }

        return data;
    },

    // Update order status
    async updateOrderStatus(orderId, newStatus, confirmedBy = null) {
        const client = getSupabase();
        if (!client) throw new Error('Supabase not initialized');

        const updateData = { status: newStatus };
        
        if (newStatus === 'confirmed') {
            updateData.confirmed_at = new Date().toISOString();
            updateData.confirmed_by = confirmedBy;
        }

        const { data, error } = await client
            .from('orders')
            .update(updateData)
            .eq('id', orderId)
            .select()
            .single();

        if (error) {
            console.error('Error updating order status:', error);
            throw error;
        }

        return data;
    }
};

// ===================================
// INTERACTION SERVICES
// ===================================

export const interactionService = {
    // Log customer interaction
    async logInteraction(customerId, interactionData) {
        const client = getSupabase();
        if (!client) throw new Error('Supabase not initialized');

        const { data, error } = await client
            .from('customer_interactions')
            .insert({
                customer_id: customerId,
                platform_type: interactionData.platformType,
                interaction_type: interactionData.type,
                message: interactionData.message,
                ai_response: interactionData.aiResponse,
                products_mentioned: interactionData.productsMentioned || [],
                sentiment: interactionData.sentiment || 'neutral',
                language: interactionData.language || 'fr',
                thread_id: interactionData.threadId
            })
            .select()
            .single();

        if (error) {
            console.error('Error logging interaction:', error);
            throw error;
        }

        return data;
    },

    // Get customer interactions
    async getCustomerInteractions(customerId, limit = 50) {
        const client = getSupabase();
        if (!client) throw new Error('Supabase not initialized');

        const { data, error } = await client
            .from('customer_interactions')
            .select('*')
            .eq('customer_id', customerId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('Error fetching customer interactions:', error);
            throw error;
        }

        return data;
    }
};

// ===================================
// ANALYTICS SERVICES
// ===================================

export const analyticsService = {
    // Get sales analytics
    async getSalesAnalytics(dateFrom, dateTo, platformType = null) {
        const client = getSupabase();
        if (!client) throw new Error('Supabase not initialized');

        let query = client
            .from('sales_analytics')
            .select('*')
            .gte('date', dateFrom)
            .lte('date', dateTo)
            .order('date', { ascending: false });

        if (platformType) {
            query = query.eq('platform_type', platformType);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching sales analytics:', error);
            throw error;
        }

        return data;
    },

    // Get real-time dashboard data
    async getDashboardData() {
        const client = getSupabase();
        if (!client) throw new Error('Supabase not initialized');

        const today = new Date().toISOString().split('T')[0];
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        // Get today's stats
        const { data: todayStats, error: todayError } = await client
            .from('orders')
            .select('total_amount, status')
            .gte('created_at', today);

        if (todayError) {
            console.error('Error fetching today stats:', todayError);
            throw todayError;
        }

        // Get weekly stats
        const { data: weeklyStats, error: weeklyError } = await client
            .from('orders')
            .select('total_amount, status, created_at')
            .gte('created_at', sevenDaysAgo);

        if (weeklyError) {
            console.error('Error fetching weekly stats:', weeklyError);
            throw weeklyError;
        }

        // Get low stock products
        const { data: lowStockProducts, error: lowStockError } = await client
            .from('products')
            .select('id, name, stock_quantity, low_stock_threshold')
            .lt('stock_quantity', 10)
            .eq('is_active', true);

        if (lowStockError) {
            console.error('Error fetching low stock products:', lowStockError);
            throw lowStockError;
        }

        return {
            today: {
                totalOrders: todayStats.length,
                totalRevenue: todayStats.reduce((sum, order) => sum + parseFloat(order.total_amount), 0),
                pendingOrders: todayStats.filter(order => order.status === 'pending_confirmation').length,
                confirmedOrders: todayStats.filter(order => order.status === 'confirmed').length
            },
            week: {
                totalOrders: weeklyStats.length,
                totalRevenue: weeklyStats.reduce((sum, order) => sum + parseFloat(order.total_amount), 0)
            },
            lowStockProducts: lowStockProducts.length,
            lowStockItems: lowStockProducts
        };
    }
};

// ===================================
// INITIALIZATION AND UTILITY
// ===================================

export const supabaseService = {
    // Initialize service
    initialize: initializeSupabase,

    // Test connection
    async testConnection() {
        const client = getSupabase();
        if (!client) throw new Error('Supabase not initialized');

        const { data, error } = await client
            .from('categories')
            .select('count')
            .limit(1);

        if (error) {
            console.error('Supabase connection test failed:', error);
            throw error;
        }

        console.log('✅ Supabase connection test successful');
        return true;
    },

    // Get client instance
    getClient: getSupabase
};

// Export all services
export default {
    supabaseService,
    productService,
    categoryService,
    customerService,
    orderService,
    interactionService,
    analyticsService
};