'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Icon } from '../lib/icons'
import { loginHrefFor, planLoginHref, type PlanId } from '../lib/auth-redirect'
import type { Locale } from '../lib/i18n'
import { ThemeToggle } from './theme-toggle'
import styles from './landing-page.module.css'

type MarketingPlan = {
  id: PlanId
  name: string
  price: string
  duration: string
  dailyLimit: string
  periodLimit: string
  description: string
  action: string
  footnote: string
  featured?: boolean
}

type LandingCopy = {
  skipContent: string
  brandLabel: string
  navigationLabel: string
  languageLabel: string
  lightTheme: string
  darkTheme: string
  signIn: string
  nav: { method: string; experience: string; plans: string }
  hero: { eyebrow: string; title: string; emphasis: string; description: string; primaryAction: string; secondaryAction: string; principlesLabel: string; principles: readonly string[] }
  method: { kicker: string; title: string }
  journey: readonly { number: string; title: string; description: string }[]
  experience: {
    eyebrow: string
    title: string
    description: string
    problemKicker: string
    problemTitle: string
    problemDescription: string
    mapKicker: string
    mapTitle: string
    mapDescription: string
    mapLabel: string
    mapNodes: readonly { label: string; detail: string; tone: 'blue' | 'green' | 'amber' }[]
    mapSignal: { kicker: string; title: string; description: string }
    pathsLabel: string
    paths: readonly { title: string; description: string }[]
    diagnosticKicker: string
    diagnosticTitle: string
    diagnosticQuote: string
    transferKicker: string
    transferTitle: string
    transferItems: readonly string[]
  }
  pricing: { kicker: string; title: string; description: string; freeDescription: string; featuredBadge: string; simultaneousLimits: string; creditNote: string }
  plans: readonly MarketingPlan[]
  faq: { kicker: string; title: string; items: readonly { question: string; answer: string; paid?: boolean }[] }
  finalCta: { kicker: string; title: string; action: string }
  footer: { description: string; method: string; plans: string; signIn: string }
  visual: { nodes: readonly string[]; reasoning: string; explained: string; testBoundary: string; liveMap: string; caption: string }
}

