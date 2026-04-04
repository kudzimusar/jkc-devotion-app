import { ChurchGPTChat } from '@/components/churchgpt/ChurchGPTChat'

export const metadata = {
  title: 'ChurchGPT | Church OS',
  description: 'Your Christian AI Companion'
}

export default function ChurchGPTPage() {
  return <ChurchGPTChat initialSessionType="general" />
}
