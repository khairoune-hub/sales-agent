// Cloudflare Workers entry point for the sales agent
// Production-ready implementation with real service integrations

// Import system context
const SYSTEM_CONTEXT = {
  fr: `Tu es un assistant commercial expert pour une boutique de lingerie féminine, spécialisé dans les soutiens-gorge, culottes, ensembles et vêtements de nuit.

INSTRUCTIONS IMPORTANTES:
- TOUJOURS utiliser les fonctions disponibles pour obtenir les informations produits à jour
- NE PAS inventer de produits ou de prix
- NE JAMAIS inclure des liens d'images ou du markdown dans tes réponses
- Utiliser search_products() pour chercher des produits par nom, catégorie, couleur, taille ou description
- Utiliser get_all_products() pour voir tous les produits disponibles
- Utiliser check_product_availability() pour vérifier les stocks
- Utiliser get_product_info() pour obtenir les détails complets d'un produit
- Utiliser get_product_variants() pour voir les couleurs et tailles disponibles d'un produit
- TOUJOURS utiliser send_product_image() après avoir présenté un produit pour envoyer son image

PROCESSUS DE COMMANDE:
1. Présenter le produit et son prix (obtenu via les fonctions)
2. Utiliser get_product_variants() pour vérifier les options disponibles
3. Demander: NOM COMPLET du client
4. Demander: NUMÉRO DE TÉLÉPHONE
5. Demander: ADRESSE DE LIVRAISON
6. Demander: TAILLE et COULEUR souhaitées (si applicable selon les variantes)
7. Confirmer la commande avec tous les détails

INSTRUCTIONS:
- Sois chaleureux, professionnel et discret
- Recommande des produits adaptés aux besoins et occasions
- Explique les avantages (confort, qualité, style)
- Pour les commandes, collecte OBLIGATOIREMENT: nom, téléphone, adresse, taille
- Utilise la fonction save_order pour enregistrer les commandes
- Réponds en français sauf si le client préfère l'arabe
- Pose des questions pour mieux comprendre les besoins et occasions
- Sois respectueux et professionnel dans tes réponses
- Propose des ensembles assortis quand c'est approprié
- Mentionne les promotions et prix réduits quand disponibles

CONSEILS DE VENTE:
- Commence par demander l'occasion (quotidien, sport, occasion spéciale, soirée)
- Quand un client demande un produit spécifique, utilise search_products() pour le trouver
- Utilise search_products() avec des filtres pour couleur et taille si demandés
- TOUJOURS utilise get_product_variants() pour vérifier les couleurs et tailles disponibles
- Quand un client demande "quelles tailles/couleurs disponibles", utilise get_product_variants()
- Ne fais JAMAIS d'hypothèses sur les variantes - vérifie toujours avec get_product_variants()
- Suggère des ensembles assortis disponibles
- Explique les matériaux et leurs avantages
- Propose des tailles appropriées selon la disponibilité des variantes
- Vérifie toujours les stocks avec check_product_availability()
- Après avoir décrit un produit, utilise TOUJOURS send_product_image(productName) pour envoyer son image
- NE PAS inclure d'images en markdown, utilise la fonction send_product_image() à la place
- Informe le client des différentes couleurs et tailles disponibles pour chaque produit

FONCTIONS DISPONIBLES:
- search_products(query, category, color, size, price_min, price_max): Rechercher des produits avec filtres
- get_all_products(): Obtenir tous les produits
- get_product_info(productId): Détails d'un produit
- get_product_variants(productId): Voir couleurs et tailles disponibles
- check_product_availability(): Vérifier les stocks
- save_order(): Enregistrer une commande
- send_product_image(productName): Envoyer l'image d'un produit`,

  ar: `أنت مساعد تجاري محترف لمتجر متخصص في بيع الملابس الداخلية النسائية، وتركز بشكل خاص على حمالات الصدر، والسراويل الداخلية، والأطقم، وملابس النوم.

التعليمات المهمة:
- استخدم دائماً الوظائف المتاحة للحصول على معلومات المنتجات المحدثة
- لا تخترع منتجات أو أسعار
- لا تدرج أبداً روابط الصور أو رموز markdown في إجاباتك
- استخدم search_products() للبحث عن منتجات بالاسم أو الفئة أو اللون أو المقاس أو الوصف
- استخدم get_all_products() لرؤية جميع المنتجات المتاحة
- استخدم check_product_availability() للتحقق من المخزون
- استخدم get_product_info() للحصول على التفاصيل الكاملة للمنتج
- استخدم get_product_variants() لرؤية الألوان والمقاسات المتاحة للمنتج
- استخدم دائماً send_product_image() بعد تقديم منتج لإرسال صورته

عملية الطلب:
1. تقديم المنتج وسعره (المحصل عليه عبر الوظائف)
2. استخدام get_product_variants() للتحقق من الخيارات المتاحة
3. طلب الاسم الكامل للعميلة
4. طلب رقم الهاتف
5. طلب عنوان التوصيل
6. طلب المقاس واللون المطلوب (إن وُجد حسب المتغيرات)
7. تأكيد الطلب بجميع التفاصيل

التعليمات:
- كن دافئًا، مهنيًا ومحترمًا
- اقترح منتجات مناسبة لاحتياجات العميلة والمناسبات
- اشرح مزايا المنتجات (الراحة، الجودة، الأسلوب)
- من الضروري جمع: الاسم، رقم الهاتف، العنوان، المقاس
- استخدم دالة save_order لتسجيل الطلبات
- أجب باللغة العربية إلا إذا طلبت العميلة الفرنسية
- اسأل أسئلة لفهم احتياجاتها ومناسباتها بشكل أفضل
- كن لبقًا ومهنيًا في إجاباتك
- اقترح أطقم متناسقة عندما يكون ذلك مناسبًا
- أشر إلى العروض أو التخفيضات إن وُجدت

نصائح للبيع:
- ابدأ بالسؤال عن المناسبة (الاستخدام اليومي، الرياضة، مناسبة خاصة، سهرة)
- عندما يطلب عميل منتج محدد، استخدم search_products() للعثور عليه
- استخدم search_products() مع المرشحات للون والمقاس إذا طُلب
- استخدم دائماً get_product_variants() للتحقق من الألوان والمقاسات المتاحة
- عندما يسأل العميل "ما المقاسات/الألوان المتاحة"، استخدم get_product_variants()
- لا تقم أبداً بافتراضات حول المتغيرات - تحقق دائماً باستخدام get_product_variants()
- اقترح أطقم متناسقة متوفرة
- اشرح المواد المستخدمة وفوائدها
- اقترح مقاسات مناسبة حسب توفر المتغيرات
- تحقق دائماً من المخزون باستخدام check_product_availability()
- بعد وصف منتج، استخدم دائماً send_product_image(productName) لإرسال صورته
- لا تدرج صور markdown، استخدم وظيفة send_product_image() بدلاً من ذلك
- أخبر العميلة عن الألوان والمقاسات المختلفة المتاحة لكل منتج

الوظائف المتاحة:
- search_products(query, category, color, size, price_min, price_max): البحث عن منتجات مع المرشحات
- get_all_products(): الحصول على جميع المنتجات
- get_product_info(productId): تفاصيل منتج
- get_product_variants(productId): رؤية الألوان والمقاسات المتاحة
- check_product_availability(): التحقق من المخزون
- save_order(): تسجيل طلب
- send_product_image(productName): إرسال صورة منتج`
};

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Max-Age': '86400',
};

// Create JSON response with CORS
const jsonResponse = (data, status = 200) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  });
};

// Create error response
const errorResponse = (message, status = 500, details = null) => {
  const error = {
    error: true,
    message,
    timestamp: new Date().toISOString(),
    status
  };
  if (details) error.details = details;
  return jsonResponse(error, status);
};

// Session storage using Map (temporary storage in memory)
// In production, you might want to use Cloudflare KV for persistent storage
const messengerSessions = new Map();
const whatsappSessions = new Map();

// Clean up old sessions periodically (simple memory management)
const cleanupSessions = () => {
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours

  for (const [key, session] of messengerSessions.entries()) {
    if (now - new Date(session.createdAt).getTime() > maxAge) {
      messengerSessions.delete(key);
    }
  }

  for (const [key, session] of whatsappSessions.entries()) {
    if (now - new Date(session.createdAt).getTime() > maxAge) {
      whatsappSessions.delete(key);
    }
  }
};

// ===============================
// SUPABASE SERVICE INTEGRATION
// ===============================

class SupabaseService {
  constructor(env) {
    this.supabaseUrl = env.SUPABASE_URL;
    this.supabaseKey = env.SUPABASE_SERVICE_KEY;
  }