const landingCopy = {
  'pt-BR': {
    skipContent: 'Pular para o conteúdo principal',
    brandLabel: 'MasterMe, página inicial',
    navigationLabel: 'Navegação da página',
    languageLabel: 'Idioma',
    lightTheme: 'Usar tema claro',
    darkTheme: 'Usar tema escuro',
    signIn: 'Entrar',
    nav: { method: 'Como funciona', experience: 'Experiência', plans: 'Planos' },
    hero: {
      eyebrow: 'Estudo ativo, no seu contexto',
      title: 'Pare de apenas reler.',
      emphasis: 'Aprenda explicando.',
      description: 'O MasterMe transforma materiais técnicos em mapas de conhecimento, diagnósticos objetivos e projetos que colocam seu entendimento em movimento.',
      primaryAction: 'Começar gratuitamente',
      secondaryAction: 'Conhecer o método',
      principlesLabel: 'Princípios do produto',
      principles: ['Biblioteca privada', 'Diagnóstico ancorado', 'Sem trilha obrigatória'],
    },
    method: { kicker: 'UM MÉTODO, TRÊS MOVIMENTOS', title: 'Do conteúdo reconhecido ao conhecimento que você consegue usar.' },
    journey: [
      { number: '01', title: 'Traga o que você já estuda', description: 'Cole um texto ou envie PDF, Markdown e TXT. O conteúdo original permanece como referência.' },
      { number: '02', title: 'Enxergue a estrutura', description: 'O material vira um mapa navegável de conceitos, relações e perguntas específicas.' },
      { number: '03', title: 'Explique ou construa', description: 'Explique para receber um diagnóstico ancorado, ou gere um projeto de prática diretamente do material.' },
    ],
    experience: {
      eyebrow: 'Clareza antes de volume',
      title: 'Ler até reconhecer não é o mesmo que conseguir explicar.',
      description: 'O MasterMe torna seu raciocínio visível para que você pare de confundir familiaridade com compreensão — e escolha o próximo movimento com intenção.',
      problemKicker: 'O PROBLEMA NÃO É FALTA DE CONTEÚDO',
      problemTitle: 'Você lembra da frase. Mas consegue sustentar a ideia?',
      problemDescription: 'A leitura passiva cria uma sensação confortável de domínio. O mapa separa o que está no material do que você realmente consegue conectar, explicar e usar.',
      mapKicker: 'MAPA DE CONHECIMENTO',
      mapTitle: 'Enxergue o raciocínio por trás do texto — sem virar refém de uma trilha.',
      mapDescription: 'Conceitos, relações e perguntas ficam no mesmo contexto. As conexões ajudam você a investigar; elas nunca bloqueiam seu próximo passo.',
      mapLabel: 'Demonstração de um mapa de conhecimento',
      mapNodes: [
        { label: 'Material', detail: 'fonte preservada', tone: 'blue' },
        { label: 'Conceito', detail: 'ideia central', tone: 'blue' },
        { label: 'Relação', detail: 'contexto, não bloqueio', tone: 'amber' },
        { label: 'Diagnóstico', detail: 'lacuna específica', tone: 'green' },
      ],
      mapSignal: { kicker: 'O QUE MUDA', title: '“Entendi” vira uma hipótese que você consegue verificar.', description: 'O diagnóstico aponta o mecanismo que falta, ancorado no seu próprio material — sem entregar uma resposta pronta.' },
      pathsLabel: 'Escolha o caminho que faz sentido agora',
      paths: [
        { title: 'Explorar livremente', description: 'Abra qualquer conceito e siga as relações que fizerem sentido agora.' },
        { title: 'Explicar com suas palavras', description: 'Teste o seu raciocínio e receba um diagnóstico do ponto que precisa de clareza.' },
        { title: 'Começar pela prática', description: 'Escolha o foco a partir do material e gere um projeto curto — sem iniciar uma explicação.' },
        { title: 'Testar um caso-limite', description: 'Após uma explicação aprovada, solicite esse aprofundamento se quiser — nunca por obrigação.' },
      ],
      diagnosticKicker: 'DIAGNÓSTICO',
      diagnosticTitle: 'Não é uma nota. É o próximo ponto do seu raciocínio.',
      diagnosticQuote: '“Você reconheceu a regra. Agora explique por que ela elimina metade das opções.”',
      transferKicker: 'TRANSFERÊNCIA',
      transferTitle: 'Faça o entendimento sair da página e entrar em ação.',
      transferItems: ['Objetivo direto', 'Entregáveis verificáveis', 'Primeiro passo claro'],
    },
    pricing: {
      kicker: 'ACESSO TRANSPARENTE',
      title: 'Escolha o horizonte do seu estudo.',
      description: 'Planos pagos são compras únicas. Sem assinatura e sem renovação automática.',
      freeDescription: 'O acesso gratuito está disponível enquanto preparamos os demais planos.',
      featuredBadge: 'MAIOR HORIZONTE',
      simultaneousLimits: 'Os limites diário e do período valem simultaneamente.',
      creditNote: 'No plano Livre, cada tentativa enviada ao Gemini consome 1 crédito. O saldo renova diariamente; tentativas de fallback também contam. A capacidade do provedor é compartilhada.',
    },
    plans: [
      { id: 'FREE', name: 'Livre', price: 'R$ 0', duration: 'sem prazo', dailyLimit: '100 créditos por dia', periodLimit: '', description: 'Para conhecer o método com seu próprio material.', action: 'Começar gratuitamente', footnote: 'Não exige pagamento.' },
      { id: 'ESSENTIAL', name: 'Essencial', price: 'R$ 29,90', duration: 'por 30 dias', dailyLimit: '120 créditos por dia', periodLimit: '1.500 créditos por vigência', description: 'Para transformar uma fase intensa de estudo em prática.', action: 'Escolher Essencial', footnote: 'Pagamento único · sem renovação automática.' },
      { id: 'PRO', name: 'Pro', price: 'R$ 249', duration: 'por 365 dias', dailyLimit: '180 créditos por dia', periodLimit: '15.000 créditos por vigência', description: 'Para manter uma biblioteca ativa ao longo do ano.', action: 'Escolher Pro', footnote: 'Pagamento único · sem renovação automática.', featured: true },
    ],
    faq: {
      kicker: 'SEM LETRAS MIÚDAS',
      title: 'Perguntas frequentes',
      items: [
        { question: 'Os planos pagos são assinaturas?', answer: 'Não. Essencial e Pro são pagamentos únicos para o período informado e não possuem renovação automática.', paid: true },
        { question: 'A IA responde às perguntas por mim?', answer: 'Não. Ela organiza seu material e diagnostica sua explicação. O raciocínio continua sendo seu.' },
        { question: 'Preciso seguir uma ordem no mapa?', answer: 'Não. As relações dão contexto, mas você pode abrir qualquer conceito ou gerar uma prática quando quiser.' },
      ],
    },
    finalCta: { kicker: 'SEU PRÓXIMO MATERIAL PODE VIRAR PRÁTICA', title: 'Estude menos no automático. Entenda mais por intenção.', action: 'Criar meu espaço' },
    footer: { description: 'Estudo ativo para materiais técnicos.', method: 'Método', plans: 'Planos', signIn: 'Entrar' },
    visual: {
      nodes: ['Material', 'Conceito', 'Explicação', 'Prática', 'Diagnóstico'],
      reasoning: 'RACIOCÍNIO ANCORADO',
      explained: 'Você explicou o mecanismo.',
      testBoundary: 'Agora teste onde ele deixa de valer.',
      liveMap: 'MAPA VIVO',
      caption: 'Do texto à aplicação',
    },
  },
  'en-US': {
    skipContent: 'Skip to main content',
    brandLabel: 'MasterMe, home page',
    navigationLabel: 'Page navigation',
    languageLabel: 'Language',
    lightTheme: 'Use light theme',
    darkTheme: 'Use dark theme',
    signIn: 'Sign in',
    nav: { method: 'How it works', experience: 'Experience', plans: 'Plans' },
    hero: {
      eyebrow: 'Active study, in your context',
      title: 'Stop merely rereading.',
      emphasis: 'Learn by explaining.',
      description: 'MasterMe turns technical materials into knowledge maps, objective diagnostics, and projects that put your understanding into motion.',
      primaryAction: 'Start for free',
      secondaryAction: 'Explore the method',
      principlesLabel: 'Product principles',
      principles: ['Private library', 'Grounded diagnostics', 'No mandatory path'],
    },
    method: { kicker: 'ONE METHOD, THREE MOVEMENTS', title: 'From familiar content to knowledge you can actually use.' },
    journey: [
      { number: '01', title: 'Bring what you already study', description: 'Paste text or upload PDF, Markdown, and TXT files. The original content remains your reference.' },
      { number: '02', title: 'See the structure', description: 'Your material becomes a navigable map of concepts, relationships, and focused questions.' },
      { number: '03', title: 'Explain or build', description: 'Explain to receive a grounded diagnostic, or generate a practice project directly from the material.' },
    ],
    experience: {
      eyebrow: 'Clarity before volume',
      title: 'Recognizing a sentence is not the same as being able to explain it.',
      description: 'MasterMe makes your reasoning visible so you stop confusing familiarity with understanding — and choose your next move with intention.',
      problemKicker: 'THE PROBLEM IS NOT A LACK OF CONTENT',
      problemTitle: 'You remember the sentence. Can you defend the idea?',
      problemDescription: 'Passive reading creates a comfortable feeling of mastery. The map separates what is in the material from what you can actually connect, explain, and use.',
      mapKicker: 'KNOWLEDGE MAP',
      mapTitle: 'See the reasoning behind the text — without becoming trapped in a path.',
      mapDescription: 'Concepts, relationships, and questions stay in the same context. Connections help you investigate; they never block your next step.',
      mapLabel: 'Knowledge map demonstration',
      mapNodes: [
        { label: 'Material', detail: 'source preserved', tone: 'blue' },
        { label: 'Concept', detail: 'central idea', tone: 'blue' },
        { label: 'Relationship', detail: 'context, not a lock', tone: 'amber' },
        { label: 'Diagnostic', detail: 'specific gap', tone: 'green' },
      ],
      mapSignal: { kicker: 'WHAT CHANGES', title: '“I get it” becomes a hypothesis you can verify.', description: 'The diagnostic points to the missing mechanism, grounded in your own material — without handing you a ready-made answer.' },
      pathsLabel: 'Choose the path that makes sense now',
      paths: [
        { title: 'Explore freely', description: 'Open any concept and follow the relationships that matter right now.' },
        { title: 'Explain in your own words', description: 'Test your reasoning and receive a diagnostic for the point that needs clarity.' },
        { title: 'Start with practice', description: 'Choose a focus from the material and generate a short project — without starting an explanation.' },
        { title: 'Test an edge case', description: 'After an approved explanation, request this deeper test if you want — never because you have to.' },
      ],
      diagnosticKicker: 'DIAGNOSTIC',
      diagnosticTitle: 'Not a score. The next point in your reasoning.',
      diagnosticQuote: '“You recognized the rule. Now explain why it eliminates half of the options.”',
      transferKicker: 'TRANSFER',
      transferTitle: 'Move understanding off the page and into action.',
      transferItems: ['Direct objective', 'Verifiable deliverables', 'Clear first step'],
    },
    pricing: {
      kicker: 'TRANSPARENT ACCESS',
      title: 'Choose your study horizon.',
      description: 'Paid plans are one-time purchases. No subscription and no automatic renewal.',
      freeDescription: 'Free access is available while we prepare the other plans.',
      featuredBadge: 'LONGEST HORIZON',
      simultaneousLimits: 'Daily and period limits apply simultaneously.',
      creditNote: 'On the Free plan, each attempt sent to Gemini uses 1 credit. The balance resets daily; fallback attempts also count. Provider capacity is shared.',
    },
    plans: [
      { id: 'FREE', name: 'Free', price: 'R$ 0', duration: 'no expiration', dailyLimit: '100 credits per day', periodLimit: '', description: 'Explore the method with your own material.', action: 'Start for free', footnote: 'No payment required.' },
      { id: 'ESSENTIAL', name: 'Essential', price: 'R$ 29.90', duration: 'for 30 days', dailyLimit: '120 credits per day', periodLimit: '1,500 credits per access period', description: 'Turn an intensive study phase into deliberate practice.', action: 'Choose Essential', footnote: 'One-time payment · no automatic renewal.' },
      { id: 'PRO', name: 'Pro', price: 'R$ 249', duration: 'for 365 days', dailyLimit: '180 credits per day', periodLimit: '15,000 credits per access period', description: 'Keep an active library throughout the year.', action: 'Choose Pro', footnote: 'One-time payment · no automatic renewal.', featured: true },
    ],
    faq: {
      kicker: 'NO FINE PRINT',
      title: 'Frequently asked questions',
      items: [
        { question: 'Are paid plans subscriptions?', answer: 'No. Essential and Pro are one-time payments for the stated period and do not renew automatically.', paid: true },
        { question: 'Does the AI answer questions for me?', answer: 'No. It organizes your material and diagnoses your explanation. The reasoning remains yours.' },
        { question: 'Do I have to follow the map in order?', answer: 'No. Relationships provide context, but you can open any concept or generate a practice project whenever you want.' },
      ],
    },
    finalCta: { kicker: 'YOUR NEXT MATERIAL CAN BECOME PRACTICE', title: 'Study less on autopilot. Understand more by intention.', action: 'Create my space' },
    footer: { description: 'Active study for technical materials.', method: 'Method', plans: 'Plans', signIn: 'Sign in' },
    visual: {
      nodes: ['Material', 'Concept', 'Explanation', 'Practice', 'Diagnostic'],
      reasoning: 'GROUNDED REASONING',
      explained: 'You explained the mechanism.',
      testBoundary: 'Now test where it stops applying.',
      liveMap: 'LIVE MAP',
      caption: 'From text to application',
    },
  },
} satisfies Record<Locale, LandingCopy>

