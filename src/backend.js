// Lingerie Store Products Sales Agent - Cloudflare Worker Backend
// Pure API backend for bio products sales

import { OpenAI } from 'openai';
import { createClient } from '@supabase/supabase-js';
import { SYSTEM_CONTEXT } from './SYSTEM_CONTEXT.js';

// Assistant configuration
const ASSISTANT_ID = process.env.ASSISTANT_ID || 'asst_0nGWVax2ikC68QVBvZMLPVlQ';

// Initialize Supabase client for product data
let supabaseClient = null;
const getSupabaseClient = (env) => {
    if (!supabaseClient && env.SUPABASE_URL && env.SUPABASE_SERVICE_KEY) {
        supabaseClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);
    }
    return supabaseClient;
};

// Fetch products from database
async function fetchProductsFromDatabase(env) {
    const supabase = getSupabaseClient(env);
    
    if (!supabase) {
        console.warn('⚠️ Supabase not configured, returning empty product list');
        // Return empty products object when Supabase is not available
        // Agent should use dynamic functions to get products
        return {};
    }
    
    try {
        const { data: products, error } = await supabase
            .from('products')
            .select('*')
            .eq('is_active', true);
            
        if (error) throw error;
        
        // Convert array to object keyed by product ID or slug
        const productsMap = {};
        products.forEach(product => {
            const key = product.slug || product.id;
            productsMap[key] = {
                id: product.id,
                name: product.name,
                price: product.price,
                stock: product.stock_quantity || 0,
                category: product.category_name || 'Général',
                description: product.description || '',
                sizes: product.available_sizes || [],
                colors: product.available_colors || []
            };
        });
        
        console.log(`✅ Loaded ${Object.keys(productsMap).length} products from database`);
        return productsMap;
        
    } catch (error) {
        console.error('❌ Error fetching products from database:', error);
        // Return empty object on error
        return {};
    }
}

// Cache products for performance
let cachedProducts = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function getProducts(env) {
    const now = Date.now();
    
    // Return cached products if still valid
    if (cachedProducts && (now - cacheTimestamp) < CACHE_DURATION) {
        return cachedProducts;
    }
    
    // Fetch fresh products
    cachedProducts = await fetchProductsFromDatabase(env);
    cacheTimestamp = now;
    
    return cachedProducts;
}

// JWT utility functions for Google Sheets authentication
function base64UrlEncode(str) {
    return btoa(str)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

async function createJWT(serviceAccountEmail, privateKey) {
    const header = {
        alg: 'RS256',
        typ: 'JWT'
    };

    const now = Math.floor(Date.now() / 1000);
    const payload = {
        iss: serviceAccountEmail,
        scope: 'https://www.googleapis.com/auth/spreadsheets',
        aud: 'https://oauth2.googleapis.com/token',
        exp: now + 3600,
        iat: now
    };

    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const encodedPayload = base64UrlEncode(JSON.stringify(payload));
    const unsignedToken = `${encodedHeader}.${encodedPayload}`;

    let cleanPrivateKey = privateKey
        .replace(/\\n/g, '\n')
        .replace(/-----BEGIN PRIVATE KEY-----/, '')
        .replace(/-----END PRIVATE KEY-----/, '')
        .replace(/\s/g, '');
    
    const binaryKey = Uint8Array.from(atob(cleanPrivateKey), c => c.charCodeAt(0));
    
    const cryptoKey = await crypto.subtle.importKey(
        'pkcs8',
        binaryKey,
        {
            name: 'RSASSA-PKCS1-v1_5',
            hash: 'SHA-256'
        },
        false,
        ['sign']
    );

    const signature = await crypto.subtle.sign(
        'RSASSA-PKCS1-v1_5',
        cryptoKey,
        new TextEncoder().encode(unsignedToken)
    );

    const encodedSignature = base64UrlEncode(String.fromCharCode(...new Uint8Array(signature)));
    return `${unsignedToken}.${encodedSignature}`;
}

async function getAccessToken(serviceAccountEmail, privateKey) {
    const jwt = await createJWT(serviceAccountEmail, privateKey);
    
    const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
    });

    if (!response.ok) {
        throw new Error(`Failed to get access token: ${response.status}`);
    }

    const data = await response.json();
    return data.access_token;
}

