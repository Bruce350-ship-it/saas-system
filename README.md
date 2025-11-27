# SaaS Multi-Tenant System

A comprehensive SaaS multi-tenant system built with Next.js, Prisma, PostgreSQL, and Flutter. This system supports multiple tenants with separate databases, role-based authentication, and offline mobile capabilities.

## ✨ Recent Updates

- **✅ Automated Tenant Provisioning**: One-click tenant creation with complete database setup
- **✅ Enhanced UI/UX**: Improved loading states, navigation, and user experience
- **✅ Security Improvements**: Admin self-protection and proper user management
- **✅ Mobile Integration**: Seamless offline-first mobile app with auto-sync
- **✅ Database Management**: Automated tenant database creation and deletion
- **✅ ID Consistency**: Fixed tenant ID generation and database naming

## 🏗️ Architecture

- **Backend**: Next.js 16 with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Frontend**: Next.js with Mantine UI components
- **Mobile**: Flutter with SQLite for offline support
- **Authentication**: JWT-based with role-based access control
- **Multi-tenancy**: Separate databases per tenant

## 📁 Project Structure

```
saas_next_system/
├── admin/                          # Next.js web application
│   ├── app/                        # Next.js app directory
│   │   ├── api/                    # API routes
│   │   ├── dashboard/              # Dashboard pages
│   │   └── login/                  # Authentication pages
│   ├── components/                 # Reusable UI components
│   ├── contexts/                   # React contexts
│   ├── lib/                        # Utility functions
│   └── prisma/                     # Database schemas and migrations
├── mobile/                         # Flutter mobile application
│   ├── lib/
│   │   ├── models/                 # Data models
│   │   ├── services/               # API and database services
│   │   ├── providers/              # State management
│   │   └── screens/                # UI screens
│   └── pubspec.yaml               # Flutter dependencies
├── docs/                           # Documentation
└── README.md                       # This file
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- Flutter SDK 3.0+
- Git

### 1. Clone and Setup

```bash
git clone <repository-url>
cd saas_next_system
```

### 2. Backend Setup (Next.js)

```bash
cd admin
npm install --legacy-peer-deps
```

Create environment file:
```bash
cp .env.example .env
```

Edit `.env` with your database credentials:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/saas_master_db"
JWT_SECRET="your-super-secret-jwt-key-here-make-it-long-and-random"
PGPASSWORD="postgres"
NODE_ENV="development"
```

**Important**: Create the master database first:
```bash
# Create the master database in PostgreSQL
createdb saas_master_db
```

Initialize database:
```bash
# Set DATABASE_URL and push the master schema
$env:DATABASE_URL="postgresql://username:password@localhost:5432/saas_master_db"; npx prisma db push --schema prisma/schema-master.prisma --skip-generate

# Generate Prisma client
npx prisma generate --schema prisma/schema-master.prisma

# Seed the master database
npx prisma db seed
```

### Simple db set up
```bash
npx prisma migrate dev --schema prisma/schema-master.prisma --name init
```

Start development server:
```bash
npm run dev
```

The web application will be available at `http://localhost:3000`

### 3. Mobile Setup (Flutter)

```bash
cd mobile
flutter pub get
```

Generate model files:
```bash
flutter pub run build_runner build --delete-conflicting-outputs
```

**Important**: Update the API base URL in `lib/utils/constants.dart`:
```dart
// For emulator to connect to host machine
static const String baseUrl = 'http://10.180.200.69:3000/api';
// Replace 10.180.200.69 with your host machine's IP address
```

Run the mobile app:
```bash
flutter run
```

## 🔐 Default Credentials

- **Super Admin**: `admin@example.com` / `password` (created by seed)
- **Test Tenant**: Create through super admin dashboard

## 📊 Features

### Web Dashboard (Next.js)

#### Super Admin Features
- **Tenant Management**: Create and manage business tenants with automated provisioning
- **System Overview**: Monitor system health and metrics
- **Tenant Dashboard**: Dedicated page for tenant management with create/delete functionality
- **Automated Provisioning**: One-click tenant creation with complete database setup
- **Database Management**: Automatic tenant database creation and deletion

#### Admin Features
- **User Management**: Create, update, and delete tenant users (with self-protection)
- **Product Management**: Manage product catalog
- **Sales Management**: View and track sales records with accurate revenue calculations
- **Dashboard**: Overview of key metrics with real-time data
- **Security**: Admins cannot delete their own accounts

### Mobile App (Flutter)

#### Core Features
- **Offline Support**: Works without internet connection
- **Product Catalog**: Browse available products with proper price parsing
- **Sales Creation**: Create sales offline with automatic sync
- **Auto Sync**: Automatically sync when online with connectivity monitoring
- **Manual Sync**: Force sync pending sales with status indicators
- **Type Safety**: Proper JSON serialization with custom converters

#### Offline Capabilities
- Products cached locally
- Sales queued for sync
- Automatic retry on connection
- Conflict resolution (server wins)

## 🗄️ Database Schema

### Master Database
- `tenants`: Business tenant information
- `super_admins`: System administrators

### Tenant Database
- `users`: Tenant users (admin/user roles)
- `products`: Product catalog
- `sales`: Sales transactions

