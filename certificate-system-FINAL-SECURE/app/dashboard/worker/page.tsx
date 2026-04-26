import { createServerClient } from '@/lib/supabase';
import Link from 'next/link';
import { FileText, Search, QrCode, TrendingUp } from 'lucide-react';

export default async function WorkerDashboard() {
  const supabase = createServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  const { data: stats } = await supabase
    .from('certificates')
    .select('status', { count: 'exact' })
    .eq('issued_by', session!.user.id);

  const totalCerts = stats?.length || 0;
  const activeCerts = stats?.filter(s => s.status === 'active').length || 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">لوحة التحكم</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary-100 rounded-lg">
              <FileText className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">إجمالي الشهادات</p>
              <p className="text-2xl font-bold">{totalCerts}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-success/10 rounded-lg">
              <TrendingUp className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="text-sm text-gray-500">الشهادات النشطة</p>
              <p className="text-2xl font-bold">{activeCerts}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-warning/10 rounded-lg">
              <QrCode className="w-6 h-6 text-warning" />
            </div>
            <div>
              <p className="text-sm text-gray-500">التحقق من QR</p>
              <Link href="/dashboard/worker/create" className="text-primary-600 hover:underline text-sm">
                إنشاء شهادة جديدة
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/dashboard/worker/create" className="card hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <FileText className="w-8 h-8 text-primary-600" />
            <div>
              <h3 className="font-bold text-lg">إصدار شهادة جديدة</h3>
              <p className="text-gray-500">إنشاء شهادة جديدة للطالب</p>
            </div>
          </div>
        </Link>

        <Link href="/dashboard/worker/certificates" className="card hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <Search className="w-8 h-8 text-primary-600" />
            <div>
              <h3 className="font-bold text-lg">البحث في الشهادات</h3>
              <p className="text-gray-500">عرض وتحميل الشهادات الصادرة</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
