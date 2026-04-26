import { createAdminClient } from './supabase';

export async function logAction(
  userId: string | null,
  action: string,
  certificateId: string | null = null,
  details: Record<string, any> = {},
  ipAddress: string | null = null,
  userAgent: string | null = null
) {
  const supabase = createAdminClient();

  try {
    await supabase.from('audit_logs').insert({
      user_id: userId,
      action,
      certificate_id: certificateId,
      details,
      ip_address: ipAddress,
      user_agent: userAgent,
    });
  } catch (error) {
    console.error('Failed to log action:', error);
  }
}
