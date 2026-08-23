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
} from 'lucide-react';
import { DocumentItem } from '../types';
import apiService from '../services/api';

interface DocumentSectionProps {
  documents: DocumentItem[];
  isLoading: boolean;
  onRefresh: () => void;
}

const SUPPORTED_EXTENSIONS = ['.pdf', '.docx', '.txt', '.csv', '.json', '.md', '.markdown'];

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

  const getFormatBadge = (filename: string, fileType?: string | null) => {
    const ext = (fileType || filename.split('.').pop() || 'doc').toUpperCase();
    return ext;
  };

  const handleFileUpload = async (file: File) => {
    const filenameLower = file.name.toLowerCase();
    const isSupported = SUPPORTED_EXTENSIONS.some((ext) => filenameLower.endsWith(ext));

    if (!isSupported) {
      setErrorMessage('Supported formats: PDF, DOCX, TXT, CSV, JSON, Markdown');
      setSuccessMessage(null);
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setErrorMessage('File size exceeds the 20 MB limit.');
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
      setSuccessMessage(`Processed ${result.pages} sections successfully.`);
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
    <div className="saas-card p-5 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-[#1C3326]">
        <div>
          <h2 className="text-sm font-semibold text-[#F5F7F6] flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#16A34A]" />
            Document Management
          </h2>
          <p className="text-xs text-[#A7B3AC] mt-0.5">
            Upload and process knowledge documents
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-xs font-medium bg-[#101F17] text-[#A7B3AC] border border-[#1C3326]">
            {documents.length} {documents.length === 1 ? 'Document' : 'Documents'}
          </span>
          <button
            onClick={onRefresh}
            title="Refresh documents"
            className="p-1 text-[#738078] hover:text-[#16A34A] rounded transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Alert Notifications */}
      {successMessage && (
        <div className="mt-3 p-2.5 rounded-lg bg-[#101F17] border border-[#22C55E]/30 flex items-center justify-between text-xs text-[#22C55E]">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-[#A7B3AC] hover:text-white">&times;</button>
        </div>
      )}

      {errorMessage && (
        <div className="mt-3 p-2.5 rounded-lg bg-[#101F17] border border-[#EF4444]/30 flex items-center justify-between text-xs text-[#EF4444]">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-[#A7B3AC] hover:text-white">&times;</button>
        </div>
      )}

      {/* Upload Dropzone */}
      <div className="mt-4 grid grid-cols-1 gap-4 flex-1">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
            dragOver
              ? 'border-[#16A34A] bg-[#101F17]'
              : 'border-[#1C3326] hover:border-[#16A34A]/50 bg-[#101F17]'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.txt,.csv,.json,.md,.markdown,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/csv,application/json,text/markdown"
            onChange={handleFileSelect}
            className="hidden"
            disabled={isUploading}
          />

          <div className="w-10 h-10 rounded-lg bg-[#0B1711] border border-[#1C3326] flex items-center justify-center text-[#16A34A] mb-2">
            {isUploading ? (
              <RefreshCw className="w-5 h-5 animate-spin text-[#16A34A]" />
            ) : (
              <UploadCloud className="w-5 h-5 text-[#16A34A]" />
            )}
          </div>

          <h3 className="text-xs font-semibold text-[#F5F7F6]">
            {isUploading ? 'Uploading Document...' : 'Upload Knowledge Document'}
          </h3>
          <p className="text-[11px] text-[#A7B3AC] mt-0.5">
            Drag &amp; Drop your file here or <span className="text-[#16A34A] font-medium underline">Browse Files</span>
          </p>
          <p className="mt-1.5 text-[10px] text-[#22C55E] font-medium">
            Supported: PDF • DOCX • TXT • CSV • JSON • Markdown
          </p>
          <span className="mt-1 text-[10px] text-[#738078]">
            Maximum file size: 20 MB
          </span>
        </div>

        {/* Uploaded Documents List */}
        <div className="flex-1 flex flex-col min-h-[220px]">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-medium text-[#A7B3AC]">
              Uploaded Documents ({documents.length})
            </h4>
          </div>

          {documents.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-5 rounded-lg bg-[#101F17] border border-[#1C3326]">
              <FileText className="w-6 h-6 text-[#738078] mb-2" />
              <p className="text-xs font-medium text-[#F5F7F6]">No knowledge documents yet</p>
              <p className="text-[11px] text-[#738078] max-w-xs mt-0.5">
                Upload a document to get started.
              </p>
            </div>
          ) : (
            <div className="space-y-2 overflow-y-auto max-h-[320px] pr-1">
              {documents.map((doc) => {
                const isProcessingThis = processingDocId === doc.document_id;
                const isDeletingThis = deletingDocId === doc.document_id;
                const badge = getFormatBadge(doc.filename, doc.file_type);

                return (
                  <div
                    key={doc.document_id}
                    className="saas-subcard p-3 flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="p-1.5 rounded bg-[#0B1711] text-[#16A34A] border border-[#1C3326] flex-shrink-0 font-bold text-[10px] uppercase">
                          {badge}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-[#F5F7F6] truncate" title={doc.filename}>
                            {doc.filename}
                          </p>
                          <div className="flex items-center gap-2 text-[11px] text-[#738078] mt-0.5">
                            <span>{formatFileSize(doc.file_size)}</span>
                            <span>&bull;</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-[#738078]" />
                              {formatDate(doc.upload_timestamp)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Status Tag */}
                      <div className="flex-shrink-0">
                        {doc.status === 'processed' ? (
                          <span className="inline-flex items-center gap-1.5 text-[11px] text-[#22C55E] font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]"></span>
                            Grounding Indexed
                          </span>
                        ) : doc.status === 'processing' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-[#F59E0B]">
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            Processing
                          </span>
                        ) : doc.status === 'failed' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-[#EF4444]">
                            <AlertCircle className="w-3 h-3" />
                            Failed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-[11px] text-[#A7B3AC]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#A7B3AC]"></span>
                            Uploaded
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions Bar */}
                    <div className="flex items-center justify-between pt-2 border-t border-[#1C3326] text-xs">
                      <div className="text-[11px] text-[#738078]">
                        {doc.status === 'processed' ? `${doc.pages} Sections Indexed` : 'Awaiting extraction'}
                      </div>

                      <div className="flex items-center gap-2">
                        {doc.status !== 'processed' && (
                          <button
                            onClick={() => handleProcessDocument(doc.document_id)}
                            disabled={isProcessingThis || isDeletingThis}
                            className="flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium bg-[#16A34A] hover:bg-[#15803D] text-white transition-colors disabled:opacity-50"
                          >
                            {isProcessingThis ? (
                              <>
                                <RefreshCw className="w-3 h-3 animate-spin" />
                                <span>Processing...</span>
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
                          className="p-1 text-[#738078] hover:text-[#EF4444] rounded transition-colors"
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
    </div>
  );
};
