import sgMail from '@sendgrid/mail';
import twilio from 'twilio';

const sendgridConfigured =
  !!process.env.SENDGRID_API_KEY && !process.env.SENDGRID_API_KEY.includes('your_');

const twilioConfigured =
  !!process.env.TWILIO_ACCOUNT_SID && !process.env.TWILIO_ACCOUNT_SID.includes('your_');

if (!sendgridConfigured) {
  console.warn('[NotificationService] SendGrid not configured — email notifications disabled');
} else {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

const twilioClient = twilioConfigured
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

if (!twilioConfigured) {
  console.warn('[NotificationService] Twilio not configured — SMS notifications disabled');
}

class NotificationService {
  /**
   * Sends an SMS to the configured owner notification number when a complaint is approved
   * @param {Object} complaint - The approved complaint document
   */
  static async notifyPGOwner(complaint) {
    try {
      if (!twilioConfigured) {
        return false;
      }

      await twilioClient.messages.create({
        body: `Nest Stay: New complaint received for your PG. Complaint ID: ${complaint._id}. Login to review.`,
        from: process.env.TWILIO_FROM_NUMBER,
        to: process.env.OWNER_NOTIFICATION_PHONE,
      });

      console.log(`[NotificationService] SMS sent for complaint ${complaint._id}`);
      return true;
    } catch (error) {
      console.error('[NotificationService] notifyPGOwner failed:', error);
      return false;
    }
  }

  /**
   * Sends an email to the configured admin address when an admission request is escalated
   * @param {Object} admission - The escalated admission document
   */
  static async notifyAdminEscalation(admission) {
    try {
      if (!sendgridConfigured) {
        return false;
      }

      await sgMail.send({
        to: process.env.ADMIN_NOTIFICATION_EMAIL,
        from: process.env.SENDGRID_FROM_EMAIL,
        subject: 'Nest Stay: Admission Request Escalated',
        text: `An admission request has been pending for too long and has been escalated.\n\nAdmission ID: ${admission._id}\nPG ID: ${admission.pgId}\nUser ID: ${admission.userId}\n\nPlease log in to the admin panel to review.`,
      });

      console.log(`[NotificationService] Escalation email sent for admission ${admission._id}`);
      return true;
    } catch (error) {
      console.error('[NotificationService] notifyAdminEscalation failed:', error);
      return false;
    }
  }
}

export default NotificationService;