  async query(table, options = {}) {
    if (!this.supabaseUrl || !this.supabaseKey) {
      throw new Error('Supabase not configured');
    }

    const { select = '*', filters = {}, limit = 50, offset = 0 } = options;
    
    let url = `${this.supabaseUrl}/rest/v1/${table}?select=${select}`;
    
    // Add filters
    Object.entries(filters).forEach(([key, value]) => {
      url += `&${key}=eq.${value}`;
    });
    
    if (limit) url += `&limit=${limit}`;
    if (offset) url += `&offset=${offset}`;

    console.log(`Supabase query URL: ${url}`);

    const response = await fetch(url, {
      headers: {
        'apikey': this.supabaseKey,
        'Authorization': `Bearer ${this.supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Supabase query failed: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`Supabase query failed: ${response.status} - ${errorText}`);
    }

    return await response.json();
  }

  async insert(table, data) {
    if (!this.supabaseUrl || !this.supabaseKey) {
      throw new Error('Supabase not configured');
    }

    const response = await fetch(`${this.supabaseUrl}/rest/v1/${table}`, {
      method: 'POST',
      headers: {
        'apikey': this.supabaseKey,
        'Authorization': `Bearer ${this.supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`Supabase insert failed: ${response.statusText}`);
    }

    return await response.json();
  }

  async update(table, filters, data) {
    if (!this.supabaseUrl || !this.supabaseKey) {
      throw new Error('Supabase not configured');
    }

    let url = `${this.supabaseUrl}/rest/v1/${table}`;
    
    // Add filters
    const filterParams = Object.entries(filters).map(([key, value]) => `${key}=eq.${value}`).join('&');
    if (filterParams) url += `?${filterParams}`;

    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'apikey': this.supabaseKey,
        'Authorization': `Bearer ${this.supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`Supabase update failed: ${response.statusText}`);
    }

    return await response.json();
  }
}

// ===============================
// OPENAI SERVICE INTEGRATION
// ===============================

class OpenAIService {
  constructor(env) {
    this.apiKey = env.OPENAI_API_KEY;
    this.assistantId = env.ASSISTANT_ID;
    this.model = env.OPENAI_MODEL || 'gpt-4o';
  }

  async getOrCreateAssistant(language = 'fr') {
    if (!this.apiKey) throw new Error('OpenAI not configured');

    try {
      // If we have an assistant ID in env, use it
      if (this.assistantId) {
        console.log(`Using configured assistant: ${this.assistantId}`);
        return this.assistantId;
      }

      // Otherwise, try to get existing assistant or create new one
      const response = await fetch('https://api.openai.com/v1/assistants', {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'assistants=v2'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to list assistants');
      }

      const assistants = await response.json();
      const existingAssistant = assistants.data.find(a => 
        a.name === `Lingerie Store Products Assistant (${language.toUpperCase()})`
      );

      if (existingAssistant) {
        console.log(`Found existing assistant: ${existingAssistant.id}`);
        return existingAssistant.id;
      }

      // Create new assistant with all tools
      const createResponse = await fetch('https://api.openai.com/v1/assistants', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'assistants=v2'
        },
        body: JSON.stringify({
          name: `Lingerie Store Products Assistant (${language.toUpperCase()})`,
          instructions: SYSTEM_CONTEXT[language],
          model: this.model,
          tools: [
            {
              type: 'function',
              function: {
                name: 'search_products',
                description: 'Search for products based on criteria including color, size, and price filters',
                parameters: {
                  type: 'object',
                  properties: {
                    query: {
                      type: 'string',
                      description: 'Search query for product name or description'
                    },
                    category: {
                      type: 'string',
                      description: 'Product category filter'
                    },
                    color: {
                      type: 'string',
                      description: 'Specific color filter for product variants'
                    },
                    size: {
                      type: 'string',
                      description: 'Specific size filter for product variants'
                    },
                    price_min: {
                      type: 'number',
                      description: 'Minimum price filter'
                    },
                    price_max: {
                      type: 'number',
                      description: 'Maximum price filter'
                    },
                    limit: {
                      type: 'integer',
                      description: 'Maximum number of results to return (default: 5)'
                    }
                  }
                }
              }
            },
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
                name: 'get_product_variants',
                description: 'Get available variants (colors, sizes, prices) for a specific product',
                parameters: {
                  type: 'object',
                  properties: {
                    productId: {
                      type: 'string',
                      description: 'The product ID'
                    },
                    availableOnly: {
                      type: 'boolean',
                      description: 'Only return variants that are in stock (default: true)'
                    }
                  },
                  required: ['productId']
                }
              }
            },
            {
              type: 'function',
              function: {
                name: 'check_product_availability',
                description: 'Check overall product availability and stock levels',
                parameters: {
                  type: 'object',
                  properties: {}
                }
              }
            },
            {
              type: 'function',
              function: {
                name: 'get_all_products',
                description: 'Get list of all available products',
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
                description: 'Save customer information for future orders',
                parameters: {
                  type: 'object',
                  properties: {
                    name: {
                      type: 'string',
                      description: 'Full name of the customer'
                    },
                    phone: {
                      type: 'string',
                      description: 'Customer phone number'
                    },
                    wilaya: {
                      type: 'string',
                      description: 'Wilaya (province) for delivery'
                    },
                    address: {
                      type: 'string',
                      description: 'Optional detailed address'
                    }
                  },
                  required: ['name', 'phone', 'wilaya']
                }
              }
            },
            {
              type: 'function',
              function: {
                name: 'save_order',
                description: 'Save a complete order with customer and product information',
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
                    customer_email: {
                      type: 'string',
                      description: 'Customer email (optional)'
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
            },
            {
              type: 'function',
              function: {
                name: 'send_product_image',
                description: 'Send a product image to the user when they request to see a product',
                parameters: {
                  type: 'object',
                  properties: {
                    product_name: {
                      type: 'string',
                      description: 'Name of the product to show image for'
                    },
                    product_id: {
                      type: 'string',
                      description: 'ID of the product (optional)'
                    }
                  },
                  required: ['product_name']
                }
              }
            }
          ]
        })
      });

      if (!createResponse.ok) {
        throw new Error('Failed to create assistant');
      }

      const newAssistant = await createResponse.json();
      console.log(`Created new assistant: ${newAssistant.id}`);
      return newAssistant.id;
    } catch (error) {
      console.error('Error with assistant:', error);
      throw error;
    }
  }

  async createThread() {
    if (!this.apiKey) throw new Error('OpenAI not configured');

    const response = await fetch('https://api.openai.com/v1/threads', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      }
    });

    if (!response.ok) {
      throw new Error(`OpenAI create thread failed: ${response.statusText}`);
    }

    const thread = await response.json();
    return thread.id;
  }

  async sendMessage(threadId, content, language = 'fr') {
    if (!this.apiKey) throw new Error('OpenAI not configured');

    // Get or create assistant
    const assistantId = await this.getOrCreateAssistant(language);

    // Add message to thread
    const messageResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({
        role: 'user',
        content: content
      })
    });

    if (!messageResponse.ok) {
      throw new Error(`OpenAI add message failed: ${messageResponse.statusText}`);
    }

    // Run assistant
    const runResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({
        assistant_id: assistantId
      })
    });

    if (!runResponse.ok) {
      throw new Error(`OpenAI run assistant failed: ${runResponse.statusText}`);
    }

    const run = await runResponse.json();
    
    // Wait for completion
    return await this.waitForRunCompletion(threadId, run.id);
  }

  async waitForRunCompletion(threadId, runId, maxAttempts = 20) {
    console.log(`⏳ Waiting for OpenAI run completion: ${runId}`);
    
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${runId}`, {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'OpenAI-Beta': 'assistants=v2'
          },
          signal: AbortSignal.timeout(8000) // Increased timeout to 8 seconds
        });

        if (!response.ok) {
          console.error(`❌ OpenAI run check failed: ${response.status} ${response.statusText}`);
          const errorText = await response.text();
          console.error('Error details:', errorText);
          throw new Error(`OpenAI run check failed: ${response.status} - ${errorText}`);
        }

        const run = await response.json();
        console.log(`📊 OpenAI run status (attempt ${i + 1}/${maxAttempts}): ${run.status}`);
        
        if (run.status === 'completed') {
          console.log('🎉 OpenAI run completed successfully');
          // Get the latest messages
          const messagesResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'OpenAI-Beta': 'assistants=v2'
            },
            signal: AbortSignal.timeout(8000)
          });
          
          if (!messagesResponse.ok) {
            const errorText = await messagesResponse.text();
            throw new Error(`Failed to get messages: ${messagesResponse.status} - ${errorText}`);
          }
          
          const messages = await messagesResponse.json();
          const latestMessage = messages.data[0];
          
          if (latestMessage && latestMessage.content[0]) {
            console.log('✅ OpenAI response retrieved successfully');
            return latestMessage.content[0].text.value;
          }
          
          throw new Error('No response message found in completed run');
        } else if (run.status === 'failed') {
          console.error('❌ OpenAI run failed:', run.last_error);
          throw new Error(`OpenAI run failed: ${run.last_error?.message || 'Unknown error'}`);
        } else if (run.status === 'cancelled') {
          console.error('❌ OpenAI run was cancelled');
          throw new Error('OpenAI run was cancelled - this may indicate a timeout or system issue');
        } else if (run.status === 'expired') {
          console.error('❌ OpenAI run expired');
          throw new Error('OpenAI run expired - took too long to complete');
        } else if (run.status === 'requires_action') {
          console.log('🔧 OpenAI run requires action - handling function calls');
          await this.handleRequiredActions(threadId, runId, run.required_action);
          // Continue the loop to check the run status again
        } else if (run.status === 'in_progress' || run.status === 'queued') {
          // Normal waiting states
          console.log(`⏳ OpenAI run is ${run.status}, waiting...`);
        } else {
          console.warn(`⚠️ Unknown OpenAI run status: ${run.status}`);
        }
        
        // Progressive backoff: wait longer as attempts increase to avoid rate limiting
        const waitTime = Math.min(1000 + (i * 500), 3000); // 1s to 3s max
        await new Promise(resolve => setTimeout(resolve, waitTime));
      } catch (error) {
        console.error(`❌ Error checking OpenAI run status (attempt ${i + 1}):`, error.message);
        if (i === maxAttempts - 1) {
          console.error('🚨 Max attempts reached, failing run');
          throw error;
        }
        // Exponential backoff for retries
        const retryWait = Math.min(1000 * Math.pow(2, i), 5000); // 1s, 2s, 4s, 5s max
        console.log(`⏳ Retrying in ${retryWait}ms...`);
        await new Promise(resolve => setTimeout(resolve, retryWait));
      }
    }
    
    throw new Error(`OpenAI run timeout after ${maxAttempts} attempts - run may be stuck`);
  }

  async handleRequiredActions(threadId, runId, requiredAction) {
    console.log('🔧 Handling required actions:', JSON.stringify(requiredAction, null, 2));
    
    if (requiredAction.type === 'submit_tool_outputs') {
      const toolCalls = requiredAction.submit_tool_outputs.tool_calls;
      const toolOutputs = [];

      for (const toolCall of toolCalls) {
        console.log(`🛠️ Processing tool call: ${toolCall.function.name} with args:`, toolCall.function.arguments);
        
        try {
          const functionName = toolCall.function.name;
          let functionArgs;
          
          // Parse function arguments with better error handling
          try {
            functionArgs = JSON.parse(toolCall.function.arguments);
          } catch (parseError) {
            console.error(`❌ Failed to parse function arguments:`, toolCall.function.arguments);
            throw new Error(`Invalid function arguments: ${parseError.message}`);
          }
          
          let output = '';
          
          // Execute function with timeout to prevent hanging
          const functionPromise = this.executeFunction(functionName, functionArgs);
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error(`Function ${functionName} timeout`)), 15000)
          );
          
          output = await Promise.race([functionPromise, timeoutPromise]);
          
          console.log(`✅ Function ${functionName} completed successfully`);
          
          toolOutputs.push({
            tool_call_id: toolCall.id,
            output: output
          });
          
        } catch (error) {
          console.error(`❌ Error executing function ${toolCall.function.name}:`, error.message);
          toolOutputs.push({
            tool_call_id: toolCall.id,
            output: JSON.stringify({ 
              success: false,
              error: error.message,
              message: `Erreur lors de l'exécution de ${toolCall.function.name}: ${error.message}`
            })
          });
        }
      }

      // Submit tool outputs with retry logic
      console.log('📤 Submitting tool outputs to OpenAI...');
      const maxRetries = 3;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const submitResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${runId}/submit_tool_outputs`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
              'OpenAI-Beta': 'assistants=v2'
            },
            body: JSON.stringify({
              tool_outputs: toolOutputs
            }),
            signal: AbortSignal.timeout(10000) // 10 second timeout
          });

          if (!submitResponse.ok) {
            const errorText = await submitResponse.text();
            throw new Error(`Failed to submit tool outputs: ${submitResponse.status} - ${errorText}`);
          }
          
          console.log('✅ Tool outputs submitted successfully');
          return; // Success, exit retry loop
          
        } catch (error) {
          console.error(`❌ Submit attempt ${attempt} failed:`, error.message);
          if (attempt === maxRetries) {
            throw error;
          }
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }
  }

  async executeFunction(functionName, functionArgs) {
    switch (functionName) {
      case 'search_products':
        return await this.searchProducts(functionArgs);
      case 'get_product_info':
      case 'get_product_details':
        return await this.getProductDetails(functionArgs);
      case 'get_product_variants':
        return await this.getProductVariants(functionArgs);
      case 'get_product_images':
      case 'send_product_image':
        return await this.getProductImages(functionArgs);
      case 'check_product_availability':
        return await this.checkProductAvailability(functionArgs);
      case 'get_all_products':
        return await this.getAllProducts(functionArgs);
      case 'save_client_data':
        return await this.saveClientData(functionArgs);
      case 'save_order':
        return await this.saveOrder(functionArgs);
      default:
        throw new Error(`Unknown function: ${functionName}`);
    }
  }

  async searchProducts(args) {
    console.log('🔍 Searching products with args:', args);
    try {
      // Use the global env variable (we'll need to pass this)
      const response = await fetch(`https://lingerie-sales-agent.bcos-assistant.workers.dev/api/products`);
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      
      const data = await response.json();
      const products = data.products || [];
      
      // Enhanced filtering based on search parameters with fallbacks
      const query = (args.query || args.search_term || args.product_name || '').toLowerCase().trim();
      const category = (args.category || '').toLowerCase().trim();
      const color = (args.color || '').toLowerCase().trim();
      const size = (args.size || '').toLowerCase().trim();
      const priceMin = parseFloat(args.price_min || args.min_price || 0);
      const priceMax = parseFloat(args.price_max || args.max_price || Infinity);
      
      console.log('🔍 Search filters:', { query, category, color, size, priceMin, priceMax });
      
      let filteredProducts = products;
      
      // Text search in product names and descriptions with improved matching
      if (query) {
        filteredProducts = filteredProducts.filter(product => {
          const searchableText = [
            product.name,
            product.name_ar,
            product.description,
            product.description_ar,
            product.brand,
            product.material,
            product.benefits
          ].filter(Boolean).join(' ').toLowerCase();
          
          // Exact match first
          if (searchableText.includes(query)) {
            return true;
          }
          
          // Word-by-word match for multi-word queries
          const queryWords = query.split(' ').filter(word => word.length > 2);
          return queryWords.some(word => searchableText.includes(word));
        });
        
        console.log(`🔍 After text search for "${query}": ${filteredProducts.length} products`);
      }
      
      // Category filtering (if we had categories in the data)
      if (category) {
        filteredProducts = filteredProducts.filter(product => 
          product.category?.toLowerCase().includes(category) ||
          product.brand?.toLowerCase().includes(category) ||
          product.name?.toLowerCase().includes(category)
        );
        console.log(`🔍 After category filter "${category}": ${filteredProducts.length} products`);
      }
      
      // Color filtering (mock implementation)
      if (color) {
        // In a real implementation, this would check product variants
        filteredProducts = filteredProducts.filter(product => 
          product.name?.toLowerCase().includes(color) ||
          product.description?.toLowerCase().includes(color)
        );
        console.log(`🔍 After color filter "${color}": ${filteredProducts.length} products`);
      }
      
      // Size filtering (mock implementation)
      if (size) {
        // In a real implementation, this would check product variants
        // For now, assume all products have common sizes
        const validSizes = ['xs', 's', 'm', 'l', 'xl', 'xxl'];
        if (validSizes.includes(size.toLowerCase())) {
          // All products assumed to have these sizes
          console.log(`🔍 Size "${size}" is standard, keeping all products`);
        } else {
          // Filter by specific size requirements
          filteredProducts = filteredProducts.filter(product => 
            product.name?.toLowerCase().includes(size) ||
            product.description?.toLowerCase().includes(size)
          );
          console.log(`🔍 After size filter "${size}": ${filteredProducts.length} products`);
        }
      }
      
      // Price filtering
      if (priceMin > 0 || priceMax < Infinity) {
        const originalCount = filteredProducts.length;
        filteredProducts = filteredProducts.filter(product => {
          const price = product.sale_price || product.base_price || 0;
          return price >= priceMin && price <= priceMax;
        });
        console.log(`🔍 After price filter ${priceMin}-${priceMax}: ${filteredProducts.length} products (was ${originalCount})`);
      }
      
      // Limit results
      const limit = args.limit || 8;
      const results = filteredProducts.slice(0, limit);
      
      // Enhanced product information for AI responses
      const enhancedResults = results.map(p => ({
        id: p.id,
        name: p.name,
        name_ar: p.name_ar,
        description: p.description,
        description_ar: p.description_ar,
        price: p.sale_price || p.base_price,
        original_price: p.base_price,
        brand: p.brand,
        material: p.material,
        benefits: p.benefits,
        stock: p.stock_quantity,
        is_featured: p.is_featured,
        category: p.category || 'Lingerie',
        // Mock variant information
        available_colors: ['Rouge', 'Noir', 'Blanc', 'Rose'].slice(0, Math.floor(Math.random() * 4) + 1),
        available_sizes: ['S', 'M', 'L', 'XL'].slice(0, Math.floor(Math.random() * 4) + 1),
        has_variants: true,
        has_images: p.product_images && p.product_images.length > 0
      }));
      
      console.log(`✅ Search completed: ${results.length} results returned (${filteredProducts.length} total found)`);
      
      return JSON.stringify({
        success: true,
        query: query,
        filters_applied: {
          category: category || null,
          color: color || null,
          size: size || null,
          price_range: priceMin > 0 || priceMax < Infinity ? `${priceMin}-${priceMax}` : null
        },
        total_found: filteredProducts.length,
        showing: results.length,
        products: enhancedResults
      });
    } catch (error) {
      console.error('❌ Error searching products:', error);
      return JSON.stringify({ 
        success: false,
        error: error.message,
        message: 'Erreur lors de la recherche de produits'
      });
    }
  }

  async getProductDetails(args) {
    console.log('📋 Getting product details for:', args);
    try {
      const response = await fetch(`https://lingerie-sales-agent.bcos-assistant.workers.dev/api/products`);
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      
      const data = await response.json();
      const products = data.products || [];
      
      const product = products.find(p => p.id === args.product_id);
      
      if (!product) {
        return JSON.stringify({ error: 'Product not found' });
      }
      
      return JSON.stringify({
        success: true,
        product: {
          id: product.id,
          name: product.name,
          name_ar: product.name_ar,
          description: product.description,
          description_ar: product.description_ar,
          price: product.sale_price || product.base_price,
          original_price: product.base_price,
          brand: product.brand,
          material: product.material,
          care_instructions: product.care_instructions,
          benefits: product.benefits,
          stock: product.stock_quantity,
          is_featured: product.is_featured
        }
      });
    } catch (error) {
      return JSON.stringify({ error: error.message });
    }
  }

  async getProductVariants(args) {
    console.log('🔍 Getting product variants for:', args);
    try {
      const response = await fetch(`https://lingerie-sales-agent.bcos-assistant.workers.dev/api/products`);
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      
      const data = await response.json();
      const products = data.products || [];
      
      const product = products.find(p => p.id === args.productId || p.id === args.product_id);
      
      if (!product) {
        return JSON.stringify({ error: 'Product not found' });
      }
      
      // Mock variant data based on product info
      const variants = [];
      const colors = ['Rouge', 'Noir', 'Blanc', 'Rose'];
      const sizes = ['S', 'M', 'L', 'XL'];
      
      colors.forEach(color => {
        sizes.forEach(size => {
          variants.push({
            id: `${product.id}_${color}_${size}`,
            product_id: product.id,
            color: color,
            size: size,
            price: product.sale_price || product.base_price,
            stock_quantity: Math.floor(Math.random() * 10) + 1,
            is_available: true
          });
        });
      });
      
      return JSON.stringify({
        success: true,
        product_id: product.id,
        variants: variants.slice(0, 8), // Limit to 8 variants
        available_colors: colors,
        available_sizes: sizes,
        price_range: {
          min: product.sale_price || product.base_price,
          max: product.sale_price || product.base_price
        },
        total_variants: variants.length
      });
    } catch (error) {
      return JSON.stringify({ error: error.message });
    }
  }

  async checkProductAvailability(args) {
    console.log('📋 Checking product availability');
    try {
      const response = await fetch(`https://lingerie-sales-agent.bcos-assistant.workers.dev/api/products`);
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      
      const data = await response.json();
      const products = data.products || [];
      
      const availableProducts = products.filter(p => (p.stock_quantity || 0) > 0);
      
      return JSON.stringify({
        success: true,
        totalProducts: products.length,
        availableProducts: availableProducts.length,
        products: availableProducts.map(p => ({
          id: p.id,
          name: p.name,
          nameAr: p.name_ar,
          price: p.sale_price || p.base_price,
          stock: p.stock_quantity,
          category: p.category || 'Lingerie'
        }))
      });
    } catch (error) {
      return JSON.stringify({ error: error.message });
    }
  }

  async getAllProducts(args) {
    console.log('📦 Getting all products');
    try {
      const response = await fetch(`https://lingerie-sales-agent.bcos-assistant.workers.dev/api/products`);
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      
      const data = await response.json();
      const products = data.products || [];
      
      // Remove image data to prevent markdown inclusion
      const productsWithoutImages = products.map(product => {
        const { product_images, image_url, ...productData } = product;
        return productData;
      });
      
      return JSON.stringify({
        success: true,
        products: productsWithoutImages
      });
    } catch (error) {
      return JSON.stringify({ error: error.message });
    }
  }

  async saveClientData(args) {
    console.log('💾 Saving client data:', args);
    try {
      // Use the global Supabase service
      const response = await fetch(`https://lingerie-sales-agent.bcos-assistant.workers.dev/api/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          platform_id: `client_${Date.now()}`,
          platform_type: 'chat',
          name: args.name || args.client_name || 'Client',
          phone: args.phone || args.telephone || '',
          wilaya: args.wilaya || args.province || '',
          address: args.address || '',
          language: 'fr',
          created_at: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save client data');
      }

      const result = await response.json();
      
      return JSON.stringify({
        success: true,
        message: 'Données client sauvegardées avec succès',
        client_id: result.customer?.id,
        name: args.name || args.client_name
      });
    } catch (error) {
      console.error('Error saving client data:', error);
      return JSON.stringify({ 
        success: false, 
        error: error.message,
        message: 'Erreur lors de la sauvegarde des données client'
      });
    }
  }

  async saveOrder(args) {
    console.log('🛒 Saving order:', args);
    try {
      const orderData = {
        customer_name: args.customer_name,
        phone: args.customer_phone,
        email: args.customer_email || '',
        platform_type: 'chat',
        wilaya: args.wilaya,
        address: args.address || '',
        products: args.product_name,
        total_amount: (args.quantity || 1) * (args.unit_price || 0),
        status: 'pending',
        notes: args.notes || '',
        created_at: new Date().toISOString()
      };

      const response = await fetch(`https://lingerie-sales-agent.bcos-assistant.workers.dev/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      });

      if (!response.ok) {
        throw new Error('Failed to save order');
      }

      const result = await response.json();
      
      return JSON.stringify({
        success: true,
        message: 'Commande enregistrée avec succès',
        order_id: result.order?.id,
        order_number: result.order?.order_number,
        total_amount: orderData.total_amount
      });
    } catch (error) {
      console.error('Error saving order:', error);
      return JSON.stringify({ 
        success: false, 
        error: error.message,
        message: 'Erreur lors de l\'enregistrement de la commande'
      });
    }
  }

  async getProductImages(args) {
    console.log('🖼️ Getting product images for:', args);
    try {
      // Handle both parameter names for compatibility
      const productId = args.product_id || args.productId;
      const productName = args.product_name || args.productName;
      
      console.log(`🔍 Looking for image for product: "${productName}" (ID: ${productId})`);
      
      if (!productName && !productId) {
        console.log(`❌ No product name or ID provided in parameters:`, args);
        return JSON.stringify({
          success: false,
          message: 'Product name or ID is required',
          parameters: args
        });
      }
      
      // Get product data with images from Supabase
      const productResponse = await fetch(`https://lingerie-sales-agent.bcos-assistant.workers.dev/api/products`);
      if (!productResponse.ok) {
        throw new Error('Failed to fetch products');
      }
      
      const productData = await productResponse.json();
      let product = null;
      
      // If we have productId, get the product directly
      if (productId) {
        product = productData.products.find(p => p.id === productId);
        console.log(`📦 Product by ID result:`, product ? 'found' : 'not found');
      }
      
      // Search by product name if not found by ID
      if (!product && productName) {
        // Try exact name match first
        product = productData.products.find(p => 
          p.name?.toLowerCase() === productName.toLowerCase() ||
          p.name_ar?.toLowerCase() === productName.toLowerCase()
        );
        
        // If no exact match, try partial match
        if (!product) {
          product = productData.products.find(p => 
            p.name?.toLowerCase().includes(productName.toLowerCase()) ||
            p.name_ar?.toLowerCase().includes(productName.toLowerCase()) ||
            productName.toLowerCase().includes(p.name?.toLowerCase()) ||
            productName.toLowerCase().includes(p.name_ar?.toLowerCase())
          );
        }
        
        console.log(`🔍 Search results for "${productName}":`, product ? 'found' : 'not found');
        if (product) {
          console.log(`📦 Found product:`, {
            id: product.id,
            name: product.name,
            name_ar: product.name_ar,
            hasImages: !!product.product_images,
            imageCount: product.product_images?.length || 0
          });
        }
      }
      
      if (!product) {
        console.log(`❌ No product found for "${productName}" (ID: ${productId})`);
        // Get available products for error message
        const productNames = productData.products.map(p => p.name).slice(0, 10);
        
        return JSON.stringify({
          success: false,
          message: 'Product not found',
          productName: productName,
          productId: productId,
          availableProducts: productNames
        });
      }
      
      // Check if product has images
      if (product.product_images && product.product_images.length > 0) {
        const primaryImage = product.product_images.find(img => img.is_primary) || product.product_images[0];
        console.log(`✅ Found image from Supabase: ${primaryImage.image_url}`);
        
        // Store globally for webhook access (similar to local server)
        globalThis.pendingImageSend = {
          success: true,
          action: 'send_image',
          imageUrl: primaryImage.image_url,
          caption: null,
          alt: primaryImage.alt_text || product.name,
          productName: product.name,
          productId: product.id
        };
        
        return JSON.stringify({
          success: true,
          action: 'send_image',
          product_id: product.id,
          product_name: product.name,
          product_name_ar: product.name_ar,
          price: product.sale_price || product.base_price,
          image_url: primaryImage.image_url,
          alt_text: primaryImage.alt_text,
          message: `Image trouvée pour "${product.name}". Prix: ${product.sale_price || product.base_price}€.`
        });
      }
      
      // If no images in database, create a placeholder but log the issue
      console.log(`⚠️ No images found in database for product: ${product.name}`);
      const displayName = product.name || 'Produit';
      const productColor = product.brand === 'Elegance Paris' ? 'FF69B4' : 
                          product.brand === 'Natural Comfort' ? 'DDA0DD' :
                          product.brand === 'Sport Elite' ? '87CEEB' : 'FFB6C1';
      
      const placeholderUrl = `https://via.placeholder.com/500x500/${productColor}/FFFFFF?text=${encodeURIComponent(displayName)}`;
      
      // Store globally for webhook access
      globalThis.pendingImageSend = {
        success: true,
        action: 'send_image',
        imageUrl: placeholderUrl,
        caption: null,
        alt: `Image pour ${displayName}`,
        productName: product.name,
        productId: product.id,
        isPlaceholder: true
      };
      
      return JSON.stringify({
        success: true,
        action: 'send_image',
        product_id: product.id,
        product_name: product.name,
        product_name_ar: product.name_ar,
        price: product.sale_price || product.base_price,
        image_url: placeholderUrl,
        alt_text: `Image pour ${displayName}`,
        isPlaceholder: true,
        message: `Image trouvée pour "${product.name}". Prix: ${product.sale_price || product.base_price}€. ${product.description || ''}`
      });
    } catch (error) {
      console.error('❌ Error getting product images:', error);
      return JSON.stringify({ 
        success: false,
        error: error.message,
        message: 'Erreur lors de la récupération de l\'image du produit'
      });
    }
  }
}

