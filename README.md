# FertyFlow EMR/HIS System

Enterprise-grade Electronic Medical Records (EMR) and Hospital Information System (HIS) specifically designed for IVF chains and fertility clinics.

## 🌟 Features

### Multi-Company & Multi-Clinic Support
- **Company Management**: Support for multiple healthcare companies
- **Clinic Management**: Each company can have multiple clinics
- **Role-Based Access Control**: Users can be assigned to specific companies/clinics with defined roles

### Patient Management
- **Patient Registration**: Complete patient onboarding with photo upload
- **Partner/Spouse Management**: Link couples for IVF treatments
- **Address Auto-fill**: Pincode-based address completion using external APIs
- **Marketing Channel Tracking**: Track patient acquisition sources

### IVF Treatment Module
- **Treatment Cycles**: Track multiple IVF cycles per patient
- **Ovarian Stimulation Logs**: Medication tracking and dosage monitoring
- **Embryology Lab**: Comprehensive embryo development tracking
- **Egg Retrieval & Fertilization**: Complete lab procedure records
- **Embryo Grading & Cryopreservation**: Advanced embryology management

### Billing & Financial Management
- **Multi-clinic Billing**: Separate billing for each clinic with correct headers
- **Package Management**: Pre-defined treatment packages
- **Tax Management**: GST, TIN, and other tax handling
- **Payment Tracking**: Complete payment history and account statements

### Inventory & Pharmacy
- **Stock Management**: Multi-location inventory tracking
- **Expiry Alerts**: Automated medication expiry notifications
- **Inter-clinic Transfers**: Stock movement between clinics
- **Purchase Orders**: Vendor management and procurement

### Lab & Reports
- **Pathology Integration**: Upload and manage lab reports
- **Test Categories**: Organized test management
- **Normal Range Tracking**: Gender-specific reference ranges
- **Report History**: Complete patient lab history

### User Management & Security
- **Role-Based Access**: 10 predefined roles (Super Admin, Doctor, Embryologist, etc.)
- **License Validation**: Mandatory license upload for medical practitioners
- **JWT Authentication**: Secure token-based authentication
- **Audit Trail**: Complete system activity logging

## 🏗️ Technical Architecture

### Backend (Node.js + Express)
```
backend/
├── src/
│   ├── config/
│   │   └── database.ts          # PostgreSQL configuration
│   ├── controllers/
│   │   └── auth.controller.ts   # Authentication logic
│   ├── middleware/
│   │   ├── auth.ts             # JWT middleware
│   │   ├── errorHandler.ts     # Error handling
│   │   └── notFound.ts         # 404 handler
│   ├── routes/
│   │   ├── auth.routes.ts      # Authentication routes
│   │   ├── user.routes.ts      # User management
│   │   ├── patient.routes.ts   # Patient operations
│   │   ├── treatment.routes.ts # Treatment tracking
│   │   ├── billing.routes.ts   # Billing operations
│   │   └── inventory.routes.ts # Inventory management
│   ├── utils/
│   │   └── logger.ts           # Logging utility
│   └── server.ts               # Express server setup
├── package.json
├── tsconfig.json
└── .env.example
```

### Frontend (React + TypeScript + Tailwind CSS)
```
frontend/
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── DashboardLayout.tsx
│   │   │   ├── Header.tsx
│   │   │   └── Sidebar.tsx
│   │   └── ui/
│   │       └── LoadingSpinner.tsx
│   ├── contexts/
│   │   └── AuthContext.tsx     # Global auth state
│   ├── pages/
│   │   ├── LoginPage.tsx       # Authentication
│   │   ├── Dashboard.tsx       # Main dashboard
│   │   ├── PatientRegistration.tsx
│   │   ├── TreatmentModule.tsx
│   │   ├── BillingModule.tsx
│   │   └── InventoryModule.tsx
│   ├── services/
│   │   └── authService.ts      # API communication
│   ├── types/
│   │   └── auth.ts             # TypeScript interfaces
│   ├── App.tsx
│   ├── index.tsx
│   └── index.css
├── package.json
├── tsconfig.json
└── tailwind.config.js
```

