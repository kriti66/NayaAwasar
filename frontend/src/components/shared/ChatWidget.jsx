import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

// Predefined knowledge base for the AI Assistant
const faqs = [
    {
        keywords: ['apply', 'job', 'application'],
        reply: "To apply for a job, navigate to 'Find Jobs', select a job you're interested in, and click the 'Apply Now' button. Make sure your profile and CV are up to date!"
    },
    {
        keywords: ['profile', 'complete', 'update'],
        reply: "You can update or complete your profile by navigating to your Dashboard and selecting the 'Profile' section. Filling out your skills, education, and experience will help you get better job recommendations."
    },
    {
        keywords: ['cv', 'resume', 'upload'],
        reply: "To upload your CV, go to your Profile dashboard. There is a section dedicated to document uploads where you can safely upload a PDF version of your latest resume."
    },
    {
        keywords: ['status', 'check', 'my applications'],
        reply: "You can check your application statuses by going to 'My Applications' from your dashboard. It will show if your application is Pending, Reviewed, Accepted, or Rejected."
    },
    {
        keywords: ['kyc', 'verification', 'recruiter kyc', 'company'],
        reply: "KYC verification is required to ensure trust and safety. Job seekers provide basic ID details, and recruiters provide company registration docs. You can check your KYC status in the dashboard sidebar."
    },
    {
        keywords: ['password', 'forgot', 'reset'],
        reply: "If you forgot your password, go to the Login page and click 'Forgot password?'. We will send a 6-digit OTP to your registered email to help you set a new password safely."
    },
    {
        keywords: ['interview', 'schedule', 'call', 'meeting'],
        reply: "If you're shortlisted, recruiters can schedule an interview. You will receive an email and an in-app notification with the date, time, and link to join the built-in video call."
    },
    {
        keywords: ['hello', 'hi', 'hey'],
        reply: "Hello! I am Naya Awasar Assistant. How can I help you navigate the portal today?"
    },
    {
        keywords: ['thank', 'thanks'],
        reply: "You're very welcome! Let me know if you need anything else to succeed on Naya Awasar."
    }
];

const quickActions = [
    { label: 'Find Jobs', action: 'find_jobs' },
    { label: 'Complete Profile', action: 'profile' },
    { label: 'Upload CV', action: 'cv' },
    { label: 'My Applications', action: 'applications' },
    { label: 'KYC Help', action: 'kyc' },
];

const ChatWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef(null);
    const navigate = useNavigate();
    const location = useLocation();

    // Check if the route is admin, where we might not want the chat widget, or maybe we do.
    const isAdminRoute = location.pathname.startsWith('/admin');

    // Load persisted messages from localStorage on mount
    useEffect(() => {
        try {
            const savedMessages = localStorage.getItem('naya_awasar_chat_history');
            if (savedMessages) {
                setMessages(JSON.parse(savedMessages));
            } else {
                // Initial welcome message
                setMessages([
                    { sender: 'bot', text: 'Hi there! I am the Naya Awasar Assistant. How can I help you today?' }
                ]);
            }
        } catch (error) {
            console.error('Failed to load chat history', error);
        }
    }, []);

    // Persist messages whenever they change
    useEffect(() => {
        try {
            if (messages.length > 0) {
                localStorage.setItem('naya_awasar_chat_history', JSON.stringify(messages));
            }
        } catch (error) {
            console.error('Failed to save chat history', error);
        }
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const toggleChat = () => setIsOpen(!isOpen);

    const matchIntent = (text) => {
        const lowerText = text.toLowerCase();
        for (let faq of faqs) {
            if (faq.keywords.some(kw => lowerText.includes(kw))) {
                return faq.reply;
            }
        }
        return "I'm still learning and connecting to the backend! For now, I didn't quite catch that. Try asking about jobs, KYC, CV uploads, or profiles.";
    };

    const handleSendMessage = (textOverride) => {
        const text = textOverride || inputValue.trim();
        if (!text) return;

        // Add user message
        const newMessages = [...messages, { sender: 'user', text }];
        setMessages(newMessages);
        setInputValue('');

        // Simulate thinking delay and respond
        setTimeout(() => {
            const reply = matchIntent(text);
            setMessages(prev => [...prev, { sender: 'bot', text: reply }]);
        }, 600);
    };

    const handleQuickAction = (action) => {
        switch (action) {
            case 'find_jobs':
                navigate('/jobs');
                handleSendMessage("How do I find jobs?");
                break;
            case 'profile':
                handleSendMessage("How do I complete my profile?");
                setTimeout(() => navigate('/seeker/profile'), 1500);
                break;
            case 'cv':
                handleSendMessage("How do I upload my CV?");
                setTimeout(() => navigate('/seeker/profile'), 1500);
                break;
            case 'applications':
                handleSendMessage("How do I check my applications?");
                setTimeout(() => navigate('/seeker/applications'), 1500);
                break;
            case 'kyc':
                handleSendMessage("How does KYC work?");
                setTimeout(() => navigate('/kyc'), 1500);
                break;
            default:
                break;
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSendMessage();
        }
    };
    
    const clearHistory = () => {
        localStorage.removeItem('naya_awasar_chat_history');
        setMessages([{ sender: 'bot', text: 'Chat history cleared. How can I assist you?' }]);
    };

    if (isAdminRoute) return null; // Optionally hide for admins

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {/* Chatbox Panel */}
            <div 
                className={`transition-all duration-300 ease-in-out transform origin-bottom-right mb-4 bg-white rounded-2xl shadow-2xl border border-gray-100 w-[350px] sm:w-[380px] max-h-[600px] flex flex-col overflow-hidden ${
                    isOpen ? 'scale-100 opacity-100 pointer-events-auto' : 'scale-75 opacity-0 pointer-events-none absolute'
                }`}
                style={{ height: '550px' }}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-[#29a08e] to-[#228377] p-4 flex justify-between items-center text-white shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm">
                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="font-bold text-sm tracking-wide">Naya Awasar Assistant</h3>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                                <span className="text-xs text-white/80 font-medium">Online</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={clearHistory} className="text-white/80 hover:text-white transition-colors" title="Clear Chat">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                        <button onClick={toggleChat} className="text-white/80 hover:text-white transition-colors">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Messages Body */}
                <div className="flex-1 p-4 overflow-y-auto bg-gray-50 flex flex-col gap-4">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div 
                                className={`max-w-[85%] rounded-2xl p-3 text-sm shadow-sm ${
                                    msg.sender === 'user' 
                                        ? 'bg-[#29a08e] text-white rounded-tr-none' 
                                        : 'bg-white text-gray-700 border border-gray-100 rounded-tl-none'
                                }`}
                            >
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    
                    {/* Quick Actions (only show at bottom after bot message occasionally or always at start) */}
                    {messages.length < 5 && messages[messages.length - 1]?.sender === 'bot' && (
                        <div className="flex flex-wrap gap-2 mt-2">
                            {quickActions.map((action, idx) => (
                                <button 
                                    key={idx}
                                    onClick={() => handleQuickAction(action.action)}
                                    className="text-xs border border-[#29a08e]/30 bg-white text-[#29a08e] hover:bg-[#29a08e]/5 px-3 py-1.5 rounded-full transition-colors font-medium cursor-pointer"
                                >
                                    {action.label}
                                </button>
                            ))}
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-3 bg-white border-t border-gray-100 shrink-0">
                    <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-full pr-1.5 pl-4 py-1.5 focus-within:ring-2 focus-within:ring-[#29a08e]/20 focus-within:border-[#29a08e] transition-all">
                        <input 
                            type="text" 
                            className="flex-1 bg-transparent border-none focus:outline-none text-sm py-1 placeholder-gray-400"
                            placeholder="Type your question..."
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                        />
                        <button 
                            onClick={() => handleSendMessage()}
                            disabled={!inputValue.trim()}
                            className="bg-[#29a08e] text-white p-2 rounded-full hover:bg-[#228377] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0 flex items-center justify-center shadow-md shadow-[#29a08e]/20"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                        </button>
                    </div>
                    <div className="text-center mt-2.5">
                       <span className="text-[10px] text-gray-400 font-medium">Powered by Naya Awasar AI</span>
                    </div>
                </div>
            </div>

            {/* Floating Toggle Button */}
            <button
                onClick={toggleChat}
                className={`bg-[#29a08e] text-white p-4 rounded-full shadow-xl shadow-[#29a08e]/30 hover:bg-[#228377] transform hover:scale-105 transition-all duration-300 flex items-center justify-center z-50 ${isOpen ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'}`}
                aria-label="Open support chat"
            >
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
            </button>
            <button
                onClick={toggleChat}
                className={`absolute bg-white text-[#29a08e] border border-gray-100 p-4 rounded-full shadow-lg hover:bg-gray-50 transform hover:scale-105 transition-all duration-300 flex items-center justify-center z-50 ${isOpen ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'}`}
                aria-label="Close support chat"
            >
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    );
};

export default ChatWidget;
