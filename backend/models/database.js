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