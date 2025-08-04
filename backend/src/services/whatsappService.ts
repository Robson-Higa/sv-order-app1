import axios from '../utils/axiosPolyfill';
import { ServiceOrder, ServiceOrderStatus } from '../types';
import dotenv from 'dotenv';

dotenv.config();

const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v18.0';
const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID;
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

interface WhatsappMessage {
  messaging_product: string;
  recipient_type: string;
  to: string;
  type: string;
  template?: {
    name: string;
    language: {
      code: string;
    };
    components: any[];
  };
  text?: {
    body: string;
  };
}

export class WhatsappService {
  /**
   * Envia uma mensagem via WhatsApp usando a API do WhatsApp Business
   */
  private async sendMessage(phoneNumber: string, message: WhatsappMessage): Promise<any> {
    try {
      if (!WHATSAPP_PHONE_ID || !WHATSAPP_ACCESS_TOKEN) {
        console.error('Configurações do WhatsApp não definidas');
        return null;
      }

      const response = await axios.post(
        `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_ID}/messages`,
        message,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Erro ao enviar mensagem WhatsApp:', error);
      return null;
    }
  }

  /**
   * Notifica o usuário sobre a criação de uma nova ordem de serviço
   */
  async notifyOrderCreation(order: ServiceOrder, userPhone: string): Promise<any> {
    const message: WhatsappMessage = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: userPhone,
      type: 'template',
      template: {
        name: 'order_created',
        language: {
          code: 'pt_BR',
        },
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: order.orderNumber },
              { type: 'text', text: order.title },
              { type: 'text', text: order.establishmentName },
              { type: 'text', text: new Date(order.createdAt).toLocaleDateString('pt-BR') },
            ],
          },
        ],
      },
    };

    return this.sendMessage(userPhone, message);
  }

  /**
   * Notifica o usuário sobre a atualização de status de uma ordem de serviço
   */
  async notifyStatusUpdate(order: ServiceOrder, userPhone: string): Promise<any> {
    const statusMap: Record<string, string> = {
      [ServiceOrderStatus.OPEN]: 'Aberta',
      [ServiceOrderStatus.IN_PROGRESS]: 'Em Andamento',
      [ServiceOrderStatus.COMPLETED]: 'Concluída',
      [ServiceOrderStatus.CANCELLED]: 'Cancelada',
      [ServiceOrderStatus.PENDING]: 'Pendente',
    };

    const message: WhatsappMessage = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: userPhone,
      type: 'template',
      template: {
        name: 'order_status_update',
        language: {
          code: 'pt_BR',
        },
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: order.orderNumber },
              { type: 'text', text: statusMap[order.status] || order.status },
              { type: 'text', text: order.title },
              { type: 'text', text: new Date().toLocaleDateString('pt-BR') },
            ],
          },
        ],
      },
    };

    return this.sendMessage(userPhone, message);
  }

  /**
   * Solicita feedback do usuário após a conclusão de uma ordem de serviço
   */
  async requestFeedback(order: ServiceOrder, userPhone: string): Promise<any> {
    const message: WhatsappMessage = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: userPhone,
      type: 'template',
      template: {
        name: 'order_feedback_request',
        language: {
          code: 'pt_BR',
        },
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: order.orderNumber },
              { type: 'text', text: order.title },
            ],
          },
          {
            type: 'button',
            sub_type: 'url',
            index: 0,
            parameters: [
              {
                type: 'text',
                text: `${order.id}`,
              },
            ],
          },
        ],
      },
    };

    return this.sendMessage(userPhone, message);
  }

  /**
   * Notifica o usuário sobre o cancelamento de uma ordem de serviço
   */
  async notifyCancellation(order: ServiceOrder, userPhone: string, reason: string): Promise<any> {
    const message: WhatsappMessage = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: userPhone,
      type: 'template',
      template: {
        name: 'order_cancelled',
        language: {
          code: 'pt_BR',
        },
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: order.orderNumber },
              { type: 'text', text: order.title },
              { type: 'text', text: reason || 'Não especificado' },
              { type: 'text', text: new Date().toLocaleDateString('pt-BR') },
            ],
          },
        ],
      },
    };

    return this.sendMessage(userPhone, message);
  }

  /**
   * Envia uma mensagem personalizada via WhatsApp
   */
  async sendCustomMessage(phoneNumber: string, body: string): Promise<any> {
    const message: WhatsappMessage = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: phoneNumber,
      type: 'text',
      text: {
        body,
      },
    };

    return this.sendMessage(phoneNumber, message);
  }
}

export default new WhatsappService();