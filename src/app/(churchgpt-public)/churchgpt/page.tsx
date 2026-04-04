import { PublicChurchGPTHero } from "@/components/churchgpt-public/PublicChurchGPTHero"
import { PublicChurchGPTChat } from "@/components/churchgpt-public/PublicChurchGPTChat"

export const metadata = {
  title: 'ChurchGPT | Your Christian AI Companion',
  description: 'The AI that knows the Bible, loves people, and never pretends to be neutral about Jesus.'
}

export default function ChurchGPTPublicLandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <PublicChurchGPTHero />
      <div id="churchgpt-chat" className="flex-1 bg-white">
        <PublicChurchGPTChat />
      </div>
    </div>
  )
}
