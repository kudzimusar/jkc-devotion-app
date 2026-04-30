"use client"

import { ChurchGPTMessage as IChurchGPTMessage } from "@/hooks/useChurchGPT"
import { Copy, Check } from "lucide-react"
import { useState, useCallback } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import type { Components } from "react-markdown"

// ── Utilities ────────────────────────────────────────────────────────────────

function safeContent(raw: string): string {
  if (!raw) return ""
  if (raw.trimStart().startsWith("{")) {
    try {
      const parsed = JSON.parse(raw)
      if (typeof parsed?.reply === "string") return parsed.reply
    } catch {}
  }
  return raw
}

// Highlight key terms that appear in **...** with brand orange instead of rendering as bold
// We strip the **...** markdown and render as <mark> which CSS styles as orange+bold
function preprocessContent(content: string): string {
  // Convert **word** -> custom mark tag for key term highlighting
  // We use a placeholder that won't conflict with other markdown
  return content.replace(/\*\*([^*\n]{1,60})\*\*/g, (_, term) => `<mark class="cgpt-key">${term}</mark>`)
}

// ── Custom markdown components ────────────────────────────────────────────────

const markdownComponents: Components = {
  // Paragraphs — add spacing
  p: ({ children }) => (
    <p style={{ margin: "0 0 1em", lineHeight: 1.75, color: "inherit" }}>{children}</p>
  ),

  // Ordered list
  ol: ({ children }) => (
    <ol style={{ margin: "0 0 1em", paddingLeft: "1.4em", lineHeight: 1.75 }}>{children}</ol>
  ),

  // Unordered list
  ul: ({ children }) => (
    <ul style={{ margin: "0 0 1em", paddingLeft: "1.4em", lineHeight: 1.75 }}>{children}</ul>
  ),

  li: ({ children }) => (
    <li style={{ marginBottom: "0.35em", lineHeight: 1.7 }}>{children}</li>
  ),

  // Headings
  h1: ({ children }) => (
    <h1 style={{ fontSize: "1.15em", fontWeight: 700, margin: "1em 0 0.4em", color: "inherit" }}>{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 style={{ fontSize: "1.05em", fontWeight: 700, margin: "0.9em 0 0.4em", color: "inherit" }}>{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 style={{ fontSize: "0.98em", fontWeight: 700, margin: "0.8em 0 0.35em", color: "inherit" }}>{children}</h3>
  ),

  // Bold → brand orange keyword style
  strong: ({ children }) => (
    <strong style={{ fontWeight: 700, color: "var(--cgpt-accent, #C8860A)", fontFamily: "Georgia, serif" }}>
      {children}
    </strong>
  ),

  // Italic → elegant light serif
  em: ({ children }) => (
    <em style={{ fontStyle: "italic", color: "inherit", opacity: 0.85 }}>{children}</em>
  ),

  // Inline code
  code: ({ children, className }) => {
    const isBlock = className?.includes("language-")
    if (isBlock) {
      return (
        <code style={{
          display: "block", background: "rgba(0,0,0,0.08)", borderRadius: 6,
          padding: "10px 14px", fontSize: "0.85em", fontFamily: "monospace",
          margin: "0.5em 0", overflowX: "auto", lineHeight: 1.6,
        }}>{children}</code>
      )
    }
    return (
      <code style={{
        background: "rgba(0,0,0,0.08)", borderRadius: 4, padding: "2px 6px",
        fontSize: "0.88em", fontFamily: "monospace",
      }}>{children}</code>
    )
  },

  // Block quotes — styled as scripture/devotional quotes
  blockquote: ({ children }) => (
    <blockquote style={{
      borderLeft: "3px solid var(--cgpt-accent, #C8860A)",
      margin: "0.75em 0", padding: "6px 16px",
      fontStyle: "italic", opacity: 0.8,
      background: "rgba(200,134,10,0.06)", borderRadius: "0 6px 6px 0",
    }}>
      {children}
    </blockquote>
  ),

  // Horizontal rule
  hr: () => (
    <hr style={{ border: "none", borderTop: "1px solid rgba(0,0,0,0.12)", margin: "1em 0" }} />
  ),

  // Links — open in new tab, styled in accent color
  a: ({ href, children }) => (
    <a
      href={href} target="_blank" rel="noopener noreferrer"
      style={{
        color: "var(--cgpt-accent, #C8860A)", textDecoration: "underline",
        textUnderlineOffset: 2, fontWeight: 500,
      }}
    >
      {children}
    </a>
  ),
}

// ── Main component ────────────────────────────────────────────────────────────

export function ChurchGPTMessage({ message }: { message: IChurchGPTMessage }) {
  const isUser = message.role === "user"
  const rawContent = safeContent(message.content)
  const isThinking = rawContent === "" && !isUser
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(rawContent)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }, [rawContent])

  return (
    <div className={`cgpt-msg-row ${isUser ? "cgpt-user" : "cgpt-assistant"}`}>
      {/* Label */}
      <div className="cgpt-msg-label">
        {!isUser && <span className="cgpt-dot" />}
        <span>{isUser ? "You" : "ChurchGPT"}</span>
      </div>

      {/* Bubble */}
      <div className={`cgpt-msg-bubble ${isUser ? "cgpt-bubble-user" : "cgpt-bubble-assistant"}`}>
        {/* Attachment */}
        {message.attachment && (
          <div className="cgpt-attachment">
            {message.attachment.mimeType.startsWith("image/") ? (
              <img
                src={`data:${message.attachment.mimeType};base64,${message.attachment.data}`}
                alt="Attachment"
                className="cgpt-attachment-img"
              />
            ) : (
              <div className="cgpt-attachment-file">📄 {message.attachment.name || "File"}</div>
            )}
          </div>
        )}

        {/* Content */}
        {isThinking ? (
          <div className="cgpt-typing">
            <span className="cgpt-typing-dot" />
            <span className="cgpt-typing-dot" />
            <span className="cgpt-typing-dot" />
          </div>
        ) : (
          <div className="cgpt-prose">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
              // Allow our custom <mark> passthrough for key terms
              allowedElements={undefined}
            >
              {rawContent}
            </ReactMarkdown>
          </div>
        )}
      </div>

      {/* Copy action */}
      {!isUser && rawContent !== "" && (
        <div className="cgpt-msg-actions">
          <button onClick={handleCopy} className="cgpt-action-btn" title={copied ? "Copied!" : "Copy"}>
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied && <span style={{ fontSize: 10, marginLeft: 3 }}>Copied</span>}
          </button>
        </div>
      )}
    </div>
  )
}
