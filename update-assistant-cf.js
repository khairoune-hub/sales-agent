import { OpenAI } from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const ASSISTANT_ID = 'asst_6L1tElqeiaK2fNBoLNuy7tgp';

async function updateAssistant() {
    try {
        console.log('🔄 Updating OpenAI Assistant for Cloudflare Workers...');
        
        const assistant = await openai.beta.assistants.update(ASSISTANT_ID, {
            name: "X Company Bio Products Sales Assistant - CF",
            description: "Sales assistant for X Company Bio Products with optimized order processing",
            instructions: `You are a professional sales assistant for X Company Bio Products, a bio products company in Algeria.

CRITICAL ORDER PROCESSING RULES:
1. When a customer wants to order, collect ALL required info in ONE response:
   - Customer name (full name)
   - Phone number
   - Wilaya (province/region)
   - Product name
   - Quantity (default to 1 if not specified)

2. IMMEDIATELY call place_order function once you have all required info - DO NOT ask for confirmations.

3. For honey/miel orders: use "miel" as product_name parameter.

4. NEVER ask multiple confirmations like "are you sure?" - process orders directly.

5. Respond in French by default.

6. Be efficient and direct - avoid repetitive questions.

EXAMPLE GOOD FLOW:
Customer: "je veux commander du miel moussa khairoune 0778053400 alger"
You: Extract info and call place_order({product_name: "miel", quantity: 1, customer_name: "moussa khairoune", customer_phone: "0778053400", wilaya: "alger"})

AVAILABLE FUNCTIONS:
- check_product_availability: Check products and show catalog
- place_order: Process orders immediately (no confirmations needed)
- save_client_data: Save customer information
- generate_sales_report: Generate sales reports

Process orders efficiently and professionally.`,
            model: "gpt-4o",
            tools: [
                {
                    type: 'function',
                    function: {
                        name: 'check_product_availability',
                        description: 'Check availability of bio products and show catalog',
                        parameters: {
                            type: 'object',
                            properties: {
                                product_name: {
                                    type: 'string',
                                    description: 'Name or type of product to check (optional - leave empty to show all products)'
                                }
                            }
                        }
                    }
                },
                {
                    type: 'function',
                    function: {
                        name: 'place_order',
                        description: 'Process customer order immediately - call this function as soon as you have all required information',
                        parameters: {
                            type: 'object',
                            properties: {
                                product_name: {
                                    type: 'string',
                                    description: 'Name of the product (use "miel" for honey orders)'
                                },
                                quantity: {
                                    type: 'integer',
                                    description: 'Quantity to order (default to 1 if not specified)',
                                    default: 1
                                },
                                customer_phone: {
                                    type: 'string',
                                    description: 'Customer phone number'
                                },
                                customer_name: {
                                    type: 'string',
                                    description: 'Customer full name'
                                },
                                wilaya: {
                                    type: 'string',
                                    description: 'Wilaya (province) for delivery'
                                }
                            },
                            required: ['product_name', 'quantity', 'customer_phone', 'customer_name', 'wilaya']
                        }
                    }
                },
                {
                    type: 'function',
                    function: {
                        name: 'save_client_data',
                        description: 'Save customer information',
                        parameters: {
                            type: 'object',
                            properties: {
                                name: {
                                    type: 'string',
                                    description: 'Customer full name'
                                },
                                phone: {
                                    type: 'string',
                                    description: 'Customer phone number'
                                },
                                wilaya: {
                                    type: 'string',
                                    description: 'Customer wilaya (province)'
                                }
                            },
                            required: ['name', 'phone', 'wilaya']
                        }
                    }
                },
                {
                    type: 'function',
                    function: {
                        name: 'generate_sales_report',
                        description: 'Generate sales reports and analytics',
                        parameters: {
                            type: 'object',
                            properties: {
                                period: {
                                    type: 'string',
                                    description: 'Report period (week, month, etc.)',
                                    default: 'week'
                                },
                                user_type: {
                                    type: 'string',
                                    description: 'User type requesting report',
                                    default: 'admin'
                                }
                            }
                        }
                    }
                }
            ]
        });

        console.log('✅ Assistant updated successfully!');
        console.log(`Assistant ID: ${assistant.id}`);
        console.log(`Name: ${assistant.name}`);
        console.log(`Tools: ${assistant.tools.length} functions available`);
        
        // List the function names
        const functionNames = assistant.tools
            .filter(tool => tool.type === 'function')
            .map(tool => tool.function.name);
        console.log(`Functions: ${functionNames.join(', ')}`);
        
    } catch (error) {
        console.error('❌ Error updating assistant:', error);
    }
}

updateAssistant(); 