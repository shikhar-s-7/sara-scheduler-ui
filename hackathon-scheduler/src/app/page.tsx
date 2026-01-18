'use client';

import { useState, useEffect, useRef } from 'react';

export default function TaskScheduler() {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Hello, I’m Sara. How can I help you schedule your week?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState('');
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
        setUserEmail(data.email);
        setCalendarId(data.calendarId || data.email);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    }
  };

  const handleGoogleLogin = async () => {
    window.location.href = '/api/auth/google';
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setIsAuthenticated(false);
    setUserEmail('');
    setCalendarId('');
    window.location.href = '/';
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const response = await fetch('/api/query/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userMessage, timezone: userTimezone })
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

  // --- LOGIN SCREEN (Red-Orange Theme) ---
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#1a1918] text-white font-sans">
        <div className="w-full max-w-md p-8 text-center animate-fade-in-up">
          <div className="mb-8">
            {/* Red to Orange Gradient Title */}
            <h1 className="text-5xl font-medium mb-4 bg-gradient-to-r from-[#FF512F] to-[#F09819] text-transparent bg-clip-text inline-block">
              Hello, User
            </h1>
            <h2 className="text-3xl font-medium text-[#c4c7c5] mb-8">
              Ready to organize your day?
            </h2>
          </div>
          
          <button
            onClick={handleGoogleLogin}
            className="group relative inline-flex items-center justify-center gap-3 bg-[#1e1f20] hover:bg-[#28292a] border border-[#444746] text-[#e3e3e3] px-8 py-4 rounded-full transition-all duration-200 shadow-lg hover:shadow-xl w-full max-w-sm"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="text-lg font-medium">Sign in with Google</span>
          </button>
          
          <p className="text-xs text-[#8e918f] mt-8 fixed bottom-8 left-0 right-0">
            Sara is an AI scheduler and may make mistakes. Please verify your calendar.
          </p>
        </div>
      </div>
    );
  }

  // --- MAIN APP INTERFACE (Red-Orange Theme) ---
  return (
    <div className="flex h-screen overflow-hidden bg-[#131314] text-[#e3e3e3] font-sans">

      {/* LEFT: Chat Area */}
      <div className="w-[450px] flex flex-col border-r border-[#444746] bg-[#1e1f20]">
        
        {/* Header */}
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#c4c7c5]">
            {/* Red-Orange Gradient Text */}
            <span className="font-semibold text-xl tracking-tight bg-gradient-to-r from-[#FF512F] to-[#F09819] text-transparent bg-clip-text">Sara</span>
            <span className="text-xs bg-[#444746] px-2 py-0.5 rounded text-[#e3e3e3]">Beta</span>
          </div>
          <button 
            onClick={handleLogout}
            className="text-sm text-[#F09819] hover:bg-[#3d2c1e] px-3 py-1.5 rounded-full transition-colors"
          >
            Sign out
          </button>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-[#444746] scrollbar-track-transparent">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] ${msg.role === 'user' ? 'bg-[#2b2c2d] rounded-2xl rounded-tr-sm' : ''} p-4`}>
                {msg.role === 'assistant' && (
                  <div className="flex items-center gap-2 mb-2">
                     {/* Sara Icon with Red-Orange Gradient */}
                     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="url(#sara-gradient-warm)" className="w-5 h-5 animate-pulse">
                        <defs>
                            <linearGradient id="sara-gradient-warm" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#FF512F" />
                                <stop offset="100%" stopColor="#F09819" />
                            </linearGradient>
                        </defs>
                        <path d="M9 21.035l3-9.617 3 9.617 9.617-3-9.617-3-3-9.617-3 9.617-9.617 3 9.617 3z" />
                     </svg>
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
                <div className="max-w-[85%] p-4">
                  <div className="flex items-center gap-2 mb-2">
                     <span className="font-medium text-sm text-[#F09819]">Sara</span>
                  </div>
                  <div className="h-4 bg-[#444746] rounded w-24"></div>
                </div>
             </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Floating Input Area */}
        <div className="p-4 pb-6">
          <div className="relative bg-[#1e1f20] rounded-full border border-[#444746] focus-within:border-[#F09819] focus-within:bg-[#2b2c2d] transition-all duration-200">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSend()}
              placeholder="Ask Sara to schedule..."
              className="w-full bg-transparent text-[#e3e3e3] placeholder-[#8e918f] px-6 py-4 pr-14 rounded-full focus:outline-none"
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="absolute right-2 top-2 p-2 rounded-full hover:bg-[#444746] text-[#c4c7c5] disabled:opacity-50 transition-colors"
            >
              <svg className="w-6 h-6 transform rotate-90" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </div>
          <p className="text-center text-[11px] text-[#8e918f] mt-3">
            Sara can make mistakes, so double-check your schedule.
          </p>
        </div>
      </div>

      {/* RIGHT: Calendar Area (Dark Mode Forced) */}
      <div className="flex-1 bg-[#131314] flex flex-col p-2">
        <div className="flex-1 bg-white rounded-2xl overflow-hidden shadow-lg border border-[#444746] relative filter invert hue-rotate-180">
          {calendarId ? (
            <iframe
              key={calendarId}
              src={`https://calendar.google.com/calendar/embed?src=${encodeURIComponent(calendarId.split('&')[0])}&ctz=Asia%2FKolkata&mode=MONTH&showTitle=0&showNav=1&showPrint=0&showTabs=1&bgcolor=%23ffffff`}
              style={{ border: 0, width: '100%', height: '100%' }}
              frameBorder="0"
              scrolling="no"
              className="absolute inset-0"
            />
          ) : (
             <div className="flex items-center justify-center h-full text-[#8e918f] filter invert hue-rotate-180">
                Loading Calendar...
             </div>
          )}
        </div>
      </div>

    </div>
  );
}
