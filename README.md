# CRMWIZH - AI-Powered CRM for Indonesian UMKM

Modern AI-powered Customer Relationship Management system designed specifically for Indonesian small and medium businesses (UMKM). Features intelligent WhatsApp integration, automated follow-ups, and comprehensive business analytics.

## Features

### 🎯 Core CRM
- **Contact Management** - Centralized customer database with intelligent lead scoring
- **Sales Pipeline** - Visual deal tracking with conversion analytics
- **Task Management** - Automated follow-up reminders and scheduling
- **Team Collaboration** - Multi-user access with role-based permissions

### 📱 WhatsApp Business Integration
- **Simple wa.me Links** - No API setup required, works instantly
- **Indonesian Templates** - Pre-built messages for order confirmations, payment reminders
- **Bulk Broadcasting** - Send promotions to multiple customers efficiently
- **Order Management** - Automated order confirmations and payment tracking

### 🤖 AI-Powered Features
- **Lead Scoring** - Intelligent customer prioritization
- **Sentiment Analysis** - Automatic email and message analysis
- **Follow-up Recommendations** - AI-suggested next actions
- **Campaign Optimization** - Smart email and WhatsApp campaigns

### 📧 Email Marketing
- **Template System** - Professional email templates
- **Campaign Automation** - Drip campaigns and nurture sequences
- **Analytics** - Open rates, click-through rates, conversion tracking
- **Mailgun Integration** - Reliable email delivery

### 📊 Business Intelligence
- **Sales Reports** - Revenue tracking and forecasting
- **Customer Analytics** - Behavior analysis and segmentation
- **Performance Metrics** - Team productivity and conversion rates
- **Export Tools** - Data export for external analysis

## Technology Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Replit Auth (OpenID Connect)
- **Email**: Mailgun API
- **AI**: DeepSeek API integration
- **Deployment**: Replit with auto-scaling

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Git

## Local Installation

### 1. Clone Repository
```bash
git clone <repository-url>
cd crmwizh
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Database Setup

#### Option A: Local PostgreSQL
```bash
# Install PostgreSQL (Ubuntu/Debian)
sudo apt update
sudo apt install postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql
CREATE DATABASE crmwizh;
CREATE USER crmuser WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE crmwizh TO crmuser;
\q
```

#### Option B: Use Neon (Recommended)
1. Sign up at [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string

### 4. Environment Variables

Create `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/crmwizh"

# Replit Auth (for production)
REPL_ID="your-repl-id"
ISSUER_URL="https://replit.com/oidc"
SESSION_SECRET="your-super-secret-session-key-min-32-chars"

# Email Service (Mailgun)
MAILGUN_DOMAIN="your-domain.com"
MAILGUN_SECRET="your-mailgun-api-key"
MAILGUN_ENDPOINT="https://api.mailgun.net"
MAIL_FROM_ADDRESS="noreply@your-domain.com"
MAIL_FROM_NAME="CRMWIZH"

# AI Service (Optional)
DEEPSEEK_API_KEY="your-deepseek-api-key"

# Development
NODE_ENV="development"
```

### 5. Database Migration
```bash
# Push schema to database
npm run db:push

# Verify tables created
npm run db:studio
```

### 6. Start Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## Production Deployment

### Replit Deployment (Recommended)

1. **Fork to Replit**
   - Import repository to Replit
   - All dependencies install automatically

2. **Configure Secrets**
   ```
   DATABASE_URL=<your-neon-database-url>
   MAILGUN_DOMAIN=<your-domain>
   MAILGUN_SECRET=<your-api-key>
   DEEPSEEK_API_KEY=<optional-ai-key>
   ```

3. **Custom Domain** (Optional)
   - Link custom domain in Replit
   - Configure DNS settings
   - SSL certificates handled automatically

### Manual Server Deployment

```bash
# Build application
npm run build

