-- ============================================
-- LINGERIE STORE DATA - SCHEMA COMPATIBLE
-- ============================================
-- This script populates the database with initial data for a lingerie store
-- Run this after deploying the main database-schema.sql
-- Updated to match the actual schema structure

-- Clear existing data first
DELETE FROM inventory_transactions;
DELETE FROM customer_interactions;
DELETE FROM sales_analytics;
DELETE FROM order_items;
DELETE FROM orders;
DELETE FROM product_variants;
DELETE FROM product_images;
DELETE FROM products;
DELETE FROM customers;
DELETE FROM categories;

-- ============================================
-- CATEGORIES FOR LINGERIE STORE
-- ============================================

INSERT INTO categories (name, name_ar, slug, description, description_ar, is_active, sort_order) VALUES
-- Main Categories
('Soutiens-gorge', 'حمالات الصدر', 'soutiens-gorge', 'Collection complète de soutiens-gorge confortables et élégants', 'مجموعة كاملة من حمالات الصدر المريحة والأنيقة', true, 1),
('Culottes & Slips', 'السراويل الداخلية', 'culottes-slips', 'Lingerie intime féminine de qualité supérieure', 'ملابس داخلية نسائية عالية الجودة', true, 2),
('Ensembles', 'أطقم', 'ensembles', 'Ensembles assortis soutiens-gorge et culottes', 'أطقم متناسقة من حمالات الصدر والسراويل', true, 3),
('Nuisettes', 'قمصان النوم', 'nuisettes', 'Vêtements de nuit élégants et confortables', 'ملابس نوم أنيقة ومريحة', true, 4),
('Bodies', 'البوديات', 'bodies', 'Bodies sexy et confortables pour toutes occasions', 'بوديات مثيرة ومريحة لجميع المناسبات', true, 5),
('Lingerie Sexy', 'ملابس داخلية مثيرة', 'lingerie-sexy', 'Collection sensuelle pour moments intimes', 'مجموعة حسية للحظات الحميمة', true, 6),
('Sport & Confort', 'رياضة وراحة', 'sport-confort', 'Lingerie de sport et de détente', 'ملابس داخلية رياضية وللاسترخاء', true, 7),
('Grandes Tailles', 'مقاسات كبيرة', 'grandes-tailles', 'Lingerie pour femmes aux formes généreuses', 'ملابس داخلية للنساء ذوات الأشكال السخية', true, 8);

-- Store category IDs for reference
DO $$ 
DECLARE 
    cat_soutiens_gorge UUID;
    cat_culottes UUID;
    cat_ensembles UUID;
    cat_nuisettes UUID;
    cat_bodies UUID;
    cat_lingerie_sexy UUID;
    cat_sport UUID;
    cat_grandes_tailles UUID;
