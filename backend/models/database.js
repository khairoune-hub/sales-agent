import { v4 as uuidv4 } from 'uuid';

// In-memory database (replace with real database in production)
export const database = {
    products: new Map(),
    orders: new Map(),
    customers: new Map(),
    chatThreads: new Map(),
    analytics: {
        dailySales: new Map(),
        productViews: new Map(),
        customerInteractions: new Map()
    }
};

// Bio Products Data
export const bioProductsData = {
    'poudre-proteinee-bio': {
        id: 'poudre-proteinee-bio',
        name: 'X Poudre de Protéines Bio (Vanille)',
        nameAr: 'مسحوق البروتين العضوي بالفانيليا',
        price: 45.99,
        stock: 25,
        category: 'Compléments',
        categoryAr: 'مكملات غذائية',
        description: 'Poudre de protéines biologiques de haute qualité, parfaite pour la récupération musculaire.',
        descriptionAr: 'مسحوق بروتين عضوي عالي الجودة، مثالي لاستعادة العضلات.',
        image: '/images/protein-powder.jpg',
        benefits: ['Récupération musculaire', 'Source de protéines complètes', '100% biologique'],
        benefitsAr: ['استعادة العضلات', 'مصدر بروتين كامل', '100% عضوي'],
        ingredients: 'Protéines de pois biologiques, arôme naturel de vanille',
        ingredientsAr: 'بروتين البازلاء العضوي، نكهة الفانيليا الطبيعية',
        usage: '1-2 cuillères par jour mélangées dans de l\'eau ou du lait',
        usageAr: 'ملعقة إلى ملعقتين يومياً مخلوطة بالماء أو الحليب',
        weight: '500g',
        createdAt: new Date('2024-01-01').toISOString(),
        updatedAt: new Date().toISOString()
    },
    'the-vert-biologique': {
        id: 'the-vert-biologique',
        name: 'X Thé Vert Biologique (50 sachets)',
        nameAr: 'الشاي الأخضر العضوي (50 كيس)',
        price: 18.99,
        stock: 40,
        category: 'Boissons',
        categoryAr: 'مشروبات',
        description: 'Thé vert biologique premium, riche en antioxydants naturels.',
        descriptionAr: 'شاي أخضر عضوي فاخر، غني بمضادات الأكسدة الطبيعية.',
        image: '/images/green-tea.jpg',
        benefits: ['Riche en antioxydants', 'Boost métabolisme', 'Détoxification naturelle'],
        benefitsAr: ['غني بمضادات الأكسدة', 'يعزز الأيض', 'تطهير طبيعي'],
        ingredients: 'Feuilles de thé vert biologiques',
        ingredientsAr: 'أوراق الشاي الأخضر العضوي',
        usage: '1-3 tasses par jour, infuser 3-5 minutes',
        usageAr: '1-3 أكواب يومياً، ينقع لمدة 3-5 دقائق',
        weight: '100g (50 sachets)',
        createdAt: new Date('2024-01-01').toISOString(),
        updatedAt: new Date().toISOString()
    },
    'multivitamines-bio': {
        id: 'multivitamines-bio',
        name: 'X Complexe Multivitamines Bio',
        nameAr: 'مجمع الفيتامينات العضوي',
        price: 32.99,
        stock: 15,
        category: 'Compléments',
        categoryAr: 'مكملات غذائية',
        description: 'Complexe complet de vitamines et minéraux essentiels d\'origine biologique.',
        descriptionAr: 'مجمع كامل من الفيتامينات والمعادن الأساسية من مصدر عضوي.',
        image: '/images/multivitamins.jpg',
        benefits: ['Support immunitaire', 'Énergie naturelle', 'Santé générale'],
        benefitsAr: ['دعم المناعة', 'طاقة طبيعية', 'صحة عامة'],
        ingredients: 'Vitamines A, C, D, E, B-complex, minéraux essentiels',
        ingredientsAr: 'فيتامينات أ، ج، د، هـ، مجموعة ب، معادن أساسية',
        usage: '1 comprimé par jour avec un repas',
        usageAr: 'قرص واحد يومياً مع الطعام',
        weight: '60 comprimés',
        createdAt: new Date('2024-01-01').toISOString(),
        updatedAt: new Date().toISOString()
    },
    'miel-biologique': {
        id: 'miel-biologique',
        name: 'X Miel Pur Biologique (500g)',
        nameAr: 'العسل الطبيعي العضوي (500 جرام)',
        price: 24.99,
        stock: 30,
        category: 'Alimentation',
        categoryAr: 'غذاء',
        description: 'Miel pur et naturel, récolté de ruches biologiques certifiées.',
        descriptionAr: 'عسل طبيعي خالص، مُحصد من خلايا نحل عضوية معتمدة.',
        image: '/images/honey.jpg',
        benefits: ['Antibactérien naturel', 'Source d\'énergie', 'Propriétés curatives'],
        benefitsAr: ['مضاد بكتيري طبيعي', 'مصدر طاقة', 'خصائص علاجية'],
        ingredients: 'Miel pur 100% biologique',
        ingredientsAr: 'عسل طبيعي 100% عضوي',
        usage: '1-2 cuillères à café par jour',
        usageAr: 'ملعقة إلى ملعقتين صغيرتين يومياً',
        weight: '500g',
        createdAt: new Date('2024-01-01').toISOString(),
        updatedAt: new Date().toISOString()
    },
    'omega3-bio': {
        id: 'omega3-bio',
        name: 'X Huile de Poisson Oméga-3 Bio',
        nameAr: 'زيت السمك أوميغا-3 العضوي',
        price: 28.99,
        stock: 24,
        category: 'Compléments',
        categoryAr: 'مكملات غذائية',
        description: 'Huile de poisson riche en acides gras oméga-3 EPA et DHA.',
        descriptionAr: 'زيت السمك الغني بأحماض أوميغا-3 الدهنية EPA و DHA.',
        image: '/images/omega3.jpg',
        benefits: ['Santé cardiovasculaire', 'Fonction cérébrale', 'Anti-inflammatoire'],
        benefitsAr: ['صحة القلب والأوعية', 'وظائف الدماغ', 'مضاد للالتهاب'],
        ingredients: 'Huile de poisson purifiée, vitamine E',
        ingredientsAr: 'زيت السمك المنقى، فيتامين هـ',
        usage: '1-2 capsules par jour avec les repas',
        usageAr: 'كبسولة إلى كبسولتين يومياً مع الطعام',
        weight: '60 capsules',
        createdAt: new Date('2024-01-01').toISOString(),
        updatedAt: new Date().toISOString()
    },
    'huile-noix-coco-biologique': {
        id: 'huile-noix-coco-biologique',
        name: 'X Huile de Noix de Coco Biologique (500ml)',
        nameAr: 'زيت جوز الهند العضوي (500 مل)',
        price: 22.99,
        stock: 35,
        category: 'Alimentation',
        categoryAr: 'غذاء',
        description: 'Huile de coco vierge pressée à froid, idéale pour la cuisine et les soins.',
        descriptionAr: 'زيت جوز الهند البكر المعصور على البارد، مثالي للطبخ والعناية.',
        image: '/images/coconut-oil.jpg',
        benefits: ['MCT naturels', 'Polyvalent', 'Propriétés antimicrobiennes'],
        benefitsAr: ['MCT طبيعية', 'متعدد الاستخدامات', 'خصائص مضادة للميكروبات'],
        ingredients: 'Huile de noix de coco vierge 100% biologique',
        ingredientsAr: 'زيت جوز الهند البكر 100% عضوي',
        usage: 'Cuisine, soins de la peau et des cheveux',
        usageAr: 'للطبخ وعناية البشرة والشعر',
        weight: '500ml',
        createdAt: new Date('2024-01-01').toISOString(),
        updatedAt: new Date().toISOString()
    },
    'spiruline-bio': {
        id: 'spiruline-bio',
        name: 'X Comprimés de Spiruline Bio',
        nameAr: 'أقراص السبيرولينا العضوية',
        price: 35.99,
        stock: 18,
        category: 'Compléments',
        categoryAr: 'مكملات غذائية',
        description: 'Spiruline biologique, super-aliment riche en protéines et nutriments.',
        descriptionAr: 'سبيرولينا عضوية، غذاء فائق غني بالبروتينات والعناصر الغذائية.',
        image: '/images/spirulina.jpg',
        benefits: ['Protéines complètes', 'Détoxification', 'Boost énergétique'],
        benefitsAr: ['بروتينات كاملة', 'تطهير الجسم', 'زيادة الطاقة'],
        ingredients: 'Spiruline biologique pure (Arthrospira platensis)',
        ingredientsAr: 'سبيرولينا عضوية خالصة',
        usage: '3-6 comprimés par jour avec de l\'eau',
        usageAr: '3-6 أقراص يومياً مع الماء',
        weight: '120 comprimés',
        createdAt: new Date('2024-01-01').toISOString(),
        updatedAt: new Date().toISOString()
    },
    'graines-chia-biologiques': {
        id: 'graines-chia-biologiques',
        name: 'X Graines de Chia Biologiques (250g)',
        nameAr: 'بذور الشيا العضوية (250 جرام)',
        price: 16.99,
        stock: 45,
        category: 'Alimentation',
        categoryAr: 'غذاء',
        description: 'Graines de chia biologiques, riches en oméga-3, fibres et protéines.',
        descriptionAr: 'بذور الشيا العضوية، غنية بأوميغا-3 والألياف والبروتينات.',
        image: '/images/chia-seeds.jpg',
        benefits: ['Oméga-3 végétal', 'Fibres solubles', 'Protéines végétales'],
        benefitsAr: ['أوميغا-3 نباتي', 'ألياف قابلة للذوبان', 'بروتينات نباتية'],
        ingredients: 'Graines de chia biologiques 100%',
        ingredientsAr: 'بذور الشيا العضوية 100%',
        usage: '1-2 cuillères à soupe par jour dans smoothies, yaourts ou salades',
        usageAr: 'ملعقة إلى ملعقتين كبيرتين يومياً في العصائر أو الزبادي أو السلطات',
        weight: '250g',
        createdAt: new Date('2024-01-01').toISOString(),
        updatedAt: new Date().toISOString()
    }
};