// ===============================
// GOOGLE SHEETS INTEGRATION
// ===============================

class GoogleSheetsService {
  constructor(env) {
    this.spreadsheetId = env.GOOGLE_SHEETS_SPREADSHEET_ID;
    this.privateKey = env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n');
    this.clientEmail = env.GOOGLE_SHEETS_CLIENT_EMAIL;
  }

  async getAccessToken() {
    if (!this.privateKey || !this.clientEmail) {
      throw new Error('Google Sheets not configured');
    }

    const jwtHeader = {
      alg: 'RS256',
      typ: 'JWT'
    };

    const now = Math.floor(Date.now() / 1000);
    const jwtClaimSet = {
      iss: this.clientEmail,
      scope: 'https://www.googleapis.com/auth/spreadsheets',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now
    };

    // Simple JWT implementation for Cloudflare Workers
    const jwt = await this.createJWT(jwtHeader, jwtClaimSet);
    
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
    });

    const tokenData = await response.json();
    return tokenData.access_token;
  }

  async createJWT(header, payload) {
    const encoder = new TextEncoder();
    
    // Base64URL encode header and payload
    const headerBase64 = this.base64UrlEncode(JSON.stringify(header));
    const payloadBase64 = this.base64UrlEncode(JSON.stringify(payload));
    
    const message = `${headerBase64}.${payloadBase64}`;
    
    // Import the private key for RSA-SHA256 signing
    const privateKeyPem = this.privateKey;
    const privateKeyDer = this.pemToDer(privateKeyPem);
    
    const cryptoKey = await crypto.subtle.importKey(
      'pkcs8',
      privateKeyDer,
      {
        name: 'RSASSA-PKCS1-v1_5',
        hash: { name: 'SHA-256' }
      },
      false,
      ['sign']
    );

    // Sign the message
    const signature = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      cryptoKey,
      encoder.encode(message)
    );

    // Base64URL encode the signature
    const signatureBase64 = this.base64UrlEncode(signature);
    
    return `${message}.${signatureBase64}`;
  }

  base64UrlEncode(data) {
    let base64;
    if (typeof data === 'string') {
      base64 = btoa(data);
    } else {
      // For ArrayBuffer
      const bytes = new Uint8Array(data);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      base64 = btoa(binary);
    }
    
    // Convert to base64url format
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }

  pemToDer(pem) {
    // Remove header and footer
    const base64 = pem
      .replace(/-----BEGIN PRIVATE KEY-----/g, '')
      .replace(/-----END PRIVATE KEY-----/g, '')
      .replace(/\r?\n/g, '');
    
    // Convert base64 to ArrayBuffer
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  async addOrder(orderData) {
    if (!this.spreadsheetId) {
      console.warn('Google Sheets not configured - order not logged to sheets');
      return false;
    }

    try {
      const accessToken = await this.getAccessToken();
      
      const values = [[
        orderData.id || '',
        orderData.order_number || '',
        new Date().toLocaleString('fr-FR'),
        orderData.customer_name || '',
        orderData.phone || '',
        orderData.email || '',
        orderData.platform_type || '',
        orderData.wilaya || '',
        orderData.address || '',
        orderData.products || '',
        orderData.total_amount || '',
        orderData.status || 'pending',
        orderData.notes || ''
      ]];

      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/Orders!A:M:append?valueInputOption=USER_ENTERED`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ values })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Google Sheets API error:', response.status, errorText);
        return false;
      }

      console.log('✅ Order logged to Google Sheets successfully');
      return true;
    } catch (error) {
      console.error('Google Sheets error:', error);
      return false;
    }
  }
}

// ===============================
// WEBHOOK HANDLERS
// ===============================

// Webhook handler for Messenger
async function handleMessengerWebhook(request, env) {
  const url = new URL(request.url);
  const method = request.method;

  if (method === 'GET') {
    // Webhook verification
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');

    const verifyToken = env.MESSENGER_VERIFY_TOKEN || 'salesagent';

    if (mode === 'subscribe' && token === verifyToken) {
      console.log('Messenger webhook verified');
      return new Response(challenge, { status: 200 });
    } else {
      console.log('Messenger webhook verification failed');
      return new Response('Forbidden', { status: 403 });
    }
  }

  if (method === 'POST') {
    try {
      const body = await request.json();
      console.log('Messenger webhook received:', JSON.stringify(body, null, 2));

      // Initialize services
      const supabase = new SupabaseService(env);
      const openai = new OpenAIService(env);
      const sheets = new GoogleSheetsService(env);

      // Process webhook
      if (body.object === 'page') {
        for (const entry of body.entry || []) {
          for (const messaging of entry.messaging || []) {
            const senderId = messaging.sender?.id;
            const message = messaging.message;
            const postback = messaging.postback;

            if (senderId) {
              try {
                if (message) {
                  await handleMessengerMessage(senderId, message, { supabase, openai, sheets, env });
                } else if (postback) {
                  await handleMessengerPostback(senderId, postback, { supabase, openai, sheets, env });
                }
              } catch (error) {
                console.error(`❌ Error processing message from ${senderId}:`, error);
                
                // Send a user-friendly error message
                const errorMessage = error.message.includes('timeout') 
                  ? "Désolé, le service est momentanément lent. Veuillez réessayer dans quelques instants."
                  : "Désolé, une erreur s'est produite. Veuillez réessayer.";
                  
                await sendMessengerMessage(env, senderId, errorMessage).catch(err => 
                  console.error('❌ Failed to send error message:', err)
                );
              }
            }
          }
        }
      }

      return new Response('OK', { status: 200 });
    } catch (error) {
      console.error('Messenger webhook error:', error);
      return errorResponse('Webhook processing failed', 500);
    }
  }

  return errorResponse('Method not allowed', 405);
}

// Handle individual Messenger message
async function handleMessengerMessage(senderId, message, services) {
  const { supabase, openai, sheets, env } = services;
  
  console.log(`🔥 Processing Messenger message from ${senderId}: ${message.text || 'Media message'}`);
  
  // Get or create customer with timeout
  console.log('📊 Querying customer from Supabase...');
  const customers = await Promise.race([
    supabase.query('customers', {
      filters: { platform_id: senderId, platform_type: 'messenger' }
    }),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Supabase query timeout')), 10000)
    )
  ]);
  console.log(`✅ Customer query result: ${customers.length} customers found`);

  let customer = customers[0];
  if (!customer) {
    console.log('🆕 Creating new messenger customer');
    
    // Get user profile from Facebook
    const userProfile = await getMessengerUserProfile(env, senderId);
    
    const newCustomers = await Promise.race([
      supabase.insert('customers', {
        platform_id: senderId,
        platform_type: 'messenger',
        name: userProfile.name || 'Utilisateur Messenger',
        language: 'fr',
        created_at: new Date().toISOString()
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Supabase insert timeout')), 10000)
      )
    ]);
    customer = newCustomers[0];
    console.log(`✅ New customer created with ID: ${customer.id}`);
  } else {
    console.log(`👤 Using existing customer ID: ${customer.id}`);
  }

  // Get or create session - ONLY create thread if session doesn't exist
  let session = messengerSessions.get(senderId);
  
  if (!session) {
    console.log('🆕 Creating new session for first-time user');
    console.log('🧵 Creating new OpenAI thread for new session');
    const threadId = await Promise.race([
      openai.createThread(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('OpenAI thread creation timeout')), 10000)
      )
    ]);
    session = {
      senderId,
      threadId,
      customer,
      language: customer.language || 'fr',
      createdAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString(),
      messageCount: 1
    };
    messengerSessions.set(senderId, session);
    console.log(`✅ New session created with thread: ${threadId}`);
  } else {
    // Update existing session activity - REUSE existing thread
    session.lastActivityAt = new Date().toISOString();
    session.messageCount = (session.messageCount || 0) + 1;
    console.log(`🔄 Using existing session with thread: ${session.threadId} (message ${session.messageCount})`);
  }

  // Process message with OpenAI with timeout
  if (message.text) {
    console.log('🤖 Sending text message to OpenAI...');
    const response = await Promise.race([
      openai.sendMessage(session.threadId, message.text, session.language),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('OpenAI message timeout')), 30000)
      )
    ]);
    
    console.log(`🎯 OpenAI response received: ${response.substring(0, 100)}...`);
    
    // Check if there's a pending image to send (similar to local server)
    if (globalThis.pendingImageSend && globalThis.pendingImageSend.success) {
      console.log('📸 Pending image found, sending to user');
      const imageData = globalThis.pendingImageSend;
      
      // Send the text response first
      if (response && response.trim()) {
        await sendMessengerMessage(env, senderId, response);
      }
      
      // Then send the image
      await sendMessengerImage(env, senderId, imageData.imageUrl, imageData.alt || imageData.productName || 'Image du produit');
      
      // Clear the pending image
      globalThis.pendingImageSend = null;
      
      console.log('✅ Image sent successfully');
    } else {
      // Check if the AI response indicates we should send an image (fallback)
      if (await shouldSendImage(response, openai, session.threadId)) {
        const imageInfo = await extractImageFromResponse(response);
        if (imageInfo) {
          console.log('📸 Sending product image to user (fallback method)');
          await sendMessengerImage(env, senderId, imageInfo.url, imageInfo.text || response);
        } else {
          await sendMessengerMessage(env, senderId, response);
        }
      } else {
        console.log('📱 Sending text response back to user');
        await sendMessengerMessage(env, senderId, response);
      }
    }
    
    // Log interaction (don't block on this)
    supabase.insert('interactions', {
      customer_id: customer.id,
      platform_type: 'messenger',
      message_type: 'text',
      user_message: message.text,
      bot_response: response,
      created_at: new Date().toISOString()
    }).catch(err => console.error('⚠️ Failed to log interaction:', err));
    
    console.log('🎉 Message processed successfully');
  } else if (message.attachments && message.attachments.length > 0) {
    console.log('🖼️ Processing image/attachment message...');
    
    // Handle image attachments
    const attachment = message.attachments[0];
    if (attachment.type === 'image') {
      const imageUrl = attachment.payload.url;
      console.log('📷 Image received:', imageUrl);
      
      // Send image analysis message to OpenAI
      const imageMessage = `L'utilisateur a envoyé une image. URL: ${imageUrl}. Analysez cette image et aidez le client avec sa demande concernant les produits de lingerie.`;
      
      const response = await Promise.race([
        openai.sendMessage(session.threadId, imageMessage, session.language),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('OpenAI image analysis timeout')), 30000)
        )
      ]);
      
      await sendMessengerMessage(env, senderId, response);
      
      // Log interaction
      supabase.insert('interactions', {
        customer_id: customer.id,
        platform_type: 'messenger',
        message_type: 'image',
        user_message: `Image envoyée: ${imageUrl}`,
        bot_response: response,
        created_at: new Date().toISOString()
      }).catch(err => console.error('⚠️ Failed to log interaction:', err));
      
    } else {
      // Handle other attachment types
      await sendMessengerMessage(env, senderId, "Je peux vous aider avec les images de produits de lingerie. Pourriez-vous m'envoyer une image ou me dire quel type de produit vous recherchez ?");
    }
  } else {
    console.log('📝 Empty message received');
    await sendMessengerMessage(env, senderId, "Bonjour ! Comment puis-je vous aider aujourd'hui ? Je peux vous montrer nos produits de lingerie et répondre à vos questions.");
  }
}

