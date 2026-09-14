import React from 'react';
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  Search,
  FolderGit2,
} from 'lucide-react';

interface DocumentsViewProps {
  onOpenUpload: () => void;
}

export const DocumentsView: React.FC<DocumentsViewProps> = ({ onOpenUpload }) => {
  const documents = [
    {
      id: 'doc-1',
      name: 'Enterprise_Product_Requirements_PRD_v2.pdf',
      size: '2.4 MB',
      tasksExtracted: 14,
      status: 'Indexed in RAG',
      date: 'Today, 10:30 AM',
      category: 'Product Spec',
    },
    {
      id: 'doc-2',
      name: 'SOC2_Security_Compliance_Controls_Matrix.docx',
      size: '1.8 MB',
      tasksExtracted: 8,
      status: 'Indexed in RAG',
      date: 'Yesterday, 3:15 PM',
      category: 'Compliance',
    },
    {
      id: 'doc-3',
      name: 'API_Architecture_&_Rate_Limiting_Policy.md',
      size: '420 KB',
      tasksExtracted: 5,
      status: 'Indexed in RAG',
      date: 'Sep 11, 2026',
      category: 'Engineering',
    },
    {
      id: 'doc-4',
      name: 'Customer_Success_Quarterly_Feedback_Report.pdf',
      size: '3.1 MB',
      tasksExtracted: 9,
      status: 'Indexed in RAG',
      date: 'Sep 09, 2026',
      category: 'Product Experience',
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <FolderGit2 size={20} className="text-amber-400" />
            <h2 className="text-xl font-display font-bold text-white">
              Document Knowledge Store & RAG
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            WorkPilot AI analyzes requirements, contracts, and specs to automatically generate prioritized tasks
          </p>
        </div>

        <button
          onClick={onOpenUpload}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-sm transition"
        >
          <UploadCloud size={16} />
          <span>Upload Document</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <FileText size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white truncate max-w-[220px] sm:max-w-xs">
                    {doc.name}
                  </h4>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {doc.size} • {doc.category}
                  </span>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 size={11} /> {doc.status}
              </span>
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-300 flex items-center gap-1">
                <Sparkles size={12} className="text-amber-400" />
                <strong className="text-white font-mono">{doc.tasksExtracted}</strong> tasks synthesized
              </span>
              <span className="text-[11px] text-slate-400 font-mono">{doc.date}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
