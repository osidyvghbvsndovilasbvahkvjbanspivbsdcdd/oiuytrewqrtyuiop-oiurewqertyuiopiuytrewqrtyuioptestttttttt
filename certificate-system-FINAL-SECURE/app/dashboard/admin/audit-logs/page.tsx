'use client';

import { useState, useEffect } from 'react';
import { supabaseClient } from '@/lib/supabase';
import { ClipboardList } from 'lucide-react';

interface AuditLog {
  id: string;
  user: { full_name: string } | null;
  action: string;
  certificate_id: string | null;
  details: Record<string, any>;
  ip_address: string | null;
  created_at: string;
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    const { data } = await supabaseClient
      .from('audit_logs')
      .select('*, user:profiles(full_name)')
      .order('created_at', { ascending: false })
      .limit(200);
    setLogs(data || []);
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <ClipboardList className="w-6 h-6" />
        سجل الأحداث
      </h1>

      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-right py-3 px-4">التاريخ</th>
              <th className="text-right py-3 px-4">المستخدم</th>
              <th className="text-right py-3 px-4">الإجراء</th>
              <th className="text-right py-3 px-4">رقم الشهادة</th>
              <th className="text-right py-3 px-4">IP</th>
              <th className="text-right py-3 px-4">التفاصيل</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b hover:bg-gray-50">
                <td className="py-3 px-4 text-sm text-gray-500">
                  {new Date(log.created_at).toLocaleString('ar-SA')}
                </td>
                <td className="py-3 px-4">{log.user?.full_name || '—'}</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-1 rounded-full text-xs bg-gray-100">{log.action}</span>
                </td>
                <td className="py-3 px-4 font-mono text-sm">{log.certificate_id || '—'}</td>
                <td className="py-3 px-4 text-sm text-gray-500">{log.ip_address || '—'}</td>
                <td className="py-3 px-4 text-sm">
                  <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-w-xs">
                    {JSON.stringify(log.details, null, 2)}
                  </pre>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
