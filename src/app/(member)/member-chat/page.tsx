import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import { ChurchGPTAuthApp } from '@/components/churchgpt/ChurchGPTAuthApp'

export const metadata = {
  title: 'ChurchGPT | Church OS',
  description: 'Your Christian AI Companion',
}

export default function MemberChatPage() {
  return (
    <Suspense fallback={<div className="cgpt-loading-screen"><Loader2 className="cgpt-loader" /></div>}>
      <ChurchGPTAuthApp loginRedirect="/shepherd/dashboard" />
    </Suspense>
  )
}
