import { PublicChurchGPTAuth } from "@/components/churchgpt-public/PublicChurchGPTAuth"

export const metadata = {
  title: 'Sign Up | ChurchGPT',
  description: 'Create a free ChurchGPT account to save your conversation history across devices.'
}

export default function SignupPage() {
  return <PublicChurchGPTAuth mode="signup" />
}
