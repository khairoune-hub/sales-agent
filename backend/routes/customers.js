import express from 'express';
import { dbUtils } from '../models/database.js';

const router = express.Router();

// POST /api/customers - Create a new customer
router.post('/', (req, res) => {
    try {
        const { name, phone, email, wilaya, address, notes } = req.body;

        // Validation
        if (!name || !phone) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields',
                message: 'name and phone are required'
            });
        }

        // Check if customer with this phone already exists
        const existingCustomer = dbUtils.getCustomerByPhone(phone);
        if (existingCustomer) {
            return res.status(409).json({
                success: false,
                error: 'Customer already exists',
                message: `Customer with phone ${phone} already exists`,
                data: existingCustomer
            });
        }

        const customer = dbUtils.createCustomer({
            name,
            phone,
            email,
            wilaya,
            address,
            notes
        });

        res.status(201).json({
            success: true,
            data: customer,
            message: 'Customer created successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to create customer',
            message: error.message
        });
    }
});

// GET /api/customers - Get all customers
router.get('/', (req, res) => {
    try {
        const { limit, offset, sortBy = 'createdAt', sortOrder = 'desc', search } = req.query;
        let customers = dbUtils.getAllCustomers();

        // Search functionality
        if (search) {
            const searchTerm = search.toLowerCase();
            customers = customers.filter(customer =>
                customer.name.toLowerCase().includes(searchTerm) ||
                customer.phone.includes(searchTerm) ||
                (customer.email && customer.email.toLowerCase().includes(searchTerm)) ||
                (customer.wilaya && customer.wilaya.toLowerCase().includes(searchTerm))
            );
        }

        // Sort customers
        customers.sort((a, b) => {
            const aValue = a[sortBy];
            const bValue = b[sortBy];
            
            if (sortOrder === 'desc') {
                return bValue > aValue ? 1 : -1;
            } else {
                return aValue > bValue ? 1 : -1;
            }
        });

        // Apply pagination
        const startIndex = parseInt(offset) || 0;
        const limitNum = parseInt(limit) || customers.length;
        const paginatedCustomers = customers.slice(startIndex, startIndex + limitNum);

        res.json({
            success: true,
            data: paginatedCustomers,
            pagination: {
                total: customers.length,
                offset: startIndex,
                limit: limitNum,
                hasMore: startIndex + limitNum < customers.length
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch customers',
            message: error.message
        });
    }
});

// GET /api/customers/:id - Get customer by ID
router.get('/:id', (req, res) => {
    try {
        const { id } = req.params;
        const customer = dbUtils.getCustomerById(id);

        if (!customer) {
            return res.status(404).json({
                success: false,
                error: 'Customer not found',
                message: `Customer with ID "${id}" does not exist`
            });
        }

        // Get customer's orders
        const orders = dbUtils.getAllOrders().filter(order => order.customerId === id);
        
        // Calculate customer statistics
        const totalOrders = orders.length;
        const totalSpent = orders.reduce((sum, order) => sum + order.totalAmount, 0);
        const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;

        res.json({
            success: true,
            data: {
                ...customer,
                statistics: {
                    totalOrders,
                    totalSpent,
                    averageOrderValue,
                    lastOrderDate: orders.length > 0 ? orders[0].createdAt : null
                },
                recentOrders: orders.slice(0, 5) // Last 5 orders
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch customer',
            message: error.message
        });
    }
});

// PUT /api/customers/:id - Update customer
router.put('/:id', (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const existingCustomer = dbUtils.getCustomerById(id);
        if (!existingCustomer) {
            return res.status(404).json({
                success: false,
                error: 'Customer not found',
                message: `Customer with ID "${id}" does not exist`
            });
        }

        // If phone is being updated, check for conflicts
        if (updateData.phone && updateData.phone !== existingCustomer.phone) {
            const phoneConflict = dbUtils.getCustomerByPhone(updateData.phone);
            if (phoneConflict) {
                return res.status(409).json({
                    success: false,
                    error: 'Phone number already in use',
                    message: `Phone ${updateData.phone} is already associated with another customer`
                });
            }
        }

        const updatedCustomer = dbUtils.updateCustomer(id, updateData);

        res.json({
            success: true,
            data: updatedCustomer,
            message: 'Customer updated successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to update customer',
            message: error.message
        });
    }
});

// GET /api/customers/phone/:phone - Get customer by phone
router.get('/phone/:phone', (req, res) => {
    try {
        const { phone } = req.params;
        const customer = dbUtils.getCustomerByPhone(phone);

        if (!customer) {
            return res.status(404).json({
                success: false,
                error: 'Customer not found',
                message: `Customer with phone "${phone}" does not exist`
            });
        }

        res.json({
            success: true,
            data: customer
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch customer',
            message: error.message
        });
    }
});

// GET /api/customers/:id/orders - Get customer's orders
router.get('/:id/orders', (req, res) => {
    try {
        const { id } = req.params;
        const { status, limit, offset } = req.query;

        const customer = dbUtils.getCustomerById(id);
        if (!customer) {
            return res.status(404).json({
                success: false,
                error: 'Customer not found'
            });
        }

        let orders = dbUtils.getAllOrders().filter(order => order.customerId === id);

        // Filter by status if provided
        if (status) {
            orders = orders.filter(order => order.status === status);
        }

        // Sort by creation date (newest first)
        orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // Apply pagination
        const startIndex = parseInt(offset) || 0;
        const limitNum = parseInt(limit) || orders.length;
        const paginatedOrders = orders.slice(startIndex, startIndex + limitNum);

        res.json({
            success: true,
            data: paginatedOrders,
            customer: {
                id: customer.id,
                name: customer.name,
                phone: customer.phone
            },
            pagination: {
                total: orders.length,
                offset: startIndex,
                limit: limitNum,
                hasMore: startIndex + limitNum < orders.length
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch customer orders',
            message: error.message
        });
    }
});

export default router; 