import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router-dom'

type Variant = 'primary' | 'accent' | 'petrol' | 'outline' | 'quiet' | 'onDark'
type Size = 'sm' | 'md' | 'lg'

const base =
  'inline-flex items-center justify-center gap-2 rounded-full font-sans font-semibold tracking-[-0.005em] transition-[background-color,color,box-shadow,transform] duration-150 select-none active:translate-y-px disabled:opacity-45 disabled:active:translate-y-0 focus-visible:outline-offset-3 whitespace-nowrap'

const variants: Record<Variant, string> = {
  primary: 'bg-ink text-paper hover:bg-ink/85',
  accent: 'bg-vermilion text-[#171b1d] hover:brightness-95 shadow-[inset_0_-2px_0_rgb(0_0_0/0.12)]',
  petrol: 'bg-petrol text-on-petrol hover:brightness-110',
  outline: 'border border-ink/25 text-ink hover:border-ink hover:bg-ink/5',
  quiet: 'text-ink-2 hover:text-ink hover:bg-ink/6',
  onDark: 'bg-paper text-ink hover:bg-paper/90',
}
const sizes: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-[0.875rem]',
  md: 'h-11 px-5 text-[0.9375rem]',
  lg: 'h-13 px-7 text-[1rem]',
}

export function buttonClass(variant: Variant = 'primary', size: Size = 'md', extra = '') {
  return `${base} ${variants[variant]} ${sizes[size]} ${extra}`
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size; icon?: ReactNode }

export const Button = forwardRef<HTMLButtonElement, BtnProps>(function Button(
  { variant = 'primary', size = 'md', icon, className = '', children, type = 'button', ...rest },
  ref,
) {
  return (
    <button ref={ref} type={type} className={buttonClass(variant, size, className)} {...rest}>
      {icon}
      {children}
    </button>
  )
})

export function ButtonLink({ variant = 'primary', size = 'md', icon, className = '', children, ...rest }: LinkProps & { variant?: Variant; size?: Size; icon?: ReactNode }) {
  return (
    <Link className={buttonClass(variant, size, className)} {...rest}>
      {icon}
      {children}
    </Link>
  )
}
