"use client"

import { createContext, useContext, useEffect, useMemo, useState } from 'react'

export type Locale = 'pt-BR' | 'en-US'

const pt = {
  skipContent: 'Pular para o conteúdo principal',
  navStudy: 'Estudar', navStudyLabel: 'Espaço de estudo',
  navMap: 'Analisar', navMapLabel: 'Mapa do conhecimento',
  navPractice: 'Criar', navPracticeLabel: 'Projeto de prática',
  mainNavigation: 'Navegação principal', brandLabel: 'MasterMe, ir para o espaço de estudo',
  lightTheme: 'Ativar tema claro', darkTheme: 'Ativar tema escuro', language: 'Idioma',
  logout: 'Sair da conta',
  studyActive: 'ESTUDO ATIVO', currentNode: 'Nó atual', material: 'Material', concept: 'Conceito', newSession: 'Nova sessão',
  checkingMaterial: 'Verificando o contexto do material…', extractContext: 'Extrair contexto', extractingQueue: 'Colocando na fila…',
  addMaterial: 'Adicionar novo material', referenceMaterial: 'Material de referência', chooseConcept: 'Escolha um conceito',
  chooseConceptDescription: 'Inicie uma sessão para receber uma pergunta gerada a partir do material.',
  contextNotExtracted: 'Contexto ainda não extraído', contextNotExtractedDescription: 'Use a ação acima para transformar o material em conceitos estudáveis.',
  nodeChallenge: 'Desafio deste nó', edgeChallenge: 'Teste de caso-limite', conceptContext: 'Contexto do conceito', prerequisites: 'Pré-requisitos',
  originalEvidence: 'Ver trecho original usado como evidência', explainMechanism: 'Explique o mecanismo com suas próprias palavras.',
  testLimits: 'Teste voluntariamente os limites da sua explicação.', minimumAnswer: 'Respostas com menos de 20 caracteres não são aceitas.',
  yourExplanation: 'Sua explicação', yourEdgeAnswer: 'Sua resposta ao caso', words: 'palavras', answerPlaceholder: 'Explique o seu raciocínio…',
  groundedDiagnostic: 'O diagnóstico usa somente o material selecionado.', evaluating: 'Avaliando…', validateAnswer: 'Validar resposta · 1 uso de IA', retry: 'Tentar validar novamente',
  explanationComplete: 'Explicação concluída', explanationPassed: 'Você explicou este conceito com consistência.',
  edgeOptional: 'O caso-limite é opcional e não altera esta aprovação.', prepareEdge: 'Testar em um caso-limite', preparing: 'Preparando…', edgePassed: 'Caso-limite aprovado',
  diagnostic: 'Diagnóstico', correctPoint: 'Você acertou', missingPoint: 'Faltou esclarecer', nextStep: 'Próximo passo',
  statusPassed: 'Aprovado', statusIncomplete: 'Quase lá', statusLogicalBreak: 'Revisar mecanismo',
  localizeTitle: 'Conteúdo gerado em outro idioma', localizeDescription: 'Traduza conceitos e perguntas sem alterar o trecho original nem seu histórico.',
  localizeAction: 'Localizar para português · 1 uso de IA', localizing: 'Localizando…',
  workspaceReady: 'Seu espaço está pronto', addFirstMaterial: 'Adicione o primeiro material', onboardingDescription: 'O MasterMe transforma o conteúdo em um mapa de conceitos e prepara sessões de estudo ativo.',
  addStep: 'Adicione', addStepDescription: 'Cole um texto ou envie um arquivo.', extractStep: 'Extraia', extractStepDescription: 'A IA organiza os conceitos centrais.', explainStep: 'Explique', explainStepDescription: 'Responda e receba um diagnóstico.',
  studyBase: 'Base do estudo', startWithMaterial: 'Comece com um material', materialFormDescription: 'Cole texto ou envie um PDF, Markdown ou TXT. A extração começa após salvar.', pasteText: 'Colar texto', uploadFile: 'Enviar arquivo', title: 'Título', optionalFilename: 'Opcional; o nome do arquivo será usado se ficar vazio.', titlePlaceholder: 'Dê um título ao material', content: 'Conteúdo', contentPlaceholder: 'Cole ou escreva o conteúdo que deseja estudar', file: 'Arquivo', fileHelp: 'PDF com texto selecionável, Markdown ou TXT · até 15 MiB', savingQueue: 'Salvando e enfileirando…', uploadExtract: 'Enviar e extrair arquivo', createExtract: 'Criar e extrair contexto',
  authEyebrow: 'MASTERME · ESTUDO ATIVO', authTitle: 'Aprenda explicando, não apenas relendo.', authDescription: 'Transforme seus materiais em conceitos, pratique com desafios guiados e acompanhe seu domínio.', authStepUpload: 'Envie seu material', authStepMap: 'Extraia o mapa de conhecimento', authStepTest: 'Teste sua explicação', createAccount: 'Crie sua conta', welcomeBack: 'Boas-vindas de volta', createDescription: 'Comece uma biblioteca privada para seus estudos.', loginDescription: 'Entre para continuar de onde parou.', login: 'Entrar', signup: 'Criar conta', email: 'E-mail', password: 'Senha', confirmPassword: 'Confirmar senha', passwordHint: 'Use pelo menos 8 caracteres.', passwordPlaceholder: 'Mínimo de 8 caracteres', currentPasswordPlaceholder: 'Sua senha', show: 'Mostrar', hide: 'Ocultar', passwordsMismatch: 'As senhas não coincidem.', waiting: 'Aguarde…', createMyAccount: 'Criar minha conta', privateLibrary: 'Seus materiais e sessões ficam isolados na sua conta.',
} as const

