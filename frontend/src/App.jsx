import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://notebookllm-clone-3l9t.onrender.com' : 'http://localhost:5000');

function App() {
  const [sources, setSources] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-text">
      <Sidebar 
        sources={sources} 
        setSources={setSources} 
        isUploading={isUploading} 
        setIsUploading={setIsUploading} 
        API_URL={API_URL} 
      />
      <ChatArea 
        sources={sources} 
        API_URL={API_URL} 
      />
    </div>
  );
}

export default App;
