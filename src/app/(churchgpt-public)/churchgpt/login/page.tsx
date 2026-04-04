import { PublicChurchGPTAuth } from "@/components/churchgpt-public/PublicChurchGPTAuth"

export const metadata = {
  title: 'Sign In | ChurchGPT',
  description: 'Sign in to your ChurchGPT account to save and sync your conversations.'
}

export default function LoginPage() {
  return <PublicChurchGPTAuth mode="login" />
}
