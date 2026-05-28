import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { apiFetch, jsonRequestOptions } from "../../api/client";

const AiChatPopup = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const textareaRef = useRef(null);

    useEffect(() => {
        if (!isOpen) {
            return undefined;
        }

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [isOpen]);

    const toggleChat = () => {
        setIsOpen(!isOpen);
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

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
        const nextMessages = [...messages, { role: 'user', text: userMessage }];
        setMessages(nextMessages);
        setMessage('');
        setIsLoading(true);

        try {
            const response = await apiFetch(
                '/ai/ask',
                jsonRequestOptions('POST', nextMessages)
            );
            if (!response.ok) {
                const errorText = await response.text().catch(() => 'Невідома помилка');
                throw new Error(`Сервер повернув ${response.status}: ${errorText}`);
            }
            const data = await response.text();
            setMessages(prev => [...prev, { role: 'model', text: data }]);
        } catch (error) {
            console.error('Error fetching AI response:', error);
            const errorMessage = error.message.includes('Cannot reach server') 
                ? 'Сервер недоступний. Переконайтеся, що backend запущений на порту 9000.'
                : `Сталася помилка: ${error.message}`;
            setMessages(prev => [...prev, { role: 'model', text: errorMessage }]);
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
    const popupPanelClasses = [
        'ami-elevated',
        'flex',
        'min-h-0',
        'origin-bottom-right',
        'animate-[ami-popover-enter_var(--motion-standard)_var(--motion-ease-out)_both]',
        'flex-col',
        'overflow-hidden',
        'border',
        'border-border',
        'bg-white',
        'shadow-[0_24px_60px_rgba(15,23,42,0.22)]',
        'w-[min(24rem,calc(100vw-1.5rem))]',
        'max-h-[min(38rem,calc(100dvh-7rem))]',
        'rounded-[22px]',
        'sm:w-[min(24rem,calc(100vw-2.5rem))]',
        'sm:max-h-[min(42rem,calc(100dvh-8rem))]',
        'sm:rounded-[22px]',
        'max-[640px]:fixed',
        'max-[640px]:inset-x-0',
        'max-[640px]:bottom-0',
        'max-[640px]:w-full',
        'max-[640px]:max-h-[88dvh]',
        'max-[640px]:rounded-b-none',
        'max-[640px]:rounded-t-[28px]',
    ].join(' ');

    return (
        <div className="fixed bottom-4 right-4 z-1000 sm:bottom-5 sm:right-5">
            {isOpen && (
                <div className="fixed inset-0 z-1000 bg-ink/35 backdrop-blur-[2px] max-[640px]:bg-ink/45" onClick={toggleChat}>
                    <div className="flex h-full items-end justify-center p-2 sm:items-end sm:justify-end sm:p-4" onClick={(event) => event.stopPropagation()}>
                        <div className={popupPanelClasses} role="dialog" aria-modal="true" aria-label="ШІ-помічник">
                            <div className="flex items-start justify-between gap-3 border-b border-border bg-[#007bff] px-4 py-4 text-white sm:px-4 sm:py-4">
                                <div className="min-w-0">
                                    <div className="mb-3 hidden h-1.5 w-12 rounded-full bg-white/40 max-[640px]:block" aria-hidden="true" />
                                    <h3 className="m-0 text-[17px] font-extrabold tracking-[-0.02em] text-white sm:text-[18px]">
                                        ШІ-помічник
                                    </h3>
                                    <p className="m-0 mt-1 hidden text-[12px]/4 font-medium text-white/85 max-[640px]:block">
                                        Поради, пояснення та швидкі відповіді прямо тут
                                    </p>
                                </div>
                                <button type="button" className="grid size-10 shrink-0 place-items-center rounded-full border border-white/20 bg-white/10 text-[24px] leading-none text-white cursor-pointer transition hover:bg-white/20 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-white" onClick={toggleChat} aria-label="Закрити чат">
                                    ×
                                </button>
                            </div>
                            <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto bg-[#f8f9fa] p-3.5 sm:p-4">
                        {messages.length === 0 && (
                            <div className="mt-4 rounded-[18px] border border-[#dbe3ef] bg-white px-4 py-3 text-center italic text-[#667085] shadow-[0_4px_12px_rgba(15,23,42,0.04)]">
                                Вітання! Як я можу вам сьогодні допомогти?
                            </div>
                        )}
                        {messages.map((msg, index) => (
                            <div
                                key={index}
                                className={`${bubbleClasses} ${msg.role === 'user' ? 'self-end rounded-br-[5px] bg-[#007bff] text-white' : 'self-start rounded-bl-[5px] bg-[#e9ecef] text-[#333]'}`}
                            >
                                {msg.role === 'model' ? (
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
                        <form className="flex items-end gap-2 border-t border-[#dbe3ef] bg-white p-3.5 sm:p-4" onSubmit={handleSendMessage}>
                            <textarea
                                ref={textareaRef}
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Поставте запитання..."
                                disabled={isLoading}
                                rows={1}
                                className="min-h-11 max-h-32 flex-1 resize-none overflow-y-auto rounded-[18px] border border-[#dbe3ef] bg-white px-3 py-2.5 text-[0.95rem] leading-[1.4] outline-none transition-colors duration-200 placeholder:text-[#94a3b8] focus:border-[#007bff]"
                            />
                            <button
                                type="submit"
                                disabled={isLoading || !message.trim()}
                                className="flex size-11 shrink-0 items-center justify-center rounded-full border-0 bg-[#007bff] text-white transition-colors duration-200 hover:bg-[#0056b3] disabled:cursor-not-allowed disabled:bg-[#ccc]"
                                aria-label="Надіслати повідомлення"
                            >
                                ➤
                            </button>
                        </form>
                        </div>
                    </div>
                </div>
            )}
            <button
                type="button"
                className="flex size-15 items-center justify-center rounded-full border-0 bg-[#007bff] text-white shadow-[0_10px_24px_rgba(15,23,42,0.2)] transition-transform duration-200 ease-out hover:scale-105 hover:bg-[#0056b3] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#007bff]"
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
