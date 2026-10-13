import { logger } from '../utils/logger';

export interface NotificationPayload {
  recipient: string;
  message: string;
  type?: 'SMS' | 'WHATSAPP';
}

export class NotificationService {
  async sendSms(phone: string, message: string): Promise<boolean> {
    logger.info(`📱 [SMS Gateway] Sending SMS to ${phone}: "${message}"`);
    // Phase 2 mock integration (Fast2SMS / Twilio adapter ready)
    return true;
  }

  async sendWhatsApp(phone: string, message: string, mediaUrl?: string): Promise<boolean> {
    logger.info(
      `💬 [WhatsApp Gateway] Sending WhatsApp message to ${phone}: "${message}"${
        mediaUrl ? ` with Media: ${mediaUrl}` : ''
      }`
    );
    // Phase 2 mock integration (Gupshup / Interakt / Twilio WhatsApp adapter ready)
    return true;
  }

  async sendFarmerAssistedPaymentLink(
    farmerPhone: string,
    farmerName: string,
    orderNumber: string,
    amountRupees: number,
    paymentLinkUrl: string
  ): Promise<void> {
    const text = `Namaste ${farmerName}, your Agri-Commerce order #${orderNumber} for ₹${amountRupees} is ready. Click link to complete payment securely via UPI/Card: ${paymentLinkUrl}`;
    await this.sendSms(farmerPhone, text);
    await this.sendWhatsApp(farmerPhone, text);
  }

  async sendLicenseExpiryAlert(
    dealerPhone: string,
    dealerEmail: string,
    businessName: string,
    daysRemaining: number,
    licenseType: string
  ): Promise<void> {
    const text = `⚠️ [Agri-Commerce Compliance Alert] Dear ${businessName}, your ${licenseType} expires in ${daysRemaining} days. Please upload renewed documents to avoid automatic account suspension.`;
    if (dealerPhone) {
      await this.sendSms(dealerPhone, text);
      await this.sendWhatsApp(dealerPhone, text);
    }
    logger.info(`📧 [Email Alert] Sent license expiry notice to ${dealerEmail}: "${text}"`);
  }
}

export const notificationService = new NotificationService();

