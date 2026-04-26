'use client';

import { useState, useEffect } from 'react';
import { supabaseClient } from '@/lib/supabase';
import { Search, Download, QrCode, Eye } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface Certificate {
  id: string;
  cert_number: string;
  student_name_ar: string | null;
  student_name_en: string;
  course: { name_ar: string; name_en: string } | null;
  status: string;
  created_at: string;
  pdf_url: string | null;
}

export default function WorkerCertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCertificates();
  }, []);

  const loadCertificates = async () => {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) return;

    const { data } = await supabaseClient
      .from('certificates')
      .select('*, course:courses(name_ar, name_en)')
      .eq('issued_by', session.user.id)
      .order('created_at', { ascending: false });

    setCertificates(data || []);
    setLoading(false);
  };

  const filteredCerts = certificates.filter(cert =>
    cert.student_name_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cert.cert_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (cert.student_name_ar?.includes(searchQuery))
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">الشهادات الصادرة</h1>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="البحث بالاسم أو رقم الشهادة..."
            className="input-field pr-10"
          />
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-right py-3 px-4">رقم الشهادة</th>
              <th className="text-right py-3 px-4">اسم الطالب</th>
              <th className="text-right py-3 px-4">الدورة</th>
              <th className="text-right py-3 px-4">الحالة</th>
              <th className="text-right py-3 px-4">تاريخ الإصدار</th>
              <th className="text-right py-3 px-4">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filteredCerts.map((cert) => (
              <tr key={cert.id} className="border-b hover:bg-gray-50">
                <td className="py-3 px-4 font-mono text-sm">{cert.cert_number}</td>
                <td className="py-3 px-4">
                  <div>
                    <div className="font-medium">{cert.student_name_en}</div>
                    {cert.student_name_ar && (
                      <div className="text-sm text-gray-500">{cert.student_name_ar}</div>
                    )}
                  </div>
                </td>
                <td className="py-3 px-4">{cert.course?.name_ar}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    cert.status === 'active'
                      ? 'bg-success/10 text-success'
                      : 'bg-danger/10 text-danger'
                  }`}>
                    {cert.status === 'active' ? 'نشطة' : 'ملغاة'}
                  </span>
                </td>
                <td className="py-3 px-4 text-sm text-gray-500">
                  {new Date(cert.created_at).toLocaleDateString('ar-SA')}
                </td>
                <td className="py-3 px-4">
                  <div className="flex gap-2">
                    <Link
                      href={`/verify/${cert.cert_number}`}
                      target="_blank"
                      className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg"
                      title="عرض التحقق"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                    {cert.pdf_url && (
                      <a
                        href={cert.pdf_url}
                        target="_blank"
                        className="p-2 text-success hover:bg-green-50 rounded-lg"
                        title="تحميل PDF"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredCerts.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            لا توجد شهادات
          </div>
        )}
      </div>
    </div>
  );
}