// Handle Messenger postback (buttons, quick replies)
async function handleMessengerPostback(senderId, postback, services) {
  const { env } = services;
  
  console.log(`🔘 Processing Messenger postback from ${senderId}: ${postback.payload}`);
  
  // Handle different postback payloads
  switch (postback.payload) {
    case 'GET_STARTED':
      await sendWelcomeMessage(env, senderId);
      break;
    case 'SHOW_PRODUCTS':
      await sendMessengerMessage(env, senderId, 'Parfait ! Laissez-moi vous montrer nos produits. Quel type de lingerie vous intéresse ? Soutien-gorge, culotte, ensemble, ou vêtements de nuit ?');
      break;
    case 'CONTACT_HUMAN':
      await sendMessengerMessage(env, senderId, 'Un conseiller va vous contacter prochainement. Merci pour votre patience!');
      break;
    default:
      // Treat postback as a text message
      await handleMessengerMessage(senderId, { text: postback.payload }, services);
      break;
  }
}

// Get user profile from Facebook Messenger
async function getMessengerUserProfile(env, senderId) {
  try {
    if (!env.MESSENGER_ACCESS_TOKEN) {
      console.log('⚠️ No access token - using default profile');
      return { name: 'Utilisateur Messenger' };
    }
    
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${senderId}?fields=first_name,last_name,profile_pic&access_token=${env.MESSENGER_ACCESS_TOKEN}`
    );
    
    if (!response.ok) {
      console.log('⚠️ Failed to fetch user profile - using default');
      return { name: 'Utilisateur Messenger' };
    }
    
    const profile = await response.json();
    const name = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Utilisateur Messenger';
    console.log(`👤 User profile retrieved: ${name}`);
    return { name, ...profile };
  } catch (error) {
    console.warn('⚠️ Error fetching user profile:', error);
    return { name: 'Utilisateur Messenger' };
  }
}

// Send welcome message with quick replies
async function sendWelcomeMessage(env, recipientId) {
  try {
    const messagePayload = {
      recipient: { id: recipientId },
      message: {
        text: "👋 Bienvenue dans notre boutique de lingerie ! Je suis votre assistante virtuelle. Comment puis-je vous aider aujourd'hui ?",
        quick_replies: [
          {
            content_type: "text",
            title: "Voir les produits",
            payload: "SHOW_PRODUCTS"
          },
          {
            content_type: "text",
            title: "Aide",
            payload: "HELP"
          }
        ]
      }
    };

    const response = await fetch(`https://graph.facebook.com/v18.0/me/messages?access_token=${env.MESSENGER_ACCESS_TOKEN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messagePayload),
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      throw new Error(`Welcome message API error: ${response.status}`);
    }
    
    console.log('✅ Welcome message sent successfully');
  } catch (error) {
    console.error('Error sending welcome message:', error);
    // Fallback to simple message
    await sendMessengerMessage(env, recipientId, "👋 Bienvenue ! Comment puis-je vous aider avec nos produits de lingerie ?");
  }
}

