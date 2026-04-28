"use client"

import { ChurchGPTMessage as IChurchGPTMessage } from "@/hooks/useChurchGPT"
import ReactMarkdown from 'react-markdown'
import { Copy } from "lucide-react"

function safeContent(raw: string): string {
  if (!raw) return ''
  if (raw.trimStart().startsWith('{')) {
    try {
      const parsed = JSON.parse(raw)
      if (typeof parsed?.reply === 'string') return parsed.reply
    } catch {}
  }
  return raw
}

export function ChurchGPTMessage({ message }: { message: IChurchGPTMessage }) {
  const isUser = message.role === 'user'
  const content = safeContent(message.content)
  const isThinking = content === '' && !isUser

  return (
    <div className={`cgpt-msg-row ${isUser ? 'cgpt-user' : 'cgpt-assistant'}`}>
      {/* Label */}
      <div className="cgpt-msg-label">
        {!isUser && <span className="cgpt-dot" />}
        <span>{isUser ? 'You' : 'ChurchGPT'}</span>
      </div>

      {/* Bubble */}
      <div className={`cgpt-msg-bubble ${isUser ? 'cgpt-bubble-user' : 'cgpt-bubble-assistant'}`}>
        {message.attachment && (
          <div className="cgpt-attachment">
            {message.attachment.mimeType.startsWith('image/') ? (
              <img
                src={`data:${message.attachment.mimeType};base64,${message.attachment.data}`}
                alt="Attachment"
                className="cgpt-attachment-img"
              />
            ) : (
              <div className="cgpt-attachment-file">
                📄 {message.attachment.name || 'File'}
              </div>
            )}
          </div>
        )}

        {isThinking ? (
          <div className="cgpt-typing">
            <span className="cgpt-typing-dot" />
            <span className="cgpt-typing-dot" />
            <span className="cgpt-typing-dot" />
          </div>
        ) : (
          <div className="cgpt-prose">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        )}
      </div>

      {/* Actions */}
      {!isUser && content !== '' && (
        <div className="cgpt-msg-actions">
          <button
            onClick={() => navigator.clipboard.writeText(content)}
            className="cgpt-action-btn"
            title="Copy"
          >
            <Copy size={13} />
          </button>
        </div>
      )}
    </div>
  )
}
