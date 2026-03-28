import { useState } from 'react';
import type { SavedTemplate } from '../lib/supabase';
import { ChevronDown, FileText } from 'lucide-react';

interface TemplateModalProps {
  templateText: string;
  onTemplateTextChange: (text: string) => void;
  onLoad: () => void;
  onClose: () => void;
  savedTemplates?: SavedTemplate[];
}

export default function TemplateModal({ templateText, onTemplateTextChange, onLoad, onClose, savedTemplates = [] }: TemplateModalProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');

  const filtered = savedTemplates.filter(t => !pickerSearch || t.label.toLowerCase().includes(pickerSearch.toLowerCase()));

  function handlePick(template: SavedTemplate) {
    onTemplateTextChange(template.template_text);
    setShowPicker(false);
    setPickerSearch('');
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50"></div>
      <div
        className="relative bg-white rounded-xl p-6 max-w-[700px] w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-petrona text-2xl font-bold text-navy mb-4">Load Routine Template</h2>

        {savedTemplates.length > 0 && (
          <div className="relative mb-4">
            <button
              onClick={() => setShowPicker(!showPicker)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-lg border-2 border-crimson/30 bg-crimson/5 hover:bg-crimson/10 cursor-pointer text-left transition-all"
            >
              <span className="flex items-center gap-2 text-sm font-bold text-crimson">
                <FileText className="w-4 h-4" />
                Pick from {savedTemplates.length} saved template{savedTemplates.length !== 1 ? 's' : ''}
              </span>
              <ChevronDown className={`w-4 h-4 text-crimson transition-transform ${showPicker ? 'rotate-180' : ''}`} />
            </button>
            {showPicker && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white border-2 border-navy/20 rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto">
                <input
                  type="text"
                  value={pickerSearch}
                  onChange={(e) => setPickerSearch(e.target.value)}
                  placeholder="Search templates..."
                  className="w-full px-3 py-2.5 border-b border-gray-200 text-sm font-semibold focus:outline-none sticky top-0 bg-white"
                />
                {filtered.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handlePick(t)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-cream cursor-pointer border-none bg-transparent text-left border-b border-gray-100"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="text-sm font-bold text-navy block truncate">{t.label}</span>
                      <span className="text-xs text-gray-400">
                        {t.exercise_count ? `${t.exercise_count} exercises · ` : ''}
                        Saved {new Date(t.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </button>
                ))}
                {filtered.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-4">No matches</p>
                )}
              </div>
            )}
          </div>
        )}

        <p className="text-sm text-gray-500 font-bold mb-3">
          {savedTemplates.length > 0 ? 'Or paste a template below.' : 'Paste a filled routine template. Exercise codes will be looked up in the database and template values will override the defaults.'}
        </p>
        <textarea
          value={templateText}
          onChange={(e) => onTemplateTextChange(e.target.value)}
          placeholder="Paste your routine template here..."
          className="w-full min-h-[400px] p-4 rounded-lg border-2 border-gray-200 focus:border-navy focus:outline-none text-sm font-mono bg-gray-50"
        />
        <div className="flex gap-3 mt-4 justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-lg font-bold text-sm border-2 border-gray-200 text-gray-500 hover:bg-gray-50 cursor-pointer bg-white min-h-[44px]"
          >
            Cancel
          </button>
          <button
            onClick={onLoad}
            disabled={!templateText.trim()}
            className={`px-6 py-2.5 rounded-lg font-bold text-sm text-white hover:shadow-lg cursor-pointer border-none min-h-[44px] ${
              !templateText.trim()
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-gradient-to-r from-navy to-crimson'
            }`}
          >
            Load Template
          </button>
        </div>
      </div>
    </div>
  );
}
