-- ============================================
-- LINGERIE STORE INITIAL DATA
-- ============================================
-- This script populates the database with initial data for a lingerie store
-- Run this after deploying the main database-schema.sql

-- Clear existing sample data first
DELETE FROM product_images;
DELETE FROM product_variants;
DELETE FROM order_items;
DELETE FROM orders;
DELETE FROM products;
DELETE FROM categories;
DELETE FROM customers;

-- ============================================
-- CATEGORIES FOR LINGERIE STORE
-- ============================================

INSERT INTO categories (id, name, name_ar, slug, description, description_ar, is_active, sort_order) VALUES
-- Main Categories
(1, 'Soutiens-gorge', 'حمالات الصدر', 'soutiens-gorge', 'Collection complète de soutiens-gorge confortables et élégants', 'مجموعة كاملة من حمالات الصدر المريحة والأنيقة', true, 1),
(2, 'Culottes & Slips', 'السراويل الداخلية', 'culottes-slips', 'Lingerie intime féminine de qualité supérieure', 'ملابس داخلية نسائية عالية الجودة', true, 2),
(3, 'Ensembles', 'أطقم', 'ensembles', 'Ensembles assortis soutiens-gorge et culottes', 'أطقم متناسقة من حمالات الصدر والسراويل', true, 3),
(4, 'Nuisettes', 'قمصان النوم', 'nuisettes', 'Vêtements de nuit élégants et confortables', 'ملابس نوم أنيقة ومريحة', true, 4),
(5, 'Bodies', 'البوديات', 'bodies', 'Bodies sexy et confortables pour toutes occasions', 'بوديات مثيرة ومريحة لجميع المناسبات', true, 5),
(6, 'Lingerie Sexy', 'ملابس داخلية مثيرة', 'lingerie-sexy', 'Collection sensuelle pour moments intimes', 'مجموعة حسية للحظات الحميمة', true, 6),
(7, 'Sport & Confort', 'رياضة وراحة', 'sport-confort', 'Lingerie de sport et de détente', 'ملابس داخلية رياضية وللاسترخاء', true, 7),
(8, 'Grandes Tailles', 'مقاسات كبيرة', 'grandes-tailles', 'Lingerie pour femmes aux formes généreuses', 'ملابس داخلية للنساء ذوات الأشكال السخية', true, 8);

-- ============================================
-- PRODUCTS FOR LINGERIE STORE
-- ============================================

INSERT INTO products (id, name, name_ar, slug, description, description_ar, price, compare_at_price, cost_price, sku, category_id, stock_quantity, low_stock_threshold, weight, dimensions, is_active, is_featured, sort_order, tags, meta_title, meta_description, created_at, updated_at) VALUES

-- Soutiens-gorge
(1, 'Soutien-gorge Push-up Dentelle Rose', 'حمالة صدر بوش أب دانتيل وردي', 'soutien-gorge-push-up-dentelle-rose', 
 'Soutien-gorge push-up en dentelle délicate avec armatures pour un maintien parfait et un décolleté sublimé. Disponible du 85A au 100D.', 
 'حمالة صدر بوش أب من الدانتيل الرقيق مع أسلاك للحصول على دعم مثالي وإطلالة رائعة للصدر. متوفرة من 85A إلى 100D.',
 45.99, 59.99, 22.00, 'BRA-PU-LACE-001', 1, 25, 5, 0.15, '{"length": 25, "width": 20, "height": 5}', true, true, 1,
 '["push-up", "dentelle", "armatures", "confort", "séduction"]',
 'Soutien-gorge Push-up Dentelle Rose - Confort et Séduction',
 'Découvrez notre soutien-gorge push-up en dentelle rose, alliant confort et élégance pour sublimer votre silhouette.',
 NOW(), NOW()),

(2, 'Soutien-gorge Sans Armatures Coton Bio', 'حمالة صدر بدون أسلاك قطن عضوي', 'soutien-gorge-sans-armatures-coton-bio',
 'Soutien-gorge ultra-confortable en coton biologique, sans armatures, parfait pour le quotidien. Respirant et hypoallergénique.',
 'حمالة صدر مريحة جداً من القطن العضوي، بدون أسلاك، مثالية للاستخدام اليومي. قابلة للتنفس ومضادة للحساسية.',
 35.99, 45.99, 18.00, 'BRA-WF-COT-002', 1, 30, 8, 0.12, '{"length": 24, "width": 18, "height": 4}', true, true, 2,
 '["sans-armatures", "coton-bio", "confort", "quotidien", "respirant"]',
 'Soutien-gorge Sans Armatures Coton Bio - Confort Naturel',
 'Soutien-gorge en coton bio sans armatures, pour un confort absolu au quotidien.',
 NOW(), NOW()),