BEGIN
    SELECT id INTO cat_soutiens_gorge FROM categories WHERE slug = 'soutiens-gorge';
    SELECT id INTO cat_culottes FROM categories WHERE slug = 'culottes-slips';
    SELECT id INTO cat_ensembles FROM categories WHERE slug = 'ensembles';
    SELECT id INTO cat_nuisettes FROM categories WHERE slug = 'nuisettes';
    SELECT id INTO cat_bodies FROM categories WHERE slug = 'bodies';
    SELECT id INTO cat_lingerie_sexy FROM categories WHERE slug = 'lingerie-sexy';
    SELECT id INTO cat_sport FROM categories WHERE slug = 'sport-confort';
    SELECT id INTO cat_grandes_tailles FROM categories WHERE slug = 'grandes-tailles';

    -- ============================================
    -- PRODUCTS FOR LINGERIE STORE
    -- ============================================

    INSERT INTO products (sku, name, name_ar, description, description_ar, category_id, base_price, sale_price, brand, material, weight, is_active, is_featured, stock_quantity, low_stock_threshold, benefits, benefits_ar, care_instructions, care_instructions_ar) VALUES
    -- Soutiens-gorge
    ('BRA-PU-LACE-001', 'Soutien-gorge Push-up Dentelle Rose', 'حمالة صدر بوش أب دانتيل وردي', 
     'Soutien-gorge push-up en dentelle délicate avec armatures pour un maintien parfait et un décolleté sublimé. Disponible du 85A au 100D.', 
     'حمالة صدر بوش أب من الدانتيل الرقيق مع أسلاك للحصول على دعم مثالي وإطلالة رائعة للصدر. متوفرة من 85A إلى 100D.',
     cat_soutiens_gorge, 45.99, 39.99, 'Elegance Paris', 'Dentelle française 90% polyamide 10% élasthanne', '150g', true, true, 25, 5,
     ARRAY['Effet push-up naturel', 'Armatures confortables', 'Dentelle douce', 'Maintien parfait'],
     ARRAY['تأثير بوش أب طبيعي', 'أسلاك مريحة', 'دانتيل ناعم', 'دعم مثالي'],
     'Lavage à la main à 30°C, séchage à plat', 'غسل يدوي في 30°، تجفيف مسطح'),

    ('BRA-WF-COT-002', 'Soutien-gorge Sans Armatures Coton Bio', 'حمالة صدر بدون أسلاك قطن عضوي',
     'Soutien-gorge ultra-confortable en coton biologique, sans armatures, parfait pour le quotidien. Respirant et hypoallergénique.',
     'حمالة صدر مريحة جداً من القطن العضوي، بدون أسلاك، مثالية للاستخدام اليومي. قابلة للتنفس ومضادة للحساسية.',
     cat_soutiens_gorge, 35.99, 29.99, 'Natural Comfort', 'Coton biologique 95% coton 5% élasthanne', '120g', true, true, 30, 8,
     ARRAY['Sans armatures', 'Coton biologique', 'Respirant', 'Hypoallergénique'],
     ARRAY['بدون أسلاك', 'قطن عضوي', 'قابل للتنفس', 'مضاد للحساسية'],
     'Lavage machine 30°C, séchage naturel', 'غسل بالغسالة 30°، تجفيف طبيعي'),

    ('BRA-SP-PERF-003', 'Soutien-gorge Sport Performance', 'حمالة صدر رياضية الأداء',
     'Soutien-gorge de sport haute performance avec support optimal. Évacuation de l''humidité et maintien exceptionnel.',
     'حمالة صدر رياضية عالية الأداء مع دعم أمثل. إزالة الرطوبة والحفاظ على الشكل بشكل استثنائي.',
     cat_sport, 39.99, 34.99, 'Sport Elite', 'Polyester technique 85% polyester 15% élasthanne', '180g', true, false, 20, 5,
     ARRAY['Support optimal', 'Évacuation humidité', 'Maintien exceptionnel', 'Confort sport'],
     ARRAY['دعم أمثل', 'إزالة الرطوبة', 'حفاظ استثنائي', 'راحة رياضية'],
     'Lavage machine 40°C, séchage rapide', 'غسل بالغسالة 40°، تجفيف سريع'),

    -- Culottes & Slips
    ('PANT-HW-LACE-004', 'Culotte Taille Haute Dentelle Noire', 'سروال عالي الخصر دانتيل أسود',
     'Culotte taille haute en dentelle française, coupe flatteuse et confort optimal. Finitions invisibles sous les vêtements.',
     'سروال عالي الخصر من الدانتيل الفرنسي، قصة جذابة وراحة مثلى. لمسات نهائية غير مرئية تحت الملابس.',
     cat_culottes, 29.99, 24.99, 'Elegance Paris', 'Dentelle française 90% polyamide 10% élasthanne', '80g', true, true, 35, 8,
     ARRAY['Taille haute', 'Dentelle française', 'Coupe flatteuse', 'Finitions invisibles'],
     ARRAY['خصر عالي', 'دانتيل فرنسي', 'قصة جذابة', 'لمسات غير مرئية'],
     'Lavage délicat 30°C, séchage à plat', 'غسل رقيق 30°، تجفيف مسطح'),

    ('PANT-TH-MIC-005', 'String Microfibre Nude', 'سترينغ مايكروفايبر نود',
     'String en microfibre ultra-douce, invisible sous les vêtements. Coupe classique et confort longue durée.',
     'سترينغ من المايكروفايبر فائق النعومة، غير مرئي تحت الملابس. قصة كلاسيكية وراحة طويلة المدى.',
     cat_culottes, 19.99, 16.99, 'Invisible Touch', 'Microfibre 92% polyamide 8% élasthanne', '50g', true, false, 40, 10,
     ARRAY['Microfibre douce', 'Invisible', 'Coupe classique', 'Confort longue durée'],
     ARRAY['مايكروفايبر ناعم', 'غير مرئي', 'قصة كلاسيكية', 'راحة طويلة المدى'],
     'Lavage machine 30°C, séchage rapide', 'غسل بالغسالة 30°، تجفيف سريع'),

    -- Ensembles
    ('SET-PU-LACE-006', 'Ensemble Push-up Dentelle Rouge Passion', 'طقم بوش أب دانتيل أحمر عاطفي',
     'Ensemble soutien-gorge push-up et culotte assortie en dentelle rouge. Parfait pour les occasions spéciales.',
     'طقم حمالة صدر بوش أب وسروال متناسق من الدانتيل الأحمر. مثالي للمناسبات الخاصة.',
     cat_ensembles, 69.99, 59.99, 'Passion Rouge', 'Dentelle française 90% polyamide 10% élasthanne', '250g', true, true, 15, 3,
     ARRAY['Ensemble complet', 'Push-up', 'Dentelle rouge', 'Occasions spéciales'],
     ARRAY['طقم كامل', 'بوش أب', 'دانتيل أحمر', 'مناسبات خاصة'],
     'Lavage délicat 30°C, séchage à plat', 'غسل رقيق 30°، تجفيف مسطح'),

    ('SET-ORG-COT-007', 'Ensemble Coton Bio Blanc Naturel', 'طقم قطن عضوي أبيض طبيعي',
     'Ensemble soutien-gorge sans armatures et culotte en coton biologique. Douceur et respect de la peau.',
     'طقم حمالة صدر بدون أسلاك وسروال من القطن العضوي. نعومة واحترام للبشرة.',
     cat_ensembles, 59.99, 49.99, 'Natural Comfort', 'Coton biologique 95% coton 5% élasthanne', '220g', true, false, 18, 4,
     ARRAY['Coton biologique', 'Sans armatures', 'Douceur naturelle', 'Respect de la peau'],
     ARRAY['قطن عضوي', 'بدون أسلاك', 'نعومة طبيعية', 'احترام للبشرة'],
     'Lavage machine 30°C, séchage naturel', 'غسل بالغسالة 30°، تجفيف طبيعي'),

    -- Nuisettes
    ('NIGHT-SAT-BLK-008', 'Nuisette Satin Noir Élégante', 'قميص نوم ساتان أسود أنيق',
     'Nuisette en satin luxueux avec broderies délicates. Coupe fluide et tombé parfait pour des nuits glamour.',
     'قميص نوم من الساتان الفاخر مع تطريز رقيق. قصة انسيابية وتدلي مثالي لليالي الساحرة.',
     cat_nuisettes, 79.99, 69.99, 'Nuit Glamour', 'Satin polyester 100% polyester soyeux', '300g', true, true, 12, 3,
     ARRAY['Satin luxueux', 'Broderies délicates', 'Coupe fluide', 'Nuits glamour'],
     ARRAY['ساتان فاخر', 'تطريز رقيق', 'قصة انسيابية', 'ليالي ساحرة'],
     'Lavage délicat 30°C, repassage doux', 'غسل رقيق 30°، كي خفيف'),

    -- Bodies
    ('BODY-LACE-WHT-009', 'Body Dentelle Transparent Blanc', 'بودي دانتيل شفاف أبيض',
     'Body en dentelle transparente avec fermeture pression. Design sensuel et coupe ajustée pour sublimer la silhouette.',
     'بودي من الدانتيل الشفاف مع إغلاق بكبسة. تصميم حسي وقصة مناسبة لإبراز الشكل.',
     cat_bodies, 55.99, 47.99, 'Sensual Touch', 'Dentelle transparente 85% polyamide 15% élasthanne', '200g', true, false, 20, 5,
     ARRAY['Dentelle transparente', 'Fermeture pression', 'Design sensuel', 'Coupe ajustée'],
     ARRAY['دانتيل شفاف', 'إغلاق بكبسة', 'تصميم حسي', 'قصة مناسبة'],
     'Lavage à la main 30°C, séchage à plat', 'غسل يدوي 30°، تجفيف مسطح'),

    -- Lingerie Sexy
    ('GARTER-SAT-RED-010', 'Porte-jarretelles Satin Rouge', 'حزام الجورب ساتان أحمر',
     'Porte-jarretelles en satin rouge avec jarretelles ajustables. Accessoire indispensable pour les tenues sexy.',
     'حزام جورب من الساتان الأحمر مع أربطة قابلة للتعديل. إكسسوار أساسي للإطلالات المثيرة.',
     cat_lingerie_sexy, 39.99, 34.99, 'Sexy Red', 'Satin polyester 95% polyester 5% élasthanne', '150g', true, true, 10, 2,
     ARRAY['Satin rouge', 'Jarretelles ajustables', 'Accessoire sexy', 'Tenues spéciales'],
     ARRAY['ساتان أحمر', 'أربطة قابلة للتعديل', 'إكسسوار مثير', 'إطلالات خاصة'],
     'Lavage délicat 30°C, séchage à plat', 'غسل رقيق 30°، تجفيف مسطح'),

    -- Grandes Tailles
    ('BRA-PLU-LACE-011', 'Soutien-gorge Grande Taille Dentelle Beige', 'حمالة صدر مقاس كبير دانتيل بيج',
     'Soutien-gorge spécialement conçu pour les grandes tailles (95C à 110F). Support optimal et confort toute la journée.',
     'حمالة صدر مصممة خصيصاً للمقاسات الكبيرة (95C إلى 110F). دعم أمثل وراحة طوال اليوم.',
     cat_grandes_tailles, 59.99, 52.99, 'Plus Size Comfort', 'Dentelle renforcée 88% polyamide 12% élasthanne', '250g', true, false, 15, 3,
     ARRAY['Grandes tailles', 'Support optimal', 'Confort journée', 'Dentelle renforcée'],
     ARRAY['مقاسات كبيرة', 'دعم أمثل', 'راحة طوال اليوم', 'دانتيل معزز'],
     'Lavage délicat 30°C, séchage à plat', 'غسل رقيق 30°، تجفيف مسطح'),

    ('PANT-PLU-COT-012', 'Culotte Grande Taille Coton Doux', 'سروال مقاس كبير قطن ناعم',
     'Culotte grande taille en coton extra-doux. Ceinture élastique confortable et coupe flatteuse.',
     'سروال مقاس كبير من القطن فائق النعومة. حزام مطاطي مريح وقصة جذابة.',
     cat_grandes_tailles, 34.99, 29.99, 'Plus Size Comfort', 'Coton extra-doux 92% coton 8% élasthanne', '120g', true, false, 25, 5,
     ARRAY['Grandes tailles', 'Coton extra-doux', 'Ceinture élastique', 'Coupe flatteuse'],
     ARRAY['مقاسات كبيرة', 'قطن فائق النعومة', 'حزام مطاطي', 'قصة جذابة'],
     'Lavage machine 40°C, séchage naturel', 'غسل بالغسالة 40°، تجفيف طبيعي');

