'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { CheckCircle, XCircle, AlertTriangle, Shield, Calendar, User, BookOpen, QrCode } from 'lucide-react';

interface VerifyResult {
  status: 'valid' | 'revoked' | 'not_found';
  certificate: {
    cert_number: string;
    student_name_ar: string | null;
    student_name_en: string;
    course_name_ar: string;
    course_name_en: string;
    issue_date: string;
    status: string;
    issuer: string;
    qr_valid: boolean;
  } | null;
}

export default function VerifyPage() {
  const params = useParams();
  const certNumber = params.cert_number as string;
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    verifyCertificate();
  }, [certNumber]);

  const verifyCertificate = async () => {
    try {
      const response = await fetch(`/api/verify/${certNumber}`);
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ status: 'not_found', certificate: null });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  const getStatusConfig = () => {
    switch (result?.status) {
      case 'valid':
        return {
          icon: CheckCircle,
          color: 'text-success',
          bg: 'bg-success/10',
          border: 'border-success',
          title: 'شهادة صالحة',
          subtitle: 'هذه الشهادة مؤكدة وصالحة',
        };
      case 'revoked':
        return {
          icon: XCircle,
          color: 'text-danger',
          bg: 'bg-danger/10',
          border: 'border-danger',
          title: 'شهادة ملغاة',
          subtitle: 'هذه الشهادة تم إلغاؤها أو توقيعها غير صالح',
        };
      default:
        return {
          icon: AlertTriangle,
          color: 'text-warning',
          bg: 'bg-warning/10',
          border: 'border-warning',
          title: 'شهادة غير موجودة',
          subtitle: 'لم يتم العثور على هذه الشهادة في نظامنا',
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <Shield className="w-16 h-16 mx-auto text-primary-600 mb-4" />
          <h1 className="text-3xl font-bold text-gray-900">التحقق من الشهادة</h1>
          <p className="text-gray-500 mt-2">نظام التحقق الإلكتروني من صحة الشهادات</p>
        </div>

        <div className={`card border-2 ${config.border}`}>
          <div className="text-center mb-6">
            <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${config.bg} mb-4`}>
              <Icon className={`w-10 h-10 ${config.color}`} />
            </div>
            <h2 className={`text-2xl font-bold ${config.color}`}>{config.title}</h2>
            <p className="text-gray-500 mt-1">{config.subtitle}</p>
          </div>

          {result?.certificate && (
            <div className="space-y-4 border-t pt-6">
              {/* QR Verification Badge */}
              <div className="flex items-center justify-center gap-2 mb-4">
                <QrCode className="w-5 h-5" />
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  result.certificate.qr_valid 
                    ? 'bg-success/10 text-success' 
                    : 'bg-danger/10 text-danger'
                }`}>
                  {result.certificate.qr_valid ? 'QR موثّق ✅' : 'QR غير موثّق ❌'}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">اسم الطالب</p>
                  <p className="font-medium">{result.certificate.student_name_en}</p>
                  {result.certificate.student_name_ar && (
                    <p className="text-sm text-gray-600">{result.certificate.student_name_ar}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <BookOpen className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">الدورة</p>
                  <p className="font-medium">{result.certificate.course_name_ar}</p>
                  <p className="text-sm text-gray-600">{result.certificate.course_name_en}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">تاريخ الإصدار</p>
                  <p className="font-medium">
                    {new Date(result.certificate.issue_date).toLocaleDateString('ar-SA')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">رقم الشهادة</p>
                  <p className="font-mono font-medium">{result.certificate.cert_number}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">تم الإصدار بواسطة</p>
                  <p className="font-medium">{result.certificate.issuer}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-sm text-gray-400 mt-6">
          تم التحقق من هذه الشهادة إلكترونياً من خلال نظام إصدار الشهادات
        </p>
      </div>
    </div>
  );
}
