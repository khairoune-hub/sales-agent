import express from 'express';
import crypto from 'crypto';
import { dbUtils } from '../models/database.js';
import { openAIService } from '../services/openai.js';
import { productService, customerService, orderService, interactionService } from '../services/supabase.js';

const router = express.Router();

// WhatsApp Business API configuration
const getWhatsAppConfig = () => ({
    WHATSAPP_VERIFY_TOKEN: process.env.WHATSAPP_VERIFY_TOKEN || 'whatsapp_salesagent_verify',
    WHATSAPP_ACCESS_TOKEN: process.env.WHATSAPP_ACCESS_TOKEN,
    WHATSAPP_APP_SECRET: process.env.WHATSAPP_APP_SECRET,
    WHATSAPP_PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID,
    WHATSAPP_BUSINESS_ACCOUNT_ID: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID
});

// Store active WhatsApp sessions
const whatsappSessions = new Map();

// Webhook verification endpoint for WhatsApp Business API
router.get('/webhook', (req, res) => {
    try {
        console.log('\n📱 WhatsApp webhook verification request received');
        
        // Parse the query params
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];
        
        console.log(`- Mode: ${mode}`);
        console.log(`- Token: ${token}`);
        console.log(`- Challenge: ${challenge}`);
        console.log(`- Expected Token: ${getWhatsAppConfig().WHATSAPP_VERIFY_TOKEN}`);
        console.log(`- Token Match: ${token === getWhatsAppConfig().WHATSAPP_VERIFY_TOKEN}`);
        
        // Check if a token and mode is in the query string of the request
        if (mode && token) {
            // Check the mode and token sent are correct
            if (mode === 'subscribe' && token === getWhatsAppConfig().WHATSAPP_VERIFY_TOKEN) {
                console.log('✅ WhatsApp webhook verification successful');
                
                // Respond with the challenge token from the request
                res.status(200).send(challenge);
            } else {
                console.log('❌ WhatsApp webhook verification failed - invalid token');
                // Respond with '403 Forbidden' if verify tokens do not match
                res.status(403).send('Forbidden');
            }
        } else {
            console.log('❌ WhatsApp webhook verification failed - missing parameters');
            res.status(400).send('Bad Request');
        }
    } catch (error) {
        console.error('❌ WhatsApp webhook verification error:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Webhook message handling endpoint for WhatsApp Business API
router.post('/webhook', async (req, res) => {
    try {
        console.log('\n📩 WhatsApp webhook message received');
        
        // Verify the webhook signature (temporarily disabled for testing)
        if (!verifyWhatsAppSignature(req)) {
            console.log('❌ Invalid WhatsApp webhook signature');
            return res.status(403).send('Forbidden');
        }
        
        const body = req.body;
        console.log('📄 Full WhatsApp webhook payload:', JSON.stringify(body, null, 2));
        
        // Check if this is a WhatsApp business account notification
        if (body.object === 'whatsapp_business_account') {
            console.log('✅ WhatsApp business account notification confirmed');
            
            // Iterate over each entry (there may be multiple if batched)
            for (const entry of body.entry) {
                // Handle changes (messages, status updates, etc.)
                if (entry.changes) {
                    for (const change of entry.changes) {
                        await handleWhatsAppChange(change);
                    }
                }
            }
            
            // Return a '200 OK' response to acknowledge receipt
            res.status(200).send('EVENT_RECEIVED');
        } else {
            console.log('❌ Not a WhatsApp business account notification');
            // Return a '404 Not Found' if event is not from WhatsApp
            res.status(404).send('Not Found');
        }
    } catch (error) {
        console.error('❌ WhatsApp webhook message processing error:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Verify WhatsApp webhook signature
function verifyWhatsAppSignature(req) {
    const config = getWhatsAppConfig();
    
    // Temporarily disable signature verification for testing
    console.log('⚠️ WhatsApp signature verification disabled for testing');
    return true;

    // Check if in production mode
    const isProduction = process.env.NODE_ENV === 'production';
    
    if (!config.WHATSAPP_APP_SECRET) {
        if (isProduction) {
            console.error('❌ No WhatsApp app secret configured in production!');
            return false;
        }
        console.log('⚠️ No WhatsApp app secret configured - skipping signature verification (development mode)');
        return true;
    }
    
    const signature = req.headers['x-hub-signature-256'];
    if (!signature) {
        console.log('❌ Missing WhatsApp signature header');
        return false;
    }
    
    const expectedSignature = crypto
        .createHmac('sha256', config.WHATSAPP_APP_SECRET)
        .update(JSON.stringify(req.body))
        .digest('hex');
    
    const signatureHash = signature.split('=')[1];
    
    return crypto.timingSafeEqual(
        Buffer.from(signatureHash, 'hex'),
        Buffer.from(expectedSignature, 'hex')
    );
}

// Handle different types of WhatsApp changes
async function handleWhatsAppChange(change) {
    try {
        console.log(`\n🎯 Processing WhatsApp change:`, JSON.stringify(change, null, 2));
        
        // Handle messages
        if (change.field === 'messages' && change.value.messages) {
            for (const message of change.value.messages) {
                await handleWhatsAppMessage(message, change.value.metadata);
            }
        }
        
        // Handle message status updates
        if (change.field === 'messages' && change.value.statuses) {
            for (const status of change.value.statuses) {
                console.log(`📊 Message status update: ${status.status} for message ${status.id}`);
            }
        }
    } catch (error) {
        console.error('❌ Error handling WhatsApp change:', error);
    }
}

// Handle incoming WhatsApp messages
async function handleWhatsAppMessage(message, metadata) {
    try {
        console.log(`\n💬 Processing WhatsApp message from ${message.from}`);
        console.log(`- Message: ${JSON.stringify(message)}`);
        console.log(`- Metadata: ${JSON.stringify(metadata)}`);
        
        const senderId = message.from;
        const phoneNumberId = metadata.phone_number_id;
        
        // Get or create session for this user
        let session = whatsappSessions.get(senderId);
        if (!session) {
            console.log('🆕 Creating new WhatsApp session for user');
            session = await createWhatsAppSession(senderId);
            whatsappSessions.set(senderId, session);
        }
        
        // Handle different message types
        if (message.type === 'text') {
            await processWhatsAppTextMessage(senderId, message.text.body, session, phoneNumberId);
        } else if (message.type === 'image' || message.type === 'document' || message.type === 'audio' || message.type === 'video') {
            await processWhatsAppMediaMessage(senderId, message, session, phoneNumberId);
        } else if (message.type === 'interactive') {
            await processWhatsAppInteractiveMessage(senderId, message.interactive, session, phoneNumberId);
        } else {
            console.log(`❓ Unknown WhatsApp message type: ${message.type}`);
            await sendWhatsAppTextMessage(senderId, 'Désolé, je ne comprends pas ce type de message. Pouvez-vous m\'écrire un message texte?', phoneNumberId);
        }
    } catch (error) {
        console.error('❌ Error handling WhatsApp message:', error);
        await sendWhatsAppTextMessage(message.from, 'Une erreur s\'est produite. Veuillez réessayer.', metadata.phone_number_id);
    }
}

// Create a new WhatsApp session
async function createWhatsAppSession(senderId) {
    try {
        console.log(`🆕 Creating new session for WhatsApp user: ${senderId}`);
        
        // Get user profile (WhatsApp doesn't provide profile info via webhook)
        const userProfile = {
            id: senderId,
            name: `WhatsApp User ${senderId.slice(-4)}`, // Use last 4 digits as identifier
            phone: senderId
        };
        console.log(`👤 WhatsApp user profile: ${JSON.stringify(userProfile)}`);
        
        // Create or get customer in Supabase
        let customer = null;
        try {
            customer = await customerService.getOrCreateCustomer(
                senderId,
                'whatsapp',
                {
                    name: userProfile.name,
                    email: null,
                    phone: senderId,
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
            userId: senderId,
            platform: 'whatsapp',
            threadId: threadId,
            userProfile: userProfile,
            customer,
            createdAt: new Date(),
            lastActivity: new Date(),
            messageCount: 0
        };
        
        console.log(`✅ WhatsApp session created with thread: ${threadId}`);
        return session;
    } catch (error) {
        console.error('❌ Error creating WhatsApp session:', error);
        throw error;
    }
}

// Process WhatsApp text messages
async function processWhatsAppTextMessage(senderId, text, session, phoneNumberId) {
    try {
        console.log(`🔄 Processing WhatsApp text message: "${text}"`);
        
        // Update session activity
        session.lastActivity = new Date();
        session.messageCount++;
        
        // Send typing indicator
        await sendWhatsAppTypingIndicator(senderId, true, phoneNumberId);
        
        // Process with OpenAI
        const response = await openAIService.sendMessage(
            session.threadId,
            text,
            {
                language: detectLanguage(text),
                customerName: session.userProfile.name,
                userType: 'customer',
                platform: 'whatsapp'
            }
        );
        
        // Send typing indicator off
        await sendWhatsAppTypingIndicator(senderId, false, phoneNumberId);
        
        // Log the interaction
        try {
            // Log to Supabase interaction service
            if (session.customer) {
                await interactionService.logInteraction(
                    session.customer.id,
                    {
                        platformType: 'whatsapp',
                        type: 'message',
                        message: text,
                        aiResponse: response,
                        threadId: session.threadId,
                        language: detectLanguage(text)
                    }
                );
            }
        } catch (interactionError) {
            console.warn('⚠️ Failed to log interaction to Supabase:', interactionError.message);
        }
        
        // Check if there's a pending image to send (from function call)
        if (global.pendingImageSend) {
            console.log(`📤 Sending pending WhatsApp image: ${global.pendingImageSend.imageUrl}`);
            
            // Send the image
            await sendWhatsAppImageMessage(senderId, global.pendingImageSend.imageUrl, global.pendingImageSend.caption, phoneNumberId);
            
            // Clear the pending image
            global.pendingImageSend = null;
            
            // Send a follow-up text message
            await sendWhatsAppTextMessage(senderId, response, phoneNumberId);
        } else {
            // Check if AI wants to send an image via response JSON
            try {
                const responseData = JSON.parse(response);
                if (responseData.success && responseData.action === 'send_image') {
                    console.log(`📤 AI requested to send WhatsApp image via JSON: ${responseData.imageUrl}`);
                    
                    // Send the image
                    await sendWhatsAppImageMessage(senderId, responseData.imageUrl, responseData.caption, phoneNumberId);
                    
                    // Also send a follow-up text message if needed
                    if (responseData.message && responseData.message !== responseData.caption) {
                        await sendWhatsAppTextMessage(senderId, responseData.message, phoneNumberId);
                    }
                } else {
                    // Regular text response
                    await sendWhatsAppTextMessage(senderId, response, phoneNumberId);
                }
            } catch (parseError) {
                // Not JSON, send as regular text
                await sendWhatsAppTextMessage(senderId, response, phoneNumberId);
            }
        }
        
        console.log('✅ WhatsApp message processed successfully');
    } catch (error) {
        console.error('❌ Error processing WhatsApp text message:', error);
        await sendWhatsAppTextMessage(senderId, 'Je suis désolé, je rencontre des difficultés techniques. Notre équipe vous contactera bientôt.', phoneNumberId);
    }
}

// Process WhatsApp media messages
async function processWhatsAppMediaMessage(senderId, message, session, phoneNumberId) {
    try {
        console.log(`📎 Processing WhatsApp media message: ${message.type}`);
        
        // Update session activity
        session.lastActivity = new Date();
        session.messageCount++;
        
        if (message.type === 'image') {
            await processWhatsAppImageMessage(senderId, message.image, session, phoneNumberId);
        } else if (message.type === 'document') {
            // Check if it's an image document
            const fileName = message.document.filename || 'document';
            const fileExtension = fileName.split('.').pop().toLowerCase();
            
            if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension)) {
                await processWhatsAppImageMessage(senderId, message.document, session, phoneNumberId, 'document');
            } else {
                await sendWhatsAppTextMessage(
                    senderId, 
                    'Merci pour le document! Pour une meilleure assistance, pouvez-vous décrire ce que vous cherchez par texte?', 
                    phoneNumberId
                );
            }
        } else if (message.type === 'audio' || message.type === 'video') {
            await sendWhatsAppTextMessage(
                senderId, 
                'Merci pour ce fichier multimédia! Pour une meilleure assistance, pouvez-vous décrire ce que vous cherchez par texte?', 
                phoneNumberId
            );
        } else {
            await sendWhatsAppTextMessage(
                senderId, 
                'Merci pour le fichier! Comment puis-je vous aider avec nos produits bio? Pouvez-vous me dire ce que vous cherchez?', 
                phoneNumberId
            );
        }
    } catch (error) {
        console.error('❌ Error processing WhatsApp media message:', error);
        await sendWhatsAppTextMessage(senderId, 'Une erreur s\'est produite lors du traitement de votre fichier. Veuillez réessayer.', phoneNumberId);
    }
}

// Process WhatsApp image messages with vision AI
async function processWhatsAppImageMessage(senderId, imageData, session, phoneNumberId, mediaType = 'image') {
    try {
        console.log(`\n🖼️ Processing WhatsApp ${mediaType} message`);
        console.log(`- Image ID: ${imageData.id}`);
        console.log(`- MIME type: ${imageData.mime_type}`);
        
        // Send typing indicator (WhatsApp doesn't have typing indicators, so we'll mark as read)
        await sendWhatsAppTypingIndicator(senderId, true, phoneNumberId);
        
        // Send initial acknowledgment
        await sendWhatsAppTextMessage(senderId, 'J\'analyse votre image... 🔍', phoneNumberId);
        
        try {
            // Get WhatsApp media URL using the media ID
            const mediaUrl = await getWhatsAppMediaUrl(imageData.id);
            if (!mediaUrl) {
                throw new Error('Could not retrieve media URL from WhatsApp');
            }
            
            // Download the image from WhatsApp
            const config = getWhatsAppConfig();
            const headers = {
                'Authorization': `Bearer ${config.WHATSAPP_ACCESS_TOKEN}`
            };
            
            const imageBuffer = await openAIService.downloadImage(mediaUrl, headers);
            
            // Validate the image
            const fileName = imageData.filename || `image.${imageData.mime_type?.split('/')[1] || 'jpg'}`;
            const validation = openAIService.validateFile(fileName, imageBuffer.length);
            
            if (!validation.valid) {
                throw new Error(validation.error);
            }
            
            console.log(`📊 Image validation: ${validation.type}, size: ${imageBuffer.length} bytes`);
            
            // Process image with vision model
            const textMessage = session.userProfile.name.includes('User') 
                ? 'Analysez cette image et recommandez des produits appropriés de notre catalogue bio.'
                : `Analysez cette image pour ${session.userProfile.name} et recommandez des produits appropriés de notre catalogue bio.`;
                
            const response = await openAIService.processImageMessage(
                session.threadId,
                textMessage,
                imageBuffer,
                {
                    language: detectLanguage(textMessage),
                    customerName: session.userProfile.name,
                    userType: 'customer',
                    platform: 'whatsapp'
                }
            );
            
            // Turn off typing indicator
            await sendWhatsAppTypingIndicator(senderId, false, phoneNumberId);
            
            // Send the AI response
            await sendWhatsAppTextMessage(senderId, response, phoneNumberId);
            
            console.log('✅ WhatsApp image processed successfully with vision AI');
            
        } catch (visionError) {
            console.error('❌ WhatsApp vision processing failed:', visionError);
            
            // Turn off typing indicator
            await sendWhatsAppTypingIndicator(senderId, false, phoneNumberId);
            
            // Send fallback message based on error type
            let fallbackMessage;
            if (visionError.message.includes('too large')) {
                fallbackMessage = 'L\'image est trop volumineuse. Veuillez envoyer une image plus petite ou décrire le produit par texte.';
            } else if (visionError.message.includes('not support')) {
                fallbackMessage = 'Désolé, l\'analyse d\'images n\'est pas disponible actuellement. Pouvez-vous décrire le produit que vous cherchez?';
            } else if (visionError.message.includes('Unsupported file type')) {
                fallbackMessage = 'Type de fichier non supporté. Veuillez envoyer une image (JPG, PNG, GIF, WebP) ou décrire le produit par texte.';
            } else {
                fallbackMessage = 'Je n\'ai pas pu analyser cette image. Pouvez-vous décrire le produit que vous cherchez ou envoyer une autre image?';
            }
            
            await sendWhatsAppTextMessage(senderId, fallbackMessage, phoneNumberId);
        }
        
    } catch (error) {
        console.error('❌ Error processing WhatsApp image:', error);
        await sendWhatsAppTypingIndicator(senderId, false, phoneNumberId);
        await sendWhatsAppTextMessage(senderId, 'Une erreur s\'est produite lors de l\'analyse de l\'image. Veuillez réessayer.', phoneNumberId);
    }
}

// Get WhatsApp media URL from media ID
async function getWhatsAppMediaUrl(mediaId) {
    try {
        console.log(`🔗 Getting WhatsApp media URL for ID: ${mediaId}`);
        
        const config = getWhatsAppConfig();
        if (!config.WHATSAPP_ACCESS_TOKEN) {
            throw new Error('WhatsApp access token not configured');
        }
        
        const response = await fetch(`https://graph.facebook.com/v21.0/${mediaId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${config.WHATSAPP_ACCESS_TOKEN}`
            }
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ Failed to get media URL: ${response.status} - ${errorText}`);
            throw new Error(`Failed to get media URL: ${response.status}`);
        }
        
        const mediaInfo = await response.json();
        console.log(`✅ Media URL retrieved: ${mediaInfo.url}`);
        
        return mediaInfo.url;
    } catch (error) {
        console.error('❌ Error getting WhatsApp media URL:', error);
        return null;
    }
}

// Process WhatsApp interactive messages (buttons, lists)
async function processWhatsAppInteractiveMessage(senderId, interactive, session, phoneNumberId) {
    try {
        console.log(`🔘 Processing WhatsApp interactive message`);
        
        let responseText = '';
        
        if (interactive.type === 'button_reply') {
            const buttonId = interactive.button_reply.id;
            console.log(`Button clicked: ${buttonId}`);
            
            switch (buttonId) {
                case 'show_products':
                    responseText = 'Voici nos produits biologiques...';
                    break;
                case 'contact_human':
                    responseText = 'Un conseiller va vous contacter prochainement. Merci pour votre patience!';
                    break;
                default:
                    responseText = 'Option sélectionnée. Comment puis-je vous aider?';
            }
        } else if (interactive.type === 'list_reply') {
            const listId = interactive.list_reply.id;
            console.log(`List item selected: ${listId}`);
            responseText = 'Merci pour votre sélection. Comment puis-je vous aider?';
        }
        
        await sendWhatsAppTextMessage(senderId, responseText, phoneNumberId);
    } catch (error) {
        console.error('❌ Error processing WhatsApp interactive message:', error);
    }
}

// Send WhatsApp text message
async function sendWhatsAppTextMessage(to, text, phoneNumberId) {
    try {
        console.log(`📤 Sending WhatsApp message to ${to}`);
        
        const config = getWhatsAppConfig();
        if (!config.WHATSAPP_ACCESS_TOKEN || !phoneNumberId) {
            console.error('❌ WhatsApp access token or phone number ID not configured');
            return false;
        }
        
        const messageData = {
            messaging_product: 'whatsapp',
            to: to,
            type: 'text',
            text: {
                body: text
            }
        };
        
        console.log(`📝 WhatsApp request body: ${JSON.stringify(messageData, null, 2)}`);
        
        const response = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${config.WHATSAPP_ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(messageData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            console.log('✅ WhatsApp message sent successfully:', result);
            return true;
        } else {
            console.error('❌ WhatsApp message sending failed:', result);
            return false;
        }
    } catch (error) {
        console.error('❌ Error sending WhatsApp message:', error);
        return false;
    }
}

// Send WhatsApp image message
async function sendWhatsAppImageMessage(to, imageUrl, caption, phoneNumberId) {
    try {
        console.log(`📤 Sending WhatsApp image to ${to}: ${imageUrl}`);
        
        const config = getWhatsAppConfig();
        if (!config.WHATSAPP_ACCESS_TOKEN || !phoneNumberId) {
            console.error('❌ WhatsApp access token or phone number ID not configured');
            return false;
        }
        
        const messageData = {
            messaging_product: 'whatsapp',
            to: to,
            type: 'image',
            image: {
                link: imageUrl
            }
        };
        
        // Add caption if provided
        if (caption) {
            messageData.image.caption = caption;
        }
        
        console.log(`📝 WhatsApp image request body: ${JSON.stringify(messageData, null, 2)}`);
        
        const response = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${config.WHATSAPP_ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(messageData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            console.log('✅ WhatsApp image sent successfully:', result);
            return true;
        } else {
            console.error('❌ WhatsApp image sending failed:', result);
            // Fallback to text message
            await sendWhatsAppTextMessage(to, caption || 'Image du produit demandé', phoneNumberId);
            return false;
        }
    } catch (error) {
        console.error('❌ Error sending WhatsApp image:', error);
        // Fallback to text message
        await sendWhatsAppTextMessage(to, caption || 'Désolé, je ne peux pas envoyer l\'image pour le moment.', phoneNumberId);
        return false;
    }
}

// Send WhatsApp typing indicator
async function sendWhatsAppTypingIndicator(to, isTyping, phoneNumberId) {
    try {
        const config = getWhatsAppConfig();
        if (!config.WHATSAPP_ACCESS_TOKEN || !phoneNumberId) {
            return false;
        }
        
        if (isTyping) {
            // WhatsApp doesn't have typing indicators like Messenger
            // We can send a "seen" status instead
            console.log(`👁️ Marking WhatsApp message as read for ${to}`);
        }
        
        return true;
    } catch (error) {
        console.error('❌ Error sending WhatsApp typing indicator:', error);
        return false;
    }
}

// Send WhatsApp button message
async function sendWhatsAppButtonMessage(to, text, buttons, phoneNumberId) {
    try {
        const config = getWhatsAppConfig();
        if (!config.WHATSAPP_ACCESS_TOKEN || !phoneNumberId) {
            return false;
        }
        
        const messageData = {
            messaging_product: 'whatsapp',
            to: to,
            type: 'interactive',
            interactive: {
                type: 'button',
                body: {
                    text: text
                },
                action: {
                    buttons: buttons.map((button, index) => ({
                        type: 'reply',
                        reply: {
                            id: button.id || `button_${index}`,
                            title: button.title.substring(0, 20) // WhatsApp button title limit
                        }
                    }))
                }
            }
        };
        
        const response = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${config.WHATSAPP_ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(messageData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            console.log('✅ WhatsApp button message sent successfully:', result);
            return true;
        } else {
            console.error('❌ WhatsApp button message sending failed:', result);
            return false;
        }
    } catch (error) {
        console.error('❌ Error sending WhatsApp button message:', error);
        return false;
    }
}

// Detect language from message text
function detectLanguage(text) {
    // Simple language detection based on Arabic characters
    const arabicPattern = /[\u0600-\u06FF]/;
    return arabicPattern.test(text) ? 'ar' : 'fr';
}

// Cleanup inactive sessions periodically
function cleanupInactiveWhatsAppSessions() {
    const now = new Date();
    const inactiveThreshold = 30 * 60 * 1000; // 30 minutes
    
    for (const [userId, session] of whatsappSessions) {
        if (now - session.lastActivity > inactiveThreshold) {
            console.log(`🧹 Cleaning up inactive WhatsApp session for user ${userId}`);
            whatsappSessions.delete(userId);
        }
    }
}

// Run cleanup every 15 minutes
setInterval(cleanupInactiveWhatsAppSessions, 15 * 60 * 1000);

// Debug endpoints
router.get('/debug/sessions', (req, res) => {
    console.log('🐛 WhatsApp debug sessions endpoint called');
    const sessions = Array.from(whatsappSessions.entries()).map(([userId, session]) => ({
        userId,
        platform: session.platform,
        threadId: session.threadId,
        messageCount: session.messageCount,
        lastActivity: session.lastActivity,
        userProfile: session.userProfile
    }));
    
    res.json({
        success: true,
        data: {
            activeSessions: sessions.length,
            sessions: sessions
        }
    });
});

router.get('/debug/config', (req, res) => {
    console.log('🐛 WhatsApp debug config endpoint called');
    const config = getWhatsAppConfig();
    
    res.json({
        success: true,
        data: {
            hasVerifyToken: !!config.WHATSAPP_VERIFY_TOKEN,
            hasAccessToken: !!config.WHATSAPP_ACCESS_TOKEN,
            hasAppSecret: !!config.WHATSAPP_APP_SECRET,
            hasPhoneNumberId: !!config.WHATSAPP_PHONE_NUMBER_ID,
            hasBusinessAccountId: !!config.WHATSAPP_BUSINESS_ACCOUNT_ID,
            verifyToken: config.WHATSAPP_VERIFY_TOKEN,
            phoneNumberId: config.WHATSAPP_PHONE_NUMBER_ID
        }
    });
});

export default router; 