// Google Sheets integration functions
async function addCustomerToSheet(customer, env) {
    try {
        if (!env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !env.GOOGLE_PRIVATE_KEY || !env.GOOGLE_SHEET_ID) {
            console.log(`⚠️ [CF] Google Sheets credentials not configured`);
            return true;
        }

        const accessToken = await getAccessToken(env.GOOGLE_SERVICE_ACCOUNT_EMAIL, env.GOOGLE_PRIVATE_KEY);

        const timestamp = new Date(customer.createdAt).toLocaleString('fr-FR', {
            timeZone: 'Africa/Algiers',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });

        const values = [[
            customer.id,
            customer.name,
            customer.phone,
            timestamp,
            customer.wilaya || 'Non spécifiée',
            timestamp
        ]];

        const sheetsUrl = `https://sheets.googleapis.com/v4/spreadsheets/${env.GOOGLE_SHEET_ID}/values/Customers!A:F:append?valueInputOption=RAW`;
        
        const response = await fetch(sheetsUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ values })
        });

        if (!response.ok) {
            throw new Error(`Customer Sheets API error: ${response.status}`);
        }

        return true;
    } catch (error) {
        console.error(`❌ [CF] Error adding customer to Google Sheets:`, error);
        return false;
    }
}

async function addOrderToSheet(order, env) {
    try {
        if (!env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !env.GOOGLE_PRIVATE_KEY || !env.GOOGLE_SHEET_ID) {
            console.log(`⚠️ [CF] Google Sheets credentials not configured`);
            return true;
        }

        const accessToken = await getAccessToken(env.GOOGLE_SERVICE_ACCOUNT_EMAIL, env.GOOGLE_PRIVATE_KEY);

        const timestamp = new Date(order.createdAt).toLocaleString('fr-FR', {
            timeZone: 'Africa/Algiers',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });

        let buyIntent = 'Ready to Purchase';
        if (order.totalAmount > 100) {
            buyIntent = 'High Value Buyer';
        } else if (order.quantity > 3) {
            buyIntent = 'Bulk Buyer';
        } else if (order.totalAmount < 30) {
            buyIntent = 'Budget Conscious';
        }

        const values = [[
            timestamp,
            order.id,
            order.customerName || 'Non spécifié',
            order.productName,
            order.quantity,
            order.unitPrice,
            order.totalAmount,
            order.customerPhone,
            order.wilaya || 'Non spécifiée',
            buyIntent
        ]];

        const sheetsUrl = `https://sheets.googleapis.com/v4/spreadsheets/${env.GOOGLE_SHEET_ID}/values/Orders!A:J:append?valueInputOption=RAW`;
        
        const response = await fetch(sheetsUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ values })
        });

        if (!response.ok) {
            throw new Error(`Google Sheets API error: ${response.status}`);
        }

        return true;
    } catch (error) {
        console.error(`❌ [CF] Error adding to Google Sheets:`, error);
        return false;
    }
}

