export interface Profile {
  id: string;
  full_name: string;
  role: 'admin' | 'worker';
  is_active: boolean;
  created_at: string;
  last_login: string | null;
}

export interface Course {
  id: string;
  name_ar: string;
  name_en: string;
  description_ar: string | null;
  description_en: string | null;
  duration: string | null;
  is_active: boolean;
  created_at: string;
}

export interface CertificateTemplate {
  id: string;
  name: string;
  description: string | null;
  template_image_url: string;
  fields: TemplateField[];
  qr_position: QRPosition;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TemplateField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'date' | 'select';
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  rtl: boolean;
  required: boolean;
}

export interface QRPosition {
  x: number;
  y: number;
  size: number;
}

export interface Certificate {
  id: string;
  cert_number: string;
  student_name_ar: string | null;
  student_name_en: string;
  birth_date: string;
  course_id: string;
  template_id: string;
  language: 'ar' | 'en' | 'both';
  issued_by: string;
  created_at: string;
  status: 'active' | 'revoked';
  revoked_at: string | null;
  revoked_by: string | null;
  revoke_reason: string | null;
  pdf_url: string | null;
  qr_token: string | null;
  qr_data: string | null;
  issue_date: string;
  custom_fields: Record<string, any>;
  course?: Course;
  issuer?: Profile;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  certificate_id: string | null;
  details: Record<string, any>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  user?: Profile;
}

export interface CertificateFormData {
  student_name_ar: string;
  student_name_en: string;
  birth_date: string;
  course_id: string;
  template_id: string;
  language: 'ar' | 'en' | 'both';
  custom_fields: Record<string, string>;
}
