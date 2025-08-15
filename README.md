# Sistema de Gestão de Ordens de Serviço

Este projeto consiste em um sistema completo de gestão de ordens de serviço, desenvolvido com React Native para o frontend e Node.js/TypeScript para o backend, utilizando Firebase para autenticação e armazenamento de dados.

## Estrutura do Projeto

```
service-order-app/
├── backend/             # Código do backend (Node.js/TypeScript)
├── frontend/            # Código do frontend (React Native/TypeScript)
└── README.md            # Este arquivo
```

## Funcionalidades Principais

- **Sistema de Login:** Autenticação para diferentes perfis de usuário (Administrador, Técnico, Usuário Final).
- **Gestão de Usuários:** Administradores podem cadastrar e gerenciar outros administradores, técnicos e usuários.
- **Gestão de Estabelecimentos:** Cadastro e exclusão de estabelecimentos (ESFs).
- **Gestão de Demandas:**
  - Usuários podem abrir novas demandas, descrever problemas e fornecer feedback.
  - Técnicos podem visualizar demandas, descrever o serviço prestado e finalizar demandas.
  - Demandas são marcadas como concluídas apenas após a confirmação do usuário.
- **Dashboards:**
  - Administradores: Acesso a todos os dashboards, demandas solicitadas e feedbacks.
  - Técnicos: Dashboard de atendimento com suas demandas.
  - Usuários: Dashboard com histórico de demandas, status e gráficos.
- **Relatórios:** Geração de relatórios em PDF com histórico de demandas, filtráveis por estabelecimento, técnico ou status.
- **Integração Firebase:** Utilização do Firebase para armazenamento de dados de usuários, estabelecimentos e demandas, além de autenticação.

## Configuração e Execução

As instruções detalhadas para configurar e executar o backend e o frontend serão fornecidas nas respectivas pastas `backend/` e `frontend/`.

