import express from 'express';
import { dbUtils } from '../models/database.js';
import { googleSheetsService } from '../services/googleSheets.js';
import { orderService, customerService } from '../services/supabase.js';

const router = express.Router();

// POST /api/orders - Create a new order (enhanced with Supabase)
router.post('/', async (req, res) => {
    try {
        const {
            items, // Array of {productId, quantity, variantId?}
            customerName,
            customerPhone,
            customerEmail,
            platformType = 'web',
            platformId,
            wilaya,
            address,
            notes
        } = req.body;

        // Validation
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields',
                message: 'items array is required and must contain at least one item'
            });
        }

        if (!customerName || !customerPhone) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields',
                message: 'customerName and customerPhone are required'
            });
        }

        // Validate items
        for (const item of items) {
            if (!item.productId || !item.quantity || item.quantity <= 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid item data',
                    message: 'Each item must have productId and quantity > 0'
                });
            }
        }

        // Prepare customer data
        const customerData = {
            platformId: platformId || customerPhone,
            platformType,
            name: customerName,
            phone: customerPhone,
            email: customerEmail,
            wilaya,
            address
        };

        // Prepare order data
        const orderData = {
            shippingAddress: address,
            wilaya,
            phone: customerPhone,
            notes
        };

        // Create order using Supabase service
        const order = await orderService.createOrder(customerData, items, orderData);

        // Add to Google Sheets (if configured)
        try {
            await googleSheetsService.addOrder(order);
        } catch (error) {
            console.warn('Failed to add order to Google Sheets:', error.message);
        }

        res.status(201).json({
            success: true,
            data: order,
            message: 'Order created successfully'
        });

    } catch (error) {
        console.error('Error creating order:', error);
        
        // Fallback to in-memory database for single-item orders
        try {
            const {
                productId,
                quantity,
                customerName,
                customerPhone,
                customerEmail,
                wilaya,
                address,
                notes
            } = req.body;

            // Only fallback if it's a single product order
            if (productId && quantity && customerName && customerPhone) {
                // Check if product exists and has sufficient stock
                const product = dbUtils.getProductById(productId);
                if (!product) {
                    return res.status(404).json({
                        success: false,
                        error: 'Product not found',
                        message: `Product with ID "${productId}" does not exist`
                    });
                }

                if (product.stock < quantity) {
                    return res.status(400).json({
                        success: false,
                        error: 'Insufficient stock',
                        message: `Only ${product.stock} items available, but ${quantity} requested`
                    });
                }

                // Calculate total amount
                const unitPrice = product.price;
                const totalAmount = unitPrice * quantity;

                // Create or get customer
                let customer = dbUtils.getCustomerByPhone(customerPhone);
                if (!customer) {
                    customer = dbUtils.createCustomer({
                        name: customerName,
                        phone: customerPhone,
                        email: customerEmail,
                        wilaya,
                        address
                    });
                } else {
                    // Update customer info if provided
                    customer = dbUtils.updateCustomer(customer.id, {
                        name: customerName,
                        email: customerEmail || customer.email,
                        wilaya: wilaya || customer.wilaya,
                        address: address || customer.address
                    });
                }

                // Create order
                const orderData = {
                    productId,
                    productName: product.name,
                    quantity: parseInt(quantity),
                    unitPrice,
                    totalAmount,
                    customerId: customer.id,
                    customerName,
                    customerPhone,
                    customerEmail,
                    wilaya,
                    address,
                    notes,
                    status: 'pending'
                };

                const order = dbUtils.createOrder(orderData);

                // Update product stock
                dbUtils.updateProductStock(productId, product.stock - quantity);

                // Add to Google Sheets (if configured)
                try {
                    await googleSheetsService.addOrder(order);
                } catch (sheetsError) {
                    console.warn('Failed to add order to Google Sheets:', sheetsError.message);
                }

                res.status(201).json({
                    success: true,
                    data: order,
                    message: 'Order created successfully (fallback)',
                    source: 'fallback'
                });
            } else {
                res.status(500).json({
                    success: false,
                    error: 'Failed to create order',
                    message: error.message
                });
            }
        } catch (fallbackError) {
            res.status(500).json({
                success: false,
                error: 'Failed to create order',
                message: fallbackError.message
            });
        }
    }
});

