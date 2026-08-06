import { formatBRL, type Cents } from '@/domain/money'
import { colorFor, iconFor } from '@/domain/categories'
import styles from './overview.module.css'

const FALLBACK = ['#3b82f6', '#f97316', '#22c55e', '#8b5cf6', '#f59e0b', '#ec4899']

export function CategoryDonut({
  byCat,
  categoryLabel = (cat) => cat,
}: {
  byCat: Record<string, Cents>
  categoryLabel?: (cat: string) => string
}) {
  const cats = Object.entries(byCat).sort((a, b) => b[1] - a[1])
  const total = cats.reduce((s, [, v]) => s + Number(v), 0)

  if (!total) {
    return (
      <p style={{ color: 'var(--muted)', fontSize: 12, textAlign: 'center', padding: '20px 0' }}>
        Nenhum gasto este mês ainda.
      </p>
    )
  }

  const R = 15.9155
  const cx = 18
  const cy = 18
  const circ = 2 * Math.PI * R
  let offset = 0
  const slices = cats.map(([cat, val], i) => {
    const pct = Number(val) / total
    const dash = pct * circ
    const gap = circ - dash
    const clr = colorFor(cat) || FALLBACK[i % FALLBACK.length]
    const el = (
      <circle
        key={cat}
        cx={cx}
        cy={cy}
        r={R}
        fill="none"
        stroke={clr}
        strokeWidth={3.5}
        strokeDasharray={`${dash} ${gap}`}
        strokeDashoffset={-offset * circ}
        strokeLinecap="round"
      />
    )
    offset += pct
    return el
  })

  const show = cats.slice(0, 6)
  if (cats.length > 6) {
    const other = cats.slice(6).reduce((s, [, v]) => s + Number(v), 0)
    show.push(['outros', other as Cents])
  }

  return (
    <div className={styles.donutWrap}>
      <div className={styles.donutRing}>
        <svg className={styles.donutSvg} viewBox="0 0 36 36">
          <circle
            cx={cx}
            cy={cy}
            r={R}
            fill="none"
            stroke="color-mix(in srgb, var(--text) 6%, transparent)"
            strokeWidth={3.5}
          />
          {slices}
        </svg>
        <div className={styles.donutCenter}>
          <div style={{ color: 'var(--muted)', fontSize: 9, textTransform: 'uppercase' }}>total</div>
          <div className="num-md" style={{ fontSize: 13 }}>
            {formatBRL(total as Cents)}
          </div>
        </div>
      </div>
      <div className={styles.legend}>
        {show.map(([cat, val], i) => {
          const pct = (Number(val) / total) * 100
          const clr =
            cat === 'outros' ? '#64748b' : colorFor(cat) || FALLBACK[i % FALLBACK.length]
          return (
            <div key={cat} className={styles.legendRow}>
              <div
                className={styles.legendIcon}
                style={{
                  background: `${clr}20`,
                  border: `1px solid ${clr}40`,
                }}
              >
                {iconFor(cat)}
              </div>
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: 3,
                  }}
                >
                  <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'capitalize' }}>
                    {categoryLabel(cat)}
                  </span>
                  <span style={{ fontFamily: 'var(--num)', fontSize: 10, fontWeight: 700, color: clr }}>
                    {Math.round(pct)}%
                  </span>
                </div>
                <div className="prog">
                  <div
                    className="prog-fill"
                    style={{ width: `${Math.max(pct, 2)}%`, background: clr }}
                  />
                </div>
              </div>
              <div style={{ fontFamily: 'var(--num)', fontSize: 11, fontWeight: 700 }}>
                {formatBRL(val)}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
