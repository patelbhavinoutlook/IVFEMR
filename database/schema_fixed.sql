-- FertyFlow EMR/HIS Database Schema (Fixed Version)
-- PostgreSQL Schema for Multi-Company, Multi-Clinic IVF System

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Companies Table
CREATE TABLE companies (
    company_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    registration_id VARCHAR(100) UNIQUE NOT NULL,
    pincode VARCHAR(10),
    gst_id VARCHAR(50),
    income_tax_id VARCHAR(50),
    tin_id VARCHAR(50),
    contact_numbers TEXT[], -- Array of contact numbers
    email VARCHAR(255),
    logo_image_path VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Clinics Table
CREATE TABLE clinics (
    clinic_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    tax_id VARCHAR(50),
    pan_id VARCHAR(50),
    tin_id VARCHAR(50),
    gst_id VARCHAR(50),
    pincode VARCHAR(10),
    address TEXT,
    contact_number VARCHAR(20),
    email VARCHAR(255),
    logo_image_path VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Roles Table
CREATE TABLE roles (
    role_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    permissions JSONB, -- Store permissions as JSON
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users Table
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    official_email VARCHAR(255) UNIQUE NOT NULL,
    personal_email VARCHAR(255),
    phone1 VARCHAR(20),
    phone2 VARCHAR(20),
    profile_image_path VARCHAR(500),
    license_number VARCHAR(100), -- Required for doctors/embryologists
    license_image_path VARCHAR(500), -- Required for doctors/embryologists
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Role Mapping
CREATE TABLE user_roles (
    user_role_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(role_id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, role_id)
);

-- User Company Mapping
CREATE TABLE user_companies (
    user_company_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, company_id)
);

-- User Clinic Mapping
CREATE TABLE user_clinics (
    user_clinic_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    clinic_id UUID NOT NULL REFERENCES clinics(clinic_id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, clinic_id)
);

-- Marketing Channels (Master Data)
CREATE TABLE marketing_channels (
    channel_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    channel_name VARCHAR(255) NOT NULL,
    parent_channel_id UUID REFERENCES marketing_channels(channel_id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Patients Table
CREATE TABLE patients (
    patient_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES clinics(clinic_id),
    patient_number VARCHAR(50) UNIQUE NOT NULL, -- Auto-generated patient ID
    name VARCHAR(255) NOT NULL,
    gender VARCHAR(10) NOT NULL CHECK (gender IN ('Male', 'Female', 'Other')),
    date_of_birth DATE NOT NULL,
    age INTEGER, -- We'll calculate this with a function
    photo_path VARCHAR(500),
    pincode VARCHAR(10),
    address TEXT,
    country VARCHAR(100),
    state VARCHAR(100),
    district VARCHAR(100),
    city VARCHAR(100),
    primary_marketing_channel_id UUID REFERENCES marketing_channels(channel_id),
    secondary_marketing_channel_id UUID REFERENCES marketing_channels(channel_id),
    phone1 VARCHAR(20),
    phone2 VARCHAR(20),
    email VARCHAR(255),
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    created_by UUID REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Function to calculate age
CREATE OR REPLACE FUNCTION calculate_age(birth_date DATE) RETURNS INTEGER AS $$
BEGIN
    RETURN DATE_PART('year', AGE(birth_date));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger to update age automatically
CREATE OR REPLACE FUNCTION update_patient_age() RETURNS TRIGGER AS $$
BEGIN
    NEW.age = calculate_age(NEW.date_of_birth);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_patient_age
    BEFORE INSERT OR UPDATE ON patients
    FOR EACH ROW
    EXECUTE FUNCTION update_patient_age();

-- Patient Partners/Spouses
CREATE TABLE patient_partners (
    partner_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    gender VARCHAR(10) NOT NULL CHECK (gender IN ('Male', 'Female', 'Other')),
    date_of_birth DATE,
    age INTEGER,
    phone VARCHAR(20),
    email VARCHAR(255),
    relationship VARCHAR(50) DEFAULT 'Spouse',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trigger for partner age calculation
CREATE TRIGGER trigger_update_partner_age
    BEFORE INSERT OR UPDATE ON patient_partners
    FOR EACH ROW
    EXECUTE FUNCTION update_patient_age();

-- IVF Treatment Cycles
CREATE TABLE treatment_cycles (
    cycle_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
    clinic_id UUID NOT NULL REFERENCES clinics(clinic_id),
    cycle_number INTEGER NOT NULL,
    protocol_type VARCHAR(100),
    start_date DATE,
    end_date DATE,
    status VARCHAR(50) DEFAULT 'Active',
    notes TEXT,
    assigned_doctor UUID REFERENCES users(user_id),
    assigned_embryologist UUID REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Rest of the tables remain the same...
-- (Including all other tables from the original schema)

-- Ovarian Stimulation Logs
CREATE TABLE stimulation_logs (
    log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cycle_id UUID NOT NULL REFERENCES treatment_cycles(cycle_id) ON DELETE CASCADE,
    log_date DATE NOT NULL,
    medication_name VARCHAR(255),
    dosage VARCHAR(100),
    route VARCHAR(50),
    notes TEXT,
    recorded_by UUID REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Embryology Lab Records
CREATE TABLE embryology_records (
    record_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cycle_id UUID NOT NULL REFERENCES treatment_cycles(cycle_id) ON DELETE CASCADE,
    procedure_type VARCHAR(100),
    procedure_date DATE NOT NULL,
    day_of_development INTEGER,
    eggs_retrieved INTEGER,
    eggs_fertilized INTEGER,
    embryo_grade VARCHAR(20),
    embryo_quality VARCHAR(50),
    cryopreserved BOOLEAN DEFAULT false,
    transferred BOOLEAN DEFAULT false,
    notes TEXT,
    embryologist_id UUID REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Medications Master
CREATE TABLE medications (
    medication_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    generic_name VARCHAR(255),
    category VARCHAR(100),
    unit_type VARCHAR(50),
    manufacturer VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inventory Items
CREATE TABLE inventory_items (
    item_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES clinics(clinic_id),
    item_name VARCHAR(255) NOT NULL,
    item_code VARCHAR(100),
    category VARCHAR(100),
    unit_type VARCHAR(50),
    reorder_level INTEGER DEFAULT 0,
    current_stock INTEGER DEFAULT 0,
    unit_price DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stock Transactions
CREATE TABLE stock_transactions (
    transaction_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID NOT NULL REFERENCES inventory_items(item_id),
    transaction_type VARCHAR(20) CHECK (transaction_type IN ('IN', 'OUT', 'TRANSFER')),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2),
    batch_number VARCHAR(100),
    expiry_date DATE,
    supplier_name VARCHAR(255),
    reference_number VARCHAR(100),
    notes TEXT,
    performed_by UUID REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Lab Test Categories
CREATE TABLE lab_test_categories (
    category_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true
);

-- Lab Tests Master
CREATE TABLE lab_tests (
    test_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    test_name VARCHAR(255) NOT NULL,
    test_code VARCHAR(50),
    category_id UUID REFERENCES lab_test_categories(category_id),
    normal_range_male VARCHAR(255),
    normal_range_female VARCHAR(255),
    unit VARCHAR(50),
    price DECIMAL(10,2),
    is_active BOOLEAN DEFAULT true
);

-- Patient Lab Reports
CREATE TABLE patient_lab_reports (
    report_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
    test_id UUID NOT NULL REFERENCES lab_tests(test_id),
    test_date DATE NOT NULL,
    result_value VARCHAR(255),
    result_status VARCHAR(50),
    reference_range VARCHAR(255),
    report_file_path VARCHAR(500),
    notes TEXT,
    ordered_by UUID REFERENCES users(user_id),
    reported_by UUID REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Billing Packages
CREATE TABLE billing_packages (
    package_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES clinics(clinic_id),
    package_name VARCHAR(255) NOT NULL,
    description TEXT,
    base_price DECIMAL(10,2) NOT NULL,
    tax_percentage DECIMAL(5,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Patient Bills
CREATE TABLE patient_bills (
    bill_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
    clinic_id UUID NOT NULL REFERENCES clinics(clinic_id),
    bill_number VARCHAR(100) UNIQUE NOT NULL,
    bill_date DATE NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    net_amount DECIMAL(10,2) NOT NULL,
    payment_status VARCHAR(50) DEFAULT 'Pending',
    notes TEXT,
    created_by UUID REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bill Line Items
CREATE TABLE bill_line_items (
    line_item_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bill_id UUID NOT NULL REFERENCES patient_bills(bill_id) ON DELETE CASCADE,
    item_description VARCHAR(255) NOT NULL,
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Patient Appointments
CREATE TABLE appointments (
    appointment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
    clinic_id UUID NOT NULL REFERENCES clinics(clinic_id),
    doctor_id UUID REFERENCES users(user_id),
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    duration_minutes INTEGER DEFAULT 30,
    appointment_type VARCHAR(100),
    status VARCHAR(50) DEFAULT 'Scheduled',
    notes TEXT,
    created_by UUID REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Patient Login Credentials (for patient portal)
CREATE TABLE patient_logins (
    patient_login_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- System Settings
CREATE TABLE system_settings (
    setting_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID REFERENCES clinics(clinic_id),
    setting_key VARCHAR(255) NOT NULL,
    setting_value TEXT,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit Trail
CREATE TABLE audit_logs (
    log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(user_id),
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(100),
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Indexes for Performance
CREATE INDEX idx_patients_clinic_id ON patients(clinic_id);
CREATE INDEX idx_patients_patient_number ON patients(patient_number);
CREATE INDEX idx_treatment_cycles_patient_id ON treatment_cycles(patient_id);
CREATE INDEX idx_embryology_records_cycle_id ON embryology_records(cycle_id);
CREATE INDEX idx_patient_bills_patient_id ON patient_bills(patient_id);
CREATE INDEX idx_patient_bills_clinic_id ON patient_bills(clinic_id);
CREATE INDEX idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_companies_user_id ON user_companies(user_id);
CREATE INDEX idx_user_clinics_user_id ON user_clinics(user_id);

-- Insert Default Roles
INSERT INTO roles (role_name, description, permissions) VALUES
('Super Admin', 'Full system access across all companies and clinics', '{"all": true}'),
('Company Admin', 'Admin access for specific company and its clinics', '{"company_admin": true}'),
('Clinic Admin', 'Admin access for specific clinic', '{"clinic_admin": true}'),
('Doctor', 'Medical practitioner with patient treatment access', '{"patient_access": true, "treatment_access": true}'),
('Embryologist', 'Lab specialist with embryology access', '{"lab_access": true, "embryology_access": true}'),
('Nurse', 'Nursing staff with limited patient access', '{"patient_basic_access": true}'),
('Receptionist', 'Front desk with appointment and billing access', '{"appointment_access": true, "billing_basic_access": true}'),
('Lab Technician', 'Lab reports and test management', '{"lab_reports_access": true}'),
('Pharmacist', 'Pharmacy and inventory management', '{"pharmacy_access": true, "inventory_access": true}'),
('Billing Officer', 'Billing and payment management', '{"billing_full_access": true}');

-- Insert Default Marketing Channels
INSERT INTO marketing_channels (channel_name, parent_channel_id) VALUES
('Online', NULL),
('Offline', NULL),
('Referral', NULL);

-- Insert sub-channels
INSERT INTO marketing_channels (channel_name, parent_channel_id) VALUES
('Social Media', (SELECT channel_id FROM marketing_channels WHERE channel_name = 'Online')),
('Google Ads', (SELECT channel_id FROM marketing_channels WHERE channel_name = 'Online')),
('Website', (SELECT channel_id FROM marketing_channels WHERE channel_name = 'Online')),
('Doctor Referral', (SELECT channel_id FROM marketing_channels WHERE channel_name = 'Referral')),
('Patient Referral', (SELECT channel_id FROM marketing_channels WHERE channel_name = 'Referral')),
('Newspaper', (SELECT channel_id FROM marketing_channels WHERE channel_name = 'Offline')),
('Television', (SELECT channel_id FROM marketing_channels WHERE channel_name = 'Offline'));

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clinics_updated_at BEFORE UPDATE ON clinics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_treatment_cycles_updated_at BEFORE UPDATE ON treatment_cycles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inventory_items_updated_at BEFORE UPDATE ON inventory_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_patient_bills_updated_at BEFORE UPDATE ON patient_bills FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();