// Presentation-only values. The API remains authoritative for price, credit,
// eligibility, and checkout state.
export const marketingPlans: readonly MarketingPlan[] = landingCopy['pt-BR'].plans

export function LandingPage({ paymentsEnabled = process.env.NEXT_PUBLIC_PAYMENTS_ENABLED === 'true' }: { paymentsEnabled?: boolean } = {}) {
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

  const copy = landingCopy[locale]
  return (
    <div className={styles.landing}>
      <a className={styles.skipLink} href="#conteudo-principal">{copy.skipContent}</a>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link className={styles.brand} href="/" aria-label={copy.brandLabel}><span className={styles.brandMark} aria-hidden="true">M</span><span>MASTERME</span></Link>
          <nav className={styles.navigation} aria-label={copy.navigationLabel}><a href="#como-funciona">{copy.nav.method}</a><a href="#experiencia">{copy.nav.experience}</a><a href="#planos">{copy.nav.plans}</a></nav>
          <div className={styles.headerActions}>
            <select className={styles.localeSelect} aria-label={copy.languageLabel} value={locale} onChange={(event) => setLocale(event.target.value === 'en-US' ? 'en-US' : 'pt-BR')}>
              <option value="pt-BR">PT</option><option value="en-US">EN</option>
            </select>
            <ThemeToggle lightLabel={copy.lightTheme} darkLabel={copy.darkTheme} />
            <Link className={styles.signIn} href={loginHrefFor('/estudar')}>{copy.signIn}</Link>
          </div>
        </div>
      </header>

      <main id="conteudo-principal" className={styles.main}>
        <section className={styles.hero} aria-labelledby="landing-title">
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}><span aria-hidden="true" /> {copy.hero.eyebrow}</p>
            <h1 id="landing-title">{copy.hero.title} <em>{copy.hero.emphasis}</em></h1>
            <p className={styles.heroDescription}>{copy.hero.description}</p>
            <div className={styles.heroActions}><Link className={styles.primaryAction} href={planLoginHref('FREE')} data-plan-id="FREE">{copy.hero.primaryAction} <Icon name="chevron" /></Link><a className={styles.secondaryAction} href="#como-funciona">{copy.hero.secondaryAction}</a></div>
            <ul className={styles.trustList} aria-label={copy.hero.principlesLabel}><li><Icon name="lock" /> {copy.hero.principles[0]}</li><li><Icon name="document" /> {copy.hero.principles[1]}</li><li><Icon name="sparkles" /> {copy.hero.principles[2]}</li></ul>
          </div>
          <ConstellationPreview copy={copy.visual} />
        </section>

        <section className={styles.method} id="como-funciona" aria-labelledby="method-title">
          <header className={styles.sectionHeading}><p>{copy.method.kicker}</p><h2 id="method-title">{copy.method.title}</h2></header>
          <ol className={styles.journey}>{copy.journey.map((step) => <li key={step.number}><span>{step.number}</span><div><h3>{step.title}</h3><p>{step.description}</p></div></li>)}</ol>
        </section>

        <section className={styles.experience} id="experiencia" aria-labelledby="experience-title">
          <div className={styles.experienceIntro}><p className={styles.eyebrow}><span aria-hidden="true" /> {copy.experience.eyebrow}</p><h2 id="experience-title">{copy.experience.title}</h2><p>{copy.experience.description}</p></div>
          <div className={styles.featureGrid}>
            <article className={styles.featureLarge}><span className={styles.featureIcon}><Icon name="brain" /></span><p>{copy.experience.mapKicker}</p><h3>{copy.experience.mapTitle}</h3><p className={styles.mapDescription}>{copy.experience.mapDescription}</p><KnowledgeMapPreview copy={copy.experience} /></article>
            <article className={styles.problemCard}><span className={styles.featureIcon}><Icon name="idea" /></span><p>{copy.experience.problemKicker}</p><h3>{copy.experience.problemTitle}</h3><p className={styles.problemDescription}>{copy.experience.problemDescription}</p></article>
            <article><span className={styles.featureIcon}><Icon name="idea" /></span><p>{copy.experience.diagnosticKicker}</p><h3>{copy.experience.diagnosticTitle}</h3><blockquote>{copy.experience.diagnosticQuote}</blockquote></article>
            <article className={styles.transferCard}><span className={styles.featureIcon}><Icon name="sparkles" /></span><p>{copy.experience.transferKicker}</p><h3>{copy.experience.transferTitle}</h3><ul>{copy.experience.transferItems.map((item) => <li key={item}>{item}</li>)}</ul></article>
          </div>
        </section>

        <section className={styles.pricing} id="planos" aria-labelledby="pricing-title">
          <header className={styles.sectionHeading}><p>{copy.pricing.kicker}</p><h2 id="pricing-title">{copy.pricing.title}</h2><span>{paymentsEnabled ? copy.pricing.description : copy.pricing.freeDescription}</span></header>
          <div className={`${styles.planGrid} ${paymentsEnabled ? '' : styles.planGridFree}`}>
            {copy.plans.filter((plan) => paymentsEnabled || plan.id === 'FREE').map((plan) => <article className={`${styles.planCard} ${plan.featured ? styles.featuredPlan : ''}`} key={plan.id}>
              {plan.featured && <span className={styles.planBadge}>{copy.pricing.featuredBadge}</span>}
              <header><h3>{plan.name}</h3><span>{plan.description}</span></header>
              <div className={styles.price}><strong>{plan.price}</strong><span>{plan.duration}</span></div>
              <div className={styles.credits}><b>{plan.dailyLimit}</b>{plan.periodLimit && <span>{plan.periodLimit}</span>}{plan.id !== 'FREE' && <small>{copy.pricing.simultaneousLimits}</small>}</div>
              <Link className={plan.featured ? styles.primaryAction : styles.planAction} href={planLoginHref(plan.id)} data-plan-id={plan.id}>{plan.action} <Icon name="chevron" /></Link>
              <small>{plan.footnote}</small>
            </article>)}
          </div>
          <p className={styles.creditNote}>{copy.pricing.creditNote}</p>
        </section>

        <section className={styles.faq} aria-labelledby="faq-title">
          <header><p>{copy.faq.kicker}</p><h2 id="faq-title">{copy.faq.title}</h2></header>
          <div>{copy.faq.items.filter((item) => paymentsEnabled || !item.paid).map((item) => <details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}</div>
        </section>

        <section className={styles.finalCta} aria-labelledby="final-cta-title"><span aria-hidden="true"><Icon name="sparkles" /></span><div><p>{copy.finalCta.kicker}</p><h2 id="final-cta-title">{copy.finalCta.title}</h2></div><Link className={styles.primaryAction} href={planLoginHref('FREE')} data-plan-id="FREE">{copy.finalCta.action} <Icon name="chevron" /></Link></section>
      </main>

      <footer className={styles.footer}><div><Link className={styles.brand} href="/"><span className={styles.brandMark} aria-hidden="true">M</span><span>MASTERME</span></Link><p>{copy.footer.description}</p></div><div><a href="#como-funciona">{copy.footer.method}</a><a href="#planos">{copy.footer.plans}</a><Link href="/entrar">{copy.footer.signIn}</Link></div><small>© {new Date().getFullYear()} MasterMe.</small></footer>
    </div>
  )
}

