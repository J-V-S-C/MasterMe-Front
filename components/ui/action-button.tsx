import type { ButtonHTMLAttributes, ReactNode } from 'react'

type ActionButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'small' | 'medium'
  children: ReactNode
}

export function ActionButton({ variant = 'secondary', size = 'medium', className = '', type = 'button', children, ...props }: ActionButtonProps) {
  return <button type={type} className={`app-button ${variant} ${size} ${className}`.trim()} {...props}>{children}</button>
}