END $$;

-- ============================================
-- PRODUCT IMAGES
-- ============================================

INSERT INTO product_images (product_id, image_url, alt_text, alt_text_ar, is_primary, sort_order)
SELECT p.id, 'https://images.unsplash.com/photo-1566479179817-c5d83fce1d31?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 
       'Soutien-gorge push-up dentelle rose', 'حمالة صدر بوش أب دانتيل وردي', true, 1
FROM products p WHERE p.sku = 'BRA-PU-LACE-001'
UNION ALL
SELECT p.id, 'https://images.unsplash.com/photo-1558021211-9d60e9f741c0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 
       'Soutien-gorge coton bio sans armatures', 'حمالة صدر قطن عضوي بدون أسلاك', true, 1
FROM products p WHERE p.sku = 'BRA-WF-COT-002'
UNION ALL
SELECT p.id, 'https://images.unsplash.com/photo-1512696797580-35e5ac73b69e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 
       'Soutien-gorge sport performance', 'حمالة صدر رياضية الأداء', true, 1
FROM products p WHERE p.sku = 'BRA-SP-PERF-003'
UNION ALL
SELECT p.id, 'https://images.unsplash.com/photo-1566479179817-c5d83fce1d31?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 
       'Culotte taille haute dentelle noire', 'سروال عالي الخصر دانتيل أسود', true, 1