(3, 'Soutien-gorge Sport Performance', 'حمالة صدر رياضية الأداء', 'soutien-gorge-sport-performance',
 'Soutien-gorge de sport haute performance avec support optimal. Évacuation de l''humidité et maintien exceptionnel.',
 'حمالة صدر رياضية عالية الأداء مع دعم أمثل. إزالة الرطوبة والحفاظ على الشكل بشكل استثنائي.',
 39.99, 49.99, 20.00, 'BRA-SP-PERF-003', 7, 20, 5, 0.18, '{"length": 26, "width": 22, "height": 6}', true, false, 3,
 '["sport", "performance", "support", "respirant", "running"]',
 'Soutien-gorge Sport Performance - Support Optimal',
 'Soutien-gorge de sport haute performance pour vos entraînements les plus intenses.',
 NOW(), NOW()),

-- Culottes & Slips
(4, 'Culotte Taille Haute Dentelle Noire', 'سروال عالي الخصر دانتيل أسود', 'culotte-taille-haute-dentelle-noire',
 'Culotte taille haute en dentelle française, coupe flatteuse et confort optimal. Finitions invisibles sous les vêtements.',
 'سروال عالي الخصر من الدانتيل الفرنسي، قصة جذابة وراحة مثلى. لمسات نهائية غير مرئية تحت الملابس.',
 29.99, 39.99, 15.00, 'PANT-HW-LACE-004', 2, 35, 8, 0.08, '{"length": 20, "width": 15, "height": 2}', true, true, 1,
 '["taille-haute", "dentelle", "confort", "invisible", "sexy"]',
 'Culotte Taille Haute Dentelle Noire - Élégance et Confort',
 'Culotte taille haute en dentelle noire, parfaite pour un look élégant et confortable.',
 NOW(), NOW()),

(5, 'String Microfibre Nude', 'سترينغ مايكروفايبر نود', 'string-microfibre-nude',
 'String en microfibre ultra-douce, invisible sous les vêtements. Coupe classique et confort longue durée.',
 'سترينغ من المايكروفايبر فائق النعومة، غير مرئي تحت الملابس. قصة كلاسيكية وراحة طويلة المدى.',
 19.99, 24.99, 10.00, 'PANT-TH-MIC-005', 2, 40, 10, 0.05, '{"length": 18, "width": 12, "height": 1}', true, false, 2,
 '["string", "microfibre", "invisible", "nude", "quotidien"]',
 'String Microfibre Nude - Invisible et Confortable',
 'String en microfibre nude, invisible sous vos vêtements pour un confort discret.',
 NOW(), NOW()),

-- Ensembles
(6, 'Ensemble Push-up Dentelle Rouge Passion', 'طقم بوش أب دانتيل أحمر عاطفي', 'ensemble-push-up-dentelle-rouge-passion',
 'Ensemble soutien-gorge push-up et culotte assortie en dentelle rouge. Parfait pour les occasions spéciales.',
 'طقم حمالة صدر بوش أب وسروال متناسق من الدانتيل الأحمر. مثالي للمناسبات الخاصة.',
 69.99, 89.99, 35.00, 'SET-PU-LACE-006', 3, 15, 3, 0.25, '{"length": 30, "width": 25, "height": 8}', true, true, 1,
 '["ensemble", "push-up", "dentelle", "rouge", "séduction", "cadeau"]',
 'Ensemble Lingerie Rouge Passion - Séduction Garantie',
 'Ensemble lingerie en dentelle rouge passion, pour des moments inoubliables.',
 NOW(), NOW()),

