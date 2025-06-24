'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageCircle, Send, Loader2, Sparkles } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export default function EmbeddedChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }

  useEffect(() => {
    // Only scroll if user is near the bottom of the chat container
    if (messagesEndRef.current) {
      const container = messagesEndRef.current.closest('.overflow-y-auto')
      if (container) {
        const { scrollTop, scrollHeight, clientHeight } = container
        const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100
        if (isNearBottom) {
          scrollToBottom()
        }
      }
    }
  }, [messages])

  useEffect(() => {
    // Add welcome message on component mount
    const welcomeMessage: Message = {
      id: 'welcome',
      role: 'assistant',
      content: 'Welcome to DT Exotics Las Vegas! I\'m your AI concierge, ready to help you find the perfect luxury supercar experience. Whether you\'re planning a bachelor party, birthday celebration, corporate event, or just want to cruise the Strip in style, I can provide instant quotes, availability, and recommendations. What can I help you with today?',
      timestamp: new Date()
    }
    setMessages([welcomeMessage])
  }, [])

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

  const quickQuestions = [
    "What supercars do you have available?",
    "Bachelor party packages?",
    "Pricing for a Ferrari rental?",
    "VIP concierge services?"
  ]

  const handleQuickQuestion = (question: string) => {
    setInputValue(question)
    inputRef.current?.focus()
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-16 h-16 rounded-full bg-neon-blue/20 border-2 border-neon-blue/50 flex items-center justify-center relative">
            <div className="absolute inset-0 rounded-full bg-neon-blue/10 blur-xl" />
            <MessageCircle className="w-8 h-8 text-neon-blue relative z-10" />
            <Sparkles className="w-4 h-4 text-neon-pink absolute -top-1 -right-1 animate-pulse" />
          </div>
        </div>
        <h2 className="text-3xl md:text-4xl font-tech font-black text-white mb-2">
          AI CONCIERGE <span className="neon-text">CHAT</span>
        </h2>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto">
          Get instant answers about our luxury supercars, packages, pricing, and VIP services. 
          Powered by advanced AI for immediate assistance.
        </p>
      </div>

      {/* Chat Container */}
      <div className="glass-panel bg-dark-metal/50 border border-gray-600/30 rounded-2xl overflow-hidden">
        {/* Messages */}
        <div className={`p-6 overflow-y-auto custom-scrollbar transition-all duration-300 ${
          messages.length === 1 ? 'h-96' : 'h-[480px]'
        }`}>
          <div className="space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-3 max-w-[85%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.role === 'user' 
                      ? 'bg-neon-pink/20 border border-neon-pink/50' 
                      : 'bg-neon-blue/20 border border-neon-blue/50'
                  }`}>
                    {message.role === 'user' ? (
                      <div className="w-6 h-6 bg-neon-pink rounded-full" />
                    ) : (
                      <MessageCircle className="w-5 h-5 text-neon-blue" />
                    )}
                  </div>

                  {/* Message */}
                  <div className={`p-4 rounded-2xl ${
                    message.role === 'user'
                      ? 'bg-gray-700/50 text-gray-100 border border-gray-600/30'
                      : 'bg-gray-700/50 text-gray-100 border border-gray-600/30'
                  }`}>
                    <div className="leading-relaxed text-sm prose prose-sm prose-invert max-w-none">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeHighlight]}
                        components={{
                          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                          ul: ({ children }) => <ul className="mb-2 pl-4 list-disc">{children}</ul>,
                          ol: ({ children }) => <ol className="mb-2 pl-4 list-decimal">{children}</ol>,
                          li: ({ children }) => <li className="mb-1">{children}</li>,
                          strong: ({ children }) => <strong className="text-neon-blue font-semibold">{children}</strong>,
                          em: ({ children }) => <em className="text-neon-pink italic">{children}</em>,
                          code: ({ children }) => <code className="bg-gray-800/50 px-1 py-0.5 rounded text-neon-green text-xs">{children}</code>,
                          pre: ({ children }) => <pre className="bg-gray-800/50 p-3 rounded-lg overflow-x-auto text-xs">{children}</pre>,
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                    <p className="text-xs mt-2 opacity-70 text-gray-400">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex gap-3 max-w-[85%]">
                  <div className="w-10 h-10 rounded-full bg-neon-blue/20 border border-neon-blue/50 flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="w-5 h-5 text-neon-blue" />
                  </div>
                  <div className="bg-gray-700/50 text-gray-100 border border-gray-600/30 p-4 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <Loader2 className="w-5 h-5 animate-spin text-neon-blue" />
                      <span className="text-sm">AI is thinking...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Quick Questions - Only show when needed */}
        {messages.length === 1 && (
          <div className="px-6 py-4 border-t border-gray-600/30">
            <p className="text-sm text-gray-400 mb-3">Quick questions to get started:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {quickQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickQuestion(question)}
                  className="text-left p-3 text-sm bg-gray-700/30 hover:bg-gray-700/50 border border-gray-600/30 hover:border-neon-blue/50 rounded-lg text-gray-300 hover:text-white transition-all duration-200"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-6 border-t border-gray-600/30 bg-dark-metal/80">
          <div className="flex items-end gap-3">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about vehicles, pricing, packages, or anything else..."
                className="w-full p-4 bg-gray-700/50 border border-gray-600/30 rounded-xl text-white placeholder-gray-400 text-sm resize-none focus:outline-none focus:border-neon-blue/50 focus:ring-2 focus:ring-neon-blue/20 transition-all duration-200"
                rows={1}
                style={{ minHeight: '52px', maxHeight: '120px' }}
                disabled={isLoading}
              />
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              className="w-14 h-14 bg-neon-blue hover:bg-neon-blue/80 disabled:bg-gray-600/50 disabled:cursor-not-allowed rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105 disabled:scale-100 hover:shadow-[0_0_20px_rgba(0,255,255,0.4)]"
            >
              <Send className="w-6 h-6 text-dark-gray" />
            </button>
          </div>
          
          {/* Footer */}
          <div className="flex items-center justify-end mt-4 pt-4 border-t border-gray-600/20">
            <p className="text-xs text-gray-500">
              For urgent needs: <a href="sms:+17027208948" className="text-neon-blue hover:underline">(702) 720-8948</a>
            </p>
          </div>
        </div>
      </div>

      {/* Custom scrollbar styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 255, 255, 0.3);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 255, 255, 0.5);
        }
      `}</style>
    </div>
  )
}