// Check if AI response should trigger image sending
async function shouldSendImage(response, openai, threadId) {
  // Check for explicit image indicators
  if (response.includes('SEND_IMAGE:') || response.includes('send_product_image')) {
    return true;
  }
  
  // Check for product presentation keywords
  const imageKeywords = [
    'voici le produit',
    'voici l\'image',
    'je vous montre',
    'regardez ce',
    'voici nos',
    'découvrez ce',
    'voici notre',
    'cette image montre'
  ];
  
  return imageKeywords.some(keyword => 
    response.toLowerCase().includes(keyword)
  );
}

// Extract image information from AI response or generate it
async function extractImageFromResponse(response) {
  // Check for explicit SEND_IMAGE instruction
  const imageMatch = response.match(/SEND_IMAGE:\s*(.+)/);
  if (imageMatch) {
    try {
      const imageData = JSON.parse(imageMatch[1]);
      return {
        url: imageData.url,
        text: imageData.text || response.replace(/SEND_IMAGE:.+/, '').trim()
      };
    } catch (error) {
      console.error('Error parsing image info:', error);
    }
  }
  
  // Try to extract product name from response for image generation
  const productNameMatch = response.match(/(?:produit|article|soutien-gorge|culotte|ensemble)\s+["']([^"']+)["']/i);
  if (productNameMatch) {
    const productName = productNameMatch[1];
    
    // Generate placeholder image
    const color = Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
    const imageUrl = `https://via.placeholder.com/500x500/${color}/FFFFFF?text=${encodeURIComponent(productName)}`;
    
    return {
      url: imageUrl,
      text: response
    };
  }
  
  return null;
}

