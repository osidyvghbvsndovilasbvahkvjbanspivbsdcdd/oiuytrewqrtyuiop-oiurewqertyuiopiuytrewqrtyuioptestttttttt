'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  FileText, 
  Search, 
  Users, 
  BookOpen, 
  Settings, 
  ClipboardList,
  Shield
} from 'lucide-react';
import LogoutButton from '@/components/auth/LogoutButton';

interface SidebarProps {
  role: 'admin' | 'worker';
}

const adminLinks = [
  { href: '/dashboard/admin', label: 'لوحة التحكم', icon: LayoutDashboard },
  { href: '/dashboard/admin/users', label: 'المستخدمين', icon: Users },
  { href: '/dashboard/admin/courses', label: 'الدورات', icon: BookOpen },
  { href: '/dashboard/admin/templates', label: 'قوالب الشهادات', icon: Settings },
  { href: '/dashboard/admin/audit-logs', label: 'سجل الأحداث', icon: ClipboardList },
];

const workerLinks = [
  { href: '/dashboard/worker', label: 'لوحة التحكم', icon: LayoutDashboard },
  { href: '/dashboard/worker/create', label: 'إصدار شهادة', icon: FileText },
  { href: '/dashboard/worker/certificates', label: 'الشهادات', icon: Search },
];

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const links = role === 'admin' ? adminLinks : workerLinks;

  return (
    <aside className="w-64 bg-white border-l border-gray-200 min-h-screen flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-primary-600" />
          <div>
            <h2 className="font-bold text-lg">نظام الشهادات</h2>
            <p className="text-xs text-gray-500">
              {role === 'admin' ? 'مشرف النظام' : 'موظف'}
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary-50 text-primary-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-5 h-5" />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <LogoutButton />
      </div>
    </aside>
  );
}
