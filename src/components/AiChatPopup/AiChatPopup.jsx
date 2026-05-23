import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { apiFetch, apiGet } from "../../api/client";

const AiChatPopup = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [chatHistory, setChatHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const textareaRef = useRef(null);

    const toggleChat = () => {
        setIsOpen(!isOpen);
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [chatHistory, isOpen]);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`; // Limit max height
        }
    }, [message]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!message.trim()) return;

        const userMessage = message;
        setChatHistory(prev => [...prev, { type: 'user', text: userMessage }]);
        setMessage('');
        setIsLoading(true);

        try {
            const response = await apiFetch(`/ai/ask?message=${encodeURIComponent(userMessage)}`);
            if (!response.ok) {
                const errorText = await response.text().catch(() => 'Невідома помилка');
                throw new Error(`Сервер повернув ${response.status}: ${errorText}`);
            }
            const data = await response.text();
            setChatHistory(prev => [...prev, { type: 'bot', text: data }]);
        } catch (error) {
            console.error('Error fetching AI response:', error);
            const errorMessage = error.message.includes('Cannot reach server') 
                ? 'Сервер недоступний. Переконайтеся, що backend запущений на порту 9000.'
                : `Сталася помилка: ${error.message}`;
            setChatHistory(prev => [...prev, { type: 'bot', text: errorMessage }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage(e);
        }
    };

    const bubbleClasses = 'max-w-[80%] rounded-[15px] px-3.5 py-2.5 text-[0.95rem] leading-[1.4] break-words';
    const markdownClasses = 'prose prose-sm max-w-none prose-p:my-0 prose-p:mb-[0.6rem] prose-p:last:mb-0 prose-headings:my-0 prose-headings:mb-2 prose-headings:leading-[1.2] prose-headings:text-inherit prose-ul:my-[0.4rem] prose-ol:my-[0.4rem] prose-ul:pl-[1.2rem] prose-ol:pl-[1.2rem] prose-li:my-0 prose-strong:font-bold prose-strong:text-inherit';

    return (
        <div className="fixed bottom-5 right-5 z-1000">
            {isOpen && (
                <div className="absolute bottom-20 right-0 flex h-125 w-87.5 origin-bottom-right animate-[ami-popover-enter_var(--motion-standard)_var(--motion-ease-out)_both] flex-col overflow-hidden rounded-[10px] bg-white shadow-[0_5px_15px_rgba(0,0,0,0.2)]">
                    <div className="flex items-center justify-between bg-[#007bff] px-3.75 py-3.75 text-white">
                        <h3 className="m-0 text-[18px] font-extrabold tracking-[-0.02em] text-white">
                            ШІ-помічник
                        </h3>
                        <button type="button" className="border-0 bg-transparent text-[24px] leading-none text-white cursor-pointer" onClick={toggleChat} aria-label="Закрити чат">
                            ×
                        </button>
                    </div>
                    <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto bg-[#f8f9fa] p-3.75">
                        {chatHistory.length === 0 && (
                            <div className="mt-5 text-center italic text-[#888]">
                                Вітання! Як я можу вам сьогодні допомогти?
                            </div>
                        )}
                        {chatHistory.map((msg, index) => (
                            <div
                                key={index}
                                className={`${bubbleClasses} ${msg.type === 'user' ? 'self-end rounded-br-[5px] bg-[#007bff] text-white' : 'self-start rounded-bl-[5px] bg-[#e9ecef] text-[#333]'}`}
                            >
                                {msg.type === 'bot' ? (
                                    <div className={markdownClasses}>
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                                    </div>
                                ) : (
                                    msg.text
                                )}
                            </div>
                        ))}
                        {isLoading && <div className={`${bubbleClasses} self-start rounded-bl-[5px] bg-[#e9ecef] text-[#333]`}>Набираю...</div>}
                        <div ref={messagesEndRef} />
                    </div>
                    <form className="flex gap-2.5 border-t border-[#ddd] bg-white p-3.75" onSubmit={handleSendMessage}>
                        <textarea
                            ref={textareaRef}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Поставте запитання..."
                            disabled={isLoading}
                            rows={1}
                            className="min-h-11 max-h-30 flex-1 resize-none overflow-y-auto rounded-[20px] border border-[#ddd] px-2.5 py-2.5 text-[0.95rem] leading-[1.4] outline-none transition-colors duration-200 placeholder:text-[#94a3b8] focus:border-[#007bff]"
                        />
                        <button
                            type="submit"
                            disabled={isLoading || !message.trim()}
                            className="flex size-10 items-center justify-center rounded-full border-0 bg-[#007bff] text-white transition-colors duration-200 hover:bg-[#0056b3] disabled:cursor-not-allowed disabled:bg-[#ccc]"
                            aria-label="Надіслати повідомлення"
                        >
                            ➤
                        </button>
                    </form>
                </div>
            )}
            <button
                type="button"
                className="flex size-15 items-center justify-center rounded-full border-0 bg-[#007bff] text-white shadow-[0_4px_8px_rgba(0,0,0,0.2)] transition-transform duration-200 ease-out hover:scale-105 hover:bg-[#0056b3]"
                onClick={toggleChat}
                aria-label={isOpen ? 'Закрити AI-помічник' : 'Відкрити AI-помічник'}
            >
                {isOpen ? (
                    <svg className="block size-8.5 shrink-0 stroke-current fill-none" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                        <path d="M7 7l10 10" />
                        <path d="M17 7L7 17" />
                    </svg>
                ) : (
                    <svg className="block size-8.5 shrink-0 stroke-current fill-none" width="90" height="50" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#000000">
                        <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                        <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
                        <g id="SVGRepo_iconCarrier">
                            <path d="M12.01 19V9M12.01 5H12" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
                        </g>
                    </svg>
                )}
            </button>
        </div>
    );
};

export default AiChatPopup;
