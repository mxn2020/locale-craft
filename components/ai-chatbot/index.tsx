import React, { useState, useEffect, useRef } from 'react'
import { MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

export function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! How can I help you today?', timestamp: new Date() }
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const { t } = useTranslation()
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim()) {
      const userMessage = { role: 'user', content: input, timestamp: new Date() }
      setMessages(prev => [...prev, userMessage])
      setInput('')
      setIsTyping(true)
      trackEvent('chatbot_message_sent')

      try {
        const stream = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: 'user', content: input }],
          stream: true,
        });

        let fullResponse = '';
        for await (const chunk of stream) {
          fullResponse += chunk.choices[0]?.delta?.content || "";
          setMessages(prev => [
            ...prev.slice(0, -1),
            { role: 'assistant', content: fullResponse, timestamp: new Date() }
          ]);
        }
      } catch (error) {
        console.error('Error calling OpenAI:', error)
        const errorMessage = { 
          role: 'assistant', 
          content: "I'm sorry, I encountered an error. Please try again later.", 
          timestamp: new Date() 
        }
        setMessages(prev => [...prev, errorMessage])
      } finally {
        setIsTyping(false)
      }
    }
  }

  return (
    <>
      <Button
        className="fixed bottom-4 right-4 rounded-full p-4 shadow-lg hover:scale-105 transition-transform"
        onClick={() => {
          setIsOpen(!isOpen)
          trackEvent('chatbot_toggled', { isOpen: !isOpen })
        }}
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
      {isOpen && (
        <div className="fixed bottom-20 right-4 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700">
          <div className="h-96 flex flex-col">
            <div className="flex-1 overflow-y-auto p-4">
              {messages.map((message, index) => (
                <div key={index} className={`mb-2 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                  <span className={`inline-block p-2 rounded-lg ${message.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>
                    {message.content}
                  </span>
                  <div className="text-xs text-gray-500 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="text-left">
                  <span className="inline-block p-2 rounded-lg bg-gray-200 dark:bg-gray-700">
                    <span className="typing-indicator"></span>
                  </span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 dark:border-gray-700">
              <Input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t('chatbot.type_your_message')}
                className="mb-2"
              />
              <Button type="submit" className="w-full">{t('chatbot.send')}</Button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}


export default AIChatbot;