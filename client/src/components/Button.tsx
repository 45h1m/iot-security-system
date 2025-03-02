import { LoaderCircle } from 'lucide-react'

type ButtonProps = {
  disabled?: boolean
  children: React.ReactNode
  loading?: boolean
  onclick?: () => void
  customClass?: string
  type?: 'button' | 'submit' | 'reset'
}

const Button = ({ disabled, children, loading, onclick, customClass, type }: ButtonProps) => {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onclick}
      className={`cursor-pointer flex w-fit items-center justify-center gap-2 h-12 leading-none align-middle self-center px-6 rounded-lg font-semibold bg-emerald-400 hover:brightness-125 ${customClass ? customClass : ''}`}
    >
      {loading ? <LoaderCircle className="animate-spin" /> : children}
    </button>
  )
}

export default Button
