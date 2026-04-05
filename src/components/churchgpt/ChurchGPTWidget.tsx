"use client"

import { useState } from "react"
import { ChurchGPTChat } from "./ChurchGPTChat"

export function ChurchGPTWidget() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 left-6 z-[999] flex items-center justify-center w-14 h-14 rounded-full bg-[#1b3a6b] text-white shadow-lg hover:shadow-xl hover:bg-[#152e55] transition-all"
      >
        {isOpen ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f5a623" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
             <path d="M12 2v20M8 8h8" />
          </svg>
        )}
      </button>

      {isOpen && (
        <div className="fixed bottom-24 left-6 w-[400px] h-[600px] max-h-[80vh] max-w-[calc(100vw-3rem)] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col z-[998] border border-gray-100">
          <ChurchGPTChat initialSessionType="general" hideSidebar={true} />
        </div>
      )}
    </>
  )
}