// Function implementations
const functions = {
    check_product_availability: async ({ product_name }, env) => {
        // Get products from database
        const products = await getProducts(env);
        // Product search logic
        let product = null;
        const searchTerm = product_name.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
        const searchKeywords = searchTerm.split(' ');
        
        // Try exact match first
        const exactKey = searchTerm.replace(/\s+/g, '-');
        if (products[exactKey]) {
            product = products[exactKey];
        }
        
        // Fuzzy matching if no exact match
        if (!product) {
            let bestMatch = null;
            let bestScore = 0;
            
            Object.entries(products).forEach(([key, prod]) => {
                const productName = prod.name.toLowerCase();
                const productKeywords = productName.split(/[\s-]+/);
                
                let score = 0;
                
                searchKeywords.forEach(keyword => {
                    if (keyword.length >= 3) {
                        productKeywords.forEach(prodKeyword => {
                            if (prodKeyword.includes(keyword) || keyword.includes(prodKeyword)) {
                                score += keyword.length;
                            }
                        });
                        
                        // Special product term matching for lingerie
                        if (keyword === 'push' && productName.includes('push')) score += 10;
                        if (keyword === 'dentelle' && productName.includes('dentelle')) score += 10;
                        if (keyword === 'coton' && productName.includes('coton')) score += 10;
                        // Add more special cases as needed
                    }
                });
                
                if (productName.includes(searchTerm)) {
                    score += searchTerm.length * 2;
                }
                
                if (score > bestScore && score >= 3) {
                    bestScore = score;
                    bestMatch = { key, product: prod };
                }
            });
            
            if (bestMatch) {
                product = bestMatch.product;
            }
        }
        
        if (!product) {
            return `❌ Produit "${product_name}" non trouvé.`;
        }
        
        if (product.stock > 0) {
            const sizesText = product.sizes && product.sizes.length > 0 ? `\n📏 Tailles: ${product.sizes.join(', ')}` : '';
            const colorsText = product.colors && product.colors.length > 0 ? `\n🎨 Couleurs: ${product.colors.join(', ')}` : '';
            return `✅ ${product.name} est en stock!\n💰 Prix: ${product.price.toFixed(2)} €\n📦 Stock: ${product.stock} unités${sizesText}${colorsText}\n👙 Catégorie: ${product.category}`;
        } else {
            return `❌ ${product.name} est actuellement en rupture de stock.`;
        }
    },

    save_client_data: async ({ name, phone, wilaya }, env) => {
        if (!name || !phone || !wilaya || wilaya === 'Non spécifiée') {
            const missing = [];
            if (!name) missing.push('nom complet');
            if (!phone) missing.push('numéro de téléphone');
            if (!wilaya || wilaya === 'Non spécifiée') missing.push('wilaya');
            
            return `❌ Informations manquantes: ${missing.join(', ')}`;
        }
        
        const customerId = `XCUST_${Date.now()}`;
        const customer = {
            id: customerId,
            name,
            phone,
            wilaya,
            createdAt: new Date().toISOString()
        };
        
        try {
            await env.CACHE.put(`customer_${customerId}`, JSON.stringify(customer), { expirationTtl: 86400 * 30 });
            await env.CACHE.put(`customer_phone_${phone}`, JSON.stringify(customer), { expirationTtl: 86400 * 30 });
            await addCustomerToSheet(customer, env);
            
            return `✅ Welcome to Lingerie Store Products!\n- Customer ID: ${customerId}\n- Name: ${name}\n- Phone: ${phone}\n- Wilaya: ${wilaya}`;
        } catch (error) {
            return `❌ Error saving customer data`;
        }
    },

    place_order: async ({ product_name, quantity, customer_phone, customer_name, wilaya }, env) => {
        const missing = [];
        if (!product_name) missing.push('product name');
        if (!quantity) missing.push('quantity');
        if (!customer_phone) missing.push('phone');
        if (!customer_name) missing.push('name');
        if (!wilaya || wilaya === 'Non spécifiée') missing.push('wilaya');
        
        if (missing.length > 0) {
            return `❌ Missing required fields: ${missing.join(', ')}`;
        }
        
        // Get products from database
        const products = await getProducts(env);
        let product = null;
        
        // Special handling for common product names
        const lowerProductName = product_name.toLowerCase();
        if (lowerProductName.includes('push') || lowerProductName.includes('push-up')) {
            product = products['push-up-rose']; // Direct match to push-up products
        } else {
            // Try exact key match first
            const searchTerm = product_name.toLowerCase().replace(/\s+/g, '-');
            product = products[searchTerm];
            
            if (!product) {
                // Try fuzzy matching
                const productEntries = Object.entries(products);
                for (const [key, prod] of productEntries) {
                    if (prod.name.toLowerCase().includes(product_name.toLowerCase()) ||
                        product_name.toLowerCase().includes(key.replace(/-/g, ' '))) {
                        product = prod;
                        break;
                    }
                }
            }
        }
        
        if (!product) {
            return `❌ Produit "${product_name}" non trouvé. Produits disponibles:\n${Object.values(products).map(p => `• ${p.name}: ${p.price.toFixed(2)} €`).join('\n')}`;
        }
        
        // Default quantity to 1 if not specified or invalid
        const orderQuantity = parseInt(quantity) || 1;
        
        if (product.stock < orderQuantity) {
            return `❌ Insufficient stock for ${product.name}. Available: ${product.stock}`;
        }
        
        const orderId = `XORD_${Date.now()}`;
        const totalAmount = product.price * orderQuantity;
        
        const order = {
            id: orderId,
            productId: product.id,
            productName: product.name,
            quantity: orderQuantity,
            unitPrice: product.price,
            totalAmount,
            customerPhone: customer_phone,
            customerName: customer_name,
            wilaya,
            createdAt: new Date().toISOString(),
            status: 'confirmed'
        };
        
        try {
            // Save to KV storage
            await env.CACHE.put(`order_${orderId}`, JSON.stringify(order), { expirationTtl: 86400 * 90 });
            
            // Save customer data too
            const customerId = `XCUST_${Date.now()}`;
            const customer = {
                id: customerId,
                name: customer_name,
                phone: customer_phone,
                wilaya,
                createdAt: new Date().toISOString()
            };
            await env.CACHE.put(`customer_${customerId}`, JSON.stringify(customer), { expirationTtl: 86400 * 30 });
            
            // Add to Google Sheets
            await addOrderToSheet(order, env);
            await addCustomerToSheet(customer, env);
            
            return `🎉 **Commande Confirmée !**

📋 **Détails de la commande:**
• ID Commande: ${orderId}
• Produit: ${product.name}
• Quantité: ${orderQuantity}
• Prix unitaire: ${product.price.toFixed(2)} DA
• **Total: ${totalAmount.toFixed(2)} DA**

👤 **Informations client:**
• Nom: ${customer_name}
• Téléphone: ${customer_phone}
• Wilaya: ${wilaya}

✅ Votre commande a été enregistrée avec succès !
📞 Nous vous contacterons bientôt pour confirmer la livraison.

Merci de votre confiance en Lingerie Store Products ! 🌿`;
            
        } catch (error) {
            console.error('❌ Order processing error:', error);
            return `❌ Erreur lors du traitement de la commande. Veuillez réessayer ou nous contacter directement.`;
        }
    },

    generate_sales_report: async ({ period = 'week', user_type = 'admin' }, env) => {
        const reportTime = new Date().toLocaleString('fr-FR', {
            timeZone: 'Africa/Algiers'
        });

        // Get products from database
        const products = await getProducts(env);
        
        let report = `📊 Lingerie Store Products Sales Report - ${reportTime}\n\n`;
        report += `👙 PRODUCTS AVAILABLE:\n`;
        Object.values(products).forEach(product => {
            const emoji = product.category === 'Soutiens-gorge' ? '👙' : 
                         product.category === 'Culottes' ? '🩲' : 
                         product.category === 'Ensembles' ? '👗' : 
                         product.category === 'Nuisettes' ? '👘' : '💋';
            report += `${emoji} ${product.name}: ${product.price.toFixed(2)} € (Stock: ${product.stock})\n`;
        });
        
        report += `\n💰 SYSTEM STATUS:\n`;
        report += `- Platform: Cloudflare Workers\n`;
        report += `- Status: Operational\n`;
        report += `- Cache: KV Storage Active\n`;
        
        return report;
    }
};