// GET /api/orders - Get all orders
router.get('/', (req, res) => {
    try {
        const { status, customerId, limit, offset, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
        let orders = dbUtils.getAllOrders();

        // Filter by status
        if (status) {
            orders = orders.filter(order => order.status === status);
        }

        // Filter by customer
        if (customerId) {
            orders = orders.filter(order => order.customerId === customerId);
        }

        // Sort orders
        orders.sort((a, b) => {
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
        const limitNum = parseInt(limit) || orders.length;
        const paginatedOrders = orders.slice(startIndex, startIndex + limitNum);

        res.json({
            success: true,
            data: paginatedOrders,
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
            error: 'Failed to fetch orders',
            message: error.message
        });
    }
});

// GET /api/orders/:id - Get order by ID
router.get('/:id', (req, res) => {
    try {
        const { id } = req.params;
        const order = dbUtils.getOrderById(id);

        if (!order) {
            return res.status(404).json({
                success: false,
                error: 'Order not found',
                message: `Order with ID "${id}" does not exist`
            });
        }

        // Get product details
        const product = dbUtils.getProductById(order.productId);
        
        // Get customer details
        const customer = dbUtils.getCustomerById(order.customerId);

        res.json({
            success: true,
            data: {
                ...order,
                product,
                customer
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch order',
            message: error.message
        });
    }
});

// PUT /api/orders/:id - Update order
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const existingOrder = dbUtils.getOrderById(id);
        if (!existingOrder) {
            return res.status(404).json({
                success: false,
                error: 'Order not found',
                message: `Order with ID "${id}" does not exist`
            });
        }

        // If status is being updated to 'cancelled', restore product stock
        if (updateData.status === 'cancelled' && existingOrder.status !== 'cancelled') {
            const product = dbUtils.getProductById(existingOrder.productId);
            if (product) {
                dbUtils.updateProductStock(existingOrder.productId, product.stock + existingOrder.quantity);
            }
        }

        const updatedOrder = dbUtils.updateOrder(id, updateData);

        res.json({
            success: true,
            data: updatedOrder,
            message: 'Order updated successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to update order',
            message: error.message
        });
    }
});

// DELETE /api/orders/:id - Delete order
router.delete('/:id', (req, res) => {
    try {
        const { id } = req.params;
        const order = dbUtils.getOrderById(id);

        if (!order) {
            return res.status(404).json({
                success: false,
                error: 'Order not found',
                message: `Order with ID "${id}" does not exist`
            });
        }

        // Restore product stock if order is not cancelled
        if (order.status !== 'cancelled') {
            const product = dbUtils.getProductById(order.productId);
            if (product) {
                dbUtils.updateProductStock(order.productId, product.stock + order.quantity);
            }
        }

        const deleted = dbUtils.deleteOrder(id);

        if (deleted) {
            res.json({
                success: true,
                message: 'Order deleted successfully'
            });
        } else {
            res.status(500).json({
                success: false,
                error: 'Failed to delete order'
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to delete order',
            message: error.message
        });
    }
});

// GET /api/orders/:id/status - Get order status
router.get('/:id/status', (req, res) => {
    try {
        const { id } = req.params;
        const order = dbUtils.getOrderById(id);

        if (!order) {
            return res.status(404).json({
                success: false,
                error: 'Order not found'
            });
        }

        res.json({
            success: true,
            data: {
                orderId: id,
                status: order.status,
                createdAt: order.createdAt,
                updatedAt: order.updatedAt,
                statusHistory: order.statusHistory || []
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to get order status',
            message: error.message
        });
    }
});

// POST /api/orders/:id/status - Update order status
router.post('/:id/status', (req, res) => {
    try {
        const { id } = req.params;
        const { status, notes } = req.body;

        if (!status) {
            return res.status(400).json({
                success: false,
                error: 'Status is required'
            });
        }

        const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid status',
                message: `Status must be one of: ${validStatuses.join(', ')}`
            });
        }

        const order = dbUtils.getOrderById(id);
        if (!order) {
            return res.status(404).json({
                success: false,
                error: 'Order not found'
            });
        }

        // Create status history entry
        const statusHistory = order.statusHistory || [];
        statusHistory.push({
            status,
            timestamp: new Date().toISOString(),
            notes
        });

        const updatedOrder = dbUtils.updateOrder(id, {
            status,
            statusHistory,
            ...(notes && { notes })
        });

        res.json({
            success: true,
            data: updatedOrder,
            message: `Order status updated to ${status}`
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to update order status',
            message: error.message
        });
    }
});

export default router; 