# Frontend - Sistema de Gestão de Ordens de Serviço

Aplicativo React Native para gestão de ordens de serviços com diferentes tipos de usuários.

## Funcionalidades

### Para Usuários Finais
- Criar novas ordens de serviço
- Acompanhar status das ordens
- Avaliar serviços prestados
- Dashboard com estatísticas pessoais

### Para Técnicos
- Visualizar ordens atribuídas
- Atualizar status das ordens
- Adicionar notas técnicas
- Dashboard com métricas de desempenho

### Para Administradores
- Gerenciar usuários e técnicos
- Gerenciar estabelecimentos
- Atribuir técnicos às ordens
- Dashboard completo com relatórios

## Tecnologias Utilizadas

- **React Native** - Framework para desenvolvimento mobile
- **TypeScript** - Tipagem estática
- **React Navigation** - Navegação entre telas
- **Firebase** - Autenticação e banco de dados
- **React Native Vector Icons** - Ícones
- **AsyncStorage** - Armazenamento local

## Estrutura do Projeto

```
src/
├── components/          # Componentes reutilizáveis
├── contexts/           # Contextos React (AuthContext)
├── hooks/              # Hooks customizados
├── navigation/         # Configuração de navegação
├── screens/            # Telas do aplicativo
├── services/           # Serviços de API
├── types/              # Definições de tipos TypeScript
└── utils/              # Utilitários
```

## Configuração

1. **Instalar dependências:**
   ```bash
   npm install
   ```

2. **Configurar Firebase:**
   - Edite `src/config/firebase.ts` com suas credenciais do Firebase

3. **Configurar backend:**
   - Certifique-se de que o backend está rodando na porta 3000
   - Ajuste a URL da API em `src/services/api.ts` se necessário

## Executar o Aplicativo

### Android
```bash
npm run android
```

### iOS
```bash
npm run ios
```

### Metro Bundler
```bash
npm start
```

## Telas Implementadas

### Autenticação
- **LoginScreen** - Tela de login
- **RegisterScreen** - Tela de registro

### Principais
- **DashboardScreen** - Dashboard adaptado por tipo de usuário
- **ServiceOrdersScreen** - Lista de ordens de serviço
- **ServiceOrderDetailsScreen** - Detalhes da ordem
- **CreateServiceOrderScreen** - Criação de nova ordem

### Administrativas (apenas para admins)
- **UsersScreen** - Gestão de usuários
- **EstablishmentsScreen** - Gestão de estabelecimentos

### Perfil
- **ProfileScreen** - Perfil do usuário

## Funcionalidades por Tipo de Usuário

### Usuário Final
- ✅ Criar ordens de serviço
- ✅ Visualizar suas ordens
- ✅ Avaliar serviços
- ✅ Dashboard personalizado

### Técnico
- ✅ Visualizar ordens atribuídas
- ✅ Atualizar status das ordens
- ✅ Adicionar notas técnicas
- ✅ Dashboard com métricas

### Administrador
- ✅ Todas as funcionalidades anteriores
- ✅ Gerenciar usuários
- ✅ Gerenciar estabelecimentos
- ✅ Atribuir técnicos
- ✅ Dashboard completo

## Próximos Passos

1. Implementar notificações push
2. Adicionar modo offline
3. Implementar relatórios em PDF
4. Adicionar chat entre usuários e técnicos
5. Implementar geolocalização

## Observações

- O aplicativo está configurado para funcionar com o backend Node.js
- Certifique-se de que o Firebase está configurado corretamente
- Para produção, configure as variáveis de ambiente adequadamente

