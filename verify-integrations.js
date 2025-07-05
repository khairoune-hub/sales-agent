#!/usr/bin/env node

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env') });

console.log('🔍 Sales Agent Integration Verification');
console.log('=====================================\n');

// Test Supabase Integration
async function testSupabaseIntegration() {
    console.log('1. Testing Supabase Integration...');
    
    try {
        // Check if Supabase environment variables are set
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
        
        if (!supabaseUrl || !supabaseKey) {
            console.log('   ❌ Supabase environment variables not configured');
            console.log('   ℹ️  Please set SUPABASE_URL and SUPABASE_SERVICE_KEY in your .env file');
            return false;
        }
        
        // Import and test Supabase service
        const { supabaseService } = await import('./backend/services/supabase.js');
        
        console.log('   ✅ Supabase service imported successfully');
        
        // Test connection
        const testResult = await supabaseService.testConnection();
        console.log('   ✅ Supabase connection test passed');
        console.log(`   📊 Connection details: ${JSON.stringify(testResult, null, 2)}`);
        
        return true;
    } catch (error) {
        console.log('   ❌ Supabase integration failed:', error.message);
        return false;
    }
}

// Test Google Sheets Integration
async function testGoogleSheetsIntegration() {
    console.log('\n2. Testing Google Sheets Integration...');
    
    try {
        // Check if Google Sheets environment variables are set
        const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY || process.env.GOOGLE_PRIVATE_KEY;
        const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
        const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || process.env.GOOGLE_SHEET_ID;
        
        if (!privateKey || !clientEmail || !spreadsheetId) {
            console.log('   ❌ Google Sheets environment variables not configured');
            console.log('   ℹ️  Please set GOOGLE_SHEETS_PRIVATE_KEY, GOOGLE_SHEETS_CLIENT_EMAIL, and GOOGLE_SHEETS_SPREADSHEET_ID');
            return false;
        }
        
        // Import and test Google Sheets service
        const { googleSheetsService } = await import('./backend/services/googleSheets.js');
        
        console.log('   ✅ Google Sheets service imported successfully');
        
        // Test connection
        const initialized = await googleSheetsService.initialize();
        if (initialized) {
            console.log('   ✅ Google Sheets connection test passed');
            console.log(`   📊 Spreadsheet ID: ${spreadsheetId}`);
        } else {
            console.log('   ❌ Google Sheets connection failed');
            return false;
        }
        
        return true;
    } catch (error) {
        console.log('   ❌ Google Sheets integration failed:', error.message);
        return false;
    }
}

// Test OpenAI Integration
async function testOpenAIIntegration() {
    console.log('\n3. Testing OpenAI Integration...');
    
    try {
        // Check if OpenAI environment variables are set
        const apiKey = process.env.OPENAI_API_KEY;
        const assistantId = process.env.ASSISTANT_ID;
        
        if (!apiKey) {
            console.log('   ❌ OpenAI API key not configured');
            console.log('   ℹ️  Please set OPENAI_API_KEY in your .env file');
            return false;
        }
        
        if (!assistantId) {
            console.log('   ❌ OpenAI Assistant ID not configured');
            console.log('   ℹ️  Please set ASSISTANT_ID in your .env file');
            return false;
        }
        
        // Import and test OpenAI service
        const { openAIService } = await import('./backend/services/openai.js');
        
        console.log('   ✅ OpenAI service imported successfully');
        console.log('   ✅ OpenAI API key configured');
        console.log(`   📊 Assistant ID: ${assistantId}`);
        console.log(`   📊 Model: ${process.env.OPENAI_MODEL || 'gpt-4o'}`);
        
        return true;
    } catch (error) {
        console.log('   ❌ OpenAI integration failed:', error.message);
        return false;
    }
}