type MessageKey = keyof typeof pt
const en: Record<MessageKey, string> = {
  skipContent: 'Skip to main content', navStudy: 'Study', navStudyLabel: 'Study workspace', navMap: 'Analyze', navMapLabel: 'Knowledge map', navPractice: 'Create', navPracticeLabel: 'Practice project', mainNavigation: 'Main navigation', brandLabel: 'MasterMe, go to study workspace', lightTheme: 'Use light theme', darkTheme: 'Use dark theme', language: 'Language', logout: 'Sign out', studyActive: 'ACTIVE STUDY', currentNode: 'Current node', material: 'Material', concept: 'Concept', newSession: 'New session', checkingMaterial: 'Checking material context…', extractContext: 'Extract context', extractingQueue: 'Adding to queue…', addMaterial: 'Add new material', referenceMaterial: 'Reference material', chooseConcept: 'Choose a concept', chooseConceptDescription: 'Start a session to receive a question generated from the material.', contextNotExtracted: 'Context not extracted yet', contextNotExtractedDescription: 'Use the action above to turn the material into concepts you can study.', nodeChallenge: 'Node challenge', edgeChallenge: 'Edge-case test', conceptContext: 'Concept context', prerequisites: 'Prerequisites', originalEvidence: 'View the original excerpt used as evidence', explainMechanism: 'Explain the mechanism in your own words.', testLimits: 'Deliberately test the limits of your explanation.', minimumAnswer: 'Answers shorter than 20 characters are not accepted.', yourExplanation: 'Your explanation', yourEdgeAnswer: 'Your answer to the case', words: 'words', answerPlaceholder: 'Explain your reasoning…', groundedDiagnostic: 'The diagnostic uses only the selected material.', evaluating: 'Evaluating…', validateAnswer: 'Validate answer · 1 AI use', retry: 'Try validation again', explanationComplete: 'Explanation complete', explanationPassed: 'You explained this concept consistently.', edgeOptional: 'The edge case is optional and does not change this approval.', prepareEdge: 'Test an edge case', preparing: 'Preparing…', edgePassed: 'Edge case approved', diagnostic: 'Diagnostic', correctPoint: 'What you got right', missingPoint: 'What needs clarification', nextStep: 'Next step', statusPassed: 'Approved', statusIncomplete: 'Almost there', statusLogicalBreak: 'Review the mechanism', localizeTitle: 'Generated content is in another language', localizeDescription: 'Localize concepts and questions without changing the original excerpt or your history.', localizeAction: 'Localize to English · 1 AI use', localizing: 'Localizing…', workspaceReady: 'Your workspace is ready', addFirstMaterial: 'Add your first material', onboardingDescription: 'MasterMe turns content into a concept map and prepares active-study sessions.', addStep: 'Add', addStepDescription: 'Paste text or upload a file.', extractStep: 'Extract', extractStepDescription: 'AI organizes the central concepts.', explainStep: 'Explain', explainStepDescription: 'Answer and receive a diagnostic.', studyBase: 'Study source', startWithMaterial: 'Start with a material', materialFormDescription: 'Paste text or upload a PDF, Markdown, or TXT file. Extraction starts after saving.', pasteText: 'Paste text', uploadFile: 'Upload file', title: 'Title', optionalFilename: 'Optional; the filename is used when left blank.', titlePlaceholder: 'Give the material a title', content: 'Content', contentPlaceholder: 'Paste or write the content you want to study', file: 'File', fileHelp: 'Selectable-text PDF, Markdown, or TXT · up to 15 MiB', savingQueue: 'Saving and queuing…', uploadExtract: 'Upload and extract', createExtract: 'Create and extract context', authEyebrow: 'MASTERME · ACTIVE STUDY', authTitle: 'Learn by explaining, not just rereading.', authDescription: 'Turn your materials into concepts, practice with guided challenges, and track your understanding.', authStepUpload: 'Upload your material', authStepMap: 'Extract the knowledge map', authStepTest: 'Test your explanation', createAccount: 'Create your account', welcomeBack: 'Welcome back', createDescription: 'Start a private library for your studies.', loginDescription: 'Sign in to continue where you left off.', login: 'Sign in', signup: 'Create account', email: 'Email', password: 'Password', confirmPassword: 'Confirm password', passwordHint: 'Use at least 8 characters.', passwordPlaceholder: 'At least 8 characters', currentPasswordPlaceholder: 'Your password', show: 'Show', hide: 'Hide', passwordsMismatch: 'Passwords do not match.', waiting: 'Please wait…', createMyAccount: 'Create my account', privateLibrary: 'Your materials and sessions remain isolated in your account.',
}

type I18nValue = { locale: Locale; setLocale: (locale: Locale) => void; t: (key: MessageKey) => string }
const I18nContext = createContext<I18nValue | null>(null)

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('pt-BR')
  useEffect(() => {
    const stored = window.localStorage.getItem('masterme:locale')
    const selected: Locale = stored === 'en-US' ? 'en-US' : 'pt-BR'
    setLocaleState(selected)
    document.documentElement.lang = selected
  }, [])
  const setLocale = (next: Locale) => {
    setLocaleState(next)
    window.localStorage.setItem('masterme:locale', next)
    document.documentElement.lang = next
  }
  const value = useMemo<I18nValue>(() => ({ locale, setLocale, t: (key) => (locale === 'pt-BR' ? pt : en)[key] }), [locale])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nValue {
  const value = useContext(I18nContext)
  if (!value) throw new Error('useI18n deve ser usado dentro de I18nProvider.')
  return value
}
