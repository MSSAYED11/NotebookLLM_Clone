import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { Plus, MoreVertical, Settings, Share2, FileText, Send, Loader2, ArrowRight } from 'lucide-react';
import './index.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

function App() {
  const [sources, setSources] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  const chatHistoryRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auto-scroll chat
  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      await uploadFile(selectedFile);
    } else {
      alert('Please upload a valid PDF file.');
    }
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const uploadFile = async (file) => {
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      await axios.post(`${API_BASE_URL}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSources(prev => [...prev, file.name]);
      
      if (messages.length === 0) {
        setMessages([{
          role: 'assistant',
          content: `I've successfully read **${file.name}**. What would you like to know about it?`
        }]);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to process document. Please ensure backend is running.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() || sources.length === 0) return;

    const query = inputMessage;
    setInputMessage('');
    setMessages(prev => [...prev, { role: 'user', content: query }]);
    setIsTyping(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/chat`, { query });
      setMessages(prev => [...prev, { role: 'assistant', content: response.data.answer }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error answering your question. Please try again.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="app-container">
      <header>
        <div className="logo-container">
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000' }}>
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
          Untitled notebook
        </div>
        <div className="header-actions">
        </div>
      </header>

      <div className="main-content">
        {/* Left Sidebar - Sources */}
        <div className="sidebar">
          <div className="sidebar-header">
            Sources
            <div style={{ display: 'flex', gap: '8px' }}>
               <button style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  <MoreVertical size={16} />
               </button>
            </div>
          </div>
          
          <div className="sidebar-content">
            <input 
              ref={fileInputRef}
              type="file" 
              accept=".pdf" 
              onChange={handleFileChange} 
              style={{ display: 'none' }}
            />
            <button 
              className="add-source-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? <Loader2 size={16} className="spinner" style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={16} />}
              Add sources
            </button>

            {sources.length === 0 ? (
              <div style={{ textAlign: 'center', marginTop: '40px', color: 'var(--text-secondary)' }}>
                <FileText size={48} style={{ margin: '0 auto 16px', opacity: 0.2 }} />
                <p style={{ fontSize: '0.9rem', marginBottom: '8px', color: 'var(--text-primary)' }}>Saved sources will appear here</p>
                <p style={{ fontSize: '0.8rem', lineHeight: '1.5' }}>Click Add source above to add PDFs, websites, text, videos, or audio files.</p>
              </div>
            ) : (
              sources.map((sourceName, idx) => (
                <div key={idx} className="source-item">
                  <FileText size={20} color="var(--text-secondary)" />
                  <span style={{ fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {sourceName}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Middle Chat Area */}
        <div className="chat-container">
          <div className="chat-header">
            Chat
            <button style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <MoreVertical size={16} />
            </button>
          </div>
          
          <div className="chat-history" ref={chatHistoryRef}>
            {messages.length === 0 ? (
              <div className="welcome-state">
                <h2><span style={{ fontSize: '2.5rem' }}>👋</span> Let's start your notebook...</h2>
                <p>This is your blank canvas to understand, create, or make progress on something new. I can help you get started or you can go ahead and add your own sources.</p>
                

              </div>
            ) : (
              messages.map((msg, index) => (
                <div key={index} className={`message ${msg.role}`}>
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ))
            )}
            
            {isTyping && (
              <div className="typing-indicator">
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
              </div>
            )}
          </div>

          <div className="input-container">
            <div className="input-wrapper">
              <textarea
                id="chat-input-box"
                className="chat-input"
                placeholder={sources.length > 0 ? "Start typing..." : "Please add a source first..."}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={sources.length === 0 || isTyping}
                rows={1}
              />
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                {sources.length} sources
              </span>
              <button 
                className="send-btn" 
                onClick={handleSendMessage}
                disabled={sources.length === 0 || isTyping || !inputMessage.trim()}
              >
                <ArrowRight size={18} />
              </button>
            </div>
            <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              NotebookLM can be inaccurate; please double check its responses.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
