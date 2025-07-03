# X Company Bio Products - Express.js Backend

A comprehensive Express.js backend for managing bio products sales, customer relationships, and AI-powered chat support.

## 🚀 Features

- **Product Management**: Complete CRUD operations for bio products
- **Order Processing**: Order creation, tracking, and status management
- **Customer Management**: Customer profiles and order history
- **AI Chat Support**: OpenAI-powered customer assistance
- **Analytics Dashboard**: Sales, product, and customer analytics
- **Google Sheets Integration**: Automatic order backup and sync
- **Admin Panel**: System monitoring and maintenance tools
- **Multi-language Support**: French and Arabic interfaces
- **Security**: Rate limiting, CORS, and security headers
- **RESTful API**: Well-structured API endpoints

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd x-company-bio-products
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the root directory:
   ```env
   # Server Configuration
   NODE_ENV=development
   PORT=3000

   # OpenAI Configuration (optional)
   OPENAI_API_KEY=your_openai_api_key_here
   OPENAI_MODEL=gpt-4-turbo-preview

   # Google Sheets Integration (optional)
   GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_private_key_here\n-----END PRIVATE KEY-----\n"
   GOOGLE_SHEETS_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
   GOOGLE_SHEETS_SPREADSHEET_ID=your_spreadsheet_id_here
   ```

4. **Start the server**
   ```bash
   # Development mode with auto-reload
   npm run dev

   # Production mode
   npm start

   # Run both backend and frontend
   npm run dev:both
   ```

## 🌐 API Endpoints

### Health & Documentation
- `GET /health` - Health check
- `GET /api` - API documentation

### Products
- `GET /api/products` - List all products
- `GET /api/products/search?q=query` - Search products
- `GET /api/products/categories` - Get categories
- `GET /api/products/:id` - Get product details
- `GET /api/products/category/:category` - Products by category
- `GET /api/products/:id/related` - Related products
- `GET /api/products/:id/availability` - Check availability

### Orders
- `POST /api/orders` - Create new order
- `GET /api/orders` - List orders
- `GET /api/orders/:id` - Get order details
- `PUT /api/orders/:id` - Update order
- `DELETE /api/orders/:id` - Delete order
- `GET /api/orders/:id/status` - Get order status
- `POST /api/orders/:id/status` - Update order status

### Customers
- `POST /api/customers` - Create customer
- `GET /api/customers` - List customers
- `GET /api/customers/:id` - Get customer details
- `PUT /api/customers/:id` - Update customer
- `GET /api/customers/phone/:phone` - Find by phone
- `GET /api/customers/:id/orders` - Customer orders

### Chat
- `POST /api/chat/start` - Start chat session
- `POST /api/chat/message` - Send message
- `GET /api/chat/:threadId/history` - Chat history
- `GET /api/chat/:threadId` - Chat thread details
- `PUT /api/chat/:threadId/status` - Update chat status
- `GET /api/chat` - List all chats (admin)

### Analytics
- `GET /api/analytics/dashboard` - Dashboard overview
- `GET /api/analytics/sales` - Sales analytics
- `GET /api/analytics/products` - Product analytics
- `GET /api/analytics/customers` - Customer analytics

### Admin
- `GET /api/admin/stats` - System statistics
- `GET /api/admin/config` - System configuration
- `GET /api/admin/logs` - System logs
- `POST /api/admin/backup` - Create backup
- `POST /api/admin/maintenance` - Maintenance operations
- `GET /api/admin/health` - Detailed health check

## 🛍️ Bio Products Catalog

The system includes 8 premium bio products:

1. **Poudre de Protéines Bio (Vanille)** - 45.99€
   - Récupération musculaire, protéines complètes

2. **Thé Vert Biologique (50 sachets)** - 18.99€
   - Antioxydants, boost métabolisme

3. **Complexe Multivitamines Bio** - 32.99€
   - Support immunitaire, énergie naturelle

4. **Miel Pur Biologique (500g)** - 24.99€
   - Antibactérien naturel, source d'énergie

5. **Huile de Poisson Oméga-3 Bio** - 28.99€
   - Santé cardiovasculaire, fonction cérébrale

6. **Huile de Noix de Coco Biologique (500ml)** - 22.99€
   - MCT naturels, polyvalent

7. **Comprimés de Spiruline Bio** - 35.99€
   - Protéines complètes, détoxification

8. **Graines de Chia Biologiques (250g)** - 16.99€
   - Oméga-3 végétal, fibres

## 🤖 AI Chat Integration

The system includes an intelligent chat assistant powered by OpenAI:

- **Multi-language support**: French and Arabic
- **Product recommendations**: Based on customer needs
- **Order assistance**: Help with placing orders
- **Product information**: Detailed product explanations
- **Fallback responses**: Works even without OpenAI configuration

## 📊 Google Sheets Integration

Automatic synchronization with Google Sheets for:

- **Order backup**: All orders automatically saved
- **Customer data**: Customer information sync
- **Real-time updates**: Order status changes reflected
- **Bulk operations**: Mass data synchronization

## 🔒 Security Features

- **Rate Limiting**: 100 requests per 15 minutes (general), 10 per minute (chat)
- **CORS Protection**: Configurable origins
- **Security Headers**: Helmet.js integration
- **Input Validation**: Request validation and sanitization
- **Error Handling**: Secure error responses

## 📈 Analytics & Reporting

Comprehensive analytics including:

- **Sales Metrics**: Revenue, orders, growth rates
- **Product Performance**: Views, conversions, top sellers
- **Customer Insights**: Segmentation, geographic distribution
- **System Health**: Performance monitoring, alerts

## 🛠️ Development

### Project Structure
```
backend/
├── server.js              # Main server file
├── models/
│   └── database.js         # In-memory database
├── routes/
│   ├── products.js         # Product endpoints
│   ├── orders.js           # Order endpoints
│   ├── customers.js        # Customer endpoints
│   ├── chat.js             # Chat endpoints
│   ├── analytics.js        # Analytics endpoints
│   └── admin.js            # Admin endpoints
└── services/
    ├── openai.js           # OpenAI integration
    └── googleSheets.js     # Google Sheets integration
```

### Database
Currently uses in-memory storage with Maps. Ready for database integration:
- Products, Orders, Customers, Chat Threads
- Analytics data (views, sales, interactions)
- Utility functions for CRUD operations

### API Response Format
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message",
  "pagination": { ... }  // For paginated responses
}
```

## 🚀 Deployment

### Environment Variables
Set the following environment variables for production:

- `NODE_ENV=production`
- `PORT=3000`
- `OPENAI_API_KEY` (optional)
- `GOOGLE_SHEETS_*` (optional)

### Docker Support
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 📝 API Usage Examples

### Create an Order
```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "poudre-proteinee-bio",
    "quantity": 2,
    "customerName": "Ahmed Benali",
    "customerPhone": "+213555123456",
    "wilaya": "Alger",
    "address": "123 Rue de la Paix, Alger"
  }'
```

### Start Chat Session
```bash
curl -X POST http://localhost:3000/api/chat/start \
  -H "Content-Type: application/json" \
  -d '{
    "customerPhone": "+213555123456",
    "customerName": "Ahmed Benali",
    "language": "fr"
  }'
```

### Get Analytics Dashboard
```bash
curl http://localhost:3000/api/analytics/dashboard
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For support and questions:
- Check the API documentation at `/api`
- Review the health check at `/health`
- Monitor system status at `/api/admin/health`

---

**X Company Bio Products Backend v2.0.0**  
Built with Express.js, OpenAI, and Google Sheets integration 