# Start production server
npm start
```

## Configuration

### Email Setup (Mailgun)

1. Sign up at [mailgun.com](https://mailgun.com)
2. Add and verify your domain
3. Get API key from dashboard
4. Add credentials to environment variables

### AI Features (DeepSeek)

1. Register at [deepseek.com](https://deepseek.com)
2. Generate API key
3. Add `DEEPSEEK_API_KEY` to environment
4. AI features will activate automatically

### WhatsApp Integration

No setup required! The system uses wa.me links that work with any WhatsApp account:

- Generate links automatically
- Open WhatsApp with pre-filled messages
- Works on mobile and desktop
- No API keys or business verification needed

## Usage Guide

### Getting Started

1. **Create Account** - Use Replit Auth or team invitation
2. **Add Contacts** - Import or manually add customer data
3. **Configure Templates** - Customize email and WhatsApp messages
4. **Start Campaigns** - Launch automated follow-up sequences

### WhatsApp for UMKM

1. Navigate to **WhatsApp Business** menu
2. Choose message type:
   - **Order Confirmation** - Automated order receipts
   - **Payment Reminder** - Outstanding invoice alerts
   - **Follow-up Review** - Customer satisfaction surveys
   - **Promotional Broadcast** - Marketing campaigns

3. Fill in customer details and message content
4. Click generate - WhatsApp opens with ready message
5. Review and send to customer

### Team Management

1. **Invite Members** - Send email invitations
2. **Set Roles** - Admin, Manager, or Member access
3. **Track Activity** - Monitor team performance
4. **Collaborate** - Shared contacts and deals

## API Documentation

### Authentication
All API endpoints require authentication via session cookies.

### Core Endpoints

```
GET /api/contacts - List all contacts
POST /api/contacts - Create new contact
GET /api/deals - List sales deals
POST /api/whatsapp/simple/generate-link - Generate WhatsApp link
POST /api/email/send - Send email campaign
```

### WhatsApp Simple API

```javascript
// Generate WhatsApp link
POST /api/whatsapp/simple/generate-link
{
  "contactId": 123,
  "templateId": "order_confirm_simple",
  "variables": {
    "orderId": "ORD001",
    "items": "Sepatu Nike",
    "total": "Rp 500.000"
  }
}

// Response
{
  "success": true,
  "waLink": "https://wa.me/628123456789?text=...",
  "message": "Generated message content"
}
```

## Troubleshooting

### Database Connection Issues
```bash
# Check database status
npm run db:studio

# Reset database
npm run db:push --force

# Check connection string format
DATABASE_URL="postgresql://user:pass@host:port/dbname"
```

### Email Not Sending
- Verify Mailgun domain verification
- Check API key validity
- Ensure sender domain matches Mailgun domain

### WhatsApp Links Not Working
- Ensure contact has valid phone number
- Check phone number format (Indonesian: +62)
- Verify message encoding for special characters

### Performance Issues
- Check database connection pool
- Monitor memory usage in Replit
- Optimize query patterns for large datasets

## Development

### Project Structure
```
├── client/src/          # React frontend
│   ├── components/      # Reusable UI components
│   ├── pages/          # Application pages
│   └── hooks/          # Custom React hooks
├── server/             # Express backend
│   ├── routes.ts       # API endpoints
│   ├── storage.ts      # Database layer
│   └── services/       # Business logic
├── shared/             # Shared types and schemas
└── docs/              # Documentation
```

### Adding Features

1. **New API Endpoint**
   ```typescript
   // server/routes.ts
   app.get('/api/new-feature', isAuthenticated, async (req, res) => {
     // Implementation
   });
   ```

2. **New React Page**
   ```typescript
   // client/src/pages/new-page.tsx
   export default function NewPage() {
     // Component implementation
   }
   ```

3. **Database Schema**
   ```typescript
   // shared/schema.ts
   export const newTable = pgTable('new_table', {
     // Schema definition
   });
   ```

### Testing

```bash
# Run tests
npm test

# Test database connection
npm run db:test

# Test API endpoints
curl -X GET http://localhost:5000/api/health
```

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Code Standards
- TypeScript for all new code
- ESLint + Prettier for formatting
- Tailwind CSS for styling
- React Query for data fetching

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

### Documentation
- [API Reference](docs/api.md)
- [Deployment Guide](docs/deployment.md)
- [WhatsApp Integration](docs/whatsapp.md)

### Community
- GitHub Issues for bug reports
- Discussions for feature requests
- Wiki for community guides

### Commercial Support
For enterprise deployments and custom development:
- Email: support@mediawave.co.id
- Website: https://mediawave.co.id

---

**Built with ❤️ for Indonesian UMKM**

*Empowering small businesses with enterprise-grade CRM tools*