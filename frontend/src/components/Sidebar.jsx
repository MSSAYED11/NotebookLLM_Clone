import React, { useRef, useState } from 'react';
import axios from 'axios';
import { Upload, FileText, Loader2, FileCheck2 } from 'lucide-react';

const Sidebar = ({ sources, setSources, isUploading, setIsUploading, API_URL }) => {
  const fileInputRef = useRef(null);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      await axios.post(`${API_URL}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      // Assuming success, add to sources list
      setSources((prev) => [...prev, { name: file.name, type: file.type }]);
    } catch (error) {
      console.error("Upload failed", error);
      alert("Failed to upload document. Please try again.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = null;
    }
  };

  return (
    <div className="w-80 bg-surface flex flex-col border-r border-slate-700 h-full p-4">
      <div className="mb-6">
        <h1 className="text-xl font-semibold mb-4 text-white">NotebookLM Clone</h1>
        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="w-full flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 transition-colors text-white py-3 px-4 rounded-xl font-medium disabled:opacity-50"
        >
          {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
          {isUploading ? 'Processing...' : 'Upload Document'}
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileUpload} 
          accept=".pdf,.txt,.csv" 
          className="hidden" 
        />
        <p className="text-xs text-slate-400 text-center mt-2">Supports PDF, TXT, CSV</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        <h2 className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wider">Sources</h2>
        {sources.length === 0 ? (
          <div className="text-center text-slate-500 py-8 text-sm">
            No sources uploaded yet.
          </div>
        ) : (
          <ul className="space-y-2">
            {sources.map((source, index) => (
              <li key={index} className="flex items-center gap-3 bg-slate-800 p-3 rounded-lg border border-slate-700">
                <FileText className="w-5 h-5 text-blue-400 flex-shrink-0" />
                <span className="text-sm text-slate-200 truncate" title={source.name}>{source.name}</span>
                <FileCheck2 className="w-4 h-4 text-green-500 ml-auto flex-shrink-0" />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
