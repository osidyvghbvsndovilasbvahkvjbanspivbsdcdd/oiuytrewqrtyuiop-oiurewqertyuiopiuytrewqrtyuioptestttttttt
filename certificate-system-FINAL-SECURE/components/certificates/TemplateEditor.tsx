'use client';

import { useState, useRef, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Draggable from 'react-draggable';
import { Plus, Trash2, Move, Save, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';

interface Field {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'date' | 'select';
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  rtl: boolean;
  required: boolean;
}

interface QRPosition {
  x: number;
  y: number;
  size: number;
}

interface TemplateEditorProps {
  onSave: (data: {
    name: string;
    templateImage: string;
    fields: Field[];
    qrPosition: QRPosition;
  }) => void;
}

export default function TemplateEditor({ onSave }: TemplateEditorProps) {
  const [templateImage, setTemplateImage] = useState<string | null>(null);
  const [fields, setFields] = useState<Field[]>([]);
  const [qrPosition, setQrPosition] = useState<QRPosition>({ x: 650, y: 950, size: 120 });
  const [templateName, setTemplateName] = useState('');
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setTemplateImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg'] },
    maxFiles: 1,
  });

  const addField = () => {
    const newField: Field = {
      id: `field-${Date.now()}`,
      name: `field_${fields.length + 1}`,
      label: 'حقل جديد',
      type: 'text',
      x: 100,
      y: 100,
      fontSize: 24,
      fontFamily: 'Tajawal',
      color: '#000000',
      rtl: true,
      required: true,
    };
    setFields([...fields, newField]);
    setSelectedField(newField.id);
  };

  const updateField = (id: string, updates: Partial<Field>) => {
    setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const deleteField = (id: string) => {
    setFields(fields.filter(f => f.id !== id));
    setSelectedField(null);
  };

  const handleSave = () => {
    if (!templateImage) {
      toast.error('يرجى رفع صورة القالب أولاً');
      return;
    }
    if (!templateName) {
      toast.error('يرجى إدخال اسم القالب');
      return;
    }
    onSave({
      name: templateName,
      templateImage,
      fields,
      qrPosition,
    });
  };

  const selectedFieldData = fields.find(f => f.id === selectedField);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <input
          type="text"
          value={templateName}
          onChange={(e) => setTemplateName(e.target.value)}
          placeholder="اسم القالب"
          className="input-field max-w-md"
        />
        <div className="flex gap-2">
          <button onClick={addField} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            إضافة حقل
          </button>
          <button onClick={handleSave} className="btn-primary flex items-center gap-2 bg-success hover:bg-green-600">
            <Save className="w-4 h-4" />
            حفظ القالب
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Canvas */}
        <div className="flex-1">
          {!templateImage ? (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
                isDragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300'
              }`}
            >
              <input {...getInputProps()} />
              <ImageIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">اسحب صورة القالب هنا أو انقر للاختيار</p>
              <p className="text-sm text-gray-400 mt-2">PNG, JPG حتى 10MB</p>
            </div>
          ) : (
            <div ref={imageRef} className="relative inline-block border rounded-xl overflow-hidden">
              <img src={templateImage} alt="Template" className="max-w-full" />

              {fields.map((field) => (
                <Draggable
                  key={field.id}
                  position={{ x: field.x, y: field.y }}
                  onStop={(_, data) => updateField(field.id, { x: data.x, y: data.y })}
                  bounds="parent"
                >
                  <div
                    className={`absolute cursor-move px-2 py-1 rounded border-2 ${
                      selectedField === field.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-dashed border-gray-400 bg-white/80'
                    }`}
                    onClick={() => setSelectedField(field.id)}
                    style={{
                      fontSize: `${field.fontSize}px`,
                      fontFamily: field.fontFamily,
                      color: field.color,
                      direction: field.rtl ? 'rtl' : 'ltr',
                    }}
                  >
                    <div className="flex items-center gap-1">
                      <Move className="w-3 h-3" />
                      {field.label}
                    </div>
                  </div>
                </Draggable>
              ))}

              {/* QR Code Position */}
              <Draggable
                position={{ x: qrPosition.x, y: qrPosition.y }}
                onStop={(_, data) => setQrPosition({ ...qrPosition, x: data.x, y: data.y })}
                bounds="parent"
              >
                <div
                  className="absolute border-2 border-dashed border-blue-500 bg-blue-50/50 flex items-center justify-center cursor-move"
                  style={{ width: qrPosition.size, height: qrPosition.size }}
                >
                  <span className="text-xs text-blue-600">QR</span>
                </div>
              </Draggable>
            </div>
          )}
        </div>

        {/* Properties Panel */}
        <div className="w-80 space-y-4">
          {selectedFieldData && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold">خصائص الحقل</h3>
                <button
                  onClick={() => deleteField(selectedFieldData.id)}
                  className="text-danger hover:bg-red-50 p-1 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-600">الاسم (للنظام)</label>
                  <input
                    value={selectedFieldData.name}
                    onChange={(e) => updateField(selectedFieldData.id, { name: e.target.value })}
                    className="input-field mt-1"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-600">العنوان المعروض</label>
                  <input
                    value={selectedFieldData.label}
                    onChange={(e) => updateField(selectedFieldData.id, { label: e.target.value })}
                    className="input-field mt-1"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-600">النوع</label>
                  <select
                    value={selectedFieldData.type}
                    onChange={(e) => updateField(selectedFieldData.id, { type: e.target.value as any })}
                    className="input-field mt-1"
                  >
                    <option value="text">نص</option>
                    <option value="date">تاريخ</option>
                    <option value="select">قائمة منسدلة</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm text-gray-600">حجم الخط</label>
                  <input
                    type="number"
                    value={selectedFieldData.fontSize}
                    onChange={(e) => updateField(selectedFieldData.id, { fontSize: parseInt(e.target.value) })}
                    className="input-field mt-1"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-600">اللون</label>
                  <input
                    type="color"
                    value={selectedFieldData.color}
                    onChange={(e) => updateField(selectedFieldData.id, { color: e.target.value })}
                    className="w-full h-10 mt-1 rounded"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedFieldData.rtl}
                    onChange={(e) => updateField(selectedFieldData.id, { rtl: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label className="text-sm">من اليمين لليسار</label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedFieldData.required}
                    onChange={(e) => updateField(selectedFieldData.id, { required: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label className="text-sm">مطلوب</label>
                </div>
              </div>
            </div>
          )}

          <div className="card">
            <h3 className="font-bold mb-4">موضع QR</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-600">الحجم</label>
                <input
                  type="range"
                  min="50"
                  max="200"
                  value={qrPosition.size}
                  onChange={(e) => setQrPosition({ ...qrPosition, size: parseInt(e.target.value) })}
                  className="w-full mt-1"
                />
                <span className="text-sm text-gray-500">{qrPosition.size}px</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
