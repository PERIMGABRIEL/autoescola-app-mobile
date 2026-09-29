# Autoescola Jardim Botânico | Aplicativo Mobile

Aplicativo mobile do portal do aluno da Autoescola Jardim Botânico. O projeto leva para o celular o acompanhamento de aulas práticas, créditos e horários disponíveis, reduzindo a dependência de atendimento manual.

## Contexto

A autoescola precisava de uma forma simples para que alunos acompanhassem a própria jornada pelo celular, sem expor dados de outros alunos e sem permitir conflitos de agenda. O aplicativo é integrado ao mesmo ecossistema do portal web e segue as regras de disponibilidade definidas pela operação.

## Funcionalidades

- Autenticação de alunos com Firebase Authentication
- Cadastro e acesso ao portal do aluno
- Visualização de créditos e aulas agendadas
- Consulta de horários disponíveis por modalidade
- Agendamento de aulas práticas respeitando reservas e disponibilidades
- Solicitações operacionais pelo WhatsApp da autoescola
- Persistência de sessão no dispositivo

## Tecnologias

- **React Native** e **React 19**
- **Expo SDK 54** e **EAS Build**
- **Firebase Authentication** e **Cloud Firestore**
- **AsyncStorage** para persistência local de sessão
- **DateTimePicker** para seleção de datas
- JavaScript, npm e Git/GitHub

## Arquitetura

- App.js: inicialização, estado de autenticação e assinaturas de dados
- src/screens: telas de autenticação e área do aluno
- src/services: acesso ao Firebase, perfil do aluno e regras de agendamento
- src/theme: tokens visuais e identidade da Autoescola Jardim Botânico

As telas reagem em tempo real às alterações de perfil, reservas e disponibilidades. As regras críticas de acesso e escrita ficam protegidas no Firebase, e o app não contém chaves administrativas ou contas de serviço.

## Executar localmente

Pré-requisitos: Node.js 20.19.4 ou superior e uma configuração válida do Firebase para desenvolvimento.

~~~bash
npm install
npm start
~~~

Comandos úteis:

~~~bash
npm run android
npm run ios
npm run web
npm run doctor
~~~

## Distribuição

O projeto possui configuração EAS para gerar builds Android e iOS. A versão Android está em teste fechado na Google Play; a publicação para alunos será feita após a validação do ciclo de testes.

## Privacidade

Este repositório não inclui dados reais de alunos, senhas, tokens administrativos ou arquivos de conta de serviço. Alterações no aplicativo devem respeitar as regras do Firestore e os procedimentos de privacidade do sistema.

## Próximos passos

- Ampliar testes automatizados
- Evoluir monitoramento e tratamento de erros
- Construir uma API própria com Java, Spring Boot e PostgreSQL em paralelo ao sistema atual
