/**
 * Client-side Actions for the Connect Card.
 * The email sending is now handled by Supabase Edge Functions / DB Triggers 
 * to support static site builds on GitHub Pages.
 */
export async function sendConnectEmail(_intent: string, _email: string, _name: string) {
  // NO-OP on the client to avoid Next.js Server Action build errors in static mode.
  // The DB trigger on 'public_inquiries' handles the email notification system.
  return { success: true };
}
