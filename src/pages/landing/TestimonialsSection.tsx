import { testimonialColumns, type FluxTestimonial } from './fluxTestimonials'
import './testimonialsSection.css'

function TestimonialCard({ item }: { item: FluxTestimonial }) {
  return (
    <article className="lp-testi-card">
      <blockquote>“{item.quote}”</blockquote>
      <footer>
        <span className="lp-testi-avatar" style={{ ['--testi-accent' as string]: item.accent }}>
          {item.initials}
        </span>
        <div>
          <b>{item.name}</b>
          <small>{item.role}</small>
        </div>
      </footer>
    </article>
  )
}

function TestimonialColumn({ items, speed }: { items: FluxTestimonial[]; speed: 'a' | 'b' | 'c' }) {
  const loop = [...items, ...items]
  return (
    <div className={`lp-testi-col lp-testi-col--${speed}`}>
      <div className="lp-testi-col-track">
        {loop.map((item, i) => (
          <TestimonialCard key={`${item.name}-${i}`} item={item} />
        ))}
      </div>
    </div>
  )
}

export function TestimonialsSection() {
  const columns = testimonialColumns()

  return (
    <section className="lp-testimonials" id="depoimentos">
      <div className="lp-testimonials-head">
        <span className="lp-kicker dark">Quem usa, recomenda</span>
        <h2>O que dizem sobre a gente</h2>
        <p>
          Histórias de quem organizou finanças, investimentos e metas com o Flux — sem planilha e sem três apps
          diferentes.
        </p>
      </div>
      <div className="lp-testimonials-stage" aria-hidden>
        <div className="lp-testimonials-grid">
          {columns.map((col, i) => (
            <TestimonialColumn key={i} items={col} speed={(['a', 'b', 'c'] as const)[i]} />
          ))}
        </div>
      </div>
    </section>
  )
}
