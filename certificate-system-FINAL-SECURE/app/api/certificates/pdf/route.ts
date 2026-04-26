import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();

    // 🔐 AUTH CHECK: Verify user is authenticated
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const certId = searchParams.get('id');

    if (!certId) {
      return NextResponse.json(
        { error: 'Certificate ID required' },
        { status: 400 }
      );
    }

    // Get certificate with user permissions check
    const { data: certificate, error: certError } = await supabase
      .from('certificates')
      .select('*, course:courses(name_ar, name_en), template:certificate_templates(*), issuer:profiles(full_name)')
      .eq('id', certId)
      .single();

    if (certError || !certificate) {
      return NextResponse.json(
        { error: 'Certificate not found' },
        { status: 404 }
      );
    }

    // 🔐 AUTH CHECK: Workers can only download their own certificates
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (profile?.role === 'worker' && certificate.issued_by !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden. You can only download your own certificates.' },
        { status: 403 }
      );
    }

    // Call PDF microservice
    const pdfServiceUrl = process.env.PDF_SERVICE_URL;
    const pdfApiKey = process.env.PDF_SERVICE_API_KEY;

    if (!pdfServiceUrl || !pdfApiKey) {
      return NextResponse.json(
        { error: 'PDF service not configured' },
        { status: 503 }
      );
    }

    const response = await fetch(`${pdfServiceUrl}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${pdfApiKey}`,
      },
      body: JSON.stringify({
        certificate,
        template: certificate.template,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('PDF Service Error:', errorText);
      return NextResponse.json(
        { error: 'Failed to generate PDF' },
        { status: 502 }
      );
    }

    const pdfBuffer = await response.arrayBuffer();

    // Log PDF generation
    await supabase.from('audit_logs').insert({
      user_id: session.user.id,
      action: 'GENERATE_PDF',
      certificate_id: certId,
      details: { cert_number: certificate.cert_number },
      ip_address: request.headers.get('x-forwarded-for') || request.ip,
      user_agent: request.headers.get('user-agent'),
    });

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${certificate.cert_number}.pdf"`,
        'Cache-Control': 'private, no-cache',
      },
    });

  } catch (error: any) {
    console.error('PDF API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
