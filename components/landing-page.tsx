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
    mapKicker: string
    mapTitle: string
    diagnosticKicker: string
    diagnosticTitle: string
    diagnosticQuote: string
    transferKicker: string
    transferTitle: string
    transferItems: readonly string[]
  }
  pricing: { kicker: string; title: string; description: string; featuredBadge: string; simultaneousLimits: string; creditNote: string }
  plans: readonly MarketingPlan[]
  faq: { kicker: string; title: string; items: readonly { question: string; answer: string }[] }
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
      { number: '03', title: 'Explique e construa', description: 'Receba um diagnóstico ancorado e converta lacunas reais em um projeto de prática.' },
    ],
    experience: {
      eyebrow: 'Clareza antes de volume',
      title: 'Uma sala de estudo feita para pensar, não para acumular conteúdo.',
      description: 'Cada recurso é independente. Você decide se quer explorar, explicar ou partir direto para uma prática.',
      mapKicker: 'MAPA DE CONHECIMENTO',
      mapTitle: 'Veja relações sem transformar o mapa em uma grade.',
      diagnosticKicker: 'DIAGNÓSTICO',
      diagnosticTitle: 'Descubra o ponto exato que ainda precisa de mecanismo.',
      diagnosticQuote: '“Você reconheceu a regra; agora explique por que ela elimina metade das opções.”',
      transferKicker: 'TRANSFERÊNCIA',
      transferTitle: 'Transforme lacunas ativas em um projeto curto e concreto.',
      transferItems: ['Objetivo direto', 'Entregáveis verificáveis', 'Primeiro passo claro'],
    },
    pricing: {
      kicker: 'ACESSO TRANSPARENTE',
      title: 'Escolha o horizonte do seu estudo.',
      description: 'Planos pagos são compras únicas. Sem assinatura e sem renovação automática.',
      featuredBadge: 'MAIOR HORIZONTE',
      simultaneousLimits: 'Os limites diário e do período valem simultaneamente.',
      creditNote: 'Créditos são ponderados conforme o custo de cada operação de IA. Novos usos pausam quando qualquer um dos limites é atingido; o saldo disponível fica visível antes de cada uso.',
    },
    plans: [
      { id: 'FREE', name: 'Livre', price: 'R$ 0', duration: 'sem prazo', dailyLimit: '10 créditos por dia', periodLimit: '120 créditos por mês', description: 'Para conhecer o método com seu próprio material.', action: 'Começar gratuitamente', footnote: 'Não exige pagamento.' },
      { id: 'ESSENTIAL', name: 'Essencial', price: 'R$ 29,90', duration: 'por 30 dias', dailyLimit: '120 créditos por dia', periodLimit: '1.500 créditos por vigência', description: 'Para transformar uma fase intensa de estudo em prática.', action: 'Escolher Essencial', footnote: 'Pagamento único · sem renovação automática.' },
      { id: 'PRO', name: 'Pro', price: 'R$ 249', duration: 'por 365 dias', dailyLimit: '180 créditos por dia', periodLimit: '15.000 créditos por vigência', description: 'Para manter uma biblioteca ativa ao longo do ano.', action: 'Escolher Pro', footnote: 'Pagamento único · sem renovação automática.', featured: true },
    ],
    faq: {
      kicker: 'SEM LETRAS MIÚDAS',
      title: 'Perguntas frequentes',
      items: [
        { question: 'Os planos pagos são assinaturas?', answer: 'Não. Essencial e Pro são pagamentos únicos para o período informado e não possuem renovação automática.' },
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
      { number: '03', title: 'Explain and build', description: 'Get a grounded diagnostic and turn real gaps into a practice project.' },
    ],
    experience: {
      eyebrow: 'Clarity before volume',
      title: 'A study room built for thinking, not collecting content.',
      description: 'Each tool stands on its own. You choose whether to explore, explain, or move directly into practice.',
      mapKicker: 'KNOWLEDGE MAP',
      mapTitle: 'See relationships without turning the map into a grid.',
      diagnosticKicker: 'DIAGNOSTIC',
      diagnosticTitle: 'Find the exact point that still needs a mechanism.',
      diagnosticQuote: '“You recognized the rule; now explain why it eliminates half of the options.”',
      transferKicker: 'TRANSFER',
      transferTitle: 'Turn active gaps into a short, concrete project.',
      transferItems: ['Direct objective', 'Verifiable deliverables', 'Clear first step'],
    },
    pricing: {
      kicker: 'TRANSPARENT ACCESS',
      title: 'Choose your study horizon.',
      description: 'Paid plans are one-time purchases. No subscription and no automatic renewal.',
      featuredBadge: 'LONGEST HORIZON',
      simultaneousLimits: 'Daily and period limits apply simultaneously.',
      creditNote: 'Credits are weighted by the cost of each AI operation. New uses pause when either limit is reached; your available balance is visible before every use.',
    },
    plans: [
      { id: 'FREE', name: 'Free', price: 'R$ 0', duration: 'no expiration', dailyLimit: '10 credits per day', periodLimit: '120 credits per month', description: 'Explore the method with your own material.', action: 'Start for free', footnote: 'No payment required.' },
      { id: 'ESSENTIAL', name: 'Essential', price: 'R$ 29.90', duration: 'for 30 days', dailyLimit: '120 credits per day', periodLimit: '1,500 credits per access period', description: 'Turn an intensive study phase into deliberate practice.', action: 'Choose Essential', footnote: 'One-time payment · no automatic renewal.' },
      { id: 'PRO', name: 'Pro', price: 'R$ 249', duration: 'for 365 days', dailyLimit: '180 credits per day', periodLimit: '15,000 credits per access period', description: 'Keep an active library throughout the year.', action: 'Choose Pro', footnote: 'One-time payment · no automatic renewal.', featured: true },
    ],
    faq: {
      kicker: 'NO FINE PRINT',
      title: 'Frequently asked questions',
      items: [
        { question: 'Are paid plans subscriptions?', answer: 'No. Essential and Pro are one-time payments for the stated period and do not renew automatically.' },
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

export function LandingPage() {
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
            <article className={styles.featureLarge}><span className={styles.featureIcon}><Icon name="brain" /></span><p>{copy.experience.mapKicker}</p><h3>{copy.experience.mapTitle}</h3><div className={styles.miniMap} aria-hidden="true"><i /><i /><i /><i /><svg viewBox="0 0 400 150"><path d="M44 82 C110 20 142 20 198 67 S292 142 357 62" /><path d="M44 82 C130 130 250 22 357 62" /></svg></div></article>
            <article><span className={styles.featureIcon}><Icon name="idea" /></span><p>{copy.experience.diagnosticKicker}</p><h3>{copy.experience.diagnosticTitle}</h3><blockquote>{copy.experience.diagnosticQuote}</blockquote></article>
            <article><span className={styles.featureIcon}><Icon name="sparkles" /></span><p>{copy.experience.transferKicker}</p><h3>{copy.experience.transferTitle}</h3><ul>{copy.experience.transferItems.map((item) => <li key={item}>{item}</li>)}</ul></article>
          </div>
        </section>

        <section className={styles.pricing} id="planos" aria-labelledby="pricing-title">
          <header className={styles.sectionHeading}><p>{copy.pricing.kicker}</p><h2 id="pricing-title">{copy.pricing.title}</h2><span>{copy.pricing.description}</span></header>
          <div className={styles.planGrid}>
            {copy.plans.map((plan) => <article className={`${styles.planCard} ${plan.featured ? styles.featuredPlan : ''}`} key={plan.id}>
              {plan.featured && <span className={styles.planBadge}>{copy.pricing.featuredBadge}</span>}
              <header><h3>{plan.name}</h3><span>{plan.description}</span></header>
              <div className={styles.price}><strong>{plan.price}</strong><span>{plan.duration}</span></div>
              <div className={styles.credits}><b>{plan.dailyLimit}</b><span>{plan.periodLimit}</span><small>{copy.pricing.simultaneousLimits}</small></div>
              <Link className={plan.featured ? styles.primaryAction : styles.planAction} href={planLoginHref(plan.id)} data-plan-id={plan.id}>{plan.action} <Icon name="chevron" /></Link>
              <small>{plan.footnote}</small>
            </article>)}
          </div>
          <p className={styles.creditNote}>{copy.pricing.creditNote}</p>
        </section>

        <section className={styles.faq} aria-labelledby="faq-title">
          <header><p>{copy.faq.kicker}</p><h2 id="faq-title">{copy.faq.title}</h2></header>
          <div>{copy.faq.items.map((item) => <details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}</div>
        </section>

        <section className={styles.finalCta} aria-labelledby="final-cta-title"><span aria-hidden="true"><Icon name="sparkles" /></span><div><p>{copy.finalCta.kicker}</p><h2 id="final-cta-title">{copy.finalCta.title}</h2></div><Link className={styles.primaryAction} href={planLoginHref('FREE')} data-plan-id="FREE">{copy.finalCta.action} <Icon name="chevron" /></Link></section>
      </main>

      <footer className={styles.footer}><div><Link className={styles.brand} href="/"><span className={styles.brandMark} aria-hidden="true">M</span><span>MASTERME</span></Link><p>{copy.footer.description}</p></div><div><a href="#como-funciona">{copy.footer.method}</a><a href="#planos">{copy.footer.plans}</a><Link href="/entrar">{copy.footer.signIn}</Link></div><small>© {new Date().getFullYear()} MasterMe.</small></footer>
    </div>
  )
}

function ConstellationPreview({ copy }: { copy: LandingCopy['visual'] }) {
  return <div className={styles.visual} aria-hidden="true"><div className={styles.visualGlow} /><div className={styles.constellation}><svg viewBox="0 0 620 560" preserveAspectRatio="xMidYMid meet"><defs><linearGradient id="landing-line" x1="0" y1="0" x2="1" y2="1"><stop stopColor="currentColor" stopOpacity=".15" /><stop offset=".5" stopColor="currentColor" stopOpacity=".75" /><stop offset="1" stopColor="currentColor" stopOpacity=".12" /></linearGradient></defs><path d="M111 167 C205 70 281 136 318 232 S432 391 521 304" /><path d="M111 167 C155 316 295 399 433 445" /><path d="M318 232 C390 137 468 145 521 304" /></svg><span className={`${styles.node} ${styles.nodeOne}`}><i />{copy.nodes[0]}</span><span className={`${styles.node} ${styles.nodeTwo}`}><i />{copy.nodes[1]}</span><span className={`${styles.node} ${styles.nodeThree}`}><i />{copy.nodes[2]}</span><span className={`${styles.node} ${styles.nodeFour}`}><i />{copy.nodes[3]}</span><span className={`${styles.node} ${styles.nodeFive}`}><i />{copy.nodes[4]}</span></div><div className={styles.floatingCard}><span><Icon name="check" /> {copy.reasoning}</span><strong>{copy.explained}</strong><small>{copy.testBoundary}</small></div><div className={styles.visualCaption}><span>{copy.liveMap}</span><b>{copy.caption}</b></div></div>
}
