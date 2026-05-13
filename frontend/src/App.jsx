import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';

// In production, this should point to your deployed backend URL (Render)
// For local development, it points to localhost:5000
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

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
