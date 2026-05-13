import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Send, User, Bot, Loader2 } from 'lucide-react';

const ChatArea = ({ sources, API_URL }) => {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I am your NotebookLM clone. Upload a document on the left and ask me questions about it.' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userQuery = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userQuery }]);

    if (sources.length === 0) {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Please upload a document first before asking questions.' }]);
      return;
    }

    setIsTyping(true);

    try {
      const response = await axios.post(`${API_URL}/chat`, { question: userQuery });
      const answer = response.data.answer;
      setMessages((prev) => [...prev, { role: 'assistant', content: answer }]);
    } catch (error) {
      console.error("Chat error", error);
      setMessages((prev) => [...prev, { role: 'assistant', content: 'An error occurred while fetching the answer. Please try again.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-background h-full relative">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg, index) => (
          <div key={index} className={`flex gap-4 max-w-4xl mx-auto ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-blue-600' : 'bg-slate-700'}`}>
              {msg.role === 'user' ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-blue-400" />}
            </div>
            <div className={`px-5 py-3 rounded-2xl max-w-[80%] ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-surface text-slate-200 border border-slate-700 rounded-tl-none leading-relaxed'}`}>
              {msg.content}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex gap-4 max-w-4xl mx-auto">
            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
              <Bot className="w-5 h-5 text-blue-400" />
            </div>
            <div className="px-5 py-4 rounded-2xl bg-surface border border-slate-700 rounded-tl-none flex items-center gap-2">
               <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
               <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
               <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-background border-t border-slate-800">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about your documents..."
            className="w-full bg-surface border border-slate-700 text-white rounded-full pl-6 pr-14 py-4 focus:outline-none focus:border-slate-500 transition-colors shadow-sm"
          />
          <button 
            type="submit" 
            disabled={!input.trim() || isTyping}
            className="absolute right-2 p-2 bg-slate-700 hover:bg-slate-600 rounded-full text-white transition-colors disabled:opacity-50 disabled:hover:bg-slate-700"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
        <p className="text-center text-xs text-slate-500 mt-3">
          NotebookLM Clone can make mistakes. Check important info.
        </p>
      </div>
    </div>
  );
};

export default ChatArea;
