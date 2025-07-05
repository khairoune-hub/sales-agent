-- ===================================
-- OPTIMIZED SUPABASE DATABASE SCHEMA
-- Sales Agent System - Enhanced Version
-- ===================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ===================================
-- CORE TABLES
-- ===================================

-- 1. Categories Table
CREATE TABLE categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    name_ar VARCHAR(100),
    description TEXT,
    description_ar TEXT,
    slug VARCHAR(100) UNIQUE NOT NULL,
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Products Table
CREATE TABLE products (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sku VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255),
    description TEXT,
    description_ar TEXT,
    category_id UUID REFERENCES categories(id),
    base_price DECIMAL(10,2) NOT NULL,
    sale_price DECIMAL(10,2),
    brand VARCHAR(100),
    material VARCHAR(100),
    weight VARCHAR(50),
    care_instructions TEXT,
    care_instructions_ar TEXT,
    benefits TEXT[],
    benefits_ar TEXT[],
    ingredients TEXT,
    ingredients_ar TEXT,
    usage_instructions TEXT,
    usage_instructions_ar TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    stock_quantity INTEGER DEFAULT 0,
    low_stock_threshold INTEGER DEFAULT 5,
    views_count INTEGER DEFAULT 0,
    sales_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Product Images
CREATE TABLE product_images (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    alt_text VARCHAR(255),
    alt_text_ar VARCHAR(255),
    is_primary BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. Product Variants (for sizes, colors, etc.)
CREATE TABLE product_variants (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    size VARCHAR(50),
    color VARCHAR(50),
    color_ar VARCHAR(50),
    price DECIMAL(10,2),
    stock_quantity INTEGER DEFAULT 0,
    variant_sku VARCHAR(150) UNIQUE,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. Customers Table
CREATE TABLE customers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    platform_id VARCHAR(100) NOT NULL, -- Messenger ID or WhatsApp number
    platform_type VARCHAR(20) NOT NULL, -- 'messenger' or 'whatsapp'
    name VARCHAR(255),
    phone VARCHAR(20),
    email VARCHAR(255),
    wilaya VARCHAR(100),
    address TEXT,
    preferred_language VARCHAR(10) DEFAULT 'fr',
    preferred_sizes JSONB,
    preferred_categories TEXT[],
    notes TEXT,
    is_vip BOOLEAN DEFAULT FALSE,
    total_orders INTEGER DEFAULT 0,
    total_spent DECIMAL(10,2) DEFAULT 0,
    last_order_date TIMESTAMP WITH TIME ZONE,
    first_contact_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    last_contact_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(platform_id, platform_type)
);

-- 6. Orders Table
CREATE TABLE orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID REFERENCES customers(id),
    platform_type VARCHAR(20) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending_confirmation',
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    shipping_address TEXT,
    wilaya VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(255),
    notes TEXT,
    sales_agent VARCHAR(100),
    payment_method VARCHAR(50),
    payment_status VARCHAR(50) DEFAULT 'pending',
    shipped_date TIMESTAMP WITH TIME ZONE,
    delivered_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    confirmed_by VARCHAR(100)
);

-- 7. Order Items Table
CREATE TABLE order_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    variant_id UUID REFERENCES product_variants(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    product_snapshot JSONB, -- Store product details at time of order
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 8. Inventory Transactions Table
CREATE TABLE inventory_transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id UUID REFERENCES products(id),
    variant_id UUID REFERENCES product_variants(id),
    transaction_type VARCHAR(50) NOT NULL, -- 'sale', 'restock', 'adjustment', 'return'
    quantity_change INTEGER NOT NULL,
    old_quantity INTEGER NOT NULL,
    new_quantity INTEGER NOT NULL,
    reference_id UUID, -- Could be order_id, return_id, etc.
    reference_type VARCHAR(50), -- 'order', 'return', 'manual'
    notes TEXT,
    created_by VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 9. Customer Interactions Table
CREATE TABLE customer_interactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    customer_id UUID REFERENCES customers(id),
    platform_type VARCHAR(20) NOT NULL,
    interaction_type VARCHAR(50) NOT NULL, -- 'message', 'order', 'inquiry', 'complaint'
    message TEXT,
    ai_response TEXT,
    products_mentioned UUID[],
    sentiment VARCHAR(20), -- 'positive', 'neutral', 'negative'
    language VARCHAR(10),
    thread_id VARCHAR(255), -- OpenAI thread ID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 10. Sales Analytics Table
CREATE TABLE sales_analytics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    date DATE NOT NULL,
    platform_type VARCHAR(20) NOT NULL,
    total_orders INTEGER DEFAULT 0,
    total_revenue DECIMAL(10,2) DEFAULT 0,
    new_customers INTEGER DEFAULT 0,
    returning_customers INTEGER DEFAULT 0,
    top_products JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(date, platform_type)
);

-- ===================================
-- INDEXES FOR PERFORMANCE
-- ===================================

