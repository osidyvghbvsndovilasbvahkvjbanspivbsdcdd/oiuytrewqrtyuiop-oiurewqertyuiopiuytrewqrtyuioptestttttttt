'use client';

import { useState, useEffect } from 'react';
import { supabaseClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { FileText, Loader2, QrCode, Download, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { generateQRToken } from '@/lib/crypto';

interface Course {
  id: string;
  name_ar: string;
  name_en: string;
}

interface Template {
  id: string;
  name: string;
  template_image_url: string;
  fields: any[];
  qr_position: any;
}

export default function CreateCertificatePage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    student_name_ar: '',
    student_name_en: '',
    birth_date: '',
    course_id: '',
    template_id: '',
    language: 'both' as 'ar' | 'en' | 'both',
    custom_fields: {} as Record<string, string>,
  });

  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  useEffect(() => {
    loadCoursesAndTemplates();
  }, []);

  const loadCoursesAndTemplates = async () => {
    const { data: coursesData } = await supabaseClient
      .from('courses')
      .select('*')
      .eq('is_active', true);

    const { data: templatesData } = await supabaseClient
      .from('certificate_templates')
      .select('*')
      .eq('is_active', true);

    setCourses(coursesData || []);
    setTemplates(templatesData || []);
  };

  const handleTemplateChange = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    setSelectedTemplate(template || null);
    setFormData({ ...formData, template_id: templateId, custom_fields: {} });
  };

  const generatePreview = async () => {
    if (!selectedTemplate) {
      toast.error('يرجى اختيار قالب أولاً');
      return;
    }

    // Create canvas preview
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      // Draw fields
      selectedTemplate.fields?.forEach((field: any) => {
        const value = field.name === 'student_name_ar' ? formData.student_name_ar :
                     field.name === 'student_name_en' ? formData.student_name_en :
                     field.name === 'birth_date' ? formData.birth_date :
                     field.name === 'issue_date' ? new Date().toLocaleDateString('ar-SA') :
                     formData.custom_fields[field.name] || field.label;

        ctx.font = `${field.fontSize || 24}px ${field.fontFamily || 'Arial'}`;
        ctx.fillStyle = field.color || '#000000';
        ctx.textAlign = field.rtl ? 'right' : 'left';
        ctx.fillText(value, field.x, field.y + (field.fontSize || 24));
      });

      // Draw QR placeholder
      const qr = selectedTemplate.qr_position || { x: 650, y: 950, size: 120 };
      ctx.strokeStyle = '#3b82f6';
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(qr.x, qr.y, qr.size, qr.size);
      ctx.fillStyle = '#3b82f6';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('QR Code', qr.x + qr.size/2, qr.y + qr.size/2);

      setPreviewUrl(canvas.toDataURL());
    };
    img.src = selectedTemplate.template_image_url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.student_name_en || !formData.birth_date || !formData.course_id || !formData.template_id) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    setLoading(true);

    try {
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (!session) {
        toast.error('غير مصرح. يرجى تسجيل الدخول');
        return;
      }

      // Insert certificate
      const { data: cert, error } = await supabaseClient
        .from('certificates')
        .insert({
          student_name_ar: formData.student_name_ar,
          student_name_en: formData.student_name_en,
          birth_date: formData.birth_date,
          course_id: formData.course_id,
          template_id: formData.template_id,
          language: formData.language,
          issued_by: session.user.id,
          issue_date: new Date().toISOString().split('T')[0],
          custom_fields: formData.custom_fields,
          status: 'active',
        })
        .select()
        .single();

      if (error) throw error;

      // Generate QR token with HMAC
      const qrToken = generateQRToken(cert.cert_number);

      // Update certificate with QR token
      await supabaseClient
        .from('certificates')
        .update({ 
          qr_token: qrToken,
          qr_data: JSON.stringify({
            cert_number: cert.cert_number,
            verify_url: `${window.location.origin}/verify/${cert.cert_number}`,
            issued_at: new Date().toISOString(),
          })
        })
        .eq('id', cert.id);

      toast.success('تم إصدار الشهادة بنجاح');
      router.push('/dashboard/worker/certificates');
    } catch (error: any) {
      console.error('Certificate creation error:', error);
      toast.error(error.message || 'فشل إصدار الشهادة');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <FileText className="w-6 h-6" />
        إصدار شهادة جديدة
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form onSubmit={handleSubmit} className="card space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">القالب *</label>
            <select
              value={formData.template_id}
              onChange={(e) => handleTemplateChange(e.target.value)}
              className="input-field"
              required
            >
              <option value="">اختر قالب</option>
              {templates.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الدورة *</label>
            <select
              value={formData.course_id}
              onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
              className="input-field"
              required
            >
              <option value="">اختر دورة</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.name_ar}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">اللغة</label>
            <select
              value={formData.language}
              onChange={(e) => setFormData({ ...formData, language: e.target.value as any })}
              className="input-field"
            >
              <option value="both">عربي + إنجليزي</option>
              <option value="ar">عربي فقط</option>
              <option value="en">إنجليزي فقط</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">اسم الطالب (عربي)</label>
            <input
              type="text"
              value={formData.student_name_ar}
              onChange={(e) => setFormData({ ...formData, student_name_ar: e.target.value })}
              className="input-field"
              dir="rtl"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">اسم الطالب (إنجليزي) *</label>
            <input
              type="text"
              value={formData.student_name_en}
              onChange={(e) => setFormData({ ...formData, student_name_en: e.target.value })}
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ الميلاد *</label>
            <input
              type="date"
              value={formData.birth_date}
              onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
              className="input-field"
              required
            />
          </div>

          {selectedTemplate?.fields?.map((field: any) => (
            <div key={field.id}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
              <input
                type={field.type === 'date' ? 'date' : 'text'}
                value={formData.custom_fields[field.name] || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  custom_fields: { ...formData.custom_fields, [field.name]: e.target.value }
                })}
                className="input-field"
                dir={field.rtl ? 'rtl' : 'ltr'}
              />
            </div>
          ))}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={generatePreview}
              className="btn-secondary flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              معاينة
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  جاري الإصدار...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  إصدار الشهادة
                </>
              )}
            </button>
          </div>
        </form>

        <div className="card">
          <h3 className="font-bold mb-4">معاينة الشهادة</h3>
          {previewUrl ? (
            <img src={previewUrl} alt="Preview" className="w-full rounded-lg border" />
          ) : (
            <div className="aspect-[3/4] bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
              اضغط "معاينة" لرؤية الشهادة
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
