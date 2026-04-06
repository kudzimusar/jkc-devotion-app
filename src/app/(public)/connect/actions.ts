'use server'

/**
 * Brevo Transactional Email Action
 * Handles sending confirmation emails for the Connect Card.
 * Uses the BREVO_API_KEY from server environment variables.
 */
export async function sendConnectEmail(intent: string, email: string, name: string) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.warn('[Brevo] API Key missing. Skipping email.');
    return { success: false, error: 'API_KEY_MISSING' };
  }

  const subjects: Record<string, string> = {
    'prayer': "Your prayer request has been received — Japan Kingdom Church",
    'membership': "Welcome — Your JKC membership application has been received",
    'volunteer': "Thank you for volunteering — Japan Kingdom Church",
    'jkgroup': "Your jkGroup request has been received — Japan Kingdom Church",
    'class_hoth': "Heart of the House registration confirmed — Japan Kingdom Church",
    'class_language': "Kingdom Japanese Language Class — Application received",
    'event': "Event registration confirmed — Japan Kingdom Church"
  };

  const subject = subjects[intent] || "Thank you for connecting — Japan Kingdom Church";

  const nextSteps: Record<string, string> = {
    'prayer': "Our intercessory team is already interceding for your request. We believe in the power of prayer and will stand with you.",
    'membership': "A ministry team leader will be in touch shortly to discuss your next steps in your membership journey.",
    'volunteer': "We are excited to see your heart to serve! Someone from the ministry team will reach out to discuss your availability.",
    'jkgroup': "We've received your request! A group leader will be in touch with the details of the next meeting.",
    'class_hoth': "Welcome to the family! You will receive course materials and the schedule via email shortly.",
    'class_language': "Shitsurei shimasu! We are reviewing your application and will notify you about the class placement soon.",
    'event': "We look forward to seeing you there! Keep this email as your registration confirmation."
  };

  const step = nextSteps[intent] || "We have received your message and will get back to you shortly.";

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': apiKey
      },
      body: JSON.stringify({
        sender: {
          name: "Japan Kingdom Church",
          email: "info@kudzimusar.com"
        },
        to: [{ email, name }],
        subject: subject,
        htmlContent: `
          <div style="font-family: sans-serif; padding: 20px; color: #1b3a6b;">
            <p>Dear ${name},</p>
            <p>Thank you for reaching out to Japan Kingdom Church. ${step}</p>
            <p>Blessings,<br>Japan Kingdom Church Team</p>
          </div>
        `
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('[Brevo] API Error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (e) {
    console.error('[Brevo] Error:', e);
    return { success: false, error: 'FETCH_ERROR' };
  }
}