## 🔧 API Documentation

Complete API documentation is available in [`docs/API.md`](docs/API.md).

### Key Endpoints

- `POST /api/auth/login` - User authentication
- `GET /api/tenants` - List tenants (super admin)
- `POST /api/tenants` - Create tenant (super admin)
- `GET /api/users` - List users (admin)
- `POST /api/users` - Create user (admin)
- `GET /api/products` - List products
- `POST /api/products` - Create product
- `GET /api/sales` - List sales
- `POST /api/sales` - Create sale
- `POST /api/sync` - Sync offline data (mobile)

## 🏢 Multi-Tenancy

### Tenant Provisioning

1. **Automated**: Super admin creates tenant via dashboard with one-click provisioning
2. **Complete Setup**: Automatic database creation, schema migration, and admin user creation
3. **Isolation**: Each tenant has separate PostgreSQL database with consistent naming
4. **Cleanup**: Automatic database deletion when tenant is removed

### Automated Tenant Creation Process

When creating a new tenant:
1. **Master Record**: Create tenant record in master database with Prisma-generated ID
2. **Database Creation**: Create PostgreSQL database with consistent naming (`saas_tenant_{id}`)
3. **Schema Migration**: Run Prisma migrations to create tables
4. **Admin User**: Create admin user with provided credentials
5. **Sample Data**: Seed with sample products and sales
6. **URL Update**: Update master record with actual database URL

## 📱 Mobile Development

### State Management
- **Provider Pattern**: For state management
- **Local Storage**: SQLite for offline data
- **Secure Storage**: JWT token storage

### Offline Sync
- **Queue-based**: Unsynced sales queued locally
- **Auto-sync**: Syncs when connection available
- **Conflict Resolution**: Server data takes precedence

## 🧪 Testing

### Backend Testing
```bash
cd admin
npm test
```

### Mobile Testing
```bash
cd mobile
flutter test
```

## 🚀 Deployment

### Production Setup

1. **Environment Variables**: Set production values
2. **Database**: Configure production PostgreSQL
3. **Security**: Use strong JWT secrets
4. **SSL**: Enable HTTPS for production

## 📝 Development

### Adding Features

1. **Backend**: Add API routes in `admin/app/api/`
2. **Frontend**: Add pages in `admin/app/dashboard/`
3. **Mobile**: Add screens in `mobile/lib/screens/`
4. **Database**: Update Prisma schemas

### Code Style

- **TypeScript**: Strict mode enabled
- **ESLint**: Configured for Next.js
- **Prettier**: Code formatting
- **Flutter**: Dart linting enabled

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🛠️ Troubleshooting

### Common Issues

#### 1. **401 Login Errors**
- **Issue**: Mobile app gets 401 when trying to login
- **Solution**: Ensure tenant database URL is properly set in master database
- **Check**: Verify tenant exists and database is accessible

#### 2. **Mobile App Connection Refused**
- **Issue**: Flutter app cannot connect to backend
- **Solution**: Update API base URL in `lib/utils/constants.dart` with host machine IP
- **Example**: `http://10.180.200.69:3000/api` (replace with your IP)

#### 3. **Tenant Creation Fails**
- **Issue**: Tenant creation shows error during provisioning
- **Solution**: Check PostgreSQL is running and `PGPASSWORD` is set
- **Verify**: Database permissions and connection settings

#### 4. **Mobile App Type Errors**
- **Issue**: Flutter app shows type casting errors
- **Solution**: Run `flutter pub run build_runner build --delete-conflicting-outputs`
- **Check**: Ensure JSON serialization is properly generated

#### 5. **Database Permission Errors**
- **Issue**: Prisma commands fail with permission errors
- **Solution**: Ensure PostgreSQL user has proper permissions
- **Check**: Database ownership and connection settings

### Debug Commands

```bash
# Check tenant databases
psql -h localhost -p 5432 -U username -l | findstr saas_tenant

# Check master database tenants
psql -h localhost -p 5432 -U username -d saas_master_db -c "SELECT * FROM tenants;"

# Check tenant users
psql -h localhost -p 5432 -U username -d saas_tenant_{id} -c "SELECT * FROM users;"
```

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the API documentation
- Review the code comments
- Check the troubleshooting section above

## 🔄 Version History

- **v1.1.0**: Enhanced Features & Bug Fixes
  - ✅ Automated tenant provisioning with complete database setup
  - ✅ Enhanced UI/UX with loading states and improved navigation
  - ✅ Security improvements with admin self-protection
  - ✅ Fixed tenant ID consistency and database naming
  - ✅ Improved mobile app with proper type handling
  - ✅ Automatic tenant database deletion and cleanup
  - ✅ Better error handling and user feedback

- **v1.0.0**: Initial release with core features
  - Multi-tenant architecture
  - Role-based authentication
  - Web dashboard
  - Mobile app with offline support
  - API documentation

## 🎯 Roadmap

- [ ] Real-time notifications
- [ ] Advanced analytics
- [ ] Multi-language support
- [ ] API rate limiting
- [ ] Automated testing
- [ ] CI/CD pipeline
- [ ] Docker, Kubernetes deployment
- [ ] Microservices architecture