-- Products indexes
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_products_featured ON products(is_featured);
CREATE INDEX idx_products_stock ON products(stock_quantity);
CREATE INDEX idx_products_name_search ON products USING GIN(name gin_trgm_ops);

-- Variants indexes
CREATE INDEX idx_variants_product ON product_variants(product_id);
CREATE INDEX idx_variants_available ON product_variants(is_available);

-- Images indexes
CREATE INDEX idx_images_product ON product_images(product_id);
CREATE INDEX idx_images_primary ON product_images(is_primary);

-- Customer indexes
CREATE INDEX idx_customers_platform ON customers(platform_id, platform_type);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_name ON customers(name);

-- Orders indexes
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_date ON orders(created_at);
CREATE INDEX idx_orders_number ON orders(order_number);

-- Order items indexes
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);

-- Inventory indexes
CREATE INDEX idx_inventory_product ON inventory_transactions(product_id);
CREATE INDEX idx_inventory_date ON inventory_transactions(created_at);

-- Interactions indexes
CREATE INDEX idx_interactions_customer ON customer_interactions(customer_id);
CREATE INDEX idx_interactions_date ON customer_interactions(created_at);
CREATE INDEX idx_interactions_thread ON customer_interactions(thread_id);

-- Analytics indexes
CREATE INDEX idx_analytics_date ON sales_analytics(date);
CREATE INDEX idx_analytics_platform ON sales_analytics(platform_type);

-- ===================================
-- FUNCTIONS AND TRIGGERS
-- ===================================

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply timestamp triggers
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_variants_updated_at BEFORE UPDATE ON product_variants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update inventory
CREATE OR REPLACE FUNCTION update_inventory_on_order()
RETURNS TRIGGER AS $$
BEGIN
    -- Update product stock
    UPDATE products 
    SET stock_quantity = stock_quantity - NEW.quantity,
        sales_count = sales_count + 1
    WHERE id = NEW.product_id;
    
    -- Update variant stock if applicable
    IF NEW.variant_id IS NOT NULL THEN
        UPDATE product_variants 
        SET stock_quantity = stock_quantity - NEW.quantity
        WHERE id = NEW.variant_id;
    END IF;
    
    -- Record inventory transaction
    INSERT INTO inventory_transactions (
        product_id, variant_id, transaction_type, quantity_change,
        old_quantity, new_quantity, reference_id, reference_type
    ) VALUES (
        NEW.product_id, NEW.variant_id, 'sale', -NEW.quantity,
        (SELECT stock_quantity + NEW.quantity FROM products WHERE id = NEW.product_id),
        (SELECT stock_quantity FROM products WHERE id = NEW.product_id),
        (SELECT order_id FROM order_items WHERE id = NEW.id),
        'order'
    );
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply inventory trigger
CREATE TRIGGER update_inventory_on_order_item AFTER INSERT ON order_items
    FOR EACH ROW EXECUTE FUNCTION update_inventory_on_order();

-- Function to update order total
CREATE OR REPLACE FUNCTION update_order_total()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE orders 
    SET total_amount = (
        SELECT COALESCE(SUM(total_price), 0) 
        FROM order_items 
        WHERE order_id = NEW.order_id
    )
    WHERE id = NEW.order_id;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply order total trigger
CREATE TRIGGER update_order_total_on_item AFTER INSERT OR UPDATE OR DELETE ON order_items
    FOR EACH ROW EXECUTE FUNCTION update_order_total();

-- Function to update customer stats
CREATE OR REPLACE FUNCTION update_customer_stats()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE customers 
    SET total_orders = total_orders + 1,
        total_spent = total_spent + NEW.total_amount,
        last_order_date = NEW.created_at
    WHERE id = NEW.customer_id;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply customer stats trigger
CREATE TRIGGER update_customer_stats_on_order AFTER INSERT ON orders
    FOR EACH ROW EXECUTE FUNCTION update_customer_stats();

-- ===================================
-- ADVANCED FUNCTIONS FOR SALES AGENT
-- ===================================

