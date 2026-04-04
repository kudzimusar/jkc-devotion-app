"use client"

import { ChurchGPTMessage as IChurchGPTMessage } from "@/hooks/useChurchGPT"
import ReactMarkdown from 'react-markdown'
import { Card } from "@/components/ui/card"
import { Copy, RefreshCw } from "lucide-react"

export function ChurchGPTMessage({ message }: { message: IChurchGPTMessage }) {
  const isUser = message.role === 'user'
  
  const isStreaming = message.content === '' && !isUser

  // Detect Scripture: Book Chapter:Verse, Book Chapter:Verse-Verse
  const scriptureRegex = /([1-3]?\s?[A-Za-z]+)\s+(\d+):(\d+)(?:-(\d+))?/g;

  return (
    <div className={`flex w-full mb-8 group ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[85%] relative ${isUser ? 'flex-row-reverse' : 'flex-row items-start'}`}>
        {!isUser && (
          <div className="flex-shrink-0 mr-4 mt-2">
            <div className="w-8 h-8 flex items-center justify-center rounded-full bg-[#1b3a6b] text-[#f5a623] shadow-md border border-white/10">
              <span className="text-xl font-bold">✟</span>
            </div>
          </div>
        )}
        
        <div className="flex flex-col space-y-2">
          <Card className={`px-5 py-4 ${
            isUser 
              ? 'bg-[#1b3a6b] text-white border-transparent shadow-md' 
              : 'bg-white text-gray-800 border-[#ebebeb] shadow-sm'
          }`} style={{ borderRadius: isUser ? "18px 18px 4px 18px" : "4px 18px 18px 18px" }}>
            
            {message.content === '' && !isUser ? (
              <div className="flex items-center space-x-1.5 h-6">
                <div className="w-1.5 h-4 bg-[#f5a623] animate-pulse" />
              </div>
            ) : (
              <div className={`prose prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-[#f5f5f5] prose-pre:text-gray-800 prose-pre:font-mono prose-pre:p-4 prose-pre:rounded-xl prose-strong:text-inherit font-sans text-[15px]`}>
                <ReactMarkdown
                  components={{
                    p: ({ children }) => {
                      if (typeof children === 'string') {
                        // Check for scripture references and style them if possible via simple manipulation, 
                        // though normally we'd do a custom renderer for full control.
                        return <p>{children}</p>
                      }
                      return <p>{children}</p>
                    },
                    code: ({ className, children }) => {
                      const isInline = !className?.includes('language-')
                      return isInline 
                        ? <code className="bg-gray-100 px-1 rounded text-[#1b3a6b]">{children}</code>
                        : <pre className="bg-[#f5f5f5] p-4 rounded-xl overflow-x-auto my-4 text-xs font-mono shadow-inner border border-gray-100">{children}</pre>
                    }
                  }}
                >
                  {message.content}
                </ReactMarkdown>
                {/* Visual Streaming Cursor */}
                {isStreaming && (
                   <span className="ml-1 inline-block w-1.5 h-4 bg-[#f5a623] animate-pulse align-middle" />
                )}
              </div>
            )}
          </Card>

          {/* Message Actions */}
          {!isUser && message.content !== '' && (
            <div className="flex items-center space-x-3 mt-1 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
              <button 
                onClick={() => navigator.clipboard.writeText(message.content)}
                className="flex items-center space-x-1.5 text-[10px] font-bold text-gray-400 hover:text-[#1b3a6b] transition-colors bg-gray-100/50 px-2 py-1 rounded"
              >
                <Copy className="w-3 h-3" />
                <span>COPY</span>
              </button>
              <button className="flex items-center space-x-1.5 text-[10px] font-bold text-gray-400 hover:text-[#1b3a6b] transition-colors bg-gray-100/50 px-2 py-1 rounded">
                <RefreshCw className="w-3 h-3" />
                <span>REGENERATE</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
