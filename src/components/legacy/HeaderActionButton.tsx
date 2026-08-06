import type { ButtonHTMLAttributes, ReactNode } from 'react'

/** Botão verde compacto do cabeçalho legado (＋ Nova, ＋ Cartão…). */
export function HeaderActionButton({
  children,
  className,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return (
    <button type="button" className={['btn-header', className ?? ''].filter(Boolean).join(' ')} {...rest}>
      {children}
    </button>
  )
}