-- Function to search products intelligently
CREATE OR REPLACE FUNCTION search_products(
    search_query TEXT DEFAULT NULL,
    category_filter TEXT DEFAULT NULL,
    language_filter TEXT DEFAULT 'fr',
    max_results INTEGER DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    name_ar TEXT,
    description TEXT,
    price DECIMAL,
    stock_quantity INTEGER,
    category_name TEXT,
    image_url TEXT,
    is_in_stock BOOLEAN,
    relevance_score FLOAT
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.name_ar,
        p.description,
        COALESCE(p.sale_price, p.base_price) as price,
        p.stock_quantity,
        c.name as category_name,
        pi.image_url,
        (p.stock_quantity > 0) as is_in_stock,
        CASE 
            WHEN search_query IS NULL THEN 1.0
            ELSE (
                similarity(p.name, search_query) * 0.4 +
                similarity(COALESCE(p.description, ''), search_query) * 0.3 +
                similarity(COALESCE(p.name_ar, ''), search_query) * 0.3
            )
        END as relevance_score
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = true
    WHERE 
        p.is_active = true
        AND (category_filter IS NULL OR c.slug = category_filter)
        AND (
            search_query IS NULL 
            OR p.name ILIKE '%' || search_query || '%'
            OR p.name_ar ILIKE '%' || search_query || '%'
            OR p.description ILIKE '%' || search_query || '%'
        )
    ORDER BY relevance_score DESC, p.is_featured DESC, p.sales_count DESC
    LIMIT max_results;
END;
$$;

-- Function to get product availability
CREATE OR REPLACE FUNCTION get_product_availability(product_id UUID)
RETURNS TABLE (
    is_available BOOLEAN,
    stock_quantity INTEGER,
    low_stock_alert BOOLEAN,
    variants JSONB
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (p.stock_quantity > 0) as is_available,
        p.stock_quantity,
        (p.stock_quantity <= p.low_stock_threshold) as low_stock_alert,
        (
            SELECT COALESCE(
                json_agg(
                    json_build_object(
                        'id', pv.id,
                        'size', pv.size,
                        'color', pv.color,
                        'stock', pv.stock_quantity,
                        'price', pv.price
                    )
                ), '[]'::json
            )
            FROM product_variants pv 
            WHERE pv.product_id = p.id AND pv.is_available = true
        ) as variants
    FROM products p
    WHERE p.id = get_product_availability.product_id;
END;
$$;

-- Function to create order with inventory check
CREATE OR REPLACE FUNCTION create_order_with_inventory_check(
    p_customer_id UUID,
    p_platform_type TEXT,
    p_items JSONB,
    p_shipping_address TEXT DEFAULT NULL,
    p_wilaya TEXT DEFAULT NULL,
    p_phone TEXT DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
)
RETURNS TABLE (
    success BOOLEAN,
    order_id UUID,
    message TEXT,
    out_of_stock_items JSONB
) 
LANGUAGE plpgsql
AS $$
DECLARE
    v_order_id UUID;
    v_order_number TEXT;
    v_item JSONB;
    v_product_stock INTEGER;
    v_out_of_stock JSONB := '[]'::jsonb;
    v_has_stock_issues BOOLEAN := FALSE;
BEGIN
    -- Check stock for all items first
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        SELECT stock_quantity INTO v_product_stock
        FROM products 
        WHERE id = (v_item->>'product_id')::UUID;
        
        IF v_product_stock < (v_item->>'quantity')::INTEGER THEN
            v_has_stock_issues := TRUE;
            v_out_of_stock := v_out_of_stock || jsonb_build_object(
                'product_id', v_item->>'product_id',
                'requested', (v_item->>'quantity')::INTEGER,
                'available', v_product_stock
            );
        END IF;
    END LOOP;
    
    -- Return error if stock issues
    IF v_has_stock_issues THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, 'Stock insufficient for some items', v_out_of_stock;
        RETURN;
    END IF;
    
    -- Create order
    v_order_id := uuid_generate_v4();
    v_order_number := 'ORD-' || to_char(NOW(), 'YYYYMMDD') || '-' || LPAD(nextval('order_sequence')::TEXT, 3, '0');
    
    INSERT INTO orders (
        id, order_number, customer_id, platform_type, 
        shipping_address, wilaya, phone, notes
    ) VALUES (
        v_order_id, v_order_number, p_customer_id, p_platform_type,
        p_shipping_address, p_wilaya, p_phone, p_notes
    );
    
    -- Add order items
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        INSERT INTO order_items (
            order_id, product_id, quantity, unit_price, total_price
        ) 
        SELECT 
            v_order_id,
            (v_item->>'product_id')::UUID,
            (v_item->>'quantity')::INTEGER,
            COALESCE(p.sale_price, p.base_price),
            COALESCE(p.sale_price, p.base_price) * (v_item->>'quantity')::INTEGER
        FROM products p
        WHERE p.id = (v_item->>'product_id')::UUID;
    END LOOP;
    
    RETURN QUERY SELECT TRUE, v_order_id, 'Order created successfully', '[]'::jsonb;
END;
$$;

-- Create sequence for order numbers
CREATE SEQUENCE IF NOT EXISTS order_sequence START 1;

-- ===================================
-- ROW LEVEL SECURITY POLICIES
-- ===================================

-- Enable RLS on all tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_analytics ENABLE ROW LEVEL SECURITY;

-- Public read policies for product data
CREATE POLICY "Public can read active categories" ON categories
    FOR SELECT USING (is_active = true);

CREATE POLICY "Public can read active products" ON products
    FOR SELECT USING (is_active = true);

CREATE POLICY "Public can read available variants" ON product_variants
    FOR SELECT USING (is_available = true);

CREATE POLICY "Public can read product images" ON product_images
    FOR SELECT USING (true);

-- Service role policies (full access for backend)
-- Note: These will be configured in Supabase dashboard for the service role