FROM products p WHERE p.sku = 'PANT-HW-LACE-004'
UNION ALL
SELECT p.id, 'https://images.unsplash.com/photo-1558021211-9d60e9f741c0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 
       'String microfibre nude', 'سترينغ مايكروفايبر نود', true, 1
FROM products p WHERE p.sku = 'PANT-TH-MIC-005'
UNION ALL
SELECT p.id, 'https://images.unsplash.com/photo-1566414033969-a4f2c34b0c20?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 
       'Ensemble push-up dentelle rouge', 'طقم بوش أب دانتيل أحمر', true, 1
FROM products p WHERE p.sku = 'SET-PU-LACE-006'
UNION ALL
SELECT p.id, 'https://images.unsplash.com/photo-1512696797580-35e5ac73b69e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 
       'Ensemble coton bio blanc', 'طقم قطن عضوي أبيض', true, 1
FROM products p WHERE p.sku = 'SET-ORG-COT-007'
UNION ALL
SELECT p.id, 'https://images.unsplash.com/photo-1566479179817-c5d83fce1d31?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 
       'Nuisette satin noir élégante', 'قميص نوم ساتان أسود أنيق', true, 1
FROM products p WHERE p.sku = 'NIGHT-SAT-BLK-008'
UNION ALL
SELECT p.id, 'https://images.unsplash.com/photo-1558021211-9d60e9f741c0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 
       'Body dentelle transparent blanc', 'بودي دانتيل شفاف أبيض', true, 1
