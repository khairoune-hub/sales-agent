import OpenAI from 'openai';
import { writeFileSync } from 'fs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.dev.vars' });

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_CONTEXT = {
    fr: `Tu es un assistant commercial expert pour X Company, spécialisé dans les produits biologiques et naturels. 

PRODUITS DISPONIBLES:
- Poudre de Protéines Bio (Vanille) - 45.99€ - Récupération musculaire, protéines complètes
- Thé Vert Biologique (50 sachets) - 18.99€ - Antioxydants, boost métabolisme
- Complexe Multivitamines Bio - 32.99€ - Support immunitaire, énergie naturelle
- Miel Pur Biologique (500g) - 24.99€ - Antibactérien naturel, source d'énergie
- Huile de Poisson Oméga-3 Bio - 28.99€ - Santé cardiovasculaire, fonction cérébrale
- Huile de Noix de Coco Biologique (500ml) - 22.99€ - MCT naturels, polyvalent
- Comprimés de Spiruline Bio - 35.99€ - Protéines complètes, détoxification
- Graines de Chia Biologiques (250g) - 16.99€ - Oméga-3 végétal, fibres

PROCESSUS DE COMMANDE POUR L'ALGÉRIE:
1. Présenter le produit et son prix
2. Demander: NOM COMPLET du client
3. Demander: NUMÉRO DE TÉLÉPHONE (format algérien)
4. Demander: WILAYA (province) de livraison
5. Confirmer la commande avec tous les détails

INSTRUCTIONS:
- Sois chaleureux, professionnel et informatif
- Recommande des produits adaptés aux besoins du client
- Explique les bienfaits des produits biologiques
- Pour les commandes, collecte OBLIGATOIREMENT: nom, téléphone, wilaya
- Utilise la fonction save_order_data pour enregistrer les commandes complètes
- Réponds en français sauf si le client préfère l'arabe
- Pose des questions pour mieux comprendre les besoins`
};

async function updateAssistant() {
    try {
        console.log('🔄 Updating OpenAI Assistant with new functions...');
        
        // Delete old assistant if exists
        try {
            const assistantId = process.env.OPENAI_ASSISTANT_ID || 'asst_abc123';
            await openai.beta.assistants.del(assistantId);
            console.log('🗑️ Old assistant deleted');
        } catch (error) {
            console.log('ℹ️ No old assistant to delete');
        }
        
        // Create new assistant with updated functions
        const assistant = await openai.beta.assistants.create({
            name: 'X Company Bio Products Assistant (FR)',
            instructions: SYSTEM_CONTEXT.fr,
            model: 'gpt-4-turbo-preview',
            tools: [
                {
                    type: 'function',
                    function: {
                        name: 'get_product_info',
                        description: 'Get detailed information about a specific product',
                        parameters: {
                            type: 'object',
                            properties: {
                                productId: {
                                    type: 'string',
                                    description: 'The product ID'
                                }
                            },
                            required: ['productId']
                        }
                    }
                },
                {
                    type: 'function',
                    function: {
                        name: 'search_products',
                        description: 'Search for products based on criteria',
                        parameters: {
                            type: 'object',
                            properties: {
                                query: {
                                    type: 'string',
                                    description: 'Search query'
                                },
                                category: {
                                    type: 'string',
                                    description: 'Product category'
                                }
                            }
                        }
                    }
                },
                {
                    type: 'function',
                    function: {
                        name: 'check_product_availability',
                        description: 'Check availability of products, especially supplements',
                        parameters: {
                            type: 'object',
                            properties: {
                                product_name: {
                                    type: 'string',
                                    description: 'Name or type of product to check'
                                }
                            }
                        }
                    }
                },
                {
                    type: 'function',
                    function: {
                        name: 'get_all_products',
                        description: 'Get all available products with full details',
                        parameters: {
                            type: 'object',
                            properties: {}
                        }
                    }
                },
                {
                    type: 'function',
                    function: {
                        name: 'save_client_data',
                        description: 'Save client information (name, phone, wilaya) for Algeria',
                        parameters: {
                            type: 'object',
                            properties: {
                                name: {
                                    type: 'string',
                                    description: 'Full name of the client'
                                },
                                phone: {
                                    type: 'string',
                                    description: 'Phone number (Algerian format)'
                                },
                                wilaya: {
                                    type: 'string',
                                    description: 'Wilaya (province) in Algeria'
                                },
                                address: {
                                    type: 'string',
                                    description: 'Optional address details'
                                }
                            },
                            required: ['name', 'phone']
                        }
                    }
                },
                {
                    type: 'function',
                    function: {
                        name: 'save_order_data',
                        description: 'Save complete order with customer info, product, and delivery details for Algeria',
                        parameters: {
                            type: 'object',
                            properties: {
                                customer_name: {
                                    type: 'string',
                                    description: 'Full name of the customer'
                                },
                                customer_phone: {
                                    type: 'string',
                                    description: 'Customer phone number'
                                },
                                wilaya: {
                                    type: 'string',
                                    description: 'Wilaya (province) for delivery'
                                },
                                product_name: {
                                    type: 'string',
                                    description: 'Name of the ordered product'
                                },
                                product_id: {
                                    type: 'string',
                                    description: 'Product ID'
                                },
                                quantity: {
                                    type: 'integer',
                                    description: 'Quantity ordered'
                                },
                                unit_price: {
                                    type: 'number',
                                    description: 'Unit price of the product'
                                },
                                address: {
                                    type: 'string',
                                    description: 'Optional detailed address'
                                },
                                notes: {
                                    type: 'string',
                                    description: 'Optional order notes'
                                }
                            },
                            required: ['customer_name', 'customer_phone', 'wilaya', 'product_name', 'quantity', 'unit_price']
                        }
                    }
                }
            ]
        });
        
        console.log(`✅ New assistant created: ${assistant.id}`);
        
        // Save assistant ID to file
        writeFileSync('.assistant-id', assistant.id);
        console.log('💾 Assistant ID saved to .assistant-id file');
        
        console.log('\n🎉 Assistant updated successfully!');
        console.log('🔄 Please restart the server to use the new assistant');
        
    } catch (error) {
        console.error('❌ Error updating assistant:', error);
    }
}

updateAssistant(); 