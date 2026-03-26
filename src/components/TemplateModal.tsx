interface TemplateModalProps {
  templateText: string;
  onTemplateTextChange: (text: string) => void;
  onLoad: () => void;
  onClose: () => void;
}

export default function TemplateModal({ templateText, onTemplateTextChange, onLoad, onClose }: TemplateModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50"></div>
      <div
        className="relative bg-white rounded-xl p-6 max-w-[700px] w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-petrona text-2xl font-bold text-navy mb-4">Load Routine Template</h2>
        <p className="text-sm text-gray-500 font-bold mb-3">
          Paste a filled routine template. Exercise codes will be looked up in the database
          and template values (coaching cues, timing, focus) will override the defaults.
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
