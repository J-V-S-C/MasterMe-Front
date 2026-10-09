import Link from 'next/link'
import styles from './status.module.css'

export default function NotFoundPage() {
  return <main className={styles.page}>
    <section className={styles.card} aria-labelledby="not-found-title">
      <span>PÁGINA NÃO ENCONTRADA</span>
      <h1 id="not-found-title">Este caminho não faz parte do mapa.</h1>
      <p>O endereço pode ter mudado ou estar incompleto.</p>
      <div><Link className={styles.primary} href="/">Conhecer o MasterMe</Link><Link href="/estudar">Ir para o estudo</Link></div>
    </section>
  </main>
}
