# Estrutura do Projeto - Sistema de Gestão de Ordens de Serviço

## Localização do Projeto
**Diretório Principal:** `/home/ubuntu/service-order-app/`

## Estrutura Completa

```
service-order-app/
├── README.md                           # Documentação principal do projeto
├── ESTRUTURA_PROJETO.md               # Este arquivo com a estrutura
├── backend/                           # Código do backend (Node.js/TypeScript)
│   ├── README.md                      # Documentação do backend
│   ├── package.json                   # Dependências e scripts do backend
│   ├── package-lock.json              # Lock das dependências
│   ├── tsconfig.json                  # Configuração do TypeScript
│   ├── .env.example                   # Exemplo de variáveis de ambiente
│   └── src/                           # Código fonte do backend
│       ├── index.ts                   # Arquivo principal do servidor
│       ├── config/                    # Configurações
│       │   └── firebase.ts            # Configuração do Firebase
│       ├── controllers/               # Controladores das rotas
│       │   ├── AuthController.ts      # Controlador de autenticação
│       │   ├── UserController.ts      # Controlador de usuários
│       │   ├── EstablishmentController.ts # Controlador de estabelecimentos
│       │   ├── ServiceOrderController.ts  # Controlador de ordens de serviço
│       │   └── DashboardController.ts # Controlador de dashboard
│       ├── middleware/                # Middlewares
│       │   ├── auth.ts                # Middleware de autenticação
│       │   └── validation.ts          # Middleware de validação
│       ├── routes/                    # Definição das rotas
│       │   ├── auth.ts                # Rotas de autenticação
│       │   ├── users.ts               # Rotas de usuários
│       │   ├── establishments.ts      # Rotas de estabelecimentos
│       │   ├── serviceOrders.ts       # Rotas de ordens de serviço
│       │   └── dashboard.ts           # Rotas de dashboard
│       ├── types/                     # Definições de tipos TypeScript
│       │   └── index.ts               # Tipos principais
│       ├── utils/                     # Utilitários e helpers
│       │   └── helpers.ts             # Funções auxiliares
│       ├── models/                    # Modelos de dados (vazio por enquanto)
│       └── services/                  # Serviços de negócio (vazio por enquanto)
└── frontend/                          # Código do frontend (React Native/TypeScript)
    ├── package.json                   # Dependências e scripts do frontend
    ├── package-lock.json              # Lock das dependências
    ├── tsconfig.json                  # Configuração do TypeScript
    ├── babel.config.js                # Configuração do Babel
    └── src/                           # Código fonte do frontend
        ├── types/                     # Definições de tipos TypeScript
        │   └── index.ts               # Tipos principais
        ├── components/                # Componentes reutilizáveis
        ├── screens/                   # Telas do aplicativo
        ├── navigation/                # Configuração de navegação
        ├── services/                  # Serviços de API
        ├── contexts/                  # Contextos React
        ├── hooks/                     # Hooks customizados
        └── utils/                     # Utilitários
```

## Status Atual do Desenvolvimento

### ✅ Concluído
- **Backend completo** com todas as funcionalidades:
  - Sistema de autenticação JWT
  - CRUD de usuários, estabelecimentos e ordens de serviço
  - Controle de acesso baseado em roles (Admin, Técnico, Usuário Final)
  - Integração com Firebase Firestore
  - API RESTful completa
  - Middleware de segurança e validação
  - Documentação completa

- **Frontend - Estrutura inicial**:
  - Configuração do React Native com TypeScript
  - Instalação de todas as dependências necessárias
  - Estrutura de pastas organizada
  - Tipos TypeScript definidos

### 🚧 Em Desenvolvimento
- Integração Firebase no frontend
- Telas e componentes do React Native
- Sistema de navegação
- Dashboards e gráficos
- Geração de relatórios PDF

## Tecnologias Utilizadas

### Backend
- Node.js + TypeScript
- Express.js
- Firebase Admin SDK
- JWT para autenticação
- bcryptjs para hash de senhas
- express-validator para validação

### Frontend
- React Native + TypeScript
- React Navigation
- React Native Paper (UI)
- Firebase SDK
- React Native Chart Kit (gráficos)
- AsyncStorage

## Como Executar

### Backend
```bash
cd service-order-app/backend
npm install
cp .env.example .env
# Configure as variáveis de ambiente
npm run dev
```

### Frontend
```bash
cd service-order-app/frontend
npm install
npm start
```

## Próximos Passos
1. Finalizar integração Firebase no frontend
2. Implementar sistema de autenticação no app
3. Criar todas as telas necessárias
4. Implementar dashboards com gráficos
5. Adicionar geração de relatórios PDF
6. Testes e otimizações finais

