import axios from 'axios';
import { logger } from '../utils/logger';

/**
 * WhatsApp Cloud API Service Integration
 * Dispatches delivery verification PIN and shipment notifications to farmers
 */
export async function sendDeliveryOtpWhatsApp(
  phone: string,
  orderId: string,
  otpPin: string,
  farmerName: string
): Promise<boolean> {
  const cleanPhone = phone.replace(/\D/g, '').slice(-10);
  const formattedPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  logger.info(
    `💬 [WhatsApp Cloud API] Dispatching Delivery PIN ${otpPin} for order ${orderId} to farmer ${farmerName} (${formattedPhone})`
  );

  if (!phoneNumberId || !accessToken) {
    logger.warn(
      `⚠️ [WhatsApp Cloud API] WHATSAPP_PHONE_NUMBER_ID or WHATSAPP_ACCESS_TOKEN not set in environment. PIN "${otpPin}" logged and accessible in farmer's in-app screen.`
    );
    return false;
  }

  try {
    // POST to Meta WhatsApp Cloud API or configured WhatsApp gateway
    await axios.post(
      `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: 'template',
        template: {
          name: 'kisan_hit_delivery_pin', // Approved Meta template
          language: { code: 'hi' },
          components: [
            {
              type: 'body',
              parameters: [
                { type: 'text', text: farmerName || 'Kisan' },
                { type: 'text', text: orderId },
                { type: 'text', text: otpPin },
              ],
            },
          ],
        },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );
    logger.info(`✅ [WhatsApp Cloud API] Successfully dispatched delivery OTP to ${formattedPhone}`);
    return true;
  } catch (error: any) {
    logger.error('❌ WhatsApp OTP delivery failed:', error?.response?.data || error.message);
    // Fallback: Ensure PIN remains accessible in farmer's in-app My Orders screen
    return false;
  }
}

/**
 * Send in-transit dispatch notification to farmer
 */
export async function sendOrderInTransitAlertWhatsApp(
  phone: string,
  orderNumber: string,
  carrierName: string,
  farmerName: string
): Promise<boolean> {
  const cleanPhone = phone.replace(/\D/g, '').slice(-10);
  const formattedPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  logger.info(
    `💬 [WhatsApp Cloud API] Dispatching In-Transit Alert for order ${orderNumber} to ${formattedPhone}`
  );

  if (!phoneNumberId || !accessToken) return false;

  try {
    await axios.post(
      `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: 'text',
        text: {
          body: `🌾 किसान हित (Kisan Hit): नमस्ते ${farmerName || 'किसान भाई'}, आपका ऑर्डर #${orderNumber} ${carrierName || 'ग्रामीण कार्गो'} द्वारा रवाना हो चुका है। डिलीवरी के समय 4-अंकों का पिन ड्राइवर को दें। हेल्पलाइन: 8868031460`,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );
    return true;
  } catch (err: any) {
    logger.error('❌ WhatsApp in-transit alert failed:', err?.response?.data || err.message);
    return false;
  }
}

