import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * REMINDER PROCESSOR - Phase 6 (Brevo Integration)
 * Background worker triggered every 5 minutes (via cron) to deliver
 * AI-generated reminders to church members using Brevo for Email and SMS.
 */

// Brevo API configuration
const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY');
const BREVO_SENDER_EMAIL = Deno.env.get('BREVO_SENDER_EMAIL') || 'reminders@churchos.com';
const BREVO_SENDER_NAME = Deno.env.get('BREVO_SENDER_NAME') || 'Church OS';
const BREVO_SMS_SENDER = Deno.env.get('BREVO_SMS_SENDER') || 'ChurchOS';

const BREVO_API_URL = 'https://api.brevo.com/v3';

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Get pending reminders due now or in the past
  const { data: reminders, error } = await supabase
    .from('reminders')
    .select(`
      *,
      user:profiles!inner(
        id,
        full_name,
        phone
      )
    `)
    .is('delivered_at', null)
    .eq('status', 'pending')
    .lte('scheduled_for', new Date().toISOString())
    .limit(50);

  if (error) {
    console.error('Failed to fetch reminders:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  if (!reminders || reminders.length === 0) {
    return new Response(JSON.stringify({ message: "No pending reminders." }), { status: 200 });
  }

  console.log(`[CRON] Found ${reminders.length} reminders for Brevo delivery.`);

  const results = [];

  for (const reminder of reminders) {
    const user = reminder.user;
    let delivered = false;
    let method = 'none';

    // 1. Fetch User Email from Auth.users (via profiles link or directly)
    // Note: Since we are in a service_role function, we can query auth.users if needed.
    // However, usually we keep email in the profile for easier join.
    // For this implementation, we'll try to fetch the email from auth
    const { data: authUser } = await supabase.auth.admin.getUserById(reminder.user_id);
    const email = authUser?.user?.email;

    // Attempt 1: Send Email via Brevo
    if (email) {
      const emailResult = await sendBrevoEmail({
        to: email,
        toName: user?.full_name || 'Member',
        subject: getEmailSubject(reminder.reminder_type),
        html: getEmailHtml(reminder.message, reminder.reminder_type),
        text: getEmailText(reminder.message, reminder.reminder_type)
      });

      if (emailResult.success) {
        delivered = true;
        method = 'email';
      } else {
        console.error(`Email failed for ${reminder.user_id}:`, emailResult.error);
      }
    }

    // Attempt 2: Send SMS via Brevo (if email failed OR user has phone)
    if (!delivered && user?.phone) {
      const smsResult = await sendBrevoSMS({
        to: user.phone,
        message: getSmsMessage(reminder.message, reminder.reminder_type)
      });

      if (smsResult.success) {
        delivered = true;
        method = 'sms';
      } else {
        console.error(`SMS failed for ${reminder.user_id}:`, smsResult.error);
      }
    }

    // Update reminder status
    const { error: updateError } = await supabase
      .from('reminders')
      .update({
        delivered_at: delivered ? new Date().toISOString() : null,
        delivery_method: method,
        delivery_status: delivered ? 'sent' : 'failed'
      })
      .eq('id', reminder.id);

    results.push({
      reminder_id: reminder.id,
      user_id: reminder.user_id,
      delivered,
      method,
      error: updateError?.message || (delivered ? null : 'All delivery methods failed')
    });
  }

  return new Response(
    JSON.stringify({ processed: reminders.length, results }),
    { headers: { 'Content-Type': 'application/json' } }
  );
});

// ============================================================================
// Brevo API Helpers
// ============================================================================

interface EmailParams {
  to: string;
  toName: string;
  subject: string;
  html: string;
  text: string;
}