FROM products p WHERE p.sku = 'BODY-LACE-WHT-009'
UNION ALL
SELECT p.id, 'https://images.unsplash.com/photo-1566414033969-a4f2c34b0c20?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 
       'Porte-jarretelles satin rouge', 'حزام الجورب ساتان أحمر', true, 1
FROM products p WHERE p.sku = 'GARTER-SAT-RED-010'
UNION ALL
SELECT p.id, 'https://images.unsplash.com/photo-1512696797580-35e5ac73b69e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 
       'Soutien-gorge grande taille dentelle beige', 'حمالة صدر مقاس كبير دانتيل بيج', true, 1
FROM products p WHERE p.sku = 'BRA-PLU-LACE-011'
UNION ALL
SELECT p.id, 'https://images.unsplash.com/photo-1566479179817-c5d83fce1d31?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 
       'Culotte grande taille coton doux', 'سروال مقاس كبير قطن ناعم', true, 1
FROM products p WHERE p.sku = 'PANT-PLU-COT-012';

-- ============================================
-- PRODUCT VARIANTS (Tailles et Couleurs)
-- ============================================

INSERT INTO product_variants (product_id, size, color, color_ar, price, stock_quantity, variant_sku, is_available)
SELECT p.id, '85A', 'Rose', 'وردي', 45.99, 5, 'BRA-PU-LACE-001-85A-ROSE', true
FROM products p WHERE p.sku = 'BRA-PU-LACE-001'
UNION ALL
SELECT p.id, '85B', 'Rose', 'وردي', 45.99, 4, 'BRA-PU-LACE-001-85B-ROSE', true
FROM products p WHERE p.sku = 'BRA-PU-LACE-001'
UNION ALL
SELECT p.id, '90B', 'Rose', 'وردي', 45.99, 6, 'BRA-PU-LACE-001-90B-ROSE', true
FROM products p WHERE p.sku = 'BRA-PU-LACE-001'
UNION ALL
SELECT p.id, '90C', 'Rose', 'وردي', 45.99, 5, 'BRA-PU-LACE-001-90C-ROSE', true
FROM products p WHERE p.sku = 'BRA-PU-LACE-001'
UNION ALL
SELECT p.id, '95C', 'Rose', 'وردي', 45.99, 5, 'BRA-PU-LACE-001-95C-ROSE', true
FROM products p WHERE p.sku = 'BRA-PU-LACE-001'
UNION ALL
SELECT p.id, 'S', 'Noir', 'أسود', 29.99, 8, 'PANT-HW-LACE-004-S-NOIR', true
FROM products p WHERE p.sku = 'PANT-HW-LACE-004'
UNION ALL
SELECT p.id, 'M', 'Noir', 'أسود', 29.99, 10, 'PANT-HW-LACE-004-M-NOIR', true
FROM products p WHERE p.sku = 'PANT-HW-LACE-004'
UNION ALL
SELECT p.id, 'L', 'Noir', 'أسود', 29.99, 9, 'PANT-HW-LACE-004-L-NOIR', true
FROM products p WHERE p.sku = 'PANT-HW-LACE-004'
UNION ALL
SELECT p.id, 'XL', 'Noir', 'أسود', 29.99, 8, 'PANT-HW-LACE-004-XL-NOIR', true
FROM products p WHERE p.sku = 'PANT-HW-LACE-004'
UNION ALL
SELECT p.id, 'S', 'Nude', 'نود', 19.99, 10, 'PANT-TH-MIC-005-S-NUDE', true
FROM products p WHERE p.sku = 'PANT-TH-MIC-005'
UNION ALL
SELECT p.id, 'M', 'Nude', 'نود', 19.99, 15, 'PANT-TH-MIC-005-M-NUDE', true
FROM products p WHERE p.sku = 'PANT-TH-MIC-005'
UNION ALL
SELECT p.id, 'L', 'Nude', 'نود', 19.99, 10, 'PANT-TH-MIC-005-L-NUDE', true
FROM products p WHERE p.sku = 'PANT-TH-MIC-005'
UNION ALL
SELECT p.id, 'XL', 'Nude', 'نود', 19.99, 5, 'PANT-TH-MIC-005-XL-NUDE', true
FROM products p WHERE p.sku = 'PANT-TH-MIC-005';

