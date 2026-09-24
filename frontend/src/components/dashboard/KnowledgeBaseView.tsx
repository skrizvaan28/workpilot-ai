import React, { useEffect, useState } from 'react';
import { FileText, Trash2, UploadCloud, Search, Sparkles, FolderOpen, ArrowUpRight, MessageSquareText } from 'lucide-react';
import { api, KnowledgeDocument, SemanticSearchResult } from '../../lib/api';

interface KnowledgeBaseViewProps {
  onOpenUpload: () => void;
}

const suggestionQuestions = [
  'What is the leave policy?',
  'What documents are required for onboarding?',
  'Explain the performance review process.',
  'What are the employee attendance rules?',
];

export const KnowledgeBaseView: React.FC<KnowledgeBaseViewProps> = ({ onOpenUpload }) => {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SemanticSearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [askLoading, setAskLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [askError, setAskError] = useState<string | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);
  const [answerSources, setAnswerSources] = useState<SemanticSearchResult[]>([]);
  const [contextFound, setContextFound] = useState<boolean | null>(null);
  const [topSimilarity, setTopSimilarity] = useState<number | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      const items = await api.knowledgeDocuments();
      setDocuments(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load knowledge documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await api.deleteKnowledgeDocument(id);
      setDocuments((current) => current.filter((document) => document.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete this document');
    }
  };

  const handleSearch = async (event?: React.FormEvent) => {
    event?.preventDefault();
    const trimmed = searchQuery.trim();

    if (!trimmed) {
      setSearchError('Enter a question to search your knowledge base.');
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    try {
      setSearchLoading(true);
      setSearchError(null);
      const response = await api.semanticSearch({ query: trimmed, top_k: 5 });
      setSearchResults(response.results);
      setHasSearched(true);
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : 'Unable to perform semantic search');
      setSearchResults([]);
      setHasSearched(true);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleAsk = async (event?: React.FormEvent) => {
    event?.preventDefault();
    const trimmed = searchQuery.trim();

    if (!trimmed) {
      setAskError('Enter a question to ask the knowledge base.');
      setAnswer(null);
      setAnswerSources([]);
      return;
    }

    try {
      setAskLoading(true);
      setAskError(null);
      const response = await api.askKnowledgeBase({ query: trimmed, top_k: 5 });
      setAnswer(response.answer);
      setContextFound(response.context_found);
      setTopSimilarity(response.top_similarity ?? null);
      setAnswerSources(response.sources.map((source) => ({
        document_id: source.document_id,
        title: source.title,
        filename: source.filename,
        chunk_index: source.chunk_index,
        content: source.content,
        similarity: source.similarity,
        embedding_model: source.embedding_model,
      })));
    } catch (err) {
      setAskError(err instanceof Error ? err.message : 'Unable to answer this knowledge-base question');
      setAnswer(null);
      setAnswerSources([]);
      setContextFound(null);
      setTopSimilarity(null);
    } finally {
      setAskLoading(false);
    }
  };

  const showSearchResults = hasSearched && !searchLoading && !searchError;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <FolderOpen size={20} className="text-amber-400" />
            <h2 className="text-xl font-display font-bold text-white">Knowledge Base</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Store notes, policies, and reference material for future AI retrieval.
          </p>
        </div>

        <button
          onClick={onOpenUpload}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-sm transition"
        >
          <UploadCloud size={16} />
          <span>Add Document</span>
        </button>
      </div>

      <form className="flex flex-col sm:flex-row gap-3 rounded-xl border border-slate-800 bg-slate-900/70 p-3">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search or ask your knowledge base..."
            className="w-full rounded-lg border border-slate-700 bg-slate-950/80 py-2.5 pl-9 pr-3 text-sm text-slate-200 placeholder:text-slate-500 outline-none focus:border-amber-400/60"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={(event) => handleSearch(event)}
            disabled={searchLoading}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-950 text-xs font-bold px-4 py-2.5 transition"
          >
            <Search size={15} />
            <span>{searchLoading ? 'Searching...' : 'Search'}</span>
          </button>
          <button
            type="button"
            onClick={(event) => handleAsk(event)}
            disabled={askLoading}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-amber-500/50 bg-amber-500/10 hover:bg-amber-500/15 disabled:opacity-60 text-amber-200 text-xs font-bold px-4 py-2.5 transition"
          >
            <Sparkles size={15} />
            <span>{askLoading ? 'Answering...' : 'Ask'}</span>
          </button>
        </div>
      </form>

      {loading && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-6 text-sm text-slate-300">
          Loading your knowledge documents...
        </div>
      )}

      {!loading && error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
          {error}
        </div>
      )}

      {!loading && searchError && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
          {searchError}
        </div>
      )}

      {!loading && askError && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
          {askError}
        </div>
      )}

      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
          <MessageSquareText size={14} className="text-amber-400" />
          Recommended questions
        </div>
        <div className="flex flex-wrap gap-2">
          {suggestionQuestions.map((question) => (
            <button
              key={question}
              type="button"
              onClick={() => setSearchQuery(question)}
              className="rounded-full border border-slate-700 bg-slate-950/80 px-3 py-1.5 text-xs text-slate-300 transition hover:border-amber-500/40 hover:text-amber-200"
            >
              {question}
            </button>
          ))}
        </div>
      </div>

      {answer && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-3">
            <h3 className="text-sm font-semibold text-amber-200">Knowledge base answer</h3>
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-wide text-amber-300">
              <span className="rounded-full border border-amber-500/30 bg-slate-950/40 px-2 py-0.5">
                {contextFound === true ? 'Context found' : 'No relevant context'}
              </span>
              {topSimilarity !== null && (
                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-emerald-300">
                  Top match {topSimilarity.toFixed(3)}
                </span>
              )}
            </div>
          </div>
          <p className="text-sm leading-relaxed text-slate-100">{answer}</p>
          {answerSources.length > 0 ? (
            <div className="mt-4 space-y-2">
              <div className="text-[11px] uppercase tracking-wide text-slate-400">Sources</div>
              {answerSources.map((source) => (
                <div key={`${source.document_id}-${source.chunk_index}`} className="rounded-lg border border-slate-700 bg-slate-950/60 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium text-white">{source.title}</div>
                      <div className="mt-1 text-[11px] text-slate-400 font-mono">{source.filename}</div>
                    </div>
                    <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-300">
                      {source.similarity.toFixed(3)} relevance
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2 text-[10px] text-slate-400">
                    <span>Chunk #{source.chunk_index + 1}</span>
                    <span>{source.embedding_model}</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-300 leading-relaxed">{source.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-lg border border-dashed border-slate-700 bg-slate-950/50 p-3 text-sm text-slate-300">
              No relevant knowledge was found for this query. Try a broader question or add more source documents.
            </div>
          )}
        </div>
      )}

      {showSearchResults && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Top semantic matches</h3>
            <span className="text-[11px] uppercase tracking-wide text-slate-400">{searchResults.length} results</span>
          </div>

          {searchResults.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/60 p-6 text-sm text-slate-300">
              No semantic matches found for “{searchQuery.trim()}”.
            </div>
          ) : (
            <div className="space-y-3">
              {searchResults.map((result) => (
                <div key={`${result.document_id}-${result.chunk_index}`} className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-white truncate">{result.title}</div>
                      <div className="text-[11px] text-slate-400 font-mono truncate">{result.filename}</div>
                    </div>
                    <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                      {result.similarity.toFixed(3)} relevance
                    </div>
                  </div>

                  <p className="mt-3 text-sm text-slate-300 leading-relaxed">{result.content}</p>

                  <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                      <ArrowUpRight size={11} /> {result.embedding_model}
                    </span>
                    <span>Chunk #{result.chunk_index}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!loading && !error && !hasSearched && documents.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/60 p-8 text-center">
          <Search size={28} className="mx-auto text-slate-500 mb-3" />
          <h3 className="text-base font-semibold text-white">No knowledge documents yet</h3>
          <p className="text-sm text-slate-400 mt-1">Upload a policy, brief, or reference doc to start building your knowledge base.</p>
        </div>
      )}

      {!loading && !error && !hasSearched && documents.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {documents.map((document) => (
            <div key={document.id} className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    <FileText size={18} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-white truncate">{document.title}</h3>
                    <p className="text-[11px] text-slate-400 font-mono truncate">{document.filename}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(document.id)}
                  className="p-2 rounded-lg text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 transition"
                  aria-label={`Delete ${document.title}`}
                >
                  <Trash2 size={15} />
                </button>
              </div>

              <div className="mt-4 flex items-center justify-between text-[11px] text-slate-400">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  <Sparkles size={11} /> {document.document_type}
                </span>
                <span>{new Date(document.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
