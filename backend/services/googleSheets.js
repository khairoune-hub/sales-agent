import { google } from 'googleapis';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Google Sheets API
let sheets = null;
let auth = null;

// Enhanced Google Sheets structure for the sales agent
const SHEET_STRUCTURE = {
    orders: {
        name: 'Orders',
        headers: [
            'Order ID', 'Order Number', 'Date & Time', 'Customer Name', 'Customer Phone',
            'Customer Email', 'Platform', 'Platform ID', 'Wilaya', 'Address',
            'Products', 'Quantities', 'Unit Prices', 'Total Amount', 'Status',
            'Payment Status', 'Notes', 'Sales Agent', 'Confirmed Date', 'Confirmed By'
        ]
    },
    customers: {
        name: 'Customers',
        headers: [
            'Customer ID', 'Name', 'Phone', 'Email', 'Platform', 'Platform ID',
            'Wilaya', 'Address', 'Language', 'Total Orders', 'Total Spent',
            'Is VIP', 'First Contact', 'Last Contact', 'Last Order Date'
        ]
    },
    inventory_updates: {
        name: 'Inventory_Updates',
        headers: [
            'Date & Time', 'Product ID', 'Product Name', 'SKU', 'Transaction Type',
            'Quantity Change', 'Old Quantity', 'New Quantity', 'Reference Type',
            'Reference ID', 'Notes', 'Created By'
        ]
    },
    daily_summary: {
        name: 'Daily_Summary',
        headers: [
            'Date', 'Platform', 'Total Orders', 'Pending Orders', 'Confirmed Orders',
            'Cancelled Orders', 'Total Revenue', 'New Customers', 'Returning Customers',
            'Top Product', 'Top Category'
        ]
    },
    analytics: {
        name: 'Analytics',
        headers: [
            'Date', 'Platform', 'Metric Type', 'Metric Value', 'Additional Data'
        ]
    }
};

