import OpenAI from 'openai';
import { writeFileSync } from 'fs';
import dotenv from 'dotenv';
import { SYSTEM_CONTEXT } from './src/SYSTEM_CONTEXT.js';

// Load environment variables
dotenv.config({ path: '.dev.vars' });

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

async function updateAssistant() {
    try {
        console.log('🔄 Updating OpenAI Assistant for Lingerie Store...');
        
        // Delete old assistant if exists
        try {
            const assistantId = process.env.ASSISTANT_ID || 'asst_0nGWVax2ikC68QVBvZMLPVlQ';
            await openai.beta.assistants.del(assistantId);
            console.log('🗑️ Old assistant deleted');
        } catch (error) {
            console.log('ℹ️ No old assistant to delete');
        }
        
        // Create new assistant with updated functions
        const assistant = await openai.beta.assistants.create({
            name: 'Lingerie Store Assistant (FR/AR)',
            instructions: SYSTEM_CONTEXT.fr,
            model: 'gpt-4o',
            tools: [
                {
                    type: 'function',
                    function: {
                        name: 'get_product_info',
                        description: 'Get detailed information about a specific lingerie product',
                        parameters: {
                            type: 'object',
                            properties: {
                                productId: {
                                    type: 'string',
                                    description: 'The product ID or SKU'
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
                        description: 'Search for lingerie products based on criteria',
                        parameters: {
                            type: 'object',
                            properties: {
                                query: {
                                    type: 'string',
                                    description: 'Search query (e.g., "push-up", "cotton", "red")'
                                },
                                category: {
                                    type: 'string',
                                    description: 'Product category (soutiens-gorge, culottes, ensembles, etc.)'
                                },
                                size: {
                                    type: 'string',
                                    description: 'Size filter (85A, 90B, S, M, L, etc.)'
                                },
                                color: {
                                    type: 'string',
                                    description: 'Color filter (rose, noir, rouge, blanc, etc.)'
                                }
                            }
                        }
                    }
                },
                {
                    type: 'function',
                    function: {
                        name: 'check_product_availability',
                        description: 'Check availability of lingerie products and sizes',
                        parameters: {
                            type: 'object',
                            properties: {
                                product_name: {
                                    type: 'string',
                                    description: 'Name or type of product to check'
                                },
                                size: {
                                    type: 'string',
                                    description: 'Specific size to check'
                                },
                                color: {
                                    type: 'string',
                                    description: 'Specific color to check'
                                }
                            }
                        }
                    }
                },
                {
                    type: 'function',
                    function: {
                        name: 'get_all_products',
                        description: 'Get all available lingerie products with full details',
                        parameters: {
                            type: 'object',
                            properties: {
                                category: {
                                    type: 'string',
                                    description: 'Optional category filter'
                                }
                            }
                        }
                    }
                },
                {
                    type: 'function',
                    function: {
                        name: 'save_client_data',
                        description: 'Save client information for lingerie orders',
                        parameters: {
                            type: 'object',
                            properties: {
                                name: {
                                    type: 'string',
                                    description: 'Full name of the client'
                                },
                                phone: {
                                    type: 'string',
                                    description: 'Phone number'
                                },
                                address: {
                                    type: 'string',
                                    description: 'Delivery address'
                                },
                                preferred_sizes: {
                                    type: 'string',
                                    description: 'Preferred sizes (e.g., "90B, M")'
                                }
                            },
                            required: ['name', 'phone', 'address']
                        }
                    }
                },
                {
                    type: 'function',
                    function: {
                        name: 'save_order_data',
                        description: 'Save complete lingerie order with customer info, product, and delivery details',
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
                                address: {
                                    type: 'string',
                                    description: 'Delivery address'
                                },
                                product_name: {
                                    type: 'string',
                                    description: 'Name of the ordered product'
                                },
                                product_id: {
                                    type: 'string',
                                    description: 'Product ID or SKU'
                                },
                                size: {
                                    type: 'string',
                                    description: 'Size ordered (e.g., "90B", "M")'
                                },
                                color: {
                                    type: 'string',
                                    description: 'Color ordered'
                                },
                                quantity: {
                                    type: 'integer',
                                    description: 'Quantity ordered'
                                },
                                unit_price: {
                                    type: 'number',
                                    description: 'Unit price of the product'
                                },
                                notes: {
                                    type: 'string',
                                    description: 'Optional order notes'
                                }
                            },
                            required: ['customer_name', 'customer_phone', 'address', 'product_name', 'size', 'quantity', 'unit_price']
                        }
                    }
                }
            ]
        });

        // Save the assistant ID
        writeFileSync('.assistant-id', assistant.id);
        console.log('✅ Assistant updated successfully!');
        console.log('🆔 Assistant ID:', assistant.id);
        console.log('📝 Instructions updated for lingerie store');
        console.log('🛍️ Products configured: Soutiens-gorge, Culottes, Ensembles, Nuisettes, Bodies, etc.');
        console.log('🌍 Languages: French and Arabic');
        console.log('📏 Sizes: 85A-100D for bras, S-XL for panties');
        console.log('🎨 Colors: Rose, Noir, Rouge, Blanc, Nude, Beige');

    } catch (error) {
        console.error('❌ Error updating assistant:', error.message);
        throw error;
    }
}

// Run the update
updateAssistant().catch(console.error); 