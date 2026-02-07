import React, { useState, useCallback } from 'react';
import FileExplorer from './components/FileExplorer';
import CodeEditor from './components/CodeEditor';
import ChatInterface from './components/ChatInterface';
import { File, Message } from './types';
import { INITIAL_FILES } from './constants';
import { streamChatResponse } from './services/geminiService';
import { Menu, X } from 'lucide-react';

const App: React.FC = () => {
  const [files, setFiles] = useState<File[]>(INITIAL_FILES);
  const [activeFileId, setActiveFileId] = useState<string | null>(INITIAL_FILES[0].id);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(true);

  // File Operations
  const handleSelectFile = (id: string) => {
    setActiveFileId(id);
    // On mobile, close sidebar after selection
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  const handleCreateFile = (name: string, language: string) => {
    const newFile: File = {
      id: Date.now().toString(),
      name,
      language,
      content: ''
    };
    setFiles([...files, newFile]);
    setActiveFileId(newFile.id);
  };

  const handleDeleteFile = (id: string) => {
    setFiles(files.filter(f => f.id !== id));
    if (activeFileId === id) {
      setActiveFileId(null);
    }
  };

  const handleUpdateContent = (id: string, newContent: string) => {
    setFiles(files.map(f => f.id === id ? { ...f, content: newContent } : f));
  };

  // Chat Operations
  const handleSendMessage = async (text: string) => {
    const activeFile = files.find(f => f.id === activeFileId) || null;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: text,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
        const streamResult = await streamChatResponse(
            messages,
            activeFile,
            files,
            text
        );

        const botMessageId = (Date.now() + 1).toString();
        // Optimistically add bot message placeholder
        setMessages(prev => [...prev, {
            id: botMessageId,
            role: 'model',
            text: '',
            timestamp: Date.now()
        }]);

        let accumulatedText = '';

        for await (const chunk of streamResult) {
            const chunkText = chunk.text;
            if (chunkText) {
                accumulatedText += chunkText;
                setMessages(prev => prev.map(msg => 
                    msg.id === botMessageId 
                    ? { ...msg, text: accumulatedText }
                    : msg
                ));
            }
        }
    } catch (error) {
        console.error("Error sending message:", error);
        setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: 'model',
            text: 'Sorry, I encountered an error connecting to the AI. Please try again.',
            timestamp: Date.now(),
            isError: true
        }]);
    } finally {
        setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
  };

  const activeFile = files.find(f => f.id === activeFileId) || null;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-200">
      {/* Mobile Toggle Buttons */}
      <div className="fixed top-2 left-2 z-50 md:hidden">
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 bg-slate-800 rounded-md border border-slate-700"
        >
          {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Sidebar */}
      <div className={`
        fixed md:relative z-40 h-full transition-all duration-300 ease-in-out
        ${isSidebarOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full md:w-0 md:translate-x-0 md:hidden'}
      `}>
        <FileExplorer
          files={files}
          activeFileId={activeFileId}
          onSelectFile={handleSelectFile}
          onCreateFile={handleCreateFile}
          onDeleteFile={handleDeleteFile}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full min-w-0">
        <CodeEditor
          file={activeFile}
          onUpdateContent={handleUpdateContent}
        />
      </div>

      {/* Chat Sidebar */}
      <div className={`
        fixed right-0 top-0 h-full z-40 bg-slate-900 border-l border-slate-800 transition-all duration-300
        ${isChatOpen ? 'w-96 translate-x-0' : 'w-0 translate-x-full'}
        hidden lg:block lg:relative lg:w-96
      `}>
         <ChatInterface
          messages={messages}
          isLoading={isLoading}
          onSendMessage={handleSendMessage}
          onClearChat={handleClearChat}
        />
      </div>
      
      {/* Mobile Chat Toggle (if we wanted to make chat collapsible on mobile, usually nice to have a tab system, keeping simple for now by hiding chat on very small screens or stacking) */}
      {/* For this simplified Responsive design, Chat is hidden on small screens < lg. 
          To make it truly responsive, we'd add a toggle for Chat vs Code on mobile. 
          Let's add a toggle for mobile to switch view. 
      */}
      <div className="fixed bottom-4 right-4 lg:hidden z-50">
        <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className="p-3 bg-blue-600 rounded-full shadow-lg text-white"
        >
            {isChatOpen ? <X size={24} /> : <div className="text-xs font-bold">AI</div>}
        </button>
      </div>
       <div className={`
        fixed inset-0 z-30 bg-slate-900 transition-transform duration-300 lg:hidden
        ${isChatOpen ? 'translate-y-0' : 'translate-y-full'}
        pt-12
      `}>
          {/* Close button for mobile chat overlay */}
          <button 
            onClick={() => setIsChatOpen(false)}
            className="absolute top-3 right-3 p-2 text-slate-400 hover:text-white"
          >
             <X size={24}/>
          </button>
          <ChatInterface
            messages={messages}
            isLoading={isLoading}
            onSendMessage={handleSendMessage}
            onClearChat={handleClearChat}
          />
      </div>
    </div>
  );
};

export default App;