import { Router } from 'express';
import { Request, Response } from 'express';
import whatsappService from '../services/whatsappService';
import { db } from '../config/firebase';
import { ServiceOrderStatus } from '../types';

const router = Router();

/**
 * Webhook para receber mensagens e interações do WhatsApp
 * Este endpoint é chamado pelo WhatsApp quando uma mensagem é recebida
 */
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const { object, entry } = req.body;

    // Verificar se é uma mensagem do WhatsApp
    if (object !== 'whatsapp_business_account') {
      return res.sendStatus(400);
    }

    // Processar cada entrada
    for (const entryItem of entry) {
      const changes = entryItem.changes || [];

      for (const change of changes) {
        if (change.field !== 'messages') continue;

        const messages = change.value?.messages || [];
        const contacts = change.value?.contacts || [];

        // Processar cada mensagem
        for (let i = 0; i < messages.length; i++) {
          const message = messages[i];
          const contact = contacts[i] || {};

          // Processar mensagem de texto
          if (message.type === 'text') {
            await processTextMessage(message, contact);
          }
          // Processar resposta de botão
          else if (message.type === 'button') {
            await processButtonResponse(message, contact);
          }
          // Processar resposta de template
          else if (message.type === 'interactive' && message.interactive?.type === 'button_reply') {
            await processInteractiveResponse(message, contact);
          }
        }
      }
    }

    // Responder com 200 OK para confirmar recebimento
    return res.status(200).json({ status: 'success' });
  } catch (error) {
    console.error('Erro ao processar webhook do WhatsApp:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * Webhook para verificação do WhatsApp
 * Este endpoint é chamado pelo WhatsApp para verificar a validade do webhook
 */
router.get('/webhook', (req: Request, res: Response) => {
  // Verificar token de verificação
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'sv-order-app-verify-token';
  
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  // Verificar se o token é válido
  if (mode === 'subscribe' && token === verifyToken) {
    console.log('Webhook do WhatsApp verificado com sucesso');
    return res.status(200).send(challenge);
  }

  // Token inválido
  console.error('Falha na verificação do webhook do WhatsApp');
  return res.sendStatus(403);
});

/**
 * Processa mensagens de texto recebidas
 */
async function processTextMessage(message: any, contact: any) {
  const text = message.text?.body;
  const from = contact.wa_id;
  const name = contact.profile?.name || 'Usuário';

  console.log(`Mensagem recebida de ${name} (${from}): ${text}`);

  // Verificar se é uma resposta a uma solicitação de feedback
  if (text.toLowerCase().includes('feedback') || text.toLowerCase().includes('avaliação')) {
    // Enviar instruções sobre como fornecer feedback
    await whatsappService.sendCustomMessage(
      from,
      'Para enviar seu feedback, por favor acesse o link que enviamos anteriormente ou entre no aplicativo e avalie a ordem de serviço. Sua opinião é muito importante para nós!'
    );
    return;
  }

  // Verificar se é uma consulta sobre status de ordem
  if (text.toLowerCase().includes('status') || text.toLowerCase().includes('andamento')) {
    // Extrair possível número da ordem
    const orderNumberMatch = text.match(/#(\d+)/) || text.match(/(\d{6})/); // Busca #123456 ou 123456
    
    if (orderNumberMatch) {
      const orderNumber = orderNumberMatch[1];
      await sendOrderStatus(from, orderNumber);
      return;
    }

    // Se não encontrou número da ordem, pedir para informar
    await whatsappService.sendCustomMessage(
      from,
      'Para consultar o status de uma ordem de serviço, por favor informe o número da ordem (ex: #123456).'
    );
    return;
  }

  // Resposta padrão
  await whatsappService.sendCustomMessage(
    from,
    `Olá ${name}! Recebemos sua mensagem. Para consultar o status de uma ordem, envie o número da ordem (ex: #123456). Para outras informações, por favor acesse nosso aplicativo ou entre em contato com o suporte.`
  );
}

/**
 * Processa respostas de botões
 */
async function processButtonResponse(message: any, contact: any) {
  const buttonId = message.button?.payload;
  const from = contact.wa_id;

  console.log(`Resposta de botão recebida de ${from}: ${buttonId}`);

  // Processar com base no payload do botão
  if (buttonId.startsWith('feedback_')) {
    const orderId = buttonId.replace('feedback_', '');
    
    // Enviar link para feedback
    await whatsappService.sendCustomMessage(
      from,
      `Para enviar seu feedback sobre a ordem de serviço, acesse: https://seu-app.com/feedback/${orderId}`
    );
  }
}

/**
 * Processa respostas interativas
 */
async function processInteractiveResponse(message: any, contact: any) {
  const buttonReply = message.interactive?.button_reply;
  const from = contact.wa_id;

  if (!buttonReply) return;

  console.log(`Resposta interativa recebida de ${from}: ${buttonReply.id} - ${buttonReply.title}`);

  // Processar com base no ID do botão
  if (buttonReply.id.startsWith('rate_')) {
    const [_, orderId, rating] = buttonReply.id.split('_');
    
    // Registrar avaliação
    try {
      await db.collection('serviceOrders').doc(orderId).update({
        rating: parseInt(rating),
        feedbackAt: new Date()
      });

      await whatsappService.sendCustomMessage(
        from,
        `Obrigado pela sua avaliação! Sua opinião é muito importante para melhorarmos nossos serviços.`
      );
    } catch (error) {
      console.error('Erro ao registrar avaliação:', error);
      await whatsappService.sendCustomMessage(
        from,
        `Desculpe, não foi possível registrar sua avaliação. Por favor, tente novamente mais tarde ou use nosso aplicativo.`
      );
    }
  }
}

/**
 * Envia o status atual de uma ordem de serviço
 */
async function sendOrderStatus(phoneNumber: string, orderNumber: string) {
  try {
    // Buscar ordem pelo número
    const ordersSnapshot = await db.collection('serviceOrders')
      .where('orderNumber', '==', orderNumber)
      .limit(1)
      .get();

    if (ordersSnapshot.empty) {
      await whatsappService.sendCustomMessage(
        phoneNumber,
        `Desculpe, não encontramos nenhuma ordem de serviço com o número ${orderNumber}.`
      );
      return;
    }

    // Obter dados da ordem
    const orderDoc = ordersSnapshot.docs[0];
    const order = orderDoc.data();

    // Mapear status para texto amigável
    const statusMap: Record<string, string> = {
      [ServiceOrderStatus.OPEN]: 'Aberta',
      [ServiceOrderStatus.IN_PROGRESS]: 'Em Andamento',
      [ServiceOrderStatus.COMPLETED]: 'Concluída',
      [ServiceOrderStatus.CANCELLED]: 'Cancelada',
      [ServiceOrderStatus.PENDING]: 'Pendente',
    };

    const statusText = statusMap[order.status] || order.status;
    const createdDate = new Date(order.createdAt.toDate()).toLocaleDateString('pt-BR');
    let updatedDate = 'N/A';
    
    if (order.updatedAt) {
      updatedDate = new Date(order.updatedAt.toDate()).toLocaleDateString('pt-BR');
    }

    // Enviar mensagem com status
    await whatsappService.sendCustomMessage(
      phoneNumber,
      `📋 *Ordem de Serviço #${order.orderNumber}*\n\n` +
      `*Título:* ${order.title}\n` +
      `*Status:* ${statusText}\n` +
      `*Criada em:* ${createdDate}\n` +
      `*Última atualização:* ${updatedDate}\n\n` +
      `Para mais detalhes, acesse nosso aplicativo.`
    );
  } catch (error) {
    console.error('Erro ao buscar status da ordem:', error);
    await whatsappService.sendCustomMessage(
      phoneNumber,
      `Desculpe, ocorreu um erro ao buscar informações da ordem ${orderNumber}. Por favor, tente novamente mais tarde.`
    );
  }
}

export default router;