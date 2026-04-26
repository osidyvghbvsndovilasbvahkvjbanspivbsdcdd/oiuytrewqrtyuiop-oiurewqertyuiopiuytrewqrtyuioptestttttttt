'use client';

import { useState, useEffect } from 'react';
import { supabaseClient } from '@/lib/supabase';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Course {
  id: string;
  name_ar: string;
  name_en: string;
  description_ar: string | null;
  description_en: string | null;
  duration: string | null;
  is_active: boolean;
}

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [formData, setFormData] = useState({
    name_ar: '', name_en: '', description_ar: '', description_en: '', duration: ''
  });

  useEffect(() => { loadCourses(); }, []);

  const loadCourses = async () => {
    const { data } = await supabaseClient.from('courses').select('*').order('created_at', { ascending: false });
    setCourses(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCourse) {
        await supabaseClient.from('courses').update(formData).eq('id', editingCourse.id);
        toast.success('تم تحديث الدورة');
      } else {
        await supabaseClient.from('courses').insert(formData);
        toast.success('تم إضافة الدورة');
      }
      setShowModal(false);
      setEditingCourse(null);
      setFormData({ name_ar: '', name_en: '', description_ar: '', description_en: '', duration: '' });
      loadCourses();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الدورة؟')) return;
    await supabaseClient.from('courses').delete().eq('id', id);
    toast.success('تم الحذف');
    loadCourses();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">إدارة الدورات</h1>
        <button onClick={() => { setEditingCourse(null); setShowModal(true); }} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> إضافة دورة
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {courses.map((course) => (
          <div key={course.id} className="card">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold">{course.name_ar}</h3>
                <p className="text-sm text-gray-500">{course.name_en}</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => { setEditingCourse(course); setFormData(course); setShowModal(true); }} className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(course.id)} className="p-1 text-danger hover:bg-red-50 rounded">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-2">{course.description_ar}</p>
            {course.duration && <p className="text-xs text-gray-400 mt-1">المدة: {course.duration}</p>}
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">{editingCourse ? 'تعديل' : 'إضافة'} دورة</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input value={formData.name_ar} onChange={e => setFormData({...formData, name_ar: e.target.value})} placeholder="اسم الدورة (عربي)" className="input-field" required />
              <input value={formData.name_en} onChange={e => setFormData({...formData, name_en: e.target.value})} placeholder="اسم الدورة (إنجليزي)" className="input-field" required />
              <textarea value={formData.description_ar} onChange={e => setFormData({...formData, description_ar: e.target.value})} placeholder="وصف (عربي)" className="input-field" rows={2} />
              <textarea value={formData.description_en} onChange={e => setFormData({...formData, description_en: e.target.value})} placeholder="وصف (إنجليزي)" className="input-field" rows={2} />
              <input value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})} placeholder="المدة (مثال: 3 أشهر)" className="input-field" />
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">إلغاء</button>
                <button type="submit" className="btn-primary flex-1">حفظ</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