async function sendBrevoEmail(params: EmailParams): Promise<{ success: boolean; error?: string }> {
  if (!BREVO_API_KEY) {
    return { success: false, error: 'BREVO_API_KEY not configured' };
  }

  try {
    const response = await fetch(`${BREVO_API_URL}/smtp/email`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'api-key': BREVO_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sender: {
          name: BREVO_SENDER_NAME,
          email: BREVO_SENDER_EMAIL
        },
        to: [{
          email: params.to,
          name: params.toName
        }],
        subject: params.subject,
        htmlContent: params.html,
        textContent: params.text
      })
    });

    const data = await response.json();

    if (response.ok) {
      return { success: true };
    } else {
      return { success: false, error: data.message || 'Brevo email API error' };
    }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

interface SMSParams {
  to: string;
  message: string;
}

async function sendBrevoSMS(params: SMSParams): Promise<{ success: boolean; error?: string }> {
  if (!BREVO_API_KEY) {
    return { success: false, error: 'BREVO_API_KEY not configured' };
  }

  // Format phone number (ensure E.164 format)
  let phoneNumber = params.to;
  if (!phoneNumber.startsWith('+')) {
    // Assume it's a US number, add +1
    phoneNumber = `+1${phoneNumber.replace(/\D/g, '')}`;
  }

  try {
    const response = await fetch(`${BREVO_API_URL}/transactionalSMS/sms`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'api-key': BREVO_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sender: BREVO_SMS_SENDER,
        recipient: phoneNumber,
        content: params.message,
        type: 'transactional'
      })
    });

    const data = await response.json();

    if (response.ok) {
      return { success: true };
    } else {
      return { success: false, error: data.message || 'Brevo SMS API error' };
    }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// ============================================================================
// Message Templates
// ============================================================================

function getEmailSubject(reminderType: string | null): string {
  const types: Record<string, string> = {
    devotion: '🌅 Daily Devotion Reminder',
    event: '📅 Upcoming Event Reminder',
    prayer: '🙏 Prayer Time Reminder',
    follow_up: '📞 Follow-Up Reminder',
    general: '💬 Church OS Reminder'
  };
  return types[reminderType || 'general'] || types.general;
}

function getEmailHtml(message: string, reminderType: string | null): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
        .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #e5e7eb; }
        .header h1 { margin: 0; color: #1f2937; font-size: 24px; }
        .content { padding: 24px 0; }
        .message { background-color: #f9fafb; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #3b82f6; }
        .footer { text-align: center; padding: 20px 0; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; }
        .button { display: inline-block; background-color: #3b82f6; color: #ffffff; padding: 10px 20px; border-radius: 6px; text-decoration: none; margin-top: 16px; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⛪ Church OS</h1>
        </div>
        <div class="content">
          <p>Hello,</p>
          <div class="message">
            <strong>${getEmailTitle(reminderType)}</strong><br>
            ${message}
          </div>
          <a href="https://churchos.com/dashboard" class="button">Go to Dashboard</a>
        </div>
        <div class="footer">
          <p>This reminder was created by the Church OS AI Assistant.</p>
          <p>To manage your notification preferences, visit your profile settings.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function getEmailText(message: string, reminderType: string | null): string {
  return `
Church OS Reminder
${'='.repeat(30)}

${getEmailTitle(reminderType)}

${message}

This reminder was created by the Church OS AI Assistant.
To manage your notification preferences, visit your profile settings.
  `;
}

function getEmailTitle(reminderType: string | null): string {
  const titles: Record<string, string> = {
    devotion: '🌅 Daily Devotion',
    event: '📅 Event Reminder',
    prayer: '🙏 Prayer Time',
    follow_up: '📞 Follow-Up',
    general: '💬 Reminder'
  };
  return titles[reminderType || 'general'] || titles.general;
}

function getSmsMessage(message: string, reminderType: string | null): string {
  const prefix: Record<string, string> = {
    devotion: '🌅 Church OS: ',
    event: '📅 Church OS: ',
    prayer: '🙏 Church OS: ',
    follow_up: '📞 Church OS: ',
    general: 'Church OS: '
  };
  const pre = prefix[reminderType || 'general'] || 'Church OS: ';
  return `${pre}${message}`;
}
