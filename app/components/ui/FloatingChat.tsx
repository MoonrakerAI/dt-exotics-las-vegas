'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Loader2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export default function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          conversationHistory: messages.map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        }),
      })

      const data = await response.json()

      if (data.success) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.message,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, assistantMessage])
      } else {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.error || 'Sorry, I encountered an error. Please text us at (702) 720-8948 for immediate assistance.',
          timestamp: new Date()
        }
        setMessages(prev => [...prev, errorMessage])
      }
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I\'m having trouble connecting right now. Please text us at (702) 720-8948 for immediate assistance with your luxury car rental needs.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const toggleChat = () => {
    setIsOpen(!isOpen)
    if (!isOpen && messages.length === 0) {
      // Add welcome message when first opened
      const welcomeMessage: Message = {
        id: 'welcome',
        role: 'assistant',
        content: 'Welcome to DT Exotics Las Vegas! I\'m here to help you with luxury supercar rentals, VIP experiences, and answer any questions about our services. How can I assist you today?',
        timestamp: new Date()
      }
      setMessages([welcomeMessage])
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Chat Window */}
      <div
        className={`absolute bottom-32 right-0 w-96 h-[500px] bg-dark-metal border-2 border-gray-600/30 rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-500 ease-in-out ${
          isOpen 
            ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto' 
            : 'opacity-0 scale-95 translate-y-4 pointer-events-none'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-600/30 bg-dark-metal">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-neon-blue/20 border border-neon-blue/50 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-neon-blue" />
            </div>
            <div>
              <h3 className="font-tech font-bold text-white text-sm">DT Exotics AI</h3>
              <p className="text-xs text-gray-400">Luxury Car Concierge</p>
            </div>
          </div>
          <button
            onClick={toggleChat}
            className="text-gray-400 hover:text-white transition-colors duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 p-4 h-[340px] overflow-y-auto custom-scrollbar bg-dark-metal">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg text-sm ${
                    message.role === 'user'
                      ? 'bg-neon-pink text-dark-gray font-medium'
                      : 'bg-gray-700/50 text-gray-100 border border-gray-600/30'
                  }`}
                >
                  <div className="leading-relaxed prose prose-sm prose-invert max-w-none">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeHighlight]}
                      components={{
                        p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
                        ul: ({ children }) => <ul className="mb-1 pl-3 list-disc">{children}</ul>,
                        ol: ({ children }) => <ol className="mb-1 pl-3 list-decimal">{children}</ol>,
                        li: ({ children }) => <li className="mb-0.5">{children}</li>,
                        strong: ({ children }) => <strong className="text-neon-blue font-semibold">{children}</strong>,
                        em: ({ children }) => <em className="text-neon-pink italic">{children}</em>,
                        code: ({ children }) => <code className="bg-gray-800/50 px-1 py-0.5 rounded text-neon-green text-xs">{children}</code>,
                        pre: ({ children }) => <pre className="bg-gray-800/50 p-2 rounded overflow-x-auto text-xs">{children}</pre>,
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                  <p className={`text-xs mt-1 opacity-70 ${
                    message.role === 'user' ? 'text-dark-gray/70' : 'text-gray-400'
                  }`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-700/50 text-gray-100 border border-gray-600/30 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-neon-blue" />
                    <span className="text-sm">Typing...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-600/30 bg-dark-metal">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about our supercars, packages, or VIP services..."
                className="w-full p-4 bg-gray-700/50 border border-gray-600/30 rounded-lg text-white placeholder-gray-400 text-sm resize-none focus:outline-none focus:border-neon-blue/50 focus:ring-1 focus:ring-neon-blue/50 transition-all duration-200"
                rows={3}
                style={{ minHeight: '80px', maxHeight: '140px' }}
                disabled={isLoading}
              />
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              className="w-12 h-12 bg-neon-blue hover:bg-neon-blue/80 disabled:bg-gray-600/50 disabled:cursor-not-allowed rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-105 disabled:scale-100 flex-shrink-0"
            >
              <Send className="w-5 h-5 text-dark-gray" />
            </button>
          </div>
        </div>
      </div>

      {/* Chat Toggle Button */}
      <button
        onClick={toggleChat}
        className={`w-16 h-16 bg-neon-blue hover:bg-neon-blue/80 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 group ${
          isOpen ? 'rotate-0' : 'hover:shadow-[0_0_25px_rgba(0,255,255,0.5)]'
        }`}
      >
        <div className={`transition-all duration-500 ${isOpen ? 'rotate-180 scale-0' : 'rotate-0 scale-100'}`}>
          <MessageCircle className="w-8 h-8 text-dark-gray" />
        </div>
        <div className={`absolute transition-all duration-500 ${isOpen ? 'rotate-0 scale-100' : 'rotate-180 scale-0'}`}>
          <X className="w-8 h-8 text-dark-gray" />
        </div>
        
        {/* Notification dot for when chat is closed and there are messages */}
        {!isOpen && messages.length > 0 && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-neon-pink rounded-full border-2 border-dark-gray animate-pulse" />
        )}
      </button>

      {/* Custom scrollbar styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 255, 255, 0.3);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 255, 255, 0.5);
        }
      `}</style>
    </div>
  )
}