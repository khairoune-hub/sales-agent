import express from 'express';
import crypto from 'crypto';
import { dbUtils } from '../models/database.js';
import { openAIService } from '../services/openai.js';
import { productService, customerService, orderService, interactionService } from '../services/supabase.js';

const router = express.Router();

// Messenger configuration - Using hardcoded fallback for testing
const getMessengerConfig = () => ({
    MESSENGER_VERIFY_TOKEN: process.env.MESSENGER_VERIFY_TOKEN || 'salesagent',
    MESSENGER_ACCESS_TOKEN: process.env.MESSENGER_ACCESS_TOKEN,
    MESSENGER_APP_SECRET: process.env.MESSENGER_APP_SECRET
});

// Store active messenger sessions
const messengerSessions = new Map();

// Webhook verification endpoint for Facebook Messenger
router.get('/messenger', (req, res) => {
    try {
        console.log('\n📱 Messenger webhook verification request received');
        
        // Parse the query params
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];
        
        console.log(`- Mode: ${mode}`);
        console.log(`- Token: ${token}`);
        console.log(`- Challenge: ${challenge}`);
        console.log(`- Expected Token: ${getMessengerConfig().MESSENGER_VERIFY_TOKEN}`);
        console.log(`- Token Match: ${token === getMessengerConfig().MESSENGER_VERIFY_TOKEN}`);
        
        // Check if a token and mode is in the query string of the request
        if (mode && token) {
            // Check the mode and token sent are correct
            if (mode === 'subscribe' && token === getMessengerConfig().MESSENGER_VERIFY_TOKEN) {
                console.log('✅ Webhook verification successful');
                
                // Respond with the challenge token from the request
                res.status(200).send(challenge);
            } else {
                console.log('❌ Webhook verification failed - invalid token');
                // Respond with '403 Forbidden' if verify tokens do not match
                res.status(403).send('Forbidden');
            }
        } else {
            console.log('❌ Webhook verification failed - missing parameters');
            res.status(400).send('Bad Request');
        }
    } catch (error) {
        console.error('❌ Webhook verification error:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Webhook message handling endpoint for Facebook Messenger
router.post('/messenger', async (req, res) => {
    try {
        console.log('\n📩 Messenger webhook message received');
        
        // Verify the webhook signature
        if (!verifyWebhookSignature(req)) {
            console.log('❌ Invalid webhook signature');
            return res.status(403).send('Forbidden');
        }
        
        const body = req.body;
        
        // Check if this is a page subscription
        if (body.object === 'page') {
            console.log('✅ Page subscription confirmed');
            
            // Iterate over each entry (there may be multiple if batched)
            for (const entry of body.entry) {
                // Handle messaging events
                if (entry.messaging) {
                    for (const event of entry.messaging) {
                        await handleMessengerEvent(event);
                    }
                }
            }
            
            // Return a '200 OK' response to acknowledge receipt
            res.status(200).send('EVENT_RECEIVED');
        } else {
            console.log('❌ Not a page subscription');
            // Return a '404 Not Found' if event is not from a page subscription
            res.status(404).send('Not Found');
        }
    } catch (error) {
        console.error('❌ Webhook message processing error:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Verify webhook signature
function verifyWebhookSignature(req) {
    const config = getMessengerConfig();
    
    // Temporarily disable signature verification for testing
    console.log('⚠️ Signature verification disabled for testing');
    return true;

    // Check if in production mode
    const isProduction = process.env.NODE_ENV === 'production';
    
    if (!config.MESSENGER_APP_SECRET) {
        if (isProduction) {
            console.error('❌ No app secret configured in production!');
            return false;
        }
        console.log('⚠️ No app secret configured - skipping signature verification (development mode)');
        return true;
    }
    
    const signature = req.headers['x-hub-signature-256'];
    if (!signature) {
        console.log('❌ Missing signature header');
        return false;
    }
    
    const expectedSignature = crypto
        .createHmac('sha256', config.MESSENGER_APP_SECRET)
        .update(JSON.stringify(req.body))
        .digest('hex');
    
    const signatureHash = signature.split('=')[1];
    
    return crypto.timingSafeEqual(
        Buffer.from(signatureHash, 'hex'),
        Buffer.from(expectedSignature, 'hex')
    );
}

// Handle different types of Messenger events
async function handleMessengerEvent(event) {
    try {
        console.log(`\n🎯 Processing Messenger event:`, JSON.stringify(event, null, 2));
        
        const senderId = event.sender.id;
        const recipientId = event.recipient.id;
        
        // Handle different event types
        if (event.message) {
            await handleMessage(senderId, recipientId, event.message);
        } else if (event.postback) {
            await handlePostback(senderId, recipientId, event.postback);
        } else if (event.delivery) {
            console.log('📬 Message delivery confirmation received');
        } else if (event.read) {
            console.log('👁️ Message read confirmation received');
        } else {
            console.log('❓ Unknown event type received');
        }
    } catch (error) {
        console.error('❌ Error handling Messenger event:', error);
    }
}

// Handle incoming messages
async function handleMessage(senderId, recipientId, message) {
    try {
        console.log(`\n💬 Processing message from ${senderId}`);
        console.log(`- Message: ${JSON.stringify(message)}`);
        
        // Get or create session for this user
        let session = messengerSessions.get(senderId);
        if (!session) {
            console.log('🆕 Creating new session for user');
            session = await createMessengerSession(senderId);
            messengerSessions.set(senderId, session);
        }
        
        // Handle different message types
        if (message.text) {
            await processTextMessage(senderId, message.text, session);
        } else if (message.attachments) {
            await processAttachments(senderId, message.attachments, session);
        } else {
            console.log('❓ Unknown message type');
            await sendTextMessage(senderId, 'Désolé, je ne comprends pas ce type de message. Pouvez-vous m\'écrire un message texte?');
        }
    } catch (error) {
        console.error('❌ Error handling message:', error);
        await sendTextMessage(senderId, 'Une erreur s\'est produite. Veuillez réessayer.');
    }
}

// Handle postback events (button clicks)
async function handlePostback(senderId, recipientId, postback) {
    try {
        console.log(`\n🔘 Processing postback from ${senderId}`);
        console.log(`- Payload: ${postback.payload}`);
        
        const session = messengerSessions.get(senderId);
        if (!session) {
            console.log('❌ No session found for postback');
            return;
        }
        
        // Handle different postback payloads
        switch (postback.payload) {
            case 'GET_STARTED':
                await sendWelcomeMessage(senderId);
                break;
            case 'SHOW_PRODUCTS':
                await sendProductsList(senderId);
                break;
            case 'CONTACT_HUMAN':
                await sendTextMessage(senderId, 'Un conseiller va vous contacter prochainement. Merci pour votre patience!');
                break;
            default:
                // Treat postback as a text message
                await processTextMessage(senderId, postback.payload, session);
                break;
        }
    } catch (error) {
        console.error('❌ Error handling postback:', error);
    }
}

// Create a new session for a Messenger user
async function createMessengerSession(senderId) {
    try {
        console.log(`🆕 Creating new session for Messenger user: ${senderId}`);
        
        // Get user profile from Facebook
        const userProfile = await getMessengerUserProfile(senderId);
        
        // Create or get customer in Supabase
        let customer = null;
        try {
            customer = await customerService.getOrCreateCustomer(
                senderId,
                'messenger',
                {
                    name: `${userProfile.first_name} ${userProfile.last_name}`.trim() || 'Utilisateur Messenger',
                    email: userProfile.email || null,
                    phone: userProfile.phone || null,
                    language: 'fr'
                }
            );
            console.log(`✅ Customer created/retrieved: ${customer.name}`);
        } catch (supabaseError) {
            console.warn('⚠️ Supabase customer creation failed, using session-only data:', supabaseError.message);
        }
        
        // Create OpenAI thread
        const threadId = await openAIService.createThread();
        
        const session = {
            senderId,
            threadId,
            userProfile,
            customer,
            createdAt: new Date().toISOString(),
            lastActivityAt: new Date().toISOString(),
            language: 'ar', // Default to French
            messageCount: 0
        };
        
        console.log(`✅ Session created with thread: ${threadId}`);
        return session;
    } catch (error) {
        console.error('❌ Error creating Messenger session:', error);
        throw error;
    }
}

// Get user profile from Facebook Messenger
async function getMessengerUserProfile(senderId) {
    try {
        const config = getMessengerConfig();
        if (!config.MESSENGER_ACCESS_TOKEN) {
            console.log('⚠️ No access token - using default profile');
            return {
                first_name: 'Utilisateur',
                last_name: '',
                profile_pic: null
            };
        }
        
        const response = await fetch(
            `https://graph.facebook.com/v18.0/${senderId}?fields=first_name,last_name,profile_pic&access_token=${config.MESSENGER_ACCESS_TOKEN}`
        );
        
        if (!response.ok) {
            console.log('⚠️ Failed to fetch user profile - using default');
            return {
                first_name: 'Utilisateur',
                last_name: '',
                profile_pic: null
            };
        }
        
        const profile = await response.json();
        console.log(`👤 User profile retrieved: ${profile.first_name} ${profile.last_name}`);
        return profile;
    } catch (error) {
        console.error('❌ Error fetching user profile:', error);
        return {
            first_name: 'Utilisateur',
            last_name: '',
            profile_pic: null
        };
    }
}

// Process text messages
async function processTextMessage(senderId, text, session) {
    try {
        console.log(`\n🔄 Processing text message: "${text}"`);
        
        // Update session activity
        session.lastActivityAt = new Date().toISOString();
        session.messageCount++;
        
        // Send typing indicator
        await sendTypingIndicator(senderId, 'typing_on');
        
        // Send message to OpenAI assistant
        const response = await openAIService.sendMessage(session.threadId, text, {
            language: session.language,
            customerName: session.userProfile.first_name,
            userType: 'customer',
            platform: 'messenger'
        });
        
        // Log the interaction
        try {
            // Log to Supabase interaction service
            if (session.customer) {
                await interactionService.logInteraction(
                    session.customer.id,
                    {
                        platformType: 'messenger',
                        type: 'message',
                        message: text,
                        aiResponse: response,
                        threadId: session.threadId,
                        language: session.language
                    }
                );
            }
        } catch (interactionError) {
            console.warn('⚠️ Failed to log interaction to Supabase:', interactionError.message);
        }
        
        // Fallback to in-memory logging
        dbUtils.logInteraction({
            threadId: session.threadId,
            userMessage: text,
            aiResponse: response,
            language: session.language,
            customerName: session.userProfile.first_name,
            userType: 'customer',
            platform: 'messenger',
            senderId: senderId,
            timestamp: new Date().toISOString()
        });
        
        // Turn off typing indicator
        await sendTypingIndicator(senderId, 'typing_off');
        
        // Check if there's a pending image to send (from function call)
        if (global.pendingImageSend) {
            console.log(`📤 Sending text first, then image: ${global.pendingImageSend.imageUrl}`);
            
            // Send the text message first
            await sendTextMessage(senderId, response);
            
            // Then send the image
            await sendImageMessage(senderId, global.pendingImageSend.imageUrl, global.pendingImageSend.caption);
            
            // Clear the pending image
            global.pendingImageSend = null;
        } else {
            // Check if AI wants to send an image via response JSON
            try {
                const responseData = JSON.parse(response);
                if (responseData.success && responseData.action === 'send_image') {
                    console.log(`📤 AI requested to send image via JSON: ${responseData.imageUrl}`);
                    
                    // Send the image
                    await sendImageMessage(senderId, responseData.imageUrl, responseData.caption);
                    
                    // Also send a follow-up text message
                    if (responseData.message) {
                        await sendTextMessage(senderId, responseData.message);
                    }
                } else {
                    // Regular text response
                    await sendTextMessage(senderId, response);
                }
            } catch (parseError) {
                // Not JSON, send as regular text
                await sendTextMessage(senderId, response);
            }
        }
        
        console.log('✅ Message processed successfully');
    } catch (error) {
        console.error('❌ Error processing text message:', error);
        await sendTypingIndicator(senderId, 'typing_off');
        await sendTextMessage(senderId, 'Une erreur s\'est produite lors du traitement de votre message. Veuillez réessayer.');
    }
}

// Process attachments
async function processAttachments(senderId, attachments, session) {
    try {
        console.log(`\n📎 Processing attachments: ${attachments.length} items`);
        
        // Update session activity
        session.lastActivityAt = new Date().toISOString();
        session.messageCount++;
        
        for (const attachment of attachments) {
            if (attachment.type === 'image') {
                await processMessengerImageAttachment(senderId, attachment, session);
            } else if (attachment.type === 'location') {
                await sendTextMessage(senderId, 'Merci pour votre localisation! Nos produits sont disponibles partout en France.');
            } else if (attachment.type === 'audio' || attachment.type === 'video' || attachment.type === 'file') {
                await sendTextMessage(senderId, 'Merci pour ce fichier! Pour une meilleure assistance, pouvez-vous décrire ce que vous cherchez par texte?');
            } else {
                await sendTextMessage(senderId, 'Merci pour ce fichier! Pouvez-vous me poser une question sur nos produits?');
            }
        }
    } catch (error) {
        console.error('❌ Error processing attachments:', error);
        await sendTextMessage(senderId, 'Une erreur s\'est produite lors du traitement de votre fichier. Veuillez réessayer.');
    }
}

// Process Messenger image attachments with vision AI
async function processMessengerImageAttachment(senderId, attachment, session) {
    try {
        console.log(`\n🖼️ Processing Messenger image attachment`);
        console.log(`- Image URL: ${attachment.payload.url}`);
        
        // Send typing indicator
        await sendTypingIndicator(senderId, 'typing_on');
        
        // Send initial acknowledgment
        await sendTextMessage(senderId, 'J\'analyse votre image... 🔍');
        
        try {
            // Download the image from Messenger
            const config = getMessengerConfig();
            const headers = {
                'Authorization': `Bearer ${config.MESSENGER_ACCESS_TOKEN}`
            };
            
            const imageBuffer = await openAIService.downloadImage(attachment.payload.url, headers);
            
            // Validate the image (we'll assume it's valid since it's from Messenger)
            const imageSizeBytes = imageBuffer.length;
            console.log(`📊 Image size: ${imageSizeBytes} bytes`);
            
            // Check if image is too large
            if (imageSizeBytes > 20 * 1024 * 1024) { // 20MB limit
                throw new Error('Image too large for processing');
            }
            
            // Process image with vision model
            const textMessage = 'Analysez cette image et recommandez des produits appropriés de notre catalogue bio.';
            const response = await openAIService.processImageMessage(
                session.threadId,
                textMessage,
                imageBuffer,
                {
                    language: session.language,
                    customerName: session.userProfile.first_name,
                    userType: 'customer',
                    platform: 'messenger'
                }
            );
            
            // Log the interaction
            dbUtils.logInteraction({
                threadId: session.threadId,
                userMessage: '[IMAGE] User sent an image',
                aiResponse: response,
                language: session.language,
                customerName: session.userProfile.first_name,
                userType: 'customer',
                platform: 'messenger',
                senderId: senderId,
                timestamp: new Date().toISOString(),
                attachmentType: 'image',
                attachmentUrl: attachment.payload.url
            });
            
            // Turn off typing indicator
            await sendTypingIndicator(senderId, 'typing_off');
            
            // Send the AI response
            await sendTextMessage(senderId, response);
            
            console.log('✅ Image processed successfully with vision AI');
            
        } catch (visionError) {
            console.error('❌ Vision processing failed:', visionError);
            
            // Turn off typing indicator
            await sendTypingIndicator(senderId, 'typing_off');
            
            // Send fallback message based on error type
            let fallbackMessage;
            if (visionError.message.includes('too large')) {
                fallbackMessage = 'L\'image est trop volumineuse. Veuillez envoyer une image plus petite (max 20MB) ou décrire le produit par texte.';
            } else if (visionError.message.includes('not support')) {
                fallbackMessage = 'Désolé, l\'analyse d\'images n\'est pas disponible actuellement. Pouvez-vous décrire le produit que vous cherchez?';
            } else {
                fallbackMessage = 'Je n\'ai pas pu analyser cette image. Pouvez-vous décrire le produit que vous cherchez ou envoyer une autre image?';
            }
            
            await sendTextMessage(senderId, fallbackMessage);
        }
        
    } catch (error) {
        console.error('❌ Error processing Messenger image:', error);
        await sendTypingIndicator(senderId, 'typing_off');
        await sendTextMessage(senderId, 'Une erreur s\'est produite lors de l\'analyse de l\'image. Veuillez réessayer.');
    }
}

// Send welcome message
async function sendWelcomeMessage(senderId) {
    try {
        const session = messengerSessions.get(senderId);
        const firstName = session?.userProfile?.first_name || 'Bonjour';
        
        const message = {
            text: `${firstName}! 🌿 Bienvenue chez Lingerie Store Products!\n\nJe suis votre assistant virtuel et je suis là pour vous aider à découvrir nos produits Lingerie.\n\nComment puis-je vous aider aujourd'hui?`,
            quick_replies: [
                {
                    content_type: 'text',
                    title: '🛍️ Voir les produits',
                    payload: 'SHOW_PRODUCTS'
                },
                {
                    content_type: 'text',
                    title: '💬 Poser une question',
                    payload: 'ASK_QUESTION'
                },
                {
                    content_type: 'text',
                    title: '📞 Contacter un conseiller',
                    payload: 'CONTACT_HUMAN'
                }
            ]
        };
        
        await sendMessage(senderId, { message });
    } catch (error) {
        console.error('❌ Error sending welcome message:', error);
    }
}

// Send products list
async function sendProductsList(senderId) {
    try {
        const products = await productService.getAllProducts();
        if (products.length === 0) {
            await sendTextMessage(senderId, 'Désolé, aucun produit n\'est disponible pour le moment.');
            return;
        }
        const topProducts = products.slice(0, 5);
        
        let productText = '🛍️ Voici nos produits les plus populaires:\n\n';
        topProducts.forEach((product, index) => {
            productText += `${index + 1}. ${product.name}\n`;
            productText += `   💰 ${product.price}€\n`;
            productText += `   📝 ${product.description.substring(0, 50)}...\n\n`;
        });
        
        productText += 'Dites-moi le nom d\'un produit pour plus d\'informations!';
        
        await sendTextMessage(senderId, productText);
    } catch (error) {
        console.error('❌ Error sending products list:', error);
    }
}

// Send text message to user
async function sendTextMessage(senderId, text) {
    const message = {
        text: text
    };
    
    await sendMessage(senderId, { message });
}

// Send image message to user
async function sendImageMessage(senderId, imageUrl, caption = null) {
    try {
        console.log(`📤 Sending image to ${senderId}: ${imageUrl}`);
        
        const message = {
            attachment: {
                type: 'image',
                payload: {
                    url: imageUrl,
                    is_reusable: true
                }
            }
        };
        
        // Send image
        await sendMessage(senderId, { message });
        
        // Send caption as separate text message if provided
        if (caption) {
            await sendTextMessage(senderId, caption);
        }
        
        console.log(`✅ Image sent successfully to ${senderId}`);
    } catch (error) {
        console.error('❌ Error sending image:', error);
        // Fallback to text message
        await sendTextMessage(senderId, caption || 'Désolé, je ne peux pas envoyer l\'image pour le moment.');
    }
}

// Send typing indicator
async function sendTypingIndicator(senderId, action) {
    try {
        const config = getMessengerConfig();
        if (!config.MESSENGER_ACCESS_TOKEN) {
            return; // Skip if no access token
        }
        
        const requestBody = {
            recipient: { id: senderId },
            sender_action: action
        };
        
        const response = await fetch(
            `https://graph.facebook.com/v18.0/me/messages?access_token=${config.MESSENGER_ACCESS_TOKEN}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            }
        );
        
        if (!response.ok) {
            console.log(`⚠️ Failed to send typing indicator: ${response.status}`);
        }
    } catch (error) {
        console.error('❌ Error sending typing indicator:', error);
    }
}

// Send message to Facebook Messenger
async function sendMessage(senderId, messageData) {
    try {
        console.log(`\n📤 Sending message to ${senderId}`);
        
        const config = getMessengerConfig();
        if (!config.MESSENGER_ACCESS_TOKEN) {
            console.log('⚠️ No access token configured - message not sent');
            return;
        }
        
        const requestBody = {
            recipient: { id: senderId },
            ...messageData
        };
        
        console.log('📝 Request body:', JSON.stringify(requestBody, null, 2));
        
        const response = await fetch(
            `https://graph.facebook.com/v18.0/me/messages?access_token=${config.MESSENGER_ACCESS_TOKEN}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            }
        );
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ Failed to send message: ${response.status} - ${errorText}`);
            throw new Error(`Failed to send message: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('✅ Message sent successfully:', result);
        return result;
    } catch (error) {
        console.error('❌ Error sending message to Messenger:', error);
        throw error;
    }
}

// Clean up inactive sessions (run periodically)
function cleanupInactiveSessions() {
    const now = Date.now();
    const SESSION_TIMEOUT = 60 * 60 * 1000; // 1 hour
    
    for (const [senderId, session] of messengerSessions.entries()) {
        const lastActivity = new Date(session.lastActivityAt).getTime();
        if (now - lastActivity > SESSION_TIMEOUT) {
            console.log(`🧹 Cleaning up inactive session for ${senderId}`);
            messengerSessions.delete(senderId);
        }
    }
}

// Run cleanup every 30 minutes
setInterval(cleanupInactiveSessions, 30 * 60 * 1000);

// Debug endpoints
router.get('/debug/sessions', (req, res) => {
    const sessions = Array.from(messengerSessions.entries()).map(([senderId, session]) => ({
        senderId,
        threadId: session.threadId,
        userName: `${session.userProfile.first_name} ${session.userProfile.last_name}`,
        messageCount: session.messageCount,
        lastActivity: session.lastActivityAt,
        createdAt: session.createdAt
    }));
    
    res.json({
        success: true,
        data: {
            activeSessionsCount: messengerSessions.size,
            sessions: sessions
        }
    });
});

router.get('/debug/config', (req, res) => {
    console.log('🐛 Debug config endpoint called');
    console.log('🐛 process.env.MESSENGER_VERIFY_TOKEN:', process.env.MESSENGER_VERIFY_TOKEN);
    console.log('🐛 All process.env keys:', Object.keys(process.env).filter(k => k.includes('MESSENGER')));
    
    const config = getMessengerConfig();
    console.log('🐛 config object:', config);
    
    res.json({
        success: true,
        data: {
            hasVerifyToken: !!config.MESSENGER_VERIFY_TOKEN,
            hasAccessToken: !!config.MESSENGER_ACCESS_TOKEN,
            hasAppSecret: !!config.MESSENGER_APP_SECRET,
            verifyTokenLength: config.MESSENGER_VERIFY_TOKEN ? config.MESSENGER_VERIFY_TOKEN.length : 0,
            accessTokenLength: config.MESSENGER_ACCESS_TOKEN ? config.MESSENGER_ACCESS_TOKEN.length : 0,
            actualVerifyToken: config.MESSENGER_VERIFY_TOKEN,
            processEnvVerifyToken: process.env.MESSENGER_VERIFY_TOKEN,
            allEnvKeys: Object.keys(process.env).filter(k => k.includes('MESSENGER'))
        }
    });
});

export default router; 