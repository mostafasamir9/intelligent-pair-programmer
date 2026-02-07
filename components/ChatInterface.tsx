import React, { useState, useRef, useEffect } from 'react';
import { Message } from '../types';
import { Send, Bot, User, Loader2, Eraser } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface ChatInterfaceProps {
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (text: string) => void;
  onClearChat: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  messages, 
  isLoading, 
  onSendMessage,
  onClearChat
}) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border-l border-slate-700 w-96">
      <div className="p-4 border-b border-slate-700 bg-slate-800/50 flex justify-between items-center">
        <h2 className="text-slate-200 font-semibold flex items-center gap-2">
          <Bot size={20} className="text-green-400" />
          AI Assistant
        </h2>
        <button 
          onClick={onClearChat}
          className="text-slate-500 hover:text-slate-300 transition-colors p-1"
          title="Clear Chat"
        >
          <Eraser size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
        {messages.length === 0 && (
          <div className="text-center text-slate-500 mt-10">
            <Bot size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-sm">Ask me anything about your code!</p>
            <p className="text-xs mt-2 opacity-70">"Explain this function"</p>
            <p className="text-xs opacity-70">"Find bugs in file.py"</p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${
              msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                msg.role === 'user' ? 'bg-blue-600' : 'bg-green-600'
              }`}
            >
              {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>
            
            <div
              className={`max-w-[85%] rounded-lg p-3 text-sm overflow-hidden ${
                msg.role === 'user'
                  ? 'bg-blue-600/10 border border-blue-600/20 text-blue-100'
                  : 'bg-slate-800 border border-slate-700 text-slate-200'
              }`}
            >
              {msg.role === 'user' ? (
                <div className="whitespace-pre-wrap">{msg.text}</div>
              ) : (
                <div className="prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown
                    components={{
                      code({ node, inline, className, children, ...props }: any) {
                        const match = /language-(\w+)/.exec(className || '');
                        return !inline && match ? (
                          <SyntaxHighlighter
                            style={vscDarkPlus}
                            language={match[1]}
                            PreTag="div"
                            {...props}
                          >
                            {String(children).replace(/\n$/, '')}
                          </SyntaxHighlighter>
                        ) : (
                          <code className={`${className} bg-slate-700 px-1 rounded`} {...props}>
                            {children}
                          </code>
                        );
                      }
                    }}
                  >
                    {msg.text}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {isLoading && (
            <div className="flex items-center gap-2 text-slate-500 text-xs ml-11">
                <Loader2 size={12} className="animate-spin" />
                Thinking...
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-slate-700 bg-slate-800/30">
        <form onSubmit={handleSubmit} className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="w-full bg-slate-950 text-slate-200 rounded-lg pl-4 pr-12 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none h-14 scrollbar-hide"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-blue-500 hover:text-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={18} />
          </button>
        </form>
        <div className="text-[10px] text-slate-600 mt-2 text-center">
            Shift + Enter for new line
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;