### Database (PostgreSQL)
```
database/
└── schema.sql                  # Complete database schema
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Backend Setup
1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Setup environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials and JWT secrets
   ```

4. Setup database:
   ```bash
   # Connect to PostgreSQL and run:
   psql -U postgres -d fertyflow_db -f ../database/schema.sql
   ```

5. Start development server:
   ```bash
   npm run dev
   ```

### Frontend Setup
1. Navigate to frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start development server:
   ```bash
   npm start
   ```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 🔐 Default User Roles

1. **Super Admin**: Full system access across all companies and clinics
2. **Company Admin**: Admin access for specific company and its clinics
3. **Clinic Admin**: Admin access for specific clinic
4. **Doctor**: Medical practitioner with patient treatment access (requires license)
5. **Embryologist**: Lab specialist with embryology access (requires license)
6. **Nurse**: Nursing staff with limited patient access
7. **Receptionist**: Front desk with appointment and billing access
8. **Lab Technician**: Lab reports and test management
9. **Pharmacist**: Pharmacy and inventory management
10. **Billing Officer**: Billing and payment management

## 📊 Database Schema

### Key Tables
- **companies**: Multi-company support with GST, TIN details
- **clinics**: Multi-clinic support under companies
- **users**: User management with role-based access
- **patients**: Complete patient demographics and tracking
- **treatment_cycles**: IVF cycle management
- **embryology_records**: Detailed embryo development tracking
- **patient_bills**: Comprehensive billing system
- **inventory_items**: Multi-location stock management

### Relationships
- Companies → Clinics (1:N)
- Users → Companies/Clinics (M:N)
- Patients → Clinics (N:1)
- Patients → Treatment Cycles (1:N)
- Treatment Cycles → Embryology Records (1:N)

## 🛡️ Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access Control**: Granular permissions per role
- **Company/Clinic Isolation**: Users only see assigned facilities
- **License Validation**: Mandatory for medical practitioners
- **Audit Logging**: Complete system activity tracking
- **Password Security**: Bcrypt hashing with configurable rounds

## 🔧 Configuration

### Environment Variables
- `PORT`: Server port (default: 5000)
- `DB_*`: PostgreSQL connection settings
- `JWT_SECRET`: Secret key for JWT tokens
- `UPLOAD_DIR`: File upload directory
- `FRONTEND_URL`: CORS allowed origin

### Features
- **File Upload**: Support for patient photos, licenses, logos
- **Image Processing**: Sharp for image optimization
- **Rate Limiting**: API request throttling
- **Compression**: Response compression for performance
- **CORS**: Cross-origin resource sharing configuration

## 📱 UI/UX Features

- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Modern Interface**: Clean, professional healthcare UI
- **Role-Based Navigation**: Dynamic menu based on user permissions
- **Company/Clinic Switching**: Header dropdown for facility selection
- **Toast Notifications**: User feedback for all operations
- **Loading States**: Smooth loading indicators
- **Error Handling**: Comprehensive error messages

## 🚧 Development Status

### ✅ Completed
- [x] Database schema design
- [x] Backend architecture setup
- [x] Authentication system
- [x] Frontend layout and routing
- [x] Role-based access control
- [x] JWT token management

### 🔄 In Progress
- [ ] Patient registration form
- [ ] IVF treatment tracking
- [ ] Billing module
- [ ] Inventory management
- [ ] Lab reports system

### 📋 Upcoming
- [ ] Patient portal
- [ ] Doctor portal
- [ ] Telemedicine integration
- [ ] Mobile app
- [ ] Reporting dashboard
- [ ] Data analytics

## 🤝 Contributing

This is an enterprise EMR/HIS system. Please follow the established patterns and ensure all changes maintain HIPAA compliance and data security standards.

## 📄 License

Enterprise License - All rights reserved.

## 🏥 About FertyFlow

FertyFlow is designed specifically for IVF clinics and fertility centers, providing comprehensive patient management, treatment tracking, and administrative tools. The system supports multi-company and multi-clinic operations with robust role-based access control.

Built with modern technologies and healthcare industry best practices, FertyFlow ensures secure, scalable, and efficient management of fertility treatment workflows.