// Initialize products in database
Object.values(bioProductsData).forEach(product => {
    database.products.set(product.id, product);
});

// Database utility functions
export const dbUtils = {
    // Products
    getAllProducts: () => Array.from(database.products.values()),
    
    getProductById: (id) => database.products.get(id),
    
    searchProducts: (query) => {
        const searchTerm = query.toLowerCase();
        return Array.from(database.products.values()).filter(product =>
            product.name.toLowerCase().includes(searchTerm) ||
            product.nameAr.includes(searchTerm) ||
            product.description.toLowerCase().includes(searchTerm) ||
            product.descriptionAr.includes(searchTerm) ||
            product.category.toLowerCase().includes(searchTerm) ||
            product.categoryAr.includes(searchTerm)
        );
    },
    
    getProductsByCategory: (category) => {
        return Array.from(database.products.values()).filter(product =>
            product.category.toLowerCase() === category.toLowerCase() ||
            product.categoryAr === category
        );
    },
    
    updateProductStock: (productId, newStock) => {
        const product = database.products.get(productId);
        if (product) {
            product.stock = newStock;
            product.updatedAt = new Date().toISOString();
            database.products.set(productId, product);
            return true;
        }
        return false;
    },
    
    // Orders
    createOrder: (orderData) => {
        const orderId = uuidv4();
        const order = {
            id: orderId,
            ...orderData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'pending'
        };
        database.orders.set(orderId, order);
        
        // Update analytics
        const today = new Date().toDateString();
        const currentSales = database.analytics.dailySales.get(today) || 0;
        database.analytics.dailySales.set(today, currentSales + order.totalAmount);
        
        return order;
    },
    
    getAllOrders: () => Array.from(database.orders.values()),
    
    getOrderById: (id) => database.orders.get(id),
    
    updateOrder: (id, updateData) => {
        const order = database.orders.get(id);
        if (order) {
            const updatedOrder = {
                ...order,
                ...updateData,
                updatedAt: new Date().toISOString()
            };
            database.orders.set(id, updatedOrder);
            return updatedOrder;
        }
        return null;
    },
    
    deleteOrder: (id) => {
        return database.orders.delete(id);
    },
    
    // Customers
    createCustomer: (customerData) => {
        const customerId = uuidv4();
        const customer = {
            id: customerId,
            ...customerData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        database.customers.set(customerId, customer);
        return customer;
    },
    
    getAllCustomers: () => Array.from(database.customers.values()),
    
    getCustomerById: (id) => database.customers.get(id),
    
    getCustomerByPhone: (phone) => {
        return Array.from(database.customers.values()).find(customer => 
            customer.phone === phone
        );
    },
    
    updateCustomer: (id, updateData) => {
        const customer = database.customers.get(id);
        if (customer) {
            const updatedCustomer = {
                ...customer,
                ...updateData,
                updatedAt: new Date().toISOString()
            };
            database.customers.set(id, updatedCustomer);
            return updatedCustomer;
        }
        return null;
    },
    
    // Chat Threads
    createChatThread: (threadData) => {
        const threadId = uuidv4();
        const thread = {
            id: threadId,
            ...threadData,
            messages: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        database.chatThreads.set(threadId, thread);
        return thread;
    },
    
    getChatThread: (id) => database.chatThreads.get(id),
    
    updateChatThread: (id, updateData) => {
        const thread = database.chatThreads.get(id);
        if (thread) {
            const updatedThread = {
                ...thread,
                ...updateData,
                updatedAt: new Date().toISOString()
            };
            database.chatThreads.set(id, updatedThread);
            return updatedThread;
        }
        return null;
    },
    
    addMessageToThread: (threadId, message) => {
        const thread = database.chatThreads.get(threadId);
        if (thread) {
            thread.messages.push({
                id: uuidv4(),
                ...message,
                timestamp: new Date().toISOString()
            });
            thread.updatedAt = new Date().toISOString();
            database.chatThreads.set(threadId, thread);
            return thread;
        }
        return null;
    },
    
    // Analytics
    getDailySales: () => Object.fromEntries(database.analytics.dailySales),
    
    getProductViews: () => Object.fromEntries(database.analytics.productViews),
    
    incrementProductView: (productId) => {
        const currentViews = database.analytics.productViews.get(productId) || 0;
        database.analytics.productViews.set(productId, currentViews + 1);
    },
    
    // Categories
    getCategories: () => {
        const categories = new Set();
        Array.from(database.products.values()).forEach(product => {
            categories.add(product.category);
        });
        return Array.from(categories);
    },

    // Chat Interactions Logging
    logInteraction: (interactionData) => {
        const interactionId = uuidv4();
        const interaction = {
            id: interactionId,
            ...interactionData,
            timestamp: interactionData.timestamp || new Date().toISOString()
        };
        
        // Store in analytics for tracking
        const today = new Date().toDateString();
        if (!database.analytics.customerInteractions.has(today)) {
            database.analytics.customerInteractions.set(today, []);
        }
        database.analytics.customerInteractions.get(today).push(interaction);
        
        return interaction;
    },

    // Get chat history for a thread
    getChatHistory: (threadId) => {
        // Get interactions for this thread from analytics
        const allInteractions = [];
        for (const [date, interactions] of database.analytics.customerInteractions.entries()) {
            const threadInteractions = interactions.filter(interaction => 
                interaction.threadId === threadId
            );
            allInteractions.push(...threadInteractions);
        }
        
        // Sort by timestamp
        return allInteractions.sort((a, b) => 
            new Date(a.timestamp) - new Date(b.timestamp)
        );
    },

    // Aliases for OpenAI service compatibility
    addCustomer: function(customerData) {
        return this.createCustomer(customerData);
    },

    addOrder: function(orderData) {
        return this.createOrder(orderData);
    }
};

export default database; 