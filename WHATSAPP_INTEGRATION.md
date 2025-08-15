# Integração com WhatsApp Bot

Este documento descreve a implementação da integração com WhatsApp Bot para automatizar os processos de criação, cancelamento e feedback de ordens de serviço.

## Visão Geral

A integração com WhatsApp permite:

1. **Notificações automáticas** para usuários sobre:
   - Criação de novas ordens de serviço
   - Atualizações de status
   - Cancelamentos
   - Conclusão de serviços

2. **Interação bidirecional** permitindo que usuários:
   - Consultem o status de suas ordens
   - Forneçam feedback
   - Recebam suporte

## Configuração

### Variáveis de Ambiente

As seguintes variáveis de ambiente devem ser configuradas no arquivo `.env` do backend:

```
# WhatsApp API
WHATSAPP_API_URL=https://graph.facebook.com/v18.0
WHATSAPP_PHONE_ID=seu_phone_id_aqui
WHATSAPP_ACCESS_TOKEN=seu_token_aqui
WHATSAPP_VERIFY_TOKEN=sv-order-app-verify-token
```

### Modelos de Mensagem (Templates)

É necessário criar os seguintes modelos de mensagem no WhatsApp Business API:

1. **order_created** - Notificação de criação de ordem
2. **order_status_update** - Atualização de status
3. **order_feedback_request** - Solicitação de feedback
4. **order_cancelled** - Notificação de cancelamento

## Implementação

### Arquivos Criados/Modificados

1. **whatsappService.ts** - Serviço para envio de mensagens via WhatsApp
2. **whatsappRoutes.ts** - Rotas para webhook do WhatsApp
3. **ServiceOrderController.ts** - Integração com WhatsApp nas operações de ordens de serviço

### Funcionalidades Implementadas

#### Notificações Automáticas

- Notificação ao criar uma ordem de serviço
- Notificação ao atualizar o status de uma ordem
- Notificação ao cancelar uma ordem
- Solicitação de feedback após conclusão
- Agradecimento após receber feedback

#### Webhook para Interações

O webhook do WhatsApp permite:

- Receber mensagens de texto dos usuários
- Processar respostas a botões e templates
- Responder a consultas de status
- Coletar feedback

## Uso

### Consulta de Status

Os usuários podem consultar o status de uma ordem enviando uma mensagem com o número da ordem:

```
status #123456
```

ou simplesmente:

```
#123456
```

### Feedback

Os usuários receberão uma solicitação de feedback após a conclusão de uma ordem, com um link para avaliação.

## Correções Adicionais

Além da integração com WhatsApp, foram realizadas as seguintes correções:

1. **Correções no Vite**:
   - Atualização da configuração do Vite para resolver problemas de build
   - Adição de configurações para melhorar o desempenho e debugging

2. **Correções de CSS**:
   - Adição de camadas base no arquivo global.css
   - Correção de importações de estilos

3. **Remoção de arquivos desnecessários**:
   - Remoção do arquivo `import React, { useState, useEffect.txt`

4. **Dependências**:
   - Adição da dependência `axios` para requisições HTTP

## Próximos Passos

1. Configurar os modelos de mensagem no WhatsApp Business API
2. Obter as credenciais necessárias (PHONE_ID e ACCESS_TOKEN)
3. Configurar o webhook para receber mensagens
4. Testar o fluxo completo de notificações e interações