// OpenAI Assistant Management
class CloudflareSalesAssistant {
    constructor(env) {
        this.env = env;
        this.openai = new OpenAI({
            apiKey: env.OPENAI_API_KEY
        });
        this.assistantId = ASSISTANT_ID;
    }

    async createThread() {
        const thread = await this.openai.beta.threads.create();
        return thread.id;
    }

    async sendMessage(threadId, message) {
        try {
            // Step 1: Clean up any existing active runs first
            await this.cleanupActiveRuns(threadId);
            
            // Step 2: Add message to thread
            await this.openai.beta.threads.messages.create(threadId, {
                role: "user",
                content: message
            });

            // Step 3: Create run with dynamic instructions from SYSTEM_CONTEXT
            const run = await this.openai.beta.threads.runs.create(threadId, {
                assistant_id: this.assistantId,
                instructions: SYSTEM_CONTEXT.fr // Use dynamic context instead of hardcoded
            });

            // Step 4: Wait for completion with optimized timing
            return await this.waitForRunCompletion(threadId, run.id);
            
        } catch (error) {
            console.error('❌ OpenAI API Error:', error);
            
            // Return intelligent fallback based on message content
            return this.getFallbackResponse(message);
        }
    }

    async cleanupActiveRuns(threadId) {
        try {
            const runs = await this.openai.beta.threads.runs.list(threadId);
            const activeRuns = runs.data.filter(run => 
                ['running', 'queued', 'in_progress', 'requires_action'].includes(run.status)
            );
            
            // Cancel active runs in parallel
            if (activeRuns.length > 0) {
                console.log(`🧹 Cancelling ${activeRuns.length} active run(s)`);
                await Promise.all(
                    activeRuns.map(run => 
                        this.openai.beta.threads.runs.cancel(threadId, run.id).catch(() => {})
                    )
                );
                
                // Brief wait for cancellations to take effect
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        } catch (error) {
            console.warn('⚠️ Cleanup error (non-critical):', error.message);
        }
    }

    async waitForRunCompletion(threadId, runId) {
        let attempts = 0;
        const maxAttempts = 15; // Reduced from 30 to 15 (15 seconds max)
        const pollInterval = 1000; // 1 second intervals
        
        console.log(`⏳ Waiting for run ${runId} (max ${maxAttempts}s)`);

        while (attempts < maxAttempts) {
            try {
                const run = await this.openai.beta.threads.runs.retrieve(threadId, runId);
                console.log(`- Run status: ${run.status} (${attempts + 1}/${maxAttempts})`);
                
                if (run.status === 'completed') {
                    const messages = await this.openai.beta.threads.messages.list(threadId);
                    const latestMessage = messages.data[0];
                    
                    if (latestMessage && latestMessage.role === 'assistant') {
                        console.log('✅ Run completed successfully');
                        return latestMessage.content[0].text.value;
                    }
                    
                } else if (run.status === 'requires_action') {
                    console.log('🔧 Handling function calls...');
                    return await this.handleRequiresAction(threadId, runId, run);
                    
                } else if (run.status === 'failed') {
                    console.error('❌ Run failed:', run.last_error);
                    throw new Error(`Run failed: ${run.last_error?.message || 'Unknown error'}`);
                    
                } else if (run.status === 'cancelled') {
                    throw new Error('Run was cancelled');
                    
                } else if (run.status === 'expired') {
                    throw new Error('Run expired');
                }

                attempts++;
                
                // Only wait if we're not at max attempts
                if (attempts < maxAttempts) {
                    await new Promise(resolve => setTimeout(resolve, pollInterval));
                }
                
            } catch (error) {
                if (error.message.includes('Run failed') || error.message.includes('cancelled') || error.message.includes('expired')) {
                    throw error;
                }
                
                console.warn(`⚠️ Polling error (attempt ${attempts + 1}):`, error.message);
                attempts++;
                
                if (attempts < maxAttempts) {
                    await new Promise(resolve => setTimeout(resolve, pollInterval));
                }
            }
        }

        // Timeout reached - cancel the run and return fallback
        console.warn('⏰ Run timed out, cancelling...');
        try {
            await this.openai.beta.threads.runs.cancel(threadId, runId);
        } catch (cancelError) {
            console.warn('⚠️ Failed to cancel run:', cancelError.message);
        }
        
        throw new Error('Run timed out');
    }

    async handleRequiresAction(threadId, runId, run) {
        try {
            const toolCalls = run.required_action.submit_tool_outputs.tool_calls;
            const toolOutputs = [];

            // Process function calls with timeout protection
            const functionPromises = toolCalls.map(async (toolCall) => {
                const functionName = toolCall.function.name;
                const functionArgs = JSON.parse(toolCall.function.arguments);
                
                console.log(`🛠️ Calling function: ${functionName}`);
                
                if (functions[functionName]) {
                    try {
                        // Add timeout to function calls
                        const result = await Promise.race([
                            functions[functionName](functionArgs, this.env),
                            new Promise((_, reject) => 
                                setTimeout(() => reject(new Error('Function timeout')), 5000)
                            )
                        ]);
                        
                        return {
                            tool_call_id: toolCall.id,
                            output: result
                        };
                    } catch (error) {
                        console.warn(`⚠️ Function ${functionName} error:`, error.message);
                        return {
                            tool_call_id: toolCall.id,
                            output: `Error: ${error.message}`
                        };
                    }
                } else {
                    return {
                        tool_call_id: toolCall.id,
                        output: `Function ${functionName} not found`
                    };
                }
            });

            const results = await Promise.all(functionPromises);
            toolOutputs.push(...results);

            // Submit tool outputs
            await this.openai.beta.threads.runs.submitToolOutputs(threadId, runId, {
                tool_outputs: toolOutputs
            });

            // Wait for final completion with reduced timeout
            let finalAttempts = 0;
            const maxFinalAttempts = 10; // 10 seconds for function completion
            
            while (finalAttempts < maxFinalAttempts) {
                const finalRun = await this.openai.beta.threads.runs.retrieve(threadId, runId);
                
                if (finalRun.status === 'completed') {
                    const messages = await this.openai.beta.threads.messages.list(threadId);
                    const latestMessage = messages.data[0];
                    
                    if (latestMessage && latestMessage.role === 'assistant') {
                        return latestMessage.content[0].text.value;
                    }
                } else if (finalRun.status === 'failed') {
                    throw new Error(`Function run failed: ${finalRun.last_error?.message}`);
                }
                
                finalAttempts++;
                if (finalAttempts < maxFinalAttempts) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
            
            throw new Error('Function run timed out');
            
        } catch (error) {
            console.error('❌ Function handling error:', error);
            throw error;
        }
    }

    getFallbackResponse(message) {
        const lowerMessage = message.toLowerCase();
        
        // Intelligent fallback responses based on message content
        if (lowerMessage.includes('produits') || lowerMessage.includes('products')) {
            return `🌿 ** Lingerie Store Products - Catalogue Rapide **`;
        }
        
        if (lowerMessage.includes('prix') || lowerMessage.includes('price')) {
            return `💰 **Nos Prix Compétitifs:**`;
        }
        
        if (lowerMessage.includes('commander') || lowerMessage.includes('order')) {
            return `🛒 **Comment Commander:**`;
        }
        
        if (lowerMessage.includes('bonjour') || lowerMessage.includes('salut') || lowerMessage.includes('hello')) {
            return `🌿 Bonjour et bienvenue chez Lingerie Store Products !`;
        }
        
        // Default fallback
        return `🌿 Merci pour votre message !`;
    }
}

// Main Cloudflare Worker handler
export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const path = url.pathname;

        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        };

        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }

        try {
            // API Routes
            if (path === '/api/initialize') {
                return new Response(JSON.stringify({ 
                    success: true, 
                    assistantId: ASSISTANT_ID,
                    platform: 'Cloudflare Workers Backend'
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            if (path === '/api/chat/initialize') {
                return new Response(JSON.stringify({ 
                    success: true,
                    data: {
                        message: 'Chat system initialized successfully',
                        assistantId: ASSISTANT_ID,
                        platform: 'Cloudflare Workers Backend',
                        features: ['OpenAI Assistant', 'Product Catalog', 'Google Sheets Integration']
                    }
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            if (path === '/api/chat/start') {
                const assistant = new CloudflareSalesAssistant(env);
                const threadId = await assistant.createThread();
                return new Response(JSON.stringify({ 
                    success: true,
                    data: { threadId }
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            if (path === '/api/chat/message') {
                const { threadId, message, userType } = await request.json();
                
                if (!threadId || !message) {
                    return new Response(JSON.stringify({ 
                        success: false,
                        error: 'Missing required fields: threadId and message are required'
                    }), {
                        status: 400,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                    });
                }
                
                const assistant = new CloudflareSalesAssistant(env);
                
                try {
                    const response = await assistant.sendMessage(threadId, message);
                    
                    return new Response(JSON.stringify({ 
                        success: true,
                        data: { 
                            response,
                            aiResponse: response, // Fallback for different frontend expectations
                            threadId 
                        }
                    }), {
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                    });
                    
                } catch (error) {
                    console.error('❌ Message processing error:', error);
                    
                    // Return intelligent error response
                    const fallbackResponse = assistant.getFallbackResponse(message);
                    
                    return new Response(JSON.stringify({ 
                        success: true, // Still return success with fallback
                        data: { 
                            response: fallbackResponse,
                            aiResponse: fallbackResponse,
                            threadId,
                            fallback: true
                        }
                    }), {
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                    });
                }
            }

            if (path === '/api/test-env') {
                return new Response(JSON.stringify({
                    environment: {
                        hasOpenAI: !!env.OPENAI_API_KEY,
                        hasSheetId: !!env.GOOGLE_SHEET_ID,
                        hasServiceAccount: !!env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
                        hasPrivateKey: !!env.GOOGLE_PRIVATE_KEY
                    }
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            // Default API info
            return new Response(JSON.stringify({
                message: 'Lingerie Store Products API Backend',
                platform: 'Cloudflare Workers',
                endpoints: [
                    '/api/initialize',
                    '/api/chat/start', 
                    '/api/chat/message',
                    '/api/test-env'
                ]
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });

        } catch (error) {
            return new Response(JSON.stringify({ 
                error: error.message,
                platform: 'Cloudflare Workers Backend'
            }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }
    }
};