// Parse image information from OpenAI response (legacy support)
function parseImageInfo(response) {
  const imageMatch = response.match(/SEND_IMAGE:\s*(.+)/);
  if (imageMatch) {
    try {
      const imageData = JSON.parse(imageMatch[1]);
      return {
        url: imageData.url,
        text: imageData.text || ''
      };
    } catch (error) {
      console.error('Error parsing image info:', error);
      return null;
    }
  }
  return null;
}

// Webhook handler for WhatsApp
async function handleWhatsAppWebhook(request, env) {
  const url = new URL(request.url);
  const method = request.method;

  if (method === 'GET') {
    // Webhook verification
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');

    const verifyToken = env.WHATSAPP_VERIFY_TOKEN || 'whatsapp_salesagent_verify';

    if (mode === 'subscribe' && token === verifyToken) {
      console.log('WhatsApp webhook verified');
      return new Response(challenge, { status: 200 });
    } else {
      console.log('WhatsApp webhook verification failed');
      return new Response('Forbidden', { status: 403 });
    }
  }

  if (method === 'POST') {
    try {
      const body = await request.json();
      console.log('WhatsApp webhook received:', JSON.stringify(body, null, 2));

      // Initialize services
      const supabase = new SupabaseService(env);
      const openai = new OpenAIService(env);
      const sheets = new GoogleSheetsService(env);

      // Process webhook
      if (body.object === 'whatsapp_business_account') {
        for (const entry of body.entry || []) {
          for (const change of entry.changes || []) {
            const messages = change.value?.messages || [];
            
            for (const message of messages) {
              const from = message.from;
              const text = message.text?.body;

              if (text && from) {
                console.log(`WhatsApp message from ${from}: ${text}`);
                
                try {
                  // Get or create customer
                  const customers = await supabase.query('customers', {
                    filters: { platform_id: from, platform_type: 'whatsapp' }
                  });

                  let customer = customers[0];
                  if (!customer) {
                    const newCustomers = await supabase.insert('customers', {
                      platform_id: from,
                      platform_type: 'whatsapp',
                      name: 'Utilisateur WhatsApp',
                      phone: from,
                      language: 'fr',
                      created_at: new Date().toISOString()
                    });
                    customer = newCustomers[0];
                  }

                  // Get or create session - ONLY create thread if session doesn't exist
                  let session = whatsappSessions.get(from);
                  if (!session) {
                    console.log('🆕 Creating new WhatsApp session for first-time user');
                    const threadId = await openai.createThread();
                    session = {
                      senderId: from,
                      threadId,
                      customer,
                      language: 'fr',
                      createdAt: new Date().toISOString(),
                      lastActivityAt: new Date().toISOString(),
                      messageCount: 1
                    };
                    whatsappSessions.set(from, session);
                    console.log(`✅ New WhatsApp session created with thread: ${threadId}`);
                  } else {
                    // Update existing session activity - REUSE existing thread
                    session.lastActivityAt = new Date().toISOString();
                    session.messageCount = (session.messageCount || 0) + 1;
                    console.log(`🔄 Using existing WhatsApp session with thread: ${session.threadId} (message ${session.messageCount})`);
                  }
                  
                  // Process message with OpenAI
                  const response = await openai.sendMessage(session.threadId, text);
                  
                  // Check if there's a pending image to send (similar to Messenger)
                  if (globalThis.pendingImageSend && globalThis.pendingImageSend.success) {
                    console.log('📸 Pending image found for WhatsApp, sending to user');
                    const imageData = globalThis.pendingImageSend;
                    
                    // Send the text response first
                    if (response && response.trim()) {
                      await sendWhatsAppMessage(env, from, response);
                    }
                    
                    // Then send the image (if WhatsApp image sending is supported)
                    // For now, just send the image URL as text since WhatsApp API image sending requires more setup
                    await sendWhatsAppMessage(env, from, `🖼️ Image du produit: ${imageData.imageUrl}`);
                    
                    // Clear the pending image
                    globalThis.pendingImageSend = null;
                    
                    console.log('✅ WhatsApp image sent successfully');
                  } else {
                    await sendWhatsAppMessage(env, from, response);
                  }
                  
                  // Log interaction
                  await supabase.insert('interactions', {
                    customer_id: customer.id,
                    platform_type: 'whatsapp',
                    message_type: 'text',
                    user_message: text,
                    bot_response: response,
                    created_at: new Date().toISOString()
                  });

                } catch (error) {
                  console.error('Error processing WhatsApp message:', error);
                  await sendWhatsAppMessage(env, from, "Désolé, une erreur s'est produite. Veuillez réessayer.");
                }
              }
            }
          }
        }
      }

      return new Response('OK', { status: 200 });
    } catch (error) {
      console.error('WhatsApp webhook error:', error);
      return errorResponse('Webhook processing failed', 500);
    }
  }

  return errorResponse('Method not allowed', 405);
}