-- ============================================
-- SAMPLE CUSTOMERS
-- ============================================

INSERT INTO customers (platform_id, platform_type, name, email, phone, wilaya, preferred_language, total_orders, total_spent, is_vip) VALUES
('messenger_001', 'messenger', 'Amina Benali', 'amina.benali@email.com', '+33123456789', 'Paris', 'fr', 3, 135.97, false),
('whatsapp_002', 'whatsapp', 'Sarah Dubois', 'sarah.dubois@email.com', '+33987654321', 'Rhône', 'fr', 1, 69.99, false),
('messenger_003', 'messenger', 'Fatima Al-Zahra', 'fatima.alzahra@email.com', '+212612345678', 'Casablanca', 'ar', 5, 289.95, true);

-- ============================================
-- SAMPLE ORDERS
-- ============================================

INSERT INTO orders (order_number, customer_id, platform_type, total_amount, status, payment_status, shipping_address, wilaya, notes)
SELECT 'ORD-LNG-001', c.id, 'messenger', 105.98, 'confirmed', 'paid', '123 Rue de la Paix, Paris', 'Paris', 'Commande pour ensemble rouge'
FROM customers c WHERE c.platform_id = 'messenger_001'
UNION ALL
SELECT 'ORD-LNG-002', c.id, 'whatsapp', 69.99, 'pending_confirmation', 'pending', '456 Avenue des Champs, Lyon', 'Rhône', 'Première commande cliente'
FROM customers c WHERE c.platform_id = 'whatsapp_002'
UNION ALL
SELECT 'ORD-LNG-003', c.id, 'messenger', 125.98, 'shipped', 'paid', '789 Boulevard Mohammed V, Casablanca', 'Casablanca', 'Commande VIP - livraison express'
FROM customers c WHERE c.platform_id = 'messenger_003';

