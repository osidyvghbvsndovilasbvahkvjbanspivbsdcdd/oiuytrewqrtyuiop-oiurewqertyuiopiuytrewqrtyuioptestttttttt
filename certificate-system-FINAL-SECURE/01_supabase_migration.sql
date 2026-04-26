
-- ============================================
-- Certificate Issuing & Verification System
-- Supabase PostgreSQL Migration
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- TABLE: profiles
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'worker')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    last_login TIMESTAMPTZ
);

-- ============================================
-- TABLE: courses
-- ============================================
CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name_ar TEXT NOT NULL,
    name_en TEXT NOT NULL,
    description_ar TEXT,
    description_en TEXT,
    duration TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- TABLE: certificate_templates
-- ============================================
CREATE TABLE IF NOT EXISTS certificate_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    template_image_url TEXT NOT NULL,
    fields JSONB NOT NULL DEFAULT '[]',
    qr_position JSONB DEFAULT '{"x": 650, "y": 950, "size": 120}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- TABLE: certificates
-- ============================================
CREATE TABLE IF NOT EXISTS certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cert_number TEXT UNIQUE NOT NULL,
    student_name_ar TEXT,
    student_name_en TEXT NOT NULL,
    birth_date DATE NOT NULL,
    course_id UUID REFERENCES courses(id) ON DELETE RESTRICT,
    template_id UUID REFERENCES certificate_templates(id) ON DELETE RESTRICT,
    language TEXT NOT NULL CHECK (language IN ('ar', 'en', 'both')),
    issued_by UUID REFERENCES profiles(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ DEFAULT now(),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
    revoked_at TIMESTAMPTZ,
    revoked_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    revoke_reason TEXT,
    pdf_url TEXT,
    qr_token TEXT,
    qr_data TEXT,
    issue_date DATE DEFAULT CURRENT_DATE,
    custom_fields JSONB DEFAULT '{}'
);

-- ============================================
-- TABLE: audit_logs
-- ============================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    certificate_id UUID REFERENCES certificates(id) ON DELETE SET NULL,
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_certificates_cert_number ON certificates(cert_number);
CREATE INDEX idx_certificates_student_name_en ON certificates USING gin(to_tsvector('english', student_name_en));
CREATE INDEX idx_certificates_student_name_ar ON certificates USING gin(to_tsvector('arabic', student_name_ar));
CREATE INDEX idx_certificates_issued_by ON certificates(issued_by);
CREATE INDEX idx_certificates_status ON certificates(status);
CREATE INDEX idx_certificates_created_at ON certificates(created_at DESC);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_certificate_id ON audit_logs(certificate_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_courses_active ON courses(is_active);
CREATE INDEX idx_profiles_role ON profiles(role);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Auto-generate certificate number
CREATE OR REPLACE FUNCTION generate_cert_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.cert_number IS NULL THEN
        NEW.cert_number := 'CERT-' || EXTRACT(YEAR FROM CURRENT_DATE)::TEXT || '-' || LPAD(NEXTVAL('cert_number_seq')::TEXT, 4, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create sequence for cert numbers
CREATE SEQUENCE IF NOT EXISTS cert_number_seq START 1;

-- Trigger for auto cert number
CREATE TRIGGER trg_generate_cert_number
    BEFORE INSERT ON certificates
    FOR EACH ROW
    EXECUTE FUNCTION generate_cert_number();

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_template_updated_at
    BEFORE UPDATE ON certificate_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- RLS POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificate_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles RLS
CREATE POLICY "profiles_select_all" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_admin" ON profiles FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "profiles_update_admin" ON profiles FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "profiles_delete_admin" ON profiles FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Courses RLS
CREATE POLICY "courses_select_all" ON courses FOR SELECT USING (true);
CREATE POLICY "courses_insert_admin" ON courses FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "courses_update_admin" ON courses FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "courses_delete_admin" ON courses FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Certificate Templates RLS
CREATE POLICY "templates_select_all" ON certificate_templates FOR SELECT USING (true);
CREATE POLICY "templates_insert_admin" ON certificate_templates FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "templates_update_admin" ON certificate_templates FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "templates_delete_admin" ON certificate_templates FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Certificates RLS
CREATE POLICY "certificates_select_own" ON certificates FOR SELECT USING (
    issued_by = auth.uid() OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "certificates_insert_own" ON certificates FOR INSERT WITH CHECK (
    issued_by = auth.uid() AND 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'worker')
);
CREATE POLICY "certificates_update_admin" ON certificates FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Audit Logs RLS
CREATE POLICY "audit_logs_select_admin" ON audit_logs FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "audit_logs_select_own" ON audit_logs FOR SELECT USING (
    user_id = auth.uid()
);
CREATE POLICY "audit_logs_insert_all" ON audit_logs FOR INSERT WITH CHECK (true);

-- ============================================
-- SEED DATA
-- ============================================

-- Insert default admin (password must be set via Supabase Auth)
-- The actual user creation happens via Supabase Auth, then profile is auto-created

-- Insert sample courses
INSERT INTO courses (name_ar, name_en, description_ar, description_en, duration) VALUES
('تطوير الويب المتقدم', 'Advanced Web Development', 'دورة متكاملة في تطوير الويب', 'Comprehensive web development course', '3 months'),
('الأمن السيبراني', 'Cybersecurity Fundamentals', 'أساسيات الأمن السيبراني', 'Cybersecurity basics', '2 months'),
('الذكاء الاصطناعي', 'Artificial Intelligence', 'مقدمة في الذكاء الاصطناعي', 'Introduction to AI', '4 months');