(7, 'Ensemble Coton Bio Blanc Naturel', 'طقم قطن عضوي أبيض طبيعي', 'ensemble-coton-bio-blanc-naturel',
 'Ensemble soutien-gorge sans armatures et culotte en coton biologique. Douceur et respect de la peau.',
 'طقم حمالة صدر بدون أسلاك وسروال من القطن العضوي. نعومة واحترام للبشرة.',
 59.99, 74.99, 30.00, 'SET-ORG-COT-007', 3, 18, 4, 0.22, '{"length": 28, "width": 23, "height": 7}', true, false, 2,
 '["ensemble", "coton-bio", "naturel", "sans-armatures", "confort"]',
 'Ensemble Coton Bio Blanc - Confort Naturel',
 'Ensemble en coton bio blanc, pour un confort naturel au quotidien.',
 NOW(), NOW()),

-- Nuisettes
(8, 'Nuisette Satin Noir Élégante', 'قميص نوم ساتان أسود أنيق', 'nuisette-satin-noir-elegante',
 'Nuisette en satin luxueux avec broderies délicates. Coupe fluide et tombé parfait pour des nuits glamour.',
 'قميص نوم من الساتان الفاخر مع تطريز رقيق. قصة انسيابية وتدلي مثالي لليالي الساحرة.',
 79.99, 99.99, 40.00, 'NIGHT-SAT-BLK-008', 4, 12, 3, 0.30, '{"length": 35, "width": 30, "height": 10}', true, true, 1,
 '["nuisette", "satin", "élégante", "broderies", "glamour"]',
 'Nuisette Satin Noir Élégante - Nuits Glamour',
 'Nuisette en satin noir avec broderies, pour des nuits pleines d''élégance.',
 NOW(), NOW()),

-- Bodies
(9, 'Body Dentelle Transparent Blanc', 'بودي دانتيل شفاف أبيض', 'body-dentelle-transparent-blanc',
 'Body en dentelle transparente avec fermeture pression. Design sensuel et coupe ajustée pour sublimer la silhouette.',
 'بودي من الدانتيل الشفاف مع إغلاق بكبسة. تصميم حسي وقصة مناسبة لإبراز الشكل.',
 55.99, 69.99, 28.00, 'BODY-LACE-WHT-009', 5, 20, 5, 0.20, '{"length": 32, "width": 28, "height": 5}', true, false, 1,
 '["body", "dentelle", "transparent", "sensuel", "fermeture-pression"]',
 'Body Dentelle Transparent Blanc - Sensualité Pure',
 'Body en dentelle transparente blanche, pour une sensualité raffinée.',
 NOW(), NOW()),

-- Lingerie Sexy
(10, 'Porte-jarretelles Satin Rouge', 'حزام الجورب ساتان أحمر', 'porte-jarretelles-satin-rouge',
 'Porte-jarretelles en satin rouge avec jarretelles ajustables. Accessoire indispensable pour les tenues sexy.',
 'حزام جورب من الساتان الأحمر مع أربطة قابلة للتعديل. إكسسوار أساسي للإطلالات المثيرة.',
 39.99, 49.99, 20.00, 'GARTER-SAT-RED-010', 6, 10, 2, 0.15, '{"length": 25, "width": 20, "height": 3}', true, true, 1,
 '["porte-jarretelles", "satin", "rouge", "sexy", "ajustable"]',
 'Porte-jarretelles Satin Rouge - Séduction Ultime',
 'Porte-jarretelles en satin rouge, pour une séduction irrésistible.',
 NOW(), NOW()),

-- Grandes Tailles
(11, 'Soutien-gorge Grande Taille Dentelle Beige', 'حمالة صدر مقاس كبير دانتيل بيج', 'soutien-gorge-grande-taille-dentelle-beige',
 'Soutien-gorge spécialement conçu pour les grandes tailles (95C à 110F). Support optimal et confort toute la journée.',
 'حمالة صدر مصممة خصيصاً للمقاسات الكبيرة (95C إلى 110F). دعم أمثل وراحة طوال اليوم.',
 59.99, 74.99, 30.00, 'BRA-PLU-LACE-011', 8, 15, 3, 0.25, '{"length": 35, "width": 30, "height": 8}', true, false, 1,
 '["grandes-tailles", "support", "dentelle", "confort", "maintien"]',
 'Soutien-gorge Grande Taille - Support et Élégance',
 'Soutien-gorge grande taille en dentelle, conçu pour un support optimal.',
 NOW(), NOW()),

