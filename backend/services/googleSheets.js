import { google } from 'googleapis';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Google Sheets API
let sheets = null;
let auth = null;

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

    // Add a new order to Google Sheets
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
            const range = 'Orders!A:M'; // Adjust range as needed

            // Prepare order data for sheets
            const orderRow = [
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
            ];

            // Check if headers exist, if not create them
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

            console.log(`✅ Order ${order.id} added to Google Sheets`);
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
            
            // Find the order row
            const findResponse = await sheets.spreadsheets.values.get({
                spreadsheetId,
                range: 'Orders!A:M'
            });

            const rows = findResponse.data.values;
            if (!rows) return false;

            // Find the row with matching order ID
            const rowIndex = rows.findIndex(row => row[0] === orderId);
            if (rowIndex === -1) return false;

            // Update the status column (column L, index 11)
            const updateRange = `Orders!L${rowIndex + 1}`;
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

    // Add customer to Google Sheets
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
            const range = 'Customers!A:H';

            // Prepare customer data
            const customerRow = [
                customer.id,
                new Date(customer.createdAt).toLocaleString('fr-FR'),
                customer.name,
                customer.phone,
                customer.email || '',
                customer.wilaya || '',
                customer.address || '',
                customer.notes || ''
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
            // Check if Orders sheet exists and has headers
            const response = await sheets.spreadsheets.values.get({
                spreadsheetId,
                range: 'Orders!A1:M1'
            });

            if (!response.data.values || response.data.values.length === 0) {
                // Add headers
                const headers = [
                    'ID Commande',
                    'Date Création',
                    'Nom Client',
                    'Téléphone',
                    'Email',
                    'Wilaya',
                    'Adresse',
                    'Produit',
                    'Quantité',
                    'Prix Unitaire',
                    'Montant Total',
                    'Statut',
                    'Notes'
                ];

                await sheets.spreadsheets.values.update({
                    spreadsheetId,
                    range: 'Orders!A1:M1',
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
            const response = await sheets.spreadsheets.values.get({
                spreadsheetId,
                range: 'Customers!A1:H1'
            });

            if (!response.data.values || response.data.values.length === 0) {
                const headers = [
                    'ID Client',
                    'Date Création',
                    'Nom',
                    'Téléphone',
                    'Email',
                    'Wilaya',
                    'Adresse',
                    'Notes'
                ];

                await sheets.spreadsheets.values.update({
                    spreadsheetId,
                    range: 'Customers!A1:H1',
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
    }
};

// Initialize on module load
initializeGoogleSheets();

export default googleSheetsService; 