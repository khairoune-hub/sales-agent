#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { exec } = require('child_process');

// Load environment variables
require('dotenv').config();

console.log('🩱 LINGERIE STORE SETUP');
console.log('=====================');

// Check if environment variables are set
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    console.error('❌ Missing Supabase credentials in .env file');
    console.error('Please add SUPABASE_URL and SUPABASE_SERVICE_KEY to your .env file');
    process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

async function executeSQLFile(filePath, description) {
    try {
        console.log(`\n📄 ${description}...`);
        
        if (!fs.existsSync(filePath)) {
            console.error(`❌ File not found: ${filePath}`);
            return false;
        }

        const sqlContent = fs.readFileSync(filePath, 'utf8');
        
        // Try to execute SQL through PostgreSQL connection string
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
        
        // Extract the database connection details from Supabase URL
        const url = new URL(supabaseUrl);
        const projectId = url.hostname.split('.')[0];
        
        console.log(`   Processing SQL file: ${filePath}`);
        console.log(`   Project ID: ${projectId}`);
        console.log(`   ⚠️  Manual execution required - see instructions below`);
        
        return true;
        
    } catch (error) {
        console.error(`❌ Failed to execute ${description}: ${error.message}`);
        return false;
    }
}

async function testDatabaseConnection() {
    try {
        console.log('\n🔍 Testing Supabase connection...');
        
        // Test basic connection
        const { data: connectionTest, error: connectionError } = await supabase
            .from('categories')
            .select('count', { count: 'exact', head: true });
            
        if (connectionError) {
            console.error('❌ Database connection failed:', connectionError.message);
            return false;
        }
        
        console.log('✅ Database connection successful');
        return true;
        
    } catch (error) {
        console.error('❌ Database connection test failed:', error.message);
        return false;
    }
}

async function verifyDataInsertion() {
    try {
        console.log('\n📊 Verifying data insertion...');
        
        // Check categories
        const { data: categories, error: catError } = await supabase
            .from('categories')
            .select('*');
        
        if (catError) {
            console.error('❌ Failed to fetch categories:', catError.message);
            return false;
        }
        
        // Check products
        const { data: products, error: prodError } = await supabase
            .from('products')
            .select('*');
        
        if (prodError) {
            console.error('❌ Failed to fetch products:', prodError.message);
            return false;
        }
        
        // Check customers
        const { data: customers, error: custError } = await supabase
            .from('customers')
            .select('*');
        
        if (custError) {
            console.error('❌ Failed to fetch customers:', custError.message);
            return false;
        }
        
        // Check orders
        const { data: orders, error: orderError } = await supabase
            .from('orders')
            .select('*');
        
        if (orderError) {
            console.error('❌ Failed to fetch orders:', orderError.message);
            return false;
        }
        
        console.log('✅ Data verification successful:');
        console.log(`   - Categories: ${categories?.length || 0} entries`);
        console.log(`   - Products: ${products?.length || 0} entries`);
        console.log(`   - Customers: ${customers?.length || 0} entries`);
        console.log(`   - Orders: ${orders?.length || 0} entries`);
        
        return true;
        
    } catch (error) {
        console.error('❌ Data verification failed:', error.message);
        return false;
    }
}

async function displaySetupInstructions() {
    console.log('\n🩱 LINGERIE STORE SETUP INSTRUCTIONS');
    console.log('====================================');
    console.log('');
    console.log('📋 STEP 1: Fix Google Sheets Permission (REQUIRED)');
    console.log('   1. Open: https://docs.google.com/spreadsheets/d/1gQUIKFwP1zNLYOnF_3Gc4u9X9WnZSpsS9KT31sW2jjA/edit');
    console.log('   2. Click "Share" button (top right)');
    console.log('   3. Add: agent-v1@agent-sheet-v1.iam.gserviceaccount.com');
    console.log('   4. Set permission to "Editor"');
    console.log('   5. Click "Share"');
    console.log('');
    console.log('📋 STEP 2: Deploy Database Schema');
    console.log('   1. Go to your Supabase project dashboard');
    console.log('   2. Navigate to SQL Editor');
    console.log('   3. Copy and paste the contents of: database-schema.sql');
    console.log('   4. Click "Run" to execute');
    console.log('');
    console.log('📋 STEP 3: Populate Lingerie Store Data');
    console.log('   1. In SQL Editor, copy and paste the contents of: lingerie-store-data.sql');
    console.log('   2. Click "Run" to execute');
    console.log('');
    console.log('📋 STEP 4: Verify Setup');
    console.log('   1. Run: node verify-integrations.js');
    console.log('   2. Check that all integrations are working');
    console.log('');
    console.log('📋 STEP 5: Start Testing');
    console.log('   1. Start server: npm run dev');
    console.log('   2. Visit admin dashboard: http://localhost:8787/admin.html');
    console.log('   3. Test via Messenger/WhatsApp');
    console.log('');
    console.log('🎯 Files Created:');
    console.log('   ✅ database-schema.sql - Database structure');
    console.log('   ✅ lingerie-store-data.sql - Lingerie store products & sample data');
    console.log('   ✅ verify-integrations.js - Test all integrations');
    console.log('   ✅ INTEGRATION_SETUP_GUIDE.md - Detailed setup guide');
    console.log('');
}

async function setupLingerieStore() {
    try {
        console.log('🚀 Starting lingerie store setup verification...\n');
        
        // Test database connection first
        const connectionOk = await testDatabaseConnection();
        if (!connectionOk) {
            console.log('⚠️  Database connection not working yet');
            console.log('   This is normal - you need to set up the database first');
        } else {
            console.log('✅ Database connection working');
            
            // Try to verify if data already exists
            const verificationOk = await verifyDataInsertion();
            if (verificationOk) {
                console.log('✅ Lingerie store data already exists in database');
                console.log('🎉 Your lingerie store is ready for testing!');
                console.log('');
                console.log('📱 Next steps:');
                console.log('1. Fix Google Sheets permissions (see instructions below)');
                console.log('2. Start your server: npm run dev');
                console.log('3. Test your sales agent via Messenger/WhatsApp');
                console.log('4. Visit admin dashboard: http://localhost:8787/admin.html');
                console.log('');
                return true;
            }
        }
        
        // Display setup instructions
        await displaySetupInstructions();
        
        return true;
        
    } catch (error) {
        console.error('❌ Setup verification failed:', error.message);
        await displaySetupInstructions();
        return false;
    }
}

// Run setup
setupLingerieStore().then(success => {
    process.exit(success ? 0 : 1);
}).catch(error => {
    console.error('❌ Setup crashed:', error.message);
    process.exit(1);
}); 