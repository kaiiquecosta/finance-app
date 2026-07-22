import { forwardRef, useState, type InputHTMLAttributes } from 'react'
import styles from './TextField.module.css'

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  /** Mostra o botão de olho para senhas. */
  reveal?: boolean
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, error, reveal, type = 'text', id, className, ...rest },
  ref,
) {
  const [show, setShow] = useState(false)
  const inputType = reveal ? (show ? 'text' : 'password') : type
  const fieldId = id ?? rest.name

  return (
    <label className={styles.field} htmlFor={fieldId}>
      {label && <span className={styles.label}>{label}</span>}
      <div className={styles.inputWrap}>
        <input
          ref={ref}
          id={fieldId}
          type={inputType}
          className={[styles.input, error ? styles.inputError : '', className ?? '']
            .filter(Boolean)
            .join(' ')}
          {...rest}
        />
        {reveal && (
          <button
            type="button"
            className={styles.eye}
            onClick={() => setShow((s) => !s)}
            tabIndex={-1}
            aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}
          >
            {show ? '🙈' : '👁'}
          </button>
        )}
      </div>
      {error && <span className={styles.errorMsg}>{error}</span>}
    </label>
  )
})
