'use client';

import { useState, useEffect } from 'react';
import { supabaseClient } from '@/lib/supabase';
import { Plus, Trash2, UserCheck, UserX } from 'lucide-react';
import toast from 'react-hot-toast';

interface User {
  id: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
  last_login: string | null;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({ email: '', password: '', full_name: '', role: 'worker' as 'admin' | 'worker' });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    const { data } = await supabaseClient.from('profiles').select('*').order('created_at', { ascending: false });
    setUsers(data || []);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabaseClient.auth.signUp({
        email: newUser.email,
        password: newUser.password,
      });

      if (authError) throw authError;

      // Create profile
      const { error: profileError } = await supabaseClient.from('profiles').insert({
        id: authData.user!.id,
        full_name: newUser.full_name,
        role: newUser.role,
      });

      if (profileError) throw profileError;

      toast.success('تم إنشاء المستخدم بنجاح');
      setShowAddModal(false);
      setNewUser({ email: '', password: '', full_name: '', role: 'worker' });
      loadUsers();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    const { error } = await supabaseClient
      .from('profiles')
      .update({ is_active: !currentStatus })
      .eq('id', userId);

    if (!error) {
      toast.success('تم تحديث الحالة');
      loadUsers();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">إدارة المستخدمين</h1>
        <button onClick={() => setShowAddModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          إضافة مستخدم
        </button>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-right py-3 px-4">الاسم</th>
              <th className="text-right py-3 px-4">الدور</th>
              <th className="text-right py-3 px-4">الحالة</th>
              <th className="text-right py-3 px-4">آخر دخول</th>
              <th className="text-right py-3 px-4">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b hover:bg-gray-50">
                <td className="py-3 px-4 font-medium">{user.full_name}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {user.role === 'admin' ? 'مشرف' : 'موظف'}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    user.is_active ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
                  }`}>
                    {user.is_active ? 'نشط' : 'معطل'}
                  </span>
                </td>
                <td className="py-3 px-4 text-sm text-gray-500">
                  {user.last_login ? new Date(user.last_login).toLocaleDateString('ar-SA') : '—'}
                </td>
                <td className="py-3 px-4">
                  <button
                    onClick={() => toggleUserStatus(user.id, user.is_active)}
                    className={`p-2 rounded-lg ${
                      user.is_active ? 'text-danger hover:bg-red-50' : 'text-success hover:bg-green-50'
                    }`}
                  >
                    {user.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">إضافة مستخدم جديد</h2>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">الاسم الكامل</label>
                <input
                  value={newUser.full_name}
                  onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">البريد الإلكتروني</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">كلمة المرور</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="input-field"
                  required
                  minLength={8}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">الدور</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value as 'admin' | 'worker' })}
                  className="input-field"
                >
                  <option value="worker">موظف</option>
                  <option value="admin">مشرف</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary flex-1">
                  إلغاء
                </button>
                <button type="submit" className="btn-primary flex-1">
                  إنشاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
