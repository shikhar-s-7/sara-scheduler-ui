'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

export default function TaskScheduler() {
  // --- Chat & Auth State ---
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Hello, I’m Sara. How can I help you schedule your week?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // AUTH STATES
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [calendarId, setCalendarId] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/status');
      const data = await response.json();
      
      if (data.authenticated) {
        setIsAuthenticated(true);
        setCalendarId(data.calendarId || data.email);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  const handleGoogleLogin = async () => {
    window.location.href = '/api/auth/google';
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setIsAuthenticated(false);
    window.location.href = '/';
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMessage = input;
    setInput('');

    const updatedMessages = [...messages, { role: 'user', text: userMessage }];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      const response = await fetch('/api/query/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            messages: updatedMessages, 
            timezone: userTimezone 
        })
      });

      const result = await response.json();

      if (result.response) {
        setMessages(prev => [...prev, { role: 'assistant', text: result.response }]);
        setCalendarId(prev => {
            if (!prev) return prev;
            const baseId = prev.split('&refresh=')[0];
            return `${baseId}&refresh=${Date.now()}`;
        });
      } else {
        setMessages(prev => [...prev, { role: 'assistant', text: "I didn't get a response." }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Connection error. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  // --- 1. LOADING SCREEN ---
  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#000000] text-white">
        <div className="animate-pulse flex flex-col items-center gap-4">
           <span className="font-medium text-2xl bg-gradient-to-r from-[#FF512F] to-[#F09819] text-transparent bg-clip-text">Sara</span>
           <div className="text-[#8e918f] text-sm">Loading your workspace...</div>
        </div>
      </div>
    );
  }

  // --- 2. LOGIN SCREEN (REDESIGNED) ---
  if (!isAuthenticated) {
    return (
      <div className="flex h-screen bg-[#060606] text-white font-sans overflow-hidden items-center justify-center relative">
        {/* Subtle glow effect for aesthetics */}
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-[#FF512F]/10 rounded-full blur-[120px]" />
        
        <div className="w-full max-w-6xl mx-auto px-8 grid grid-cols-1 md:grid-cols-2 gap-16 items-center z-10">
          
          {/* LEFT SIDE: Big Brand Title */}
          <div className="flex flex-col items-start space-y-4 animate-fade-in-up">
            <h1 className="text-9xl font-extrabold tracking-tighter bg-gradient-to-r from-[#FF512F] to-[#F09819] text-transparent bg-clip-text leading-none">
              SARA
            </h1>
            <p className="text-xl md:text-2xl text-[#e3e3e3] font-light max-w-lg leading-relaxed border-l-4 border-[#F09819] pl-6 mt-4">
              AI-Powered Personal Planning & Scheduling Agent
            </p>
          </div>

          {/* RIGHT SIDE: Explanation & Action */}
          <div className="flex flex-col items-start space-y-10 md:pl-12 md:border-l border-[#27272a] animate-fade-in-up" style={{ animationDelay: '150ms' }}>
            <div className="space-y-4">
               <h3 className="text-xl font-semibold text-[#e3e3e3]">Your time, optimized.</h3>
               <p className="text-lg text-[#8e918f] leading-relaxed max-w-md">
                 Sara is not just a calendar. She connects with your Google account to intelligently organize your day, resolve conflicts, and plan your week through simple conversation.
               </p>
            </div>
            
            <button 
              onClick={handleGoogleLogin} 
              className="group relative inline-flex items-center gap-4 bg-[#e3e3e3] hover:bg-white text-black px-8 py-4 rounded-full transition-all duration-200 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] font-medium text-lg w-full md:w-auto justify-center"
            >
               <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10 5.35 0 9.25-3.67 9.25-9.09 0-1.15-.15-1.81-.15-1.81z"/></svg>
               Sign in with Google
               <span className="absolute right-6 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all">→</span>
            </button>
          </div>

        </div>
      </div>
    );
  }

  // --- 3. MAIN APP INTERFACE ---
  return (
    <div className="flex h-screen overflow-hidden bg-[#000000] text-[#e3e3e3] font-sans">

      {/* LEFT: Chat Area */}
      <div className="w-[40%] flex flex-col border-r border-[#27272a] bg-[#060606]">
        
        {/* Header */}
        <div className="p-4 flex items-center justify-between bg-[#060606] z-20 relative border-b border-[#27272a]">
          <div className="flex items-center gap-2">
             <div className="flex items-center gap-2 text-[#c4c7c5]">
               <span className="font-semibold text-xl tracking-tight bg-gradient-to-r from-[#FF512F] to-[#F09819] text-transparent bg-clip-text">Sara</span>
               <span className="text-xs bg-[#27272a] border border-[#333] px-2 py-0.5 rounded text-[#e3e3e3]">Beta</span>
             </div>
          </div>
          
          <div className="flex items-center gap-3">
             <Link 
               href="/upcoming" 
               className="text-sm text-[#8e918f] hover:text-[#e3e3e3] hover:bg-[#1a1a1a] px-3 py-1.5 rounded-full transition-colors flex items-center gap-2"
             >
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
               Upcoming
             </Link>
             
             <button 
                onClick={handleLogout}
                className="text-sm text-[#8e918f] hover:text-[#e3e3e3] hover:bg-[#1a1a1a] px-3 py-1.5 rounded-full transition-colors"
             >
                Sign out
             </button>
          </div>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div 
                className={`max-w-[85%] p-4 
                  ${msg.role === 'user' 
                    // USER: Translucent lighter grey
                    ? 'bg-[#27272a]/50 backdrop-blur-md border border-[#3f3f46]/50 rounded-2xl rounded-tr-sm' 
                    // SARA: Solid dark grey
                    : 'bg-[#1a1a1a] border border-[#27272a] rounded-2xl rounded-tl-sm' 
                  }`}
              >
                {msg.role === 'assistant' && (
                  <div className="flex items-center gap-2 mb-2">
                     <span className="font-medium text-sm bg-gradient-to-r from-[#FF512F] to-[#F09819] text-transparent bg-clip-text">Sara</span>
                  </div>
                )}
                <p className="text-[15px] leading-7 text-[#e3e3e3] whitespace-pre-wrap">
                  {msg.text}
                </p>
              </div>
            </div>
          ))}
          
          {isLoading && (
             <div className="flex justify-start animate-pulse">
                <div className="max-w-[85%] p-4 bg-[#1a1a1a] border border-[#27272a] rounded-2xl rounded-tl-sm">
                  <div className="flex items-center gap-2 mb-2">
                     <span className="font-medium text-sm text-[#F09819]">Sara</span>
                  </div>
                  <div className="h-4 bg-[#27272a] rounded w-24"></div>
                </div>
             </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 pb-6">
          <div className="relative bg-[#060606] rounded-full border border-[#27272a] focus-within:border-[#F09819] focus-within:bg-[#060606] transition-all duration-200">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSend()}
              placeholder="Ask Sara to schedule..."
              className="w-full bg-transparent text-[#e3e3e3] placeholder-[#666] px-6 py-4 pr-14 rounded-full focus:outline-none"
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="absolute right-2 top-2 p-2 rounded-full hover:bg-[#1a1a1a] text-[#c4c7c5] disabled:opacity-50 transition-colors"
            >
              <svg className="w-6 h-6 transform rotate-90" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

     {/* RIGHT: Calendar Area (60%) */}
    <div className="w-[60%] bg-[#000000] flex flex-col p-2">
      <div className="flex-1 rounded-2xl overflow-hidden shadow-lg border border-[#27272a] relative">
        {calendarId ? (
          <iframe
            key={calendarId}
            src={`https://calendar.google.com/calendar/embed?src=${encodeURIComponent(calendarId.split('&')[0])}&ctz=Asia%2FKolkata&mode=MONTH&showTitle=0&showNav=1&showPrint=0&showTabs=1&bgcolor=%23ececeb`}
            style={{ 
                border: 0, 
                width: '100%', 
                height: '100%',
                filter: 'invert(1) contrast(0.95) saturate(0.8)'
            }}
            frameBorder="0"
            scrolling="no"
            className="absolute inset-0"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-[#8e918f]">
              Loading Calendar...
          </div>
        )}
      </div>
    </div>

    </div>
  );
}