-- ============================================
-- ORDER ITEMS
-- ============================================

INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price, product_snapshot)
SELECT o.id, p.id, 1, 59.99, 59.99, 
       jsonb_build_object('name', p.name, 'name_ar', p.name_ar, 'sku', p.sku, 'brand', p.brand, 'size', '90B', 'color', 'Rouge')
FROM orders o, products p 
WHERE o.order_number = 'ORD-LNG-001' AND p.sku = 'SET-PU-LACE-006'
UNION ALL
SELECT o.id, p.id, 1, 24.99, 24.99,
       jsonb_build_object('name', p.name, 'name_ar', p.name_ar, 'sku', p.sku, 'brand', p.brand, 'size', 'M', 'color', 'Noir')
FROM orders o, products p 
WHERE o.order_number = 'ORD-LNG-001' AND p.sku = 'PANT-HW-LACE-004'
UNION ALL
SELECT o.id, p.id, 1, 59.99, 59.99,
       jsonb_build_object('name', p.name, 'name_ar', p.name_ar, 'sku', p.sku, 'brand', p.brand, 'size', '85B', 'color', 'Rouge')
FROM orders o, products p 
WHERE o.order_number = 'ORD-LNG-002' AND p.sku = 'SET-PU-LACE-006'
UNION ALL
SELECT o.id, p.id, 1, 39.99, 39.99,
       jsonb_build_object('name', p.name, 'name_ar', p.name_ar, 'sku', p.sku, 'brand', p.brand, 'size', '95C', 'color', 'Rose')
FROM orders o, products p 
WHERE o.order_number = 'ORD-LNG-003' AND p.sku = 'BRA-PU-LACE-001'
UNION ALL
SELECT o.id, p.id, 1, 69.99, 69.99,
       jsonb_build_object('name', p.name, 'name_ar', p.name_ar, 'sku', p.sku, 'brand', p.brand, 'size', 'M', 'color', 'Noir')
FROM orders o, products p 
WHERE o.order_number = 'ORD-LNG-003' AND p.sku = 'NIGHT-SAT-BLK-008';

-- ============================================
-- INVENTORY TRANSACTIONS
-- ============================================

INSERT INTO inventory_transactions (product_id, transaction_type, quantity_change, old_quantity, new_quantity, reference_type, notes, created_by)
SELECT p.id, 'adjustment', 25, 0, 25, 'manual', 'Stock initial - Soutien-gorge push-up dentelle rose', 'admin'
FROM products p WHERE p.sku = 'BRA-PU-LACE-001'
UNION ALL
SELECT p.id, 'adjustment', 30, 0, 30, 'manual', 'Stock initial - Soutien-gorge coton bio', 'admin'
FROM products p WHERE p.sku = 'BRA-WF-COT-002'
UNION ALL
SELECT p.id, 'adjustment', 20, 0, 20, 'manual', 'Stock initial - Soutien-gorge sport', 'admin'
FROM products p WHERE p.sku = 'BRA-SP-PERF-003'
UNION ALL
SELECT p.id, 'adjustment', 35, 0, 35, 'manual', 'Stock initial - Culotte dentelle noire', 'admin'
FROM products p WHERE p.sku = 'PANT-HW-LACE-004'
UNION ALL
SELECT p.id, 'adjustment', 40, 0, 40, 'manual', 'Stock initial - String microfibre nude', 'admin'
FROM products p WHERE p.sku = 'PANT-TH-MIC-005';

-- ============================================
-- CUSTOMER INTERACTIONS LOG
-- ============================================

