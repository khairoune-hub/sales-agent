import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

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

        return data;
    },

    // Search products
    async searchProducts(searchQuery, filters = {}) {
        const client = getSupabase();
        if (!client) throw new Error('Supabase not initialized');

        const { data, error } = await client
            .rpc('search_products', {
                search_query: searchQuery,
                category_filter: filters.category || null,
                language_filter: filters.language || 'fr',
                max_results: filters.limit || 10
            });

        if (error) {
            console.error('Error searching products:', error);
            throw error;
        }

        return data;
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