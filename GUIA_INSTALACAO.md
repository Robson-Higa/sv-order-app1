# Guia de Instalação - Sistema de Gestão de Ordens de Serviço

## Pré-requisitos

### Para o Backend (Node.js)
- Node.js 18+ 
- npm ou yarn
- Conta no Firebase (para configuração do banco de dados)

### Para o Frontend (React Native)
- Node.js 18+
- React Native CLI
- Android Studio (para Android)
- Xcode (para iOS - apenas no macOS)
- Dispositivo físico ou emulador

## Configuração do Firebase

1. **Criar projeto no Firebase:**
   - Acesse [Firebase Console](https://console.firebase.google.com/)
   - Clique em "Adicionar projeto"
   - Siga as instruções para criar o projeto

2. **Configurar Authentication:**
   - No console do Firebase, vá para "Authentication"
   - Ative o provedor "Email/senha"

3. **Configurar Firestore:**
   - Vá para "Firestore Database"
   - Crie o banco de dados em modo de teste
   - Configure as regras de segurança conforme necessário

4. **Obter credenciais:**
   - Vá para "Configurações do projeto" > "Contas de serviço"
   - Gere uma nova chave privada (arquivo JSON)
   - Salve o arquivo como `firebase-service-account.json`

## Instalação do Backend

1. **Navegar para o diretório do backend:**
   ```bash
   cd service-order-app/backend
   ```

2. **Instalar dependências:**
   ```bash
   npm install
   ```

3. **Configurar variáveis de ambiente:**
   ```bash
   cp .env.example .env
   ```
   
   Edite o arquivo `.env` com suas configurações:
   ```
   PORT=3000
   NODE_ENV=development
   JWT_SECRET=seu_jwt_secret_muito_seguro
   JWT_EXPIRES_IN=7d
   FIREBASE_PROJECT_ID=seu_projeto_firebase
   FIREBASE_CLIENT_EMAIL=seu_email_firebase
   FIREBASE_PRIVATE_KEY=sua_chave_privada_firebase
   ```

4. **Colocar o arquivo de credenciais do Firebase:**
   - Coloque o arquivo `firebase-service-account.json` na pasta `backend/`

5. **Compilar o projeto:**
   ```bash
   npm run build
   ```

6. **Iniciar o servidor:**
   ```bash
   npm run dev
   ```

   O servidor estará rodando em `http://localhost:3000`

## Instalação do Frontend

1. **Navegar para o diretório do frontend:**
   ```bash
   cd service-order-app/frontend
   ```

2. **Instalar dependências:**
   ```bash
   npm install
   ```

3. **Configurar Firebase no frontend:**
   Edite o arquivo `src/config/firebase.ts` com suas credenciais do Firebase:
   ```typescript
   const firebaseConfig = {
     apiKey: "sua_api_key",
     authDomain: "seu_projeto.firebaseapp.com",
     projectId: "seu_projeto_id",
     storageBucket: "seu_projeto.appspot.com",
     messagingSenderId: "123456789",
     appId: "sua_app_id"
   };
   ```

4. **Configurar URL da API:**
   Edite o arquivo `src/services/api.ts` e ajuste a URL base se necessário:
   ```typescript
   const API_BASE_URL = 'http://localhost:3000/api';
   ```

### Para Android

1. **Configurar ambiente Android:**
   - Instale o Android Studio
   - Configure as variáveis de ambiente (ANDROID_HOME, etc.)
   - Crie um AVD (Android Virtual Device) ou conecte um dispositivo físico

2. **Executar no Android:**
   ```bash
   npm run android
   ```

### Para iOS (apenas macOS)

1. **Instalar dependências do iOS:**
   ```bash
   cd ios && pod install && cd ..
   ```

2. **Executar no iOS:**
   ```bash
   npm run ios
   ```

## Estrutura de Usuários Padrão

O sistema suporta três tipos de usuários:

### 1. Administrador
- **Permissões:** Acesso total ao sistema
- **Funcionalidades:**
  - Gerenciar usuários e técnicos
  - Gerenciar estabelecimentos
  - Visualizar todos os dashboards
  - Gerar relatórios
  - Atribuir técnicos às ordens

### 2. Técnico
- **Permissões:** Gerenciar ordens atribuídas
- **Funcionalidades:**
  - Visualizar ordens atribuídas
  - Atualizar status das ordens
  - Adicionar notas técnicas
  - Dashboard pessoal

### 3. Usuário Final
- **Permissões:** Criar e acompanhar suas ordens
- **Funcionalidades:**
  - Criar novas ordens de serviço
  - Acompanhar status das ordens
  - Avaliar serviços prestados
  - Dashboard pessoal

## Primeiro Acesso

1. **Criar usuário administrador:**
   - Use a tela de registro do aplicativo
   - Selecione "Administrador" como tipo de usuário
   - O primeiro usuário criado terá privilégios administrativos

2. **Criar estabelecimentos:**
   - Faça login como administrador
   - Vá para a aba "Estabelecimentos"
   - Crie os estabelecimentos (ESFs) necessários

3. **Criar usuários e técnicos:**
   - Na aba "Usuários", crie os técnicos e usuários finais
   - Associe cada usuário ao estabelecimento apropriado

## Solução de Problemas

### Backend não inicia
- Verifique se o Node.js está instalado corretamente
- Confirme se as variáveis de ambiente estão configuradas
- Verifique se o arquivo de credenciais do Firebase está no local correto

### Frontend não conecta com o backend
- Confirme se o backend está rodando na porta 3000
- Verifique a URL da API no arquivo `src/services/api.ts`
- Para dispositivos físicos, use o IP da máquina ao invés de localhost

### Erros de compilação do React Native
- Execute `npm install` novamente
- Limpe o cache: `npx react-native start --reset-cache`
- Para Android: `cd android && ./gradlew clean && cd ..`

### Problemas com Firebase
- Verifique se as credenciais estão corretas
- Confirme se os serviços (Authentication, Firestore) estão habilitados
- Verifique as regras de segurança do Firestore

## Recursos Adicionais

- **Documentação do React Native:** https://reactnative.dev/docs/getting-started
- **Documentação do Firebase:** https://firebase.google.com/docs
- **Documentação do Express.js:** https://expressjs.com/

## Suporte

Para dúvidas ou problemas, consulte:
1. A documentação oficial das tecnologias utilizadas
2. Os arquivos README.md específicos de cada módulo
3. Os comentários no código fonte