// Send Messenger message
async function sendMessengerMessage(env, recipientId, text) {
  try {
    console.log(`Sending Messenger message to ${recipientId}: ${text.substring(0, 100)}...`);
    
    const response = await fetch(`https://graph.facebook.com/v18.0/me/messages?access_token=${env.MESSENGER_ACCESS_TOKEN}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: { text: text }
      }),
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to send Messenger message:', response.status, errorText);
      throw new Error(`Messenger API error: ${response.status}`);
    }
    
    console.log('✅ Messenger message sent successfully');
  } catch (error) {
    console.error('Error sending Messenger message:', error);
    throw error;
  }
}

// Send Messenger image
async function sendMessengerImage(env, recipientId, imageUrl, text = '') {
  try {
    console.log(`Sending Messenger image to ${recipientId}: ${imageUrl}`);
    
    const messagePayload = {
      recipient: { id: recipientId },
      message: {
        attachment: {
          type: 'image',
          payload: {
            url: imageUrl,
            is_reusable: true
          }
        }
      }
    };

    // Add text if provided
    if (text) {
      // Send text first, then image
      await sendMessengerMessage(env, recipientId, text);
      await new Promise(resolve => setTimeout(resolve, 500)); // Small delay
    }

    const response = await fetch(`https://graph.facebook.com/v18.0/me/messages?access_token=${env.MESSENGER_ACCESS_TOKEN}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messagePayload),
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to send Messenger image:', response.status, errorText);
      throw new Error(`Messenger image API error: ${response.status}`);
    }
    
    console.log('✅ Messenger image sent successfully');
  } catch (error) {
    console.error('Error sending Messenger image:', error);
    throw error;
  }
}