(12, 'Culotte Grande Taille Coton Doux', 'سروال مقاس كبير قطن ناعم', 'culotte-grande-taille-coton-doux',
 'Culotte grande taille en coton extra-doux. Ceinture élastique confortable et coupe flatteuse.',
 'سروال مقاس كبير من القطن فائق النعومة. حزام مطاطي مريح وقصة جذابة.',
 34.99, 44.99, 17.50, 'PANT-PLU-COT-012', 8, 25, 5, 0.12, '{"length": 25, "width": 20, "height": 3}', true, false, 2,
 '["grandes-tailles", "coton", "confort", "élastique", "flatteuse"]',
 'Culotte Grande Taille Coton - Confort Absolu',
 'Culotte grande taille en coton doux, pour un confort sans compromis.',
 NOW(), NOW());

-- ============================================
-- PRODUCT IMAGES
-- ============================================

INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order) VALUES
-- Images pour soutien-gorge push-up dentelle rose
(1, 'https://images.unsplash.com/photo-1566479179817-c5d83fce1d31?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'Soutien-gorge push-up dentelle rose vue de face', true, 1),
(1, 'https://images.unsplash.com/photo-1566414033969-a4f2c34b0c20?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'Soutien-gorge push-up dentelle rose vue de dos', false, 2),

-- Images pour soutien-gorge coton bio
(2, 'https://images.unsplash.com/photo-1558021211-9d60e9f741c0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'Soutien-gorge coton bio sans armatures', true, 1),

-- Images pour soutien-gorge sport
(3, 'https://images.unsplash.com/photo-1512696797580-35e5ac73b69e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'Soutien-gorge sport performance', true, 1),

-- Images pour culotte taille haute
(4, 'https://images.unsplash.com/photo-1566479179817-c5d83fce1d31?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'Culotte taille haute dentelle noire', true, 1),

-- Images pour string microfibre
(5, 'https://images.unsplash.com/photo-1558021211-9d60e9f741c0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'String microfibre nude', true, 1),

-- Images pour ensemble rouge
(6, 'https://images.unsplash.com/photo-1566414033969-a4f2c34b0c20?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'Ensemble push-up dentelle rouge', true, 1),

-- Images pour ensemble coton bio
(7, 'https://images.unsplash.com/photo-1512696797580-35e5ac73b69e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'Ensemble coton bio blanc', true, 1),

-- Images pour nuisette satin
(8, 'https://images.unsplash.com/photo-1566479179817-c5d83fce1d31?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'Nuisette satin noir élégante', true, 1),

-- Images pour body dentelle
(9, 'https://images.unsplash.com/photo-1558021211-9d60e9f741c0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'Body dentelle transparent blanc', true, 1),

-- Images pour porte-jarretelles
(10, 'https://images.unsplash.com/photo-1566414033969-a4f2c34b0c20?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'Porte-jarretelles satin rouge', true, 1),

-- Images pour grande taille bra
(11, 'https://images.unsplash.com/photo-1512696797580-35e5ac73b69e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'Soutien-gorge grande taille dentelle beige', true, 1),

-- Images pour grande taille culotte
(12, 'https://images.unsplash.com/photo-1566479179817-c5d83fce1d31?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'Culotte grande taille coton doux', true, 1);

-- ============================================
-- PRODUCT VARIANTS (Tailles et Couleurs)
-- ============================================

INSERT INTO product_variants (product_id, size, color, color_ar, price, stock_quantity, is_available, sku_variant) VALUES
-- Variants pour soutien-gorge push-up dentelle rose
(1, '85A', 'Rose', 'وردي', 45.99, 5, true, 'BRA-PU-LACE-001-85A-ROSE'),
(1, '85B', 'Rose', 'وردي', 45.99, 4, true, 'BRA-PU-LACE-001-85B-ROSE'),
(1, '90B', 'Rose', 'وردي', 45.99, 6, true, 'BRA-PU-LACE-001-90B-ROSE'),
(1, '90C', 'Rose', 'وردي', 45.99, 5, true, 'BRA-PU-LACE-001-90C-ROSE'),
(1, '95C', 'Rose', 'وردي', 45.99, 5, true, 'BRA-PU-LACE-001-95C-ROSE'),

-- Variants pour culotte taille haute dentelle noire
(4, 'S', 'Noir', 'أسود', 29.99, 8, true, 'PANT-HW-LACE-004-S-NOIR'),
(4, 'M', 'Noir', 'أسود', 29.99, 10, true, 'PANT-HW-LACE-004-M-NOIR'),
(4, 'L', 'Noir', 'أسود', 29.99, 9, true, 'PANT-HW-LACE-004-L-NOIR'),
(4, 'XL', 'Noir', 'أسود', 29.99, 8, true, 'PANT-HW-LACE-004-XL-NOIR'),

-- Variants pour string microfibre nude
(5, 'S', 'Nude', 'نود', 19.99, 10, true, 'PANT-TH-MIC-005-S-NUDE'),
(5, 'M', 'Nude', 'نود', 19.99, 15, true, 'PANT-TH-MIC-005-M-NUDE'),
(5, 'L', 'Nude', 'نود', 19.99, 10, true, 'PANT-TH-MIC-005-L-NUDE'),
(5, 'XL', 'Nude', 'نود', 19.99, 5, true, 'PANT-TH-MIC-005-XL-NUDE');

-- ============================================
-- SAMPLE CUSTOMERS
-- ============================================

INSERT INTO customers (id, name, email, phone, platform, platform_id, profile_data, language_preference, total_orders, total_spent, is_vip, created_at, updated_at) VALUES
(1, 'Amina Benali', 'amina.benali@email.com', '+33123456789', 'messenger', 'messenger_001', 
 '{"first_name": "Amina", "last_name": "Benali", "locale": "fr_FR"}', 'fr', 3, 135.97, false, NOW(), NOW()),
(2, 'Sarah Dubois', 'sarah.dubois@email.com', '+33987654321', 'whatsapp', 'whatsapp_002',
 '{"name": "Sarah Dubois", "phone": "+33987654321"}', 'fr', 1, 69.99, false, NOW(), NOW()),
(3, 'Fatima Al-Zahra', 'fatima.alzahra@email.com', '+212612345678', 'messenger', 'messenger_003',
 '{"first_name": "Fatima", "last_name": "Al-Zahra", "locale": "ar_AR"}', 'ar', 5, 289.95, true, NOW(), NOW());

-- ============================================
-- SAMPLE ORDERS
-- ============================================

INSERT INTO orders (id, order_number, customer_id, platform_type, total_amount, status, payment_status, shipping_address, wilaya, notes, created_at, updated_at) VALUES
(1, 'ORD-LNG-001', 1, 'messenger', 75.98, 'confirmed', 'paid', '123 Rue de la Paix, Paris', 'Paris', 'Commande pour ensemble rouge', NOW() - INTERVAL '2 days', NOW()),
(2, 'ORD-LNG-002', 2, 'whatsapp', 69.99, 'pending_confirmation', 'pending', '456 Avenue des Champs, Lyon', 'Rhône', 'Première commande cliente', NOW() - INTERVAL '1 day', NOW()),
(3, 'ORD-LNG-003', 3, 'messenger', 95.98, 'shipped', 'paid', '789 Boulevard Mohammed V, Casablanca', 'Casablanca', 'Commande VIP - livraison express', NOW() - INTERVAL '5 days', NOW());

-- ============================================
-- ORDER ITEMS
-- ============================================

INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price, variant_info) VALUES
-- Order 1 items
(1, 6, 1, 69.99, 69.99, '{"size": "90B", "color": "Rouge"}'),
(1, 4, 1, 29.99, 29.99, '{"size": "M", "color": "Noir"}'),

-- Order 2 items  
(2, 6, 1, 69.99, 69.99, '{"size": "85B", "color": "Rouge"}'),

-- Order 3 items
(3, 1, 1, 45.99, 45.99, '{"size": "95C", "color": "Rose"}'),
(3, 8, 1, 79.99, 79.99, '{"size": "M", "color": "Noir"}');

-- ============================================
-- INVENTORY TRANSACTIONS
-- ============================================

INSERT INTO inventory_transactions (product_id, transaction_type, quantity_change, old_quantity, new_quantity, reference_type, reference_id, notes, created_by) VALUES
-- Initial stock setup
(1, 'adjustment', 25, 0, 25, 'manual', NULL, 'Stock initial - Soutien-gorge push-up dentelle rose', 'admin'),
(2, 'adjustment', 30, 0, 30, 'manual', NULL, 'Stock initial - Soutien-gorge coton bio', 'admin'),
(3, 'adjustment', 20, 0, 20, 'manual', NULL, 'Stock initial - Soutien-gorge sport', 'admin'),
(4, 'adjustment', 35, 0, 35, 'manual', NULL, 'Stock initial - Culotte dentelle noire', 'admin'),
(5, 'adjustment', 40, 0, 40, 'manual', NULL, 'Stock initial - String microfibre nude', 'admin'),

-- Sales transactions
(6, 'sale', -2, 17, 15, 'order', 1, 'Vente ordre ORD-LNG-001', 'system'),
(6, 'sale', -1, 16, 15, 'order', 2, 'Vente ordre ORD-LNG-002', 'system'),
(1, 'sale', -1, 26, 25, 'order', 3, 'Vente ordre ORD-LNG-003', 'system'),
(8, 'sale', -1, 13, 12, 'order', 3, 'Vente ordre ORD-LNG-003', 'system');

-- ============================================
-- CUSTOMER INTERACTIONS LOG
-- ============================================

INSERT INTO customer_interactions (customer_id, platform_type, interaction_type, message, ai_response, products_mentioned, sentiment, language, thread_id) VALUES
(1, 'messenger', 'message', 'Bonjour, je cherche un ensemble de lingerie rouge pour une occasion spéciale', 
 'Bonjour ! Parfait timing ! Je vous recommande notre Ensemble Push-up Dentelle Rouge Passion à 69.99€. Il est parfait pour les occasions spéciales avec son soutien-gorge push-up et sa culotte assortie en dentelle rouge. Voulez-vous connaître les tailles disponibles ?',
 '[6]', 'positive', 'fr', 'thread_001'),

(2, 'whatsapp', 'message', 'Je voudrais voir vos soutiens-gorge de sport',
 'Excellent choix ! Notre Soutien-gorge Sport Performance à 39.99€ offre un support optimal avec évacuation de l''humidité. Parfait pour tous vos entraînements. Quelle taille vous intéresse ?',
 '[3]', 'neutral', 'fr', 'thread_002'),

(3, 'messenger', 'message', 'أريد طقم ملابس داخلية أنيق وجميل',
 'أهلاً وسهلاً! أنصحك بطقم البوش أب الدانتيل الأحمر العاطفي بـ 69.99€. إنه مثالي للمناسبات الخاصة مع حمالة صدر بوش أب وسروال متناسق من الدانتيل الأحمر. هل تودين معرفة المقاسات المتوفرة؟',
 '[6]', 'positive', 'ar', 'thread_003');

-- ============================================
-- ANALYTICS DATA
-- ============================================

INSERT INTO sales_analytics (date, platform_type, total_orders, total_revenue, new_customers, returning_customers, avg_order_value, top_product_id, top_category_id) VALUES
(CURRENT_DATE - INTERVAL '5 days', 'messenger', 1, 95.98, 0, 1, 95.98, 6, 3),
(CURRENT_DATE - INTERVAL '2 days', 'messenger', 1, 75.98, 0, 1, 75.98, 6, 3),
(CURRENT_DATE - INTERVAL '1 day', 'whatsapp', 1, 69.99, 1, 0, 69.99, 6, 3),
(CURRENT_DATE, 'messenger', 0, 0.00, 0, 0, 0.00, NULL, NULL),
(CURRENT_DATE, 'whatsapp', 0, 0.00, 0, 0, 0.00, NULL, NULL);

-- ============================================
-- UPDATE SEQUENCES
-- ============================================

-- Update sequences to avoid conflicts
SELECT setval('categories_id_seq', (SELECT MAX(id) FROM categories));
SELECT setval('products_id_seq', (SELECT MAX(id) FROM products));
SELECT setval('customers_id_seq', (SELECT MAX(id) FROM customers));
SELECT setval('orders_id_seq', (SELECT MAX(id) FROM orders));

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Verify data insertion
DO $$
BEGIN
    RAISE NOTICE 'Données insérées avec succès:';
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
    RAISE NOTICE 'Vous pouvez maintenant tester votre agent de vente.';
END $$; 