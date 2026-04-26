import { createServerClient } from '@/lib/supabase';
import Link from 'next/link';
import { Users, BookOpen, FileText, ClipboardList, Shield } from 'lucide-react';

export default async function AdminDashboard() {
  const supabase = createServerClient();

  const { count: usersCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  const { count: coursesCount } = await supabase
    .from('courses')
    .select('*', { count: 'exact', head: true });

  const { count: certsCount } = await supabase
    .from('certificates')
    .select('*', { count: 'exact', head: true });

  const { count: logsCount } = await supabase
    .from('audit_logs')
    .select('*', { count: 'exact', head: true });

  const stats = [
    { label: 'المستخدمين', value: usersCount || 0, icon: Users, href: '/dashboard/admin/users', color: 'bg-blue-100 text-blue-600' },
    { label: 'الدورات', value: coursesCount || 0, icon: BookOpen, href: '/dashboard/admin/courses', color: 'bg-green-100 text-green-600' },
    { label: 'الشهادات', value: certsCount || 0, icon: FileText, href: '#', color: 'bg-purple-100 text-purple-600' },
    { label: 'سجلات الأحداث', value: logsCount || 0, icon: ClipboardList, href: '/dashboard/admin/audit-logs', color: 'bg-orange-100 text-orange-600' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Shield className="w-6 h-6" />
        لوحة تحكم المشرف
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.label} href={stat.href} className="card hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