INSERT INTO customer_interactions (customer_id, platform_type, interaction_type, message, ai_response, products_mentioned, sentiment, language, thread_id)
SELECT c.id, 'messenger', 'message', 'Bonjour, je cherche un ensemble de lingerie rouge pour une occasion spéciale', 
       'Bonjour ! Parfait timing ! Je vous recommande notre Ensemble Push-up Dentelle Rouge Passion à 59.99€. Il est parfait pour les occasions spéciales avec son soutien-gorge push-up et sa culotte assortie en dentelle rouge. Voulez-vous connaître les tailles disponibles ?',
       ARRAY[p.id], 'positive', 'fr', 'thread_001'
FROM customers c, products p 
WHERE c.platform_id = 'messenger_001' AND p.sku = 'SET-PU-LACE-006'
UNION ALL
SELECT c.id, 'whatsapp', 'message', 'Je voudrais voir vos soutiens-gorge de sport',
       'Excellent choix ! Notre Soutien-gorge Sport Performance à 34.99€ offre un support optimal avec évacuation de l''humidité. Parfait pour tous vos entraînements. Quelle taille vous intéresse ?',
       ARRAY[p.id], 'neutral', 'fr', 'thread_002'
FROM customers c, products p 
WHERE c.platform_id = 'whatsapp_002' AND p.sku = 'BRA-SP-PERF-003'
UNION ALL
SELECT c.id, 'messenger', 'message', 'أريد طقم ملابس داخلية أنيق وجميل',
       'أهلاً وسهلاً! أنصحك بطقم البوش أب الدانتيل الأحمر العاطفي بـ 59.99€. إنه مثالي للمناسبات الخاصة مع حمالة صدر بوش أب وسروال متناسق من الدانتيل الأحمر. هل تودين معرفة المقاسات المتوفرة؟',
       ARRAY[p.id], 'positive', 'ar', 'thread_003'
FROM customers c, products p 
WHERE c.platform_id = 'messenger_003' AND p.sku = 'SET-PU-LACE-006';

-- ============================================
-- ANALYTICS DATA
-- ============================================

INSERT INTO sales_analytics (date, platform_type, total_orders, total_revenue, new_customers, returning_customers, top_products)
VALUES
(CURRENT_DATE - INTERVAL '5 days', 'messenger', 1, 125.98, 0, 1, '{"most_sold": [{"product_id": "placeholder", "quantity": 1}]}'::jsonb),
(CURRENT_DATE - INTERVAL '2 days', 'messenger', 1, 105.98, 0, 1, '{"most_sold": [{"product_id": "placeholder", "quantity": 1}]}'::jsonb),
(CURRENT_DATE - INTERVAL '1 day', 'whatsapp', 1, 69.99, 1, 0, '{"most_sold": [{"product_id": "placeholder", "quantity": 1}]}'::jsonb),
(CURRENT_DATE, 'messenger', 0, 0.00, 0, 0, '{}'::jsonb),
(CURRENT_DATE, 'whatsapp', 0, 0.00, 0, 0, '{}'::jsonb);

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

DO $$
BEGIN
    RAISE NOTICE 'Données de magasin de lingerie insérées avec succès:';
    RAISE NOTICE '- Catégories: % entrées', (SELECT count(*) FROM categories);
    RAISE NOTICE '- Produits: % entrées', (SELECT count(*) FROM products);
    RAISE NOTICE '- Images: % entrées', (SELECT count(*) FROM product_images);
    RAISE NOTICE '- Variantes: % entrées', (SELECT count(*) FROM product_variants);
    RAISE NOTICE '- Clients: % entrées', (SELECT count(*) FROM customers);
    RAISE NOTICE '- Commandes: % entrées', (SELECT count(*) FROM orders);
    RAISE NOTICE '- Articles commandés: % entrées', (SELECT count(*) FROM order_items);
    RAISE NOTICE '- Transactions inventaire: % entrées', (SELECT count(*) FROM inventory_transactions);
    RAISE NOTICE '- Interactions clients: % entrées', (SELECT count(*) FROM customer_interactions);
    RAISE NOTICE '';
    RAISE NOTICE '🎉 Base de données de magasin de lingerie prête!';
    RAISE NOTICE 'Toutes les données sont compatibles avec le schéma UUID.';
    RAISE NOTICE 'Vous pouvez maintenant tester votre agent de vente.';
END $$; 