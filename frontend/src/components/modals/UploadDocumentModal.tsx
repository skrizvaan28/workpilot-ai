import React, { useState } from 'react';
import {
  X,
  UploadCloud,
  FileText,
  Sparkles,
  CheckCircle2,
  FileCode,
  FileCheck,
} from 'lucide-react';

interface UploadDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTasksExtracted?: (count: number) => void;
}

export const UploadDocumentModal: React.FC<UploadDocumentModalProps> = ({
  isOpen,
  onClose,
  onTasksExtracted,
}) => {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [autoExtractTasks, setAutoExtractTasks] = useState(true);

  if (!isOpen) return null;

  const sampleFiles = [
    { name: 'Enterprise_Product_Requirements_PRD.pdf', size: '2.4 MB', type: 'PDF' },
    { name: 'SOC2_Security_Compliance_Framework.docx', size: '1.8 MB', type: 'DOCX' },
    { name: 'API_Architecture_Guidelines.md', size: '420 KB', type: 'MARKDOWN' },
  ];

  const handleStartParsing = () => {
    if (!selectedFile) return;
    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      setIsCompleted(true);
      if (onTasksExtracted) {
        onTasksExtracted(6);
      }
    }, 1500);
  };

  const handleReset = () => {
    setSelectedFile(null);
    setIsProcessing(false);
    setIsCompleted(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
              <UploadCloud size={18} />
            </div>
            <h3 className="font-display font-bold text-white text-base">
              Upload Document for AI Analysis
            </h3>
          </div>
          <button
            onClick={handleReset}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {!isCompleted ? (
            <>
              {/* Dropzone */}
              <div
                onClick={() => setSelectedFile(sampleFiles[0].name)}
                className="border-2 border-dashed border-slate-700 hover:border-amber-400/60 rounded-xl p-6 text-center cursor-pointer transition bg-slate-950/50 group"
              >
                <div className="h-12 w-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-400 group-hover:text-amber-400 group-hover:bg-slate-800/80 transition">
                  <UploadCloud size={24} />
                </div>
                <h4 className="text-sm font-semibold text-white">
                  Click or drag document to analyze
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Supports PDF, DOCX, TXT, and Markdown (up to 25MB)
                </p>
                {selectedFile && (
                  <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs">
                    <FileText size={13} />
                    <span>Selected: {selectedFile}</span>
                  </div>
                )}
              </div>

              {/* Sample Files Chips */}
              <div>
                <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Or select a sample workspace document:
                </span>
                <div className="space-y-1.5">
                  {sampleFiles.map((f) => (
                    <button
                      key={f.name}
                      type="button"
                      onClick={() => setSelectedFile(f.name)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-lg text-xs border transition text-left ${
                        selectedFile === f.name
                          ? 'bg-amber-500/10 border-amber-500/40 text-amber-200'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <FileCode size={14} className="text-amber-400 shrink-0" />
                        <span className="truncate font-medium">{f.name}</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 shrink-0">
                        {f.size}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* AI Auto-Extraction Checkbox */}
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="auto-extract"
                  checked={autoExtractTasks}
                  onChange={(e) => setAutoExtractTasks(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded text-amber-500 border-slate-700 bg-slate-900"
                />
                <label htmlFor="auto-extract" className="text-xs text-slate-300 cursor-pointer">
                  <div className="font-semibold text-white flex items-center gap-1.5">
                    <Sparkles size={12} className="text-amber-400" />
                    Auto-decompose into prioritized tasks
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    WorkPilot AI will convert requirements, milestones, and acceptance criteria directly into tasks.
                  </p>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 rounded-lg border border-slate-800 text-xs font-medium text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!selectedFile || isProcessing}
                  onClick={handleStartParsing}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 text-xs font-bold shadow-sm transition disabled:opacity-50"
                >
                  <Sparkles size={14} />
                  <span>{isProcessing ? 'AI Analyzing...' : 'Upload & Parse Document'}</span>
                </button>
              </div>
            </>
          ) : (
            /* Completed view */
            <div className="py-4 text-center space-y-4">
              <div className="h-14 w-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                <FileCheck size={28} />
              </div>
              <div>
                <h4 className="font-display font-bold text-white text-base">
                  Document Successfully Synthesized!
                </h4>
                <p className="text-xs text-slate-300 mt-1 max-w-sm mx-auto">
                  WorkPilot AI analyzed <strong className="text-white font-mono">{selectedFile}</strong> and generated{' '}
                  <strong className="text-amber-400">6 prioritized tasks</strong> with estimated deadlines.
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-left max-w-md mx-auto space-y-1.5">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Extracted Action Items:
                </div>
                <div className="text-slate-300 flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-emerald-400" />
                  <span>Configure OAuth2 & JWT session management</span>
                </div>
                <div className="text-slate-300 flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-emerald-400" />
                  <span>Implement document chunking & vector indexing pipeline</span>
                </div>
                <div className="text-slate-300 flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-emerald-400" />
                  <span>Set up role-based access control audit policies</span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition"
              >
                View in My Tasks
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