// Send WhatsApp message
async function sendWhatsAppMessage(env, to, text) {
  try {
    const response = await fetch(`https://graph.facebook.com/v18.0/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: to,
        text: { body: text }
      })
    });

    if (!response.ok) {
      console.error('Failed to send WhatsApp message:', await response.text());
    }
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
  }
}

// ===============================
// API ENDPOINTS
// ===============================

async function handleApiRequest(request, env) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  const supabase = new SupabaseService(env);

  try {
    // Products endpoint
    if (pathname.startsWith('/api/products')) {
      const products = await supabase.query('products', {
        select: '*',
        filters: { is_active: true }
      });
      return jsonResponse({ products });
    }

    // Orders endpoint
    if (pathname.startsWith('/api/orders')) {
      if (request.method === 'POST') {
        const orderData = await request.json();
        
        // Add order to database
        const newOrder = await supabase.insert('orders', {
          ...orderData,
          order_number: `ORD-${Date.now()}`,
          status: 'pending',
          created_at: new Date().toISOString()
        });

        // Add to Google Sheets
        const sheets = new GoogleSheetsService(env);
        await sheets.addOrder(newOrder[0]);

        return jsonResponse({ 
          message: 'Order created successfully', 
          order: newOrder[0] 
        });
      }
      
      const orders = await supabase.query('orders', {
        select: '*',
        limit: 100
      });
      return jsonResponse({ orders });
    }

    // Customers endpoint
    if (pathname.startsWith('/api/customers')) {
      const customers = await supabase.query('customers', {
        limit: 100
      });
      return jsonResponse({ customers });
    }

    // Analytics endpoint
    if (pathname.startsWith('/api/analytics')) {
      const [orders, customers] = await Promise.all([
        supabase.query('orders'),
        supabase.query('customers')
      ]);
      
      const totalRevenue = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
      
      return jsonResponse({
        analytics: {
          total_orders: orders.length,
          total_revenue: totalRevenue,
          total_customers: customers.length,
          recent_orders: orders.slice(0, 10)
        }
      });
    }

    // Admin endpoint
    if (pathname.startsWith('/api/admin')) {
      return jsonResponse({
        config: {
          store_name: env.STORE_NAME || 'Lingerie Store',
          environment: env.NODE_ENV || 'production',
          version: '2.0.0',
          services: {
            supabase: !!env.SUPABASE_URL,
            openai: !!env.OPENAI_API_KEY,
            messenger: !!env.MESSENGER_ACCESS_TOKEN,
            whatsapp: !!env.WHATSAPP_ACCESS_TOKEN,
            google_sheets: !!env.GOOGLE_SHEETS_SPREADSHEET_ID
          }
        }
      });
    }

    // Storage endpoint
    if (pathname.startsWith('/api/storage')) {
      return jsonResponse({
        storage: {
          available: !!env.SUPABASE_URL,
          provider: 'supabase',
          bucket_url: env.SUPABASE_URL ? `${env.SUPABASE_URL}/storage/v1` : null
        }
      });
    }

  } catch (error) {
    console.error('API error:', error);
    return errorResponse(`API error: ${error.message}`, 500);
  }

  return errorResponse('API endpoint not found', 404);
}

// Main worker export
export default {
  async fetch(request, env, ctx) {
    try {
      // Clean up old sessions periodically
      cleanupSessions();
      
      const url = new URL(request.url);
      const method = request.method;
      const pathname = url.pathname;

      // Handle CORS preflight
      if (method === 'OPTIONS') {
        return new Response(null, {
          status: 204,
          headers: corsHeaders,
        });
      }

      // Health check endpoint
      if (pathname === '/health') {
        return jsonResponse({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          environment: 'cloudflare-workers',
          version: '2.0.0',
          platform: 'cloudflare-workers',
          services: {
            messenger: !!env.MESSENGER_ACCESS_TOKEN,
            whatsapp: !!env.WHATSAPP_ACCESS_TOKEN,
            openai: !!env.OPENAI_API_KEY,
            supabase: !!env.SUPABASE_URL,
            google_sheets: !!env.GOOGLE_SHEETS_SPREADSHEET_ID
          }
        });
      }

      // Test environment endpoint
      if (pathname === '/api/test-env') {
        return jsonResponse({
          success: true,
          message: 'Cloudflare Workers backend connection successful',
          timestamp: new Date().toISOString(),
          environment: {
            hasOpenAI: !!env.OPENAI_API_KEY,
            hasSheetId: !!env.GOOGLE_SHEETS_SPREADSHEET_ID,
            hasServiceAccount: !!(env.GOOGLE_SHEETS_PRIVATE_KEY && env.GOOGLE_SHEETS_CLIENT_EMAIL),
            hasMessenger: !!env.MESSENGER_ACCESS_TOKEN,
            hasWhatsApp: !!env.WHATSAPP_ACCESS_TOKEN,
            hasSupabase: !!env.SUPABASE_URL,
          },
          backend: {
            version: '2.0.0',
            platform: 'cloudflare-workers',
            environment: env.NODE_ENV || 'production'
          }
        });
      }

      // API Documentation
      if (pathname === '/api' || pathname === '/api/') {
        return jsonResponse({
          name: 'Lingerie Store Products API - Cloudflare Workers',
          version: '2.0.0',
          description: 'Cloudflare Workers backend for lingerie products sales platform',
          platform: 'cloudflare-workers',
          status: 'active',
          endpoints: {
            health: 'GET /health',
            test_env: 'GET /api/test-env',
            products: 'GET /api/products',
            orders: 'GET|POST /api/orders',
            customers: 'GET /api/customers',
            analytics: 'GET /api/analytics',
            admin: 'GET /api/admin',
            storage: 'GET /api/storage',
            webhooks: {
              messenger_verify: 'GET /webhook/messenger',
              messenger_message: 'POST /webhook/messenger',
              whatsapp_verify: 'GET /whatsapp/webhook',
              whatsapp_message: 'POST /whatsapp/webhook'
            }
          },
          documentation: 'Visit /api for this documentation'
        });
      }

      // Webhook routes - CRITICAL for Messenger and WhatsApp
      if (pathname.startsWith('/webhook/messenger')) {
        return handleMessengerWebhook(request, env);
      }
      
      if (pathname.startsWith('/whatsapp/webhook')) {
        return handleWhatsAppWebhook(request, env);
      }

      // API routes
      if (pathname.startsWith('/api/')) {
        return handleApiRequest(request, env);
      }

      // Home page
      if (pathname === '/' || pathname === '') {
        return new Response(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Lingerie Store - Sales Agent API</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            max-width: 900px; 
            margin: 40px auto; 
            padding: 30px; 
            line-height: 1.6;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
        }
        .container {
            background: rgba(255,255,255,0.1);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 30px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.1);
        }
        .status { 
            padding: 15px; 
            border-radius: 10px; 
            margin: 15px 0; 
            backdrop-filter: blur(10px);
        }
        .success { 
            background: rgba(76, 175, 80, 0.2); 
            border: 1px solid rgba(76, 175, 80, 0.3); 
        }
        .info { 
            background: rgba(33, 150, 243, 0.2); 
            border: 1px solid rgba(33, 150, 243, 0.3); 
        }
        code { 
            background: rgba(0,0,0,0.2); 
            padding: 3px 6px; 
            border-radius: 5px; 
            font-family: 'Monaco', 'Consolas', monospace;
        }
        .endpoint { 
            background: rgba(255,255,255,0.1); 
            padding: 20px; 
            margin: 15px 0; 
            border-radius: 10px; 
            border: 1px solid rgba(255,255,255,0.2);
        }
        .badge {
            display: inline-block;
            background: rgba(76, 175, 80, 0.8);
            color: white;
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: bold;
            margin-left: 10px;
        }
        a { color: #82B1FF; text-decoration: none; }
        a:hover { text-decoration: underline; }
        h1 { margin-bottom: 10px; }
        .subtitle { opacity: 0.8; font-size: 18px; margin-bottom: 30px; }
        ul { list-style: none; padding: 0; }
        li { margin: 8px 0; }
        li:before { content: "✅ "; margin-right: 8px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🩱 Lingerie Store Sales Agent</h1>
        <div class="subtitle">Intelligent Sales Assistant powered by AI</div>
        
        <div class="status success">
            ✅ API is running on Cloudflare Workers <span class="badge">LIVE</span>
        </div>
        
        <h2>🚀 Quick Links</h2>
        <div class="endpoint">
            <strong>Health Check:</strong> <a href="/health">/health</a><br>
            <strong>API Documentation:</strong> <a href="/api">/api</a><br>
            <strong>Environment Test:</strong> <a href="/api/test-env">/api/test-env</a>
        </div>

        <h2>📱 Webhook Endpoints</h2>
        <div class="endpoint">
            <strong>Facebook Messenger:</strong> <code>/webhook/messenger</code><br>
            <small>Configure this URL in your Facebook App webhook settings</small><br><br>
            <strong>WhatsApp Business:</strong> <code>/whatsapp/webhook</code><br>
            <small>Configure this URL in your WhatsApp Business API settings</small>
        </div>

        <h2>🛍️ Sales Features</h2>
        <ul>
            <li>Messenger Integration - Customer chat support</li>
            <li>WhatsApp Business API - Order processing via WhatsApp</li>
            <li>Product Catalog Management</li>
            <li>Automated Order Processing</li>
            <li>Customer Data Management</li>
            <li>Google Sheets Integration - Real-time data sync</li>
            <li>OpenAI Sales Assistant - AI-powered responses</li>
            <li>Supabase Database - Secure data storage</li>
            <li>Analytics & Reporting</li>
            <li>Multi-language Support (FR/AR)</li>
        </ul>

        <h2>🌍 API Endpoints</h2>
        <div class="endpoint">
            <strong>Products:</strong> <a href="/api/products">/api/products</a><br>
            <strong>Orders:</strong> <code>/api/orders</code><br>
            <strong>Customers:</strong> <code>/api/customers</code><br>
            <strong>Analytics:</strong> <code>/api/analytics</code><br>
            <strong>Admin:</strong> <code>/api/admin</code><br>
            <strong>Storage:</strong> <code>/api/storage</code>
        </div>

        <div class="status info">
            💡 This sales agent automatically handles customer inquiries and processes orders through Messenger and WhatsApp
        </div>
        
        <div style="margin-top: 30px; text-align: center; opacity: 0.7; font-size: 14px;">
            Powered by Cloudflare Workers | Version 2.0.0
        </div>
    </div>
</body>
</html>
        `, {
          headers: {
            'Content-Type': 'text/html',
            ...corsHeaders,
          },
        });
      }

      // 404 for all other routes
      return jsonResponse({
        error: 'Not Found',
        message: 'The requested endpoint was not found.',
        timestamp: new Date().toISOString(),
        available_endpoints: [
          'GET /',
          'GET /health',
          'GET /api',
          'GET /api/test-env',
          'GET /api/products',
          'GET|POST /api/orders', 
          'GET /api/customers',
          'GET /api/analytics',
          'GET /api/admin',
          'GET /api/storage',
          'GET|POST /webhook/messenger',
          'GET|POST /whatsapp/webhook'
        ]
      }, 404);

    } catch (error) {
      console.error('Worker error:', error);
      return errorResponse(`Worker error: ${error.message}`, 500, {
        stack: error.stack
      });
    }
  },
};
