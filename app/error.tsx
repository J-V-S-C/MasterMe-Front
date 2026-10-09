'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import styles from './status.module.css'

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Page render failed', { name: error.name, digest: error.digest })
  }, [error])

  return <main className={styles.page}>
    <section className={styles.card} aria-labelledby="error-title">
      <span>ALGO INTERROMPEU A EXPERIÊNCIA</span>
      <h1 id="error-title">Não foi possível abrir esta página.</h1>
      <p>Tente novamente. Se o problema persistir, volte ao início e retome o caminho desejado.</p>
      <div><button type="button" onClick={reset}>Tentar novamente</button><Link href="/">Voltar ao início</Link></div>
    </section>
  </main>
}
