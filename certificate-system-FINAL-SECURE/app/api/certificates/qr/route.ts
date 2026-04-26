import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { verifyQRToken } from '@/lib/crypto';

export async function POST(request: NextRequest) {
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

    // 🔐 AUTH CHECK: Verify user is a worker or admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_active')
      .eq('id', session.user.id)
      .single();

    if (!profile?.is_active) {
      return NextResponse.json(
        { error: 'Account deactivated' },
        { status: 403 }
      );
    }

    if (!['admin', 'worker'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'Forbidden. Insufficient permissions.' },
        { status: 403 }
      );
    }

    const { certNumber, token } = await request.json();

    if (!certNumber || !token) {
      return NextResponse.json(
        { error: 'certNumber and token required' },
        { status: 400 }
      );
    }

    // Verify the QR token
    const verification = verifyQRToken(certNumber, token);

    if (!verification.valid) {
      return NextResponse.json(
        { error: 'Invalid QR token', reason: verification.reason },
        { status: 400 }
      );
    }

    // Update certificate with verified QR token
    const { error } = await supabase
      .from('certificates')
      .update({ 
        qr_token: token,
        qr_data: JSON.stringify({
          cert_number: certNumber,
          verify_url: `${process.env.NEXT_PUBLIC_APP_URL}/verify/${certNumber}`,
          verified_at: new Date().toISOString(),
        })
      })
      .eq('cert_number', certNumber);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to update certificate' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'QR token verified and saved' 
    });

  } catch (error: any) {
    console.error('QR API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
