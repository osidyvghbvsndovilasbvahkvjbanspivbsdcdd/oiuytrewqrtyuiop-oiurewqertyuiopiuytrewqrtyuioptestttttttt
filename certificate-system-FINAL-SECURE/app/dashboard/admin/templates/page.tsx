'use client';

import { useState } from 'react';
import { supabaseClient } from '@/lib/supabase';
import TemplateEditor from '@/components/certificates/TemplateEditor';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminTemplatesPage() {
  const [showEditor, setShowEditor] = useState(false);

  const handleSaveTemplate = async (data: any) => {
    try {
      // Upload template image to Supabase Storage
      const base64Data = data.templateImage.split(',')[1];
      const blob = await fetch(`data:image/png;base64,${base64Data}`).then(r => r.blob());
      const fileName = `templates/${Date.now()}.png`;

      const { data: uploadData, error: uploadError } = await supabaseClient.storage
        .from('certificates')
        .upload(fileName, blob, { contentType: 'image/png' });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabaseClient.storage
        .from('certificates')
        .getPublicUrl(fileName);

      await supabaseClient.from('certificate_templates').insert({
        name: data.name,
        template_image_url: publicUrl,
        fields: data.fields,
        qr_position: data.qrPosition,
      });

      toast.success('تم حفظ القالب بنجاح');
      setShowEditor(false);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">قوالب الشهادات</h1>
        {!showEditor && (
          <button onClick={() => setShowEditor(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> قالب جديد
          </button>
        )}
      </div>

      {showEditor ? (
        <TemplateEditor onSave={handleSaveTemplate} />
      ) : (
        <div className="text-center py-12 text-gray-500">
          انقر "قالب جديد" لإنشاء قالب شهادة
        </div>
      )}
    </div>
  );
}