function KnowledgeMapPreview({ copy }: { copy: LandingCopy['experience'] }) {
  return <figure className={styles.mapStory} aria-labelledby="map-preview-caption">
    <figcaption className={styles.srOnly} id="map-preview-caption">{copy.mapLabel}</figcaption>
    <div className={styles.miniMap}><svg aria-hidden="true" viewBox="0 0 400 150"><path d="M44 82 C110 20 142 20 198 67 S292 142 357 62" /><path d="M44 82 C130 130 250 22 357 62" /></svg>{copy.mapNodes.map((node, index) => <div className={`${styles.mapNode} ${styles[`mapNode${index + 1}`]} ${styles[`mapTone${node.tone[0].toUpperCase()}${node.tone.slice(1)}`]}`} key={node.label}><span aria-hidden="true" /><strong>{node.label}</strong><small>{node.detail}</small></div>)}</div>
    <aside className={styles.mapSignal}><p>{copy.mapSignal.kicker}</p><h4>{copy.mapSignal.title}</h4><span>{copy.mapSignal.description}</span></aside>
    <div className={styles.mapPaths}><p>{copy.pathsLabel}</p><ul>{copy.paths.map((path) => <li key={path.title}><div><strong>{path.title}</strong><small>{path.description}</small></div></li>)}</ul></div>
  </figure>
}