// Initialize Google Sheets authentication
const initializeGoogleSheets = async () => {
    try {
        // Try to load credentials from file first
        let credentials;
        try {
            const credentialsPath = join(__dirname, '../../credentials/service-account.json');
            const credentialsData = readFileSync(credentialsPath, 'utf8');
            credentials = JSON.parse(credentialsData);
            console.log('✅ Loaded Google Sheets credentials from file');
        } catch (fileError) {
            // Fallback to environment variables
            if (!process.env.GOOGLE_SHEETS_PRIVATE_KEY || !process.env.GOOGLE_SHEETS_CLIENT_EMAIL) {
                console.warn('❌ Google Sheets not configured. Need either credentials file or environment variables.');
                return false;
            }
            
            // Parse the private key (handle escaped newlines)
            const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY.replace(/\\n/g, '\n');
            
            credentials = {
                type: 'service_account',
                private_key: privateKey,
                client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
                client_id: process.env.GOOGLE_SHEETS_CLIENT_ID,
                auth_uri: 'https://accounts.google.com/o/oauth2/auth',
                token_uri: 'https://oauth2.googleapis.com/token',
            };
            console.log('✅ Loaded Google Sheets credentials from environment variables');
        }

        auth = new google.auth.GoogleAuth({
            credentials,
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        sheets = google.sheets({ version: 'v4', auth });
        
        // Get spreadsheet ID from environment or use default
        const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || process.env.GOOGLE_SHEET_ID || '1gQUIKFwP1zNLYOnF_3Gc4u9X9WnZSpsS9KT31sW2jjA';
        
        // Test the connection
        await sheets.spreadsheets.get({
            spreadsheetId
        });

        console.log('✅ Google Sheets API initialized successfully');
        console.log(`📊 Using spreadsheet ID: ${spreadsheetId}`);
        return true;
    } catch (error) {
        console.error('❌ Google Sheets initialization failed:', error.message);
        return false;
    }
};

// Helper function to get spreadsheet ID
const getSpreadsheetId = () => {
    return process.env.GOOGLE_SHEETS_SPREADSHEET_ID || process.env.GOOGLE_SHEET_ID || '1gQUIKFwP1zNLYOnF_3Gc4u9X9WnZSpsS9KT31sW2jjA';
};

export const googleSheetsService = {
    // Initialize the service
    initialize: initializeGoogleSheets,

    // Add a new order to Google Sheets (enhanced version)
    addOrder: async (order) => {
        // Ensure service is initialized
        if (!sheets) {
            console.log('🔄 Google Sheets not initialized, attempting to initialize...');
            const initialized = await initializeGoogleSheets();
            if (!initialized || !sheets) {
                console.warn('Google Sheets not configured, skipping order sync');
                return false;
            }
        }

        try {
            const spreadsheetId = getSpreadsheetId();
            const range = `${SHEET_STRUCTURE.orders.name}!A:T`;

            // Prepare enhanced order data for sheets
            const products = order.order_items?.map(item => item.products?.name || item.product_name).join(', ') || '';
            const quantities = order.order_items?.map(item => item.quantity).join(', ') || '';
            const unitPrices = order.order_items?.map(item => item.unit_price).join(', ') || '';

            const orderRow = [
                order.id,
                order.order_number,
                new Date(order.created_at).toLocaleString('fr-FR'),
                order.customers?.name || order.customer_name || '',
                order.customers?.phone || order.phone || '',
                order.customers?.email || order.email || '',
                order.platform_type || '',
                order.customers?.platform_id || '',
                order.wilaya || '',
                order.shipping_address || '',
                products,
                quantities,
                unitPrices,
                order.total_amount,
                order.status,
                order.payment_status || '',
                order.notes || '',
                order.sales_agent || '',
                order.confirmed_at ? new Date(order.confirmed_at).toLocaleString('fr-FR') : '',
                order.confirmed_by || ''
            ];

            // Ensure headers exist
            await googleSheetsService.ensureHeaders(spreadsheetId);

            // Append the order
            const response = await sheets.spreadsheets.values.append({
                spreadsheetId,
                range,
                valueInputOption: 'USER_ENTERED',
                resource: {
                    values: [orderRow]
                }
            });

            console.log(`✅ Order ${order.order_number} added to Google Sheets`);
            return response.data;
        } catch (error) {
            console.error('❌ Failed to add order to Google Sheets:', error.message);
            throw new Error('Google Sheets sync failed');
        }
    },

    // Update order status in Google Sheets
    updateOrderStatus: async (orderId, newStatus) => {
        // Ensure service is initialized
        if (!sheets) {
            console.log('🔄 Google Sheets not initialized for updateOrderStatus, attempting to initialize...');
            const initialized = await initializeGoogleSheets();
            if (!initialized || !sheets) {
                console.warn('Google Sheets not configured, skipping status update');
                return false;
            }
        }

        try {
            const spreadsheetId = getSpreadsheetId();
            
            // Find the order row - using correct range A:T to match our 20-column structure
            const findResponse = await sheets.spreadsheets.values.get({
                spreadsheetId,
                range: 'Orders!A:T'
            });

            const rows = findResponse.data.values;
            if (!rows) return false;

            // Find the row with matching order ID (first column)
            const rowIndex = rows.findIndex(row => row[0] === orderId);
            if (rowIndex === -1) return false;

            // Update the status column (column O, index 14 - based on SHEET_STRUCTURE.orders.headers)
            // Headers: Order ID(A), Order Number(B), Date & Time(C), Customer Name(D), Customer Phone(E),
            // Customer Email(F), Platform(G), Platform ID(H), Wilaya(I), Address(J),
            // Products(K), Quantities(L), Unit Prices(M), Total Amount(N), Status(O) <- column 15, index 14
            const updateRange = `Orders!O${rowIndex + 1}`;
            await sheets.spreadsheets.values.update({
                spreadsheetId,
                range: updateRange,
                valueInputOption: 'USER_ENTERED',
                resource: {
                    values: [[newStatus]]
                }
            });

            console.log(`✅ Order ${orderId} status updated to ${newStatus} in Google Sheets`);
            return true;
        } catch (error) {
            console.error('❌ Failed to update order status in Google Sheets:', error.message);
            return false;
        }
    },

    // Add customer to Google Sheets (enhanced version)
    addCustomer: async (customer) => {
        // Ensure service is initialized
        if (!sheets) {
            console.log('🔄 Google Sheets not initialized, attempting to initialize...');
            const initialized = await initializeGoogleSheets();
            if (!initialized || !sheets) {
                console.warn('Google Sheets not configured, skipping customer sync');
                return false;
            }
        }

        try {
            const spreadsheetId = getSpreadsheetId();
            const range = `${SHEET_STRUCTURE.customers.name}!A:O`;

            // Prepare enhanced customer data - aligning with SHEET_STRUCTURE.customers.headers (15 columns)
            const customerRow = [
                customer.id,                    // Customer ID
                customer.name || '',            // Name  
                customer.phone || '',           // Phone
                customer.email || '',           // Email
                customer.platform_type || '',   // Platform
                customer.platform_id || '',     // Platform ID
                customer.wilaya || '',          // Wilaya
                customer.address || '',         // Address
                customer.preferred_language || 'fr', // Language
                customer.total_orders || 0,     // Total Orders
                customer.total_spent || 0,      // Total Spent
                customer.is_vip ? 'Yes' : 'No', // Is VIP
                customer.first_contact_date ? new Date(customer.first_contact_date).toLocaleString('fr-FR') : '', // First Contact
                customer.last_contact_date ? new Date(customer.last_contact_date).toLocaleString('fr-FR') : '',  // Last Contact
                customer.last_order_date ? new Date(customer.last_order_date).toLocaleString('fr-FR') : ''       // Last Order Date
            ];

            // Ensure headers exist
            await googleSheetsService.ensureCustomerHeaders(spreadsheetId);

            // Append the customer
            await sheets.spreadsheets.values.append({
                spreadsheetId,
                range,
                valueInputOption: 'USER_ENTERED',
                resource: {
                    values: [customerRow]
                }
            });

            console.log(`✅ Customer ${customer.id} added to Google Sheets`);
            return true;
        } catch (error) {
            console.error('❌ Failed to add customer to Google Sheets:', error.message);
            return false;
        }
    },

    // Ensure order headers exist
    ensureHeaders: async (spreadsheetId) => {
        // Ensure service is initialized
        if (!sheets) {
            console.log('🔄 Google Sheets not initialized for headers, attempting to initialize...');
            const initialized = await initializeGoogleSheets();
            if (!initialized || !sheets) {
                throw new Error('Google Sheets service not available');
            }
        }

        try {
            // Check if Orders sheet exists and has headers - Using full range A1:T1 for 20 columns
            const response = await sheets.spreadsheets.values.get({
                spreadsheetId,
                range: 'Orders!A1:T1'
            });

            if (!response.data.values || response.data.values.length === 0) {
                // Use the standardized headers from SHEET_STRUCTURE
                const headers = SHEET_STRUCTURE.orders.headers;

                await sheets.spreadsheets.values.update({
                    spreadsheetId,
                    range: 'Orders!A1:T1',
                    valueInputOption: 'USER_ENTERED',
                    resource: {
                        values: [headers]
                    }
                });

                console.log('✅ Order headers created in Google Sheets');
            }
        } catch (error) {
            // If sheet doesn't exist, create it
            if (error.code === 400) {
                await googleSheetsService.createOrdersSheet(spreadsheetId);
            } else {
                console.error('Error ensuring headers:', error.message);
            }
        }
    },

    // Ensure customer headers exist
    ensureCustomerHeaders: async (spreadsheetId) => {
        // Ensure service is initialized
        if (!sheets) {
            console.log('🔄 Google Sheets not initialized for customer headers, attempting to initialize...');
            const initialized = await initializeGoogleSheets();
            if (!initialized || !sheets) {
                throw new Error('Google Sheets service not available');
            }
        }

        try {
            // Check if Customers sheet exists and has headers - Using full range A1:O1 for 15 columns
            const response = await sheets.spreadsheets.values.get({
                spreadsheetId,
                range: 'Customers!A1:O1'
            });

            if (!response.data.values || response.data.values.length === 0) {
                // Use the standardized headers from SHEET_STRUCTURE
                const headers = SHEET_STRUCTURE.customers.headers;

                await sheets.spreadsheets.values.update({
                    spreadsheetId,
                    range: 'Customers!A1:O1',
                    valueInputOption: 'USER_ENTERED',
                    resource: {
                        values: [headers]
                    }
                });

                console.log('✅ Customer headers created in Google Sheets');
            }
        } catch (error) {
            if (error.code === 400) {
                await googleSheetsService.createCustomersSheet(spreadsheetId);
            } else {
                console.error('Error ensuring customer headers:', error.message);
            }
        }
    },

    // Create Orders sheet
    createOrdersSheet: async (spreadsheetId) => {
        // Ensure service is initialized
        if (!sheets) {
            console.log('🔄 Google Sheets not initialized for createOrdersSheet, attempting to initialize...');
            const initialized = await initializeGoogleSheets();
            if (!initialized || !sheets) {
                throw new Error('Google Sheets service not available for sheet creation');
            }
        }

        try {
            await sheets.spreadsheets.batchUpdate({
                spreadsheetId,
                resource: {
                    requests: [{
                        addSheet: {
                            properties: {
                                title: 'Orders'
                            }
                        }
                    }]
                }
            });

            // Add headers after creating sheet
            await googleSheetsService.ensureHeaders(spreadsheetId);
            console.log('✅ Orders sheet created in Google Sheets');
        } catch (error) {
            console.error('Error creating Orders sheet:', error.message);
        }
    },

    // Create Customers sheet
    createCustomersSheet: async (spreadsheetId) => {
        // Ensure service is initialized
        if (!sheets) {
            console.log('🔄 Google Sheets not initialized for createCustomersSheet, attempting to initialize...');
            const initialized = await initializeGoogleSheets();
            if (!initialized || !sheets) {
                throw new Error('Google Sheets service not available for sheet creation');
            }
        }

        try {
            await sheets.spreadsheets.batchUpdate({
                spreadsheetId,
                resource: {
                    requests: [{
                        addSheet: {
                            properties: {
                                title: 'Customers'
                            }
                        }
                    }]
                }
            });

            // Add headers after creating sheet
            await googleSheetsService.ensureCustomerHeaders(spreadsheetId);
            console.log('✅ Customers sheet created in Google Sheets');
        } catch (error) {
            console.error('Error creating Customers sheet:', error.message);
        }
    },

    // Get orders from Google Sheets (for backup/sync purposes)
    getOrders: async () => {
        // Ensure service is initialized
        if (!sheets) {
            console.log('🔄 Google Sheets not initialized for getOrders, attempting to initialize...');
            const initialized = await initializeGoogleSheets();
            if (!initialized || !sheets) {
                console.warn('Google Sheets not configured, returning empty array');
                return [];
            }
        }

        const spreadsheetId = getSpreadsheetId();
        if (!spreadsheetId) {
            return [];
        }

        try {
            const response = await sheets.spreadsheets.values.get({
                spreadsheetId,
                range: 'Orders!A2:M' // Skip header row
            });

            const rows = response.data.values || [];
            return rows.map(row => ({
                id: row[0],
                createdAt: row[1],
                customerName: row[2],
                customerPhone: row[3],
                customerEmail: row[4],
                wilaya: row[5],
                address: row[6],
                productName: row[7],
                quantity: parseInt(row[8]) || 0,
                unitPrice: parseFloat(row[9]) || 0,
                totalAmount: parseFloat(row[10]) || 0,
                status: row[11],
                notes: row[12]
            }));
        } catch (error) {
            console.error('Error getting orders from Google Sheets:', error.message);
            return [];
        }
    },

    // Bulk sync orders to Google Sheets
    bulkSyncOrders: async (orders) => {
        // Ensure service is initialized
        if (!sheets) {
            console.log('🔄 Google Sheets not initialized for bulk sync, attempting to initialize...');
            const initialized = await initializeGoogleSheets();
            if (!initialized || !sheets) {
                console.warn('Google Sheets not configured, skipping bulk sync');
                return false;
            }
        }

        const spreadsheetId = getSpreadsheetId();
        if (!spreadsheetId || !orders.length) {
            return false;
        }

        try {
            // Ensure headers exist
            await googleSheetsService.ensureHeaders(spreadsheetId);

            // Prepare all order rows
            const orderRows = orders.map(order => [
                order.id,
                new Date(order.createdAt).toLocaleString('fr-FR'),
                order.customerName,
                order.customerPhone,
                order.customerEmail || '',
                order.wilaya || '',
                order.address || '',
                order.productName,
                order.quantity,
                order.unitPrice,
                order.totalAmount,
                order.status,
                order.notes || ''
            ]);

            // Clear existing data (except headers) and add new data
            await sheets.spreadsheets.values.clear({
                spreadsheetId,
                range: 'Orders!A2:M'
            });

            if (orderRows.length > 0) {
                await sheets.spreadsheets.values.update({
                    spreadsheetId,
                    range: 'Orders!A2:M',
                    valueInputOption: 'USER_ENTERED',
                    resource: {
                        values: orderRows
                    }
                });
            }

            console.log(`✅ Bulk synced ${orders.length} orders to Google Sheets`);
            return true;
        } catch (error) {
            console.error('❌ Bulk sync failed:', error.message);
            return false;
        }
    },

    // Add inventory update to Google Sheets
    addInventoryUpdate: async (inventoryUpdate) => {
        if (!sheets) {
            const initialized = await initializeGoogleSheets();
            if (!initialized || !sheets) {
                console.warn('Google Sheets not configured, skipping inventory update sync');
                return false;
            }
        }

        try {
            const spreadsheetId = getSpreadsheetId();
            const range = `${SHEET_STRUCTURE.inventory_updates.name}!A:L`;

            const updateRow = [
                new Date(inventoryUpdate.created_at).toLocaleString('fr-FR'),
                inventoryUpdate.product_id,
                inventoryUpdate.product_name || '',
                inventoryUpdate.product_sku || '',
                inventoryUpdate.transaction_type,
                inventoryUpdate.quantity_change,
                inventoryUpdate.old_quantity,
                inventoryUpdate.new_quantity,
                inventoryUpdate.reference_type || '',
                inventoryUpdate.reference_id || '',
                inventoryUpdate.notes || '',
                inventoryUpdate.created_by || ''
            ];

            await googleSheetsService.ensureHeaders(spreadsheetId);

            const response = await sheets.spreadsheets.values.append({
                spreadsheetId,
                range,
                valueInputOption: 'USER_ENTERED',
                resource: {
                    values: [updateRow]
                }
            });

            console.log(`✅ Inventory update added to Google Sheets`);
            return response.data;
        } catch (error) {
            console.error('❌ Failed to add inventory update to Google Sheets:', error.message);
            return false;
        }
    },

    // Add daily summary to Google Sheets
    addDailySummary: async (summaryData) => {
        if (!sheets) {
            const initialized = await initializeGoogleSheets();
            if (!initialized || !sheets) {
                console.warn('Google Sheets not configured, skipping daily summary sync');
                return false;
            }
        }

        try {
            const spreadsheetId = getSpreadsheetId();
            const range = `${SHEET_STRUCTURE.daily_summary.name}!A:J`;

            const summaryRow = [
                summaryData.date,
                summaryData.platform,
                summaryData.total_orders,
                summaryData.pending_orders,
                summaryData.confirmed_orders,
                summaryData.cancelled_orders,
                summaryData.total_revenue,
                summaryData.new_customers,
                summaryData.returning_customers,
                summaryData.top_product || '',
                summaryData.top_category || ''
            ];

            await googleSheetsService.ensureHeaders(spreadsheetId);

            const response = await sheets.spreadsheets.values.append({
                spreadsheetId,
                range,
                valueInputOption: 'USER_ENTERED',
                resource: {
                    values: [summaryRow]
                }
            });

            console.log(`✅ Daily summary added to Google Sheets`);
            return response.data;
        } catch (error) {
            console.error('❌ Failed to add daily summary to Google Sheets:', error.message);
            return false;
        }
    },

    // Enhanced method to ensure all sheet headers exist
    ensureAllSheetHeaders: async (spreadsheetId) => {
        try {
            // Get current sheets
            const response = await sheets.spreadsheets.get({
                spreadsheetId
            });

            const existingSheets = response.data.sheets.map(sheet => sheet.properties.title);
            console.log(`📋 Existing sheets: ${existingSheets.join(', ')}`);

            // Create all required sheets and headers
            for (const [key, sheetConfig] of Object.entries(SHEET_STRUCTURE)) {
                if (!existingSheets.includes(sheetConfig.name)) {
                    console.log(`📝 Creating ${sheetConfig.name} sheet...`);
                    await sheets.spreadsheets.batchUpdate({
                        spreadsheetId,
                        resource: {
                            requests: [{
                                addSheet: {
                                    properties: {
                                        title: sheetConfig.name
                                    }
                                }
                            }]
                        }
                    });
                }

                // Add headers
                const headerRange = `${sheetConfig.name}!A1:${String.fromCharCode(65 + sheetConfig.headers.length - 1)}1`;
                await sheets.spreadsheets.values.update({
                    spreadsheetId,
                    range: headerRange,
                    valueInputOption: 'USER_ENTERED',
                    resource: {
                        values: [sheetConfig.headers]
                    }
                });
            }

            console.log('✅ All sheet headers ensured');
        } catch (error) {
            console.error('❌ Error ensuring all sheet headers:', error.message);
        }
    },

    // Test and verify Google Sheets integration
    verifyIntegration: async () => {
        console.log('\n🔍 === GOOGLE SHEETS INTEGRATION VERIFICATION ===');
        
        const spreadsheetId = getSpreadsheetId();
        
        const verificationResults = {
            initialization: false,
            spreadsheetAccess: false,
            orderSheetStructure: false,
            customerSheetStructure: false,
            testDataWrite: false,
            issues: []
        };

        try {
            // 1. Check initialization
            const initialized = await initializeGoogleSheets();
            verificationResults.initialization = initialized;
            console.log(`✅ Initialization: ${initialized ? 'PASSED' : 'FAILED'}`);
            
            if (!initialized) {
                verificationResults.issues.push('Google Sheets service failed to initialize');
                return verificationResults;
            }

            // 2. Check spreadsheet access
            try {
                const spreadsheetInfo = await sheets.spreadsheets.get({ spreadsheetId });
                verificationResults.spreadsheetAccess = true;
                console.log(`✅ Spreadsheet Access: PASSED - ${spreadsheetInfo.data.properties.title}`);
            } catch (error) {
                verificationResults.issues.push(`Cannot access spreadsheet: ${error.message}`);
                console.log(`❌ Spreadsheet Access: FAILED - ${error.message}`);
            }

            // 3. Verify Orders sheet structure
            try {
                await googleSheetsService.ensureHeaders(spreadsheetId);
                
                const ordersResponse = await sheets.spreadsheets.values.get({
                    spreadsheetId,
                    range: 'Orders!A1:T1'
                });

                const ordersHeaders = ordersResponse.data.values?.[0] || [];
                const expectedOrdersHeaders = SHEET_STRUCTURE.orders.headers;
                
                const ordersMatch = ordersHeaders.length === expectedOrdersHeaders.length;
                verificationResults.orderSheetStructure = ordersMatch;
                
                console.log(`${ordersMatch ? '✅' : '❌'} Orders Sheet Structure: ${ordersMatch ? 'PASSED' : 'FAILED'}`);
                console.log(`   Expected: ${expectedOrdersHeaders.length} columns`);
                console.log(`   Found: ${ordersHeaders.length} columns`);
                
                if (!ordersMatch) {
                    verificationResults.issues.push(`Orders headers mismatch - Expected: ${expectedOrdersHeaders.length}, Found: ${ordersHeaders.length}`);
                    console.log(`   Expected Headers: ${expectedOrdersHeaders.join(', ')}`);
                    console.log(`   Found Headers: ${ordersHeaders.join(', ')}`);
                }
            } catch (error) {
                verificationResults.issues.push(`Orders sheet verification failed: ${error.message}`);
                console.log(`❌ Orders Sheet Structure: FAILED - ${error.message}`);
            }

            // 4. Verify Customers sheet structure
            try {
                await googleSheetsService.ensureCustomerHeaders(spreadsheetId);
                
                const customersResponse = await sheets.spreadsheets.values.get({
                    spreadsheetId,
                    range: 'Customers!A1:O1'
                });

                const customersHeaders = customersResponse.data.values?.[0] || [];
                const expectedCustomersHeaders = SHEET_STRUCTURE.customers.headers;
                
                const customersMatch = customersHeaders.length === expectedCustomersHeaders.length;
                verificationResults.customerSheetStructure = customersMatch;
                
                console.log(`${customersMatch ? '✅' : '❌'} Customers Sheet Structure: ${customersMatch ? 'PASSED' : 'FAILED'}`);
                console.log(`   Expected: ${expectedCustomersHeaders.length} columns`);
                console.log(`   Found: ${customersHeaders.length} columns`);
                
                if (!customersMatch) {
                    verificationResults.issues.push(`Customers headers mismatch - Expected: ${expectedCustomersHeaders.length}, Found: ${customersHeaders.length}`);
                    console.log(`   Expected Headers: ${expectedCustomersHeaders.join(', ')}`);
                    console.log(`   Found Headers: ${customersHeaders.join(', ')}`);
                }
            } catch (error) {
                verificationResults.issues.push(`Customers sheet verification failed: ${error.message}`);
                console.log(`❌ Customers Sheet Structure: FAILED - ${error.message}`);
            }

            // 5. Test data write (dry run)
            try {
                const testOrder = {
                    id: 'TEST_ORDER_' + Date.now(),
                    order_number: 'TEST_001',
                    created_at: new Date().toISOString(),
                    customers: { 
                        name: 'Test Customer', 
                        phone: '+213123456789', 
                        email: 'test@example.com',
                        platform_id: 'test_platform_id'
                    },
                    platform_type: 'test',
                    wilaya: 'Alger',
                    shipping_address: 'Test Address',
                    order_items: [{ 
                        products: { name: 'Test Product' }, 
                        quantity: 1, 
                        unit_price: 100 
                    }],
                    total_amount: 100,
                    status: 'pending',
                    payment_status: 'pending',
                    notes: 'Test order for verification',
                    sales_agent: 'system_test',
                    confirmed_at: null,
                    confirmed_by: null
                };

                // Don't actually write, just validate the data structure
                const products = testOrder.order_items?.map(item => item.products?.name || item.product_name).join(', ') || '';
                const quantities = testOrder.order_items?.map(item => item.quantity).join(', ') || '';
                const unitPrices = testOrder.order_items?.map(item => item.unit_price).join(', ') || '';

                const orderRow = [
                    testOrder.id,
                    testOrder.order_number,
                    new Date(testOrder.created_at).toLocaleString('fr-FR'),
                    testOrder.customers?.name || testOrder.customer_name || '',
                    testOrder.customers?.phone || testOrder.phone || '',
                    testOrder.customers?.email || testOrder.email || '',
                    testOrder.platform_type || '',
                    testOrder.customers?.platform_id || '',
                    testOrder.wilaya || '',
                    testOrder.shipping_address || '',
                    products,
                    quantities,
                    unitPrices,
                    testOrder.total_amount,
                    testOrder.status,
                    testOrder.payment_status || '',
                    testOrder.notes || '',
                    testOrder.sales_agent || '',
                    testOrder.confirmed_at ? new Date(testOrder.confirmed_at).toLocaleString('fr-FR') : '',
                    testOrder.confirmed_by || ''
                ];

                const expectedLength = SHEET_STRUCTURE.orders.headers.length;
                const actualLength = orderRow.length;
                
                verificationResults.testDataWrite = expectedLength === actualLength;
                console.log(`${verificationResults.testDataWrite ? '✅' : '❌'} Test Data Structure: ${verificationResults.testDataWrite ? 'PASSED' : 'FAILED'}`);
                console.log(`   Expected data fields: ${expectedLength}`);
                console.log(`   Actual data fields: ${actualLength}`);
                
                if (!verificationResults.testDataWrite) {
                    verificationResults.issues.push(`Data structure mismatch - Expected: ${expectedLength} fields, Actual: ${actualLength} fields`);
                }
            } catch (error) {
                verificationResults.issues.push(`Test data structure validation failed: ${error.message}`);
                console.log(`❌ Test Data Structure: FAILED - ${error.message}`);
            }

        } catch (error) {
            verificationResults.issues.push(`Verification process failed: ${error.message}`);
            console.log(`❌ Verification process failed: ${error.message}`);
        }

        // Summary
        console.log('\n📊 === VERIFICATION SUMMARY ===');
        const allPassed = Object.values(verificationResults).every(result => 
            typeof result === 'boolean' ? result : true
        ) && verificationResults.issues.length === 0;
        
        console.log(`Overall Status: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ ISSUES FOUND'}`);
        
        if (verificationResults.issues.length > 0) {
            console.log('\n🚨 Issues to fix:');
            verificationResults.issues.forEach((issue, index) => {
                console.log(`   ${index + 1}. ${issue}`);
            });
        }
        
        console.log('=================================\n');
        
        return verificationResults;
    },

    // Fix Google Sheets structure
    fixSheetStructure: async () => {
        console.log('\n🔧 === FIXING GOOGLE SHEETS STRUCTURE ===');
        
        try {
            const spreadsheetId = getSpreadsheetId();
            
            // Initialize if needed
            if (!sheets) {
                const initialized = await initializeGoogleSheets();
                if (!initialized) {
                    throw new Error('Cannot initialize Google Sheets service');
                }
            }

            // Force recreate headers with correct structure
            console.log('🔄 Updating Orders sheet headers...');
            await sheets.spreadsheets.values.update({
                spreadsheetId,
                range: 'Orders!A1:T1',
                valueInputOption: 'USER_ENTERED',
                resource: {
                    values: [SHEET_STRUCTURE.orders.headers]
                }
            });
            console.log('✅ Orders headers updated');

            console.log('🔄 Updating Customers sheet headers...');
            await sheets.spreadsheets.values.update({
                spreadsheetId,
                range: 'Customers!A1:O1',
                valueInputOption: 'USER_ENTERED',
                resource: {
                    values: [SHEET_STRUCTURE.customers.headers]
                }
            });
            console.log('✅ Customers headers updated');

            console.log('✅ Google Sheets structure fixed successfully!');
            
            // Run verification to confirm
            console.log('\n🔍 Running verification to confirm fixes...');
            return await googleSheetsService.verifyIntegration();

        } catch (error) {
            console.error('❌ Failed to fix Google Sheets structure:', error.message);
            throw error;
        }
    }
};

// Initialize on module load
initializeGoogleSheets();

export default googleSheetsService;