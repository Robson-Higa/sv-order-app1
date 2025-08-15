# Backend - Sistema de Gestão de Ordens de Serviço

Este é o backend do sistema de gestão de ordens de serviço, desenvolvido com Node.js, TypeScript e Firebase.

## Tecnologias Utilizadas

- **Node.js** - Runtime JavaScript
- **TypeScript** - Superset tipado do JavaScript
- **Express.js** - Framework web para Node.js
- **Firebase Admin SDK** - Integração com Firebase para autenticação e banco de dados
- **JWT** - Autenticação baseada em tokens
- **bcryptjs** - Hash de senhas
- **express-validator** - Validação de dados de entrada
- **cors** - Configuração de CORS
- **helmet** - Middleware de segurança
- **morgan** - Logger de requisições HTTP

## Estrutura do Projeto

```
src/
├── config/          # Configurações (Firebase, etc.)
├── controllers/     # Controladores das rotas
├── middleware/      # Middlewares (autenticação, validação)
├── models/          # Modelos de dados (se necessário)
├── routes/          # Definição das rotas
├── services/        # Serviços de negócio
├── types/           # Definições de tipos TypeScript
├── utils/           # Utilitários e helpers
└── index.ts         # Arquivo principal do servidor
```

## Configuração

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar Variáveis de Ambiente

Copie o arquivo `.env.example` para `.env` e configure as variáveis:

```bash
cp .env.example .env
```

Configure as seguintes variáveis no arquivo `.env`:

- `PORT` - Porta do servidor (padrão: 3000)
- `NODE_ENV` - Ambiente de execução (development/production)
- `JWT_SECRET` - Chave secreta para JWT
- `JWT_EXPIRES_IN` - Tempo de expiração do JWT
- Configurações do Firebase (obtidas no console do Firebase)

### 3. Configurar Firebase

1. Acesse o [Console do Firebase](https://console.firebase.google.com/)
2. Crie um novo projeto ou use um existente
3. Ative o Firestore Database
4. Ative o Authentication
5. Gere uma chave de conta de serviço:
   - Vá em Configurações do Projeto > Contas de Serviço
   - Clique em "Gerar nova chave privada"
   - Baixe o arquivo JSON
   - Use os dados deste arquivo para configurar as variáveis de ambiente

## Scripts Disponíveis

```bash
# Desenvolvimento (com hot reload)
npm run dev

# Build do projeto
npm run build

# Executar versão compilada
npm start

# Executar testes
npm test
```

## API Endpoints

### Autenticação (`/api/auth`)

- `POST /login` - Login de usuário
- `POST /register` - Registro de usuário final
- `POST /register-admin` - Registro de administrador (apenas admin)
- `POST /register-technician` - Registro de técnico (apenas admin)
- `POST /logout` - Logout
- `GET /me` - Dados do usuário atual
- `PUT /change-password` - Alterar senha
- `POST /forgot-password` - Solicitar reset de senha
- `POST /reset-password` - Redefinir senha

### Usuários (`/api/users`)

- `GET /` - Listar todos os usuários (apenas admin)
- `GET /stats` - Estatísticas de usuários (apenas admin)
- `GET /type/:userType` - Usuários por tipo (apenas admin)
- `GET /technicians` - Listar técnicos (apenas admin)
- `GET /:id` - Dados de usuário específico
- `PUT /:id` - Atualizar usuário
- `PATCH /:id/deactivate` - Desativar usuário (apenas admin)
- `PATCH /:id/activate` - Ativar usuário (apenas admin)
- `DELETE /:id` - Excluir usuário (apenas admin)

### Estabelecimentos (`/api/establishments`)

- `GET /` - Listar estabelecimentos
- `GET /:id` - Dados de estabelecimento específico
- `POST /` - Criar estabelecimento (apenas admin)
- `PUT /:id` - Atualizar estabelecimento (apenas admin)
- `DELETE /:id` - Excluir estabelecimento (apenas admin)
- `PATCH /:id/deactivate` - Desativar estabelecimento (apenas admin)
- `PATCH /:id/activate` - Ativar estabelecimento (apenas admin)
- `GET /admin/stats` - Estatísticas de estabelecimentos (apenas admin)

### Ordens de Serviço (`/api/service-orders`)

- `GET /` - Listar ordens de serviço (filtradas por usuário)
- `GET /stats` - Estatísticas de ordens de serviço
- `GET /:id` - Dados de ordem específica
- `POST /` - Criar nova ordem de serviço
- `PUT /:id` - Atualizar ordem de serviço
- `PATCH /:id/assign` - Atribuir técnico (apenas admin)
- `PATCH /:id/cancel` - Cancelar ordem de serviço
- `PATCH /:id/feedback` - Adicionar feedback do usuário

### Dashboard (`/api/dashboard`)

- `GET /` - Dados do dashboard (adaptado ao tipo de usuário)
- `GET /reports` - Relatórios detalhados (apenas admin)

## Tipos de Usuário

### Administrador
- Pode criar, editar e excluir usuários, técnicos e estabelecimentos
- Acesso a todos os dashboards e relatórios
- Pode atribuir técnicos às ordens de serviço
- Visualiza todas as ordens de serviço

### Técnico
- Visualiza ordens atribuídas a ele
- Pode atualizar status das ordens (em progresso, concluída)
- Pode adicionar notas técnicas
- Dashboard com suas estatísticas de atendimento

### Usuário Final
- Pode criar novas ordens de serviço
- Visualiza apenas suas próprias ordens
- Pode fornecer feedback e avaliação
- Confirma a conclusão do serviço

## Status das Ordens de Serviço

1. **OPEN** - Ordem criada, aguardando atribuição
2. **ASSIGNED** - Técnico atribuído
3. **IN_PROGRESS** - Serviço em andamento
4. **COMPLETED** - Serviço concluído pelo técnico
5. **CONFIRMED** - Serviço confirmado pelo usuário
6. **CANCELLED** - Ordem cancelada

## Segurança

- Autenticação JWT
- Validação de dados de entrada
- Middleware de segurança (helmet)
- Controle de acesso baseado em roles
- Hash de senhas com bcrypt
- CORS configurado

## Desenvolvimento

Para contribuir com o projeto:

1. Clone o repositório
2. Instale as dependências
3. Configure as variáveis de ambiente
4. Execute `npm run dev` para iniciar o servidor de desenvolvimento
5. Faça suas alterações
6. Teste as funcionalidades
7. Submeta um pull request

## Logs

O sistema utiliza morgan para logging das requisições HTTP. Em ambiente de desenvolvimento, os logs são exibidos no console.

## Tratamento de Erros

O sistema possui middleware centralizado para tratamento de erros, retornando respostas JSON padronizadas com códigos de status HTTP apropriados.