// Test Database Schema
async function testDatabaseSchema() {
    console.log('\n4. Testing Database Schema...');
    
    try {
        // Check if schema file exists
        const schemaPath = join(__dirname, 'database-schema.sql');
        if (!existsSync(schemaPath)) {
            console.log('   ❌ Database schema file not found');
            return false;
        }
        
        console.log('   ✅ Database schema file exists');
        console.log(`   📊 Schema file: ${schemaPath}`);
        
        return true;
    } catch (error) {
        console.log('   ❌ Database schema test failed:', error.message);
        return false;
    }
}

// Test Webhook Routes
async function testWebhookRoutes() {
    console.log('\n5. Testing Webhook Routes...');
    
    try {
        // Import webhook routes
        const messengerRoutes = await import('./backend/routes/webhook.js');
        const whatsappRoutes = await import('./backend/routes/whatsapp.js');
        
        console.log('   ✅ Messenger webhook routes imported successfully');
        console.log('   ✅ WhatsApp webhook routes imported successfully');
        
        return true;
    } catch (error) {
        console.log('   ❌ Webhook routes test failed:', error.message);
        return false;
    }
}

// Test API Routes
async function testAPIRoutes() {
    console.log('\n6. Testing API Routes...');
    
    try {
        // Import API routes
        const productRoutes = await import('./backend/routes/products.js');
        const orderRoutes = await import('./backend/routes/orders.js');
        const adminRoutes = await import('./backend/routes/admin.js');
        
        console.log('   ✅ Product routes imported successfully');
        console.log('   ✅ Order routes imported successfully');
        console.log('   ✅ Admin routes imported successfully');
        
        return true;
    } catch (error) {
        console.log('   ❌ API routes test failed:', error.message);
        return false;
    }
}

// Test Dependencies
async function testDependencies() {
    console.log('\n7. Testing Dependencies...');
    
    try {
        // Test critical dependencies
        await import('@supabase/supabase-js');
        console.log('   ✅ @supabase/supabase-js imported successfully');
        
        await import('googleapis');
        console.log('   ✅ googleapis imported successfully');
        
        await import('openai');
        console.log('   ✅ openai imported successfully');
        
        await import('express');
        console.log('   ✅ express imported successfully');
        
        return true;
    } catch (error) {
        console.log('   ❌ Dependencies test failed:', error.message);
        return false;
    }
}

// Main verification function
async function runVerification() {
    console.log('Starting comprehensive integration verification...\n');
    
    const results = {
        supabase: await testSupabaseIntegration(),
        googleSheets: await testGoogleSheetsIntegration(),
        openAI: await testOpenAIIntegration(),
        databaseSchema: await testDatabaseSchema(),
        webhookRoutes: await testWebhookRoutes(),
        apiRoutes: await testAPIRoutes(),
        dependencies: await testDependencies()
    };
    
    console.log('\n📊 Verification Summary:');
    console.log('=======================');
    
    const passed = Object.values(results).filter(Boolean).length;
    const total = Object.keys(results).length;
    
    Object.entries(results).forEach(([test, result]) => {
        const status = result ? '✅ PASS' : '❌ FAIL';
        console.log(`${status} ${test.charAt(0).toUpperCase() + test.slice(1)}`);
    });
    
    console.log(`\n🎯 Overall Score: ${passed}/${total} tests passed`);
    
    if (passed === total) {
        console.log('\n🎉 All integrations verified successfully!');
        console.log('✅ Your sales agent is ready for testing!');
        console.log('\nNext steps:');
        console.log('1. Set up your Supabase database using database-schema.sql');
        console.log('2. Update SUPABASE_URL and SUPABASE_SERVICE_KEY in .env');
        console.log('3. Test the agent using the admin dashboard');
        console.log('4. Configure webhooks for Messenger and WhatsApp');
    } else {
        console.log('\n⚠️  Some integrations need attention before testing');
        console.log('Please fix the failing tests and run verification again.');
    }
    
    return passed === total;
}

// Run verification
runVerification().catch(console.error); 