function ConstellationPreview({ copy }: { copy: LandingCopy['visual'] }) {
  return <div className={styles.visual} aria-hidden="true"><div className={styles.visualGlow} /><div className={styles.constellation}><svg viewBox="0 0 620 560" preserveAspectRatio="xMidYMid meet"><defs><linearGradient id="landing-line" x1="0" y1="0" x2="1" y2="1"><stop stopColor="currentColor" stopOpacity=".15" /><stop offset=".5" stopColor="currentColor" stopOpacity=".75" /><stop offset="1" stopColor="currentColor" stopOpacity=".12" /></linearGradient></defs><path d="M111 167 C205 70 281 136 318 232 S432 391 521 304" /><path d="M111 167 C155 316 295 399 433 445" /><path d="M318 232 C390 137 468 145 521 304" /></svg><span className={`${styles.node} ${styles.nodeOne}`}><i />{copy.nodes[0]}</span><span className={`${styles.node} ${styles.nodeTwo}`}><i />{copy.nodes[1]}</span><span className={`${styles.node} ${styles.nodeThree}`}><i />{copy.nodes[2]}</span><span className={`${styles.node} ${styles.nodeFour}`}><i />{copy.nodes[3]}</span><span className={`${styles.node} ${styles.nodeFive}`}><i />{copy.nodes[4]}</span></div><div className={styles.floatingCard}><span><Icon name="check" /> {copy.reasoning}</span><strong>{copy.explained}</strong><small>{copy.testBoundary}</small></div><div className={styles.visualCaption}><span>{copy.liveMap}</span><b>{copy.caption}</b></div></div>
}
