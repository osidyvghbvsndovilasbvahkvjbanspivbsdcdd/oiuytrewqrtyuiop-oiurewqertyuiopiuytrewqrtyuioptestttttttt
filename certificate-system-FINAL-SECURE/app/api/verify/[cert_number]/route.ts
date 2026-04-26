import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { verifyQRToken } from '@/lib/crypto';
import { rateLimit } from '@/lib/rate-limit';

export async function GET(
  request: NextRequest,
  { params }: { params: { cert_number: string } }
) {
  const ip = request.headers.get('x-forwarded-for') || request.ip || 'unknown';

  // Rate limiting - 10 requests per minute per IP
  const limit = await rateLimit(`verify:${ip}`, 10, 60);
  if (!limit.success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Try again later.' },
      { status: 429, headers: { 'X-RateLimit-Remaining': '0' } }
    );
  }

  const supabase = createServerClient();
  const certNumber = params.cert_number;

  try {
    // Get certificate from database
    const { data: certificate, error } = await supabase
      .from('certificates')
      .select('*, course:courses(name_ar, name_en), issuer:profiles(full_name)')
      .eq('cert_number', certNumber)
      .single();

    if (error || !certificate) {
      // Log failed verification attempt
      await supabase.from('audit_logs').insert({
        action: 'VERIFY_FAILED',
        details: { 
          cert_number: certNumber, 
          reason: 'NOT_FOUND',
          ip: ip 
        },
        ip_address: ip,
        user_agent: request.headers.get('user-agent'),
      });

      return NextResponse.json({
        status: 'not_found',
        message: 'الشهادة غير موجودة',
        certificate: null,
      });
    }

    // 🔐 SECURITY: Verify QR token if present
    let qrValid = false;
    if (certificate.qr_token) {
      const qrCheck = verifyQRToken(certNumber, certificate.qr_token);
      qrValid = qrCheck.valid;
    }

    // Determine final status
    const isValid = certificate.status === 'active' && qrValid;

    // Log verification attempt
    await supabase.from('audit_logs').insert({
      action: 'VERIFY_CERTIFICATE',
      certificate_id: certificate.id,
      details: { 
        cert_number: certNumber, 
        result: isValid ? 'VALID' : 'INVALID',
        qr_valid: qrValid,
        cert_status: certificate.status,
        ip: ip 
      },
      ip_address: ip,
      user_agent: request.headers.get('user-agent'),
    });

    return NextResponse.json({
      status: isValid ? 'valid' : 'revoked',
      certificate: {
        cert_number: certificate.cert_number,
        student_name_ar: certificate.student_name_ar,
        student_name_en: certificate.student_name_en,
        course_name_ar: certificate.course?.name_ar,
        course_name_en: certificate.course?.name_en,
        issue_date: certificate.issue_date,
        status: certificate.status,
        issuer: certificate.issuer?.full_name,
        qr_valid: qrValid,
      },
    });

  } catch (error) {
    console.error('Verify API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
