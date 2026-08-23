import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  AlertCircle,
  CheckCircle2,
  Clock,
  Play,
  Trash2,
  RefreshCw,
  Layers,
  FileCheck,
} from 'lucide-react';
import { DocumentItem } from '../types';
import apiService from '../services/api';

interface DocumentSectionProps {
  documents: DocumentItem[];
  isLoading: boolean;
  onRefresh: () => void;
}

export const DocumentSection: React.FC<DocumentSectionProps> = ({
  documents,
  isLoading,
  onRefresh,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [processingDocId, setProcessingDocId] = useState<string | null>(null);
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (isoString: string): string => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', ' +
             date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return isoString;
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setErrorMessage('Only PDF documents (.pdf) are supported.');
      setSuccessMessage(null);
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setErrorMessage('File size exceeds the 20MB limit.');
      setSuccessMessage(null);
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await apiService.uploadDocument(file);
      setSuccessMessage(`"${response.filename}" uploaded successfully.`);
      onRefresh();
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        (err instanceof Error ? err.message : 'Document upload failed.');
      setErrorMessage(errorMsg);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleProcessDocument = async (docId: string) => {
    setProcessingDocId(docId);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const result = await apiService.processDocument(docId);
      setSuccessMessage(`Processed ${result.pages} pages successfully.`);
      onRefresh();
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        (err instanceof Error ? err.message : 'Unable to process document.');
      setErrorMessage(errorMsg);
    } finally {
      setProcessingDocId(null);
    }
  };

  const handleDeleteDocument = async (docId: string, filename: string) => {
    if (!window.confirm(`Are you sure you want to delete "${filename}"?`)) {
      return;
    }

    setDeletingDocId(docId);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await apiService.deleteDocument(docId);
      setSuccessMessage(`"${filename}" deleted.`);
      onRefresh();
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        (err instanceof Error ? err.message : 'Failed to delete document.');
      setErrorMessage(errorMsg);
    } finally {
      setDeletingDocId(null);
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-6 flex flex-col h-full border border-emerald-500/15">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-emerald-500/15">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-400" />
            Knowledge Repository
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Ingest and extract page-level text from enterprise PDFs
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            {documents.length} {documents.length === 1 ? 'Document' : 'Documents'}
          </span>
          <button
            onClick={onRefresh}
            title="Refresh documents"
            className="p-1.5 text-slate-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-lg transition-colors border border-emerald-500/15"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Alert Notifications */}
      {successMessage && (
        <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs text-emerald-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-400/70 hover:text-emerald-300 ml-2"
          >
            &times;
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-between text-xs text-rose-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-rose-400/70 hover:text-rose-300 ml-2"
          >
            &times;
          </button>
        </div>
      )}

      {/* Upload Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`mt-4 border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center text-center transition-all duration-300 cursor-pointer group ${
          dragOver
            ? 'border-emerald-400 bg-emerald-500/10 shadow-lg shadow-emerald-500/10'
            : 'border-emerald-500/20 hover:border-emerald-400/50 bg-dark-900/60 hover:bg-dark-850'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileSelect}
          className="hidden"
          disabled={isUploading}
        />

        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-2.5 group-hover:-translate-y-1 transition-transform duration-300">
          {isUploading ? (
            <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
          ) : (
            <UploadCloud className="w-6 h-6 text-emerald-400" />
          )}
        </div>

        <h3 className="text-xs font-bold text-white">
          {isUploading ? 'Uploading Knowledge PDF...' : 'Upload Knowledge Document'}
        </h3>
        <p className="text-[11px] text-slate-400 mt-1">
          Drag &amp; Drop your PDF here or Browse Files
        </p>
        <span className="mt-2 text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/15">
          Maximum 20 MB &bull; PDF only
        </span>
      </div>

      {/* Document List */}
      <div className="mt-5 flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between mb-2.5">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Uploaded Documents ({documents.length})
          </h4>
        </div>

        {documents.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 rounded-xl bg-dark-900/40 border border-emerald-500/10 my-auto">
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-3">
              <FileText className="w-6 h-6" />
            </div>
            <p className="text-xs font-semibold text-slate-200">No knowledge documents yet</p>
            <p className="text-[11px] text-slate-400 max-w-xs mt-1 leading-relaxed">
              Upload a document to get started.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5 overflow-y-auto max-h-[380px] pr-1">
            {documents.map((doc) => {
              const isProcessingThis = processingDocId === doc.document_id;
              const isDeletingThis = deletingDocId === doc.document_id;

              return (
                <div
                  key={doc.document_id}
                  className="p-3.5 rounded-xl bg-dark-900/70 border border-emerald-500/15 hover:border-emerald-500/30 transition-all flex flex-col gap-2.5 group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 flex-shrink-0 mt-0.5 border border-emerald-500/20">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white truncate" title={doc.filename}>
                          {doc.filename}
                        </p>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                          <span>{formatFileSize(doc.file_size)}</span>
                          <span>&bull;</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {formatDate(doc.upload_timestamp)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="flex-shrink-0">
                      {doc.status === 'uploaded' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          Uploaded
                        </span>
                      )}
                      {doc.status === 'processing' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                          Processing
                        </span>
                      )}
                      {doc.status === 'processed' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                          <FileCheck className="w-2.5 h-2.5 text-emerald-400" />
                          {doc.pages} {doc.pages === 1 ? 'Page' : 'Pages'}
                        </span>
                      )}
                      {doc.status === 'failed' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          <AlertCircle className="w-2.5 h-2.5" />
                          Failed
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Processing Progress Animation Bar */}
                  {isProcessingThis && (
                    <div className="w-full bg-dark-800 rounded-full h-1.5 overflow-hidden border border-emerald-500/20">
                      <div className="bg-gradient-to-r from-emerald-500 to-teal-300 h-full animate-pulse rounded-full w-3/4"></div>
                    </div>
                  )}

                  {/* Actions & Metadata Bar */}
                  <div className="flex items-center justify-between pt-2 border-t border-emerald-500/10 text-xs">
                    <div className="text-[11px] text-slate-400 flex items-center gap-1">
                      {doc.status === 'processed' ? (
                        <span className="text-emerald-400/90 flex items-center gap-1">
                          <Layers className="w-3 h-3 text-emerald-400" /> Grounding Indexed
                        </span>
                      ) : (
                        <span>Awaiting text extraction</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {doc.status !== 'processed' && (
                        <button
                          onClick={() => handleProcessDocument(doc.document_id)}
                          disabled={isProcessingThis || isDeletingThis}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors disabled:opacity-50 shadow-sm shadow-emerald-500/20"
                        >
                          {isProcessingThis ? (
                            <>
                              <RefreshCw className="w-3 h-3 animate-spin" />
                              <span>Extracting...</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-3 h-3 fill-current" />
                              <span>Process</span>
                            </>
                          )}
                        </button>
                      )}

                      <button
                        onClick={() => handleDeleteDocument(doc.document_id, doc.filename)}
                        disabled={isProcessingThis || isDeletingThis}
                        title="Delete Document"
                        className="p-1 text-slate-400 hover:text-rose-400 rounded-md transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
