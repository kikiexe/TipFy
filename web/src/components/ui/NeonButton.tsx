import { motion  } from 'framer-motion'
import type {HTMLMotionProps} from 'framer-motion';

interface NeonButtonProps extends HTMLMotionProps<'button'> {
  variant?: 'pink' | 'cyan'
}

export const NeonButton = ({
  variant = 'pink',
  children,
  className = '',
  ...props
}: NeonButtonProps) => {
  const styles =
    variant === 'pink'
      ? 'bg-neon-pink text-black glow-pink'
      : 'border-2 border-neon-cyan text-neon-cyan hover:bg-neon-cyan/10 glow-cyan'

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`px-10 py-4 font-black uppercase tracking-widest transition-all skew-x--10 ${styles} ${className}`}
      {...props}
    >
      <span className="skew-x-10 flex items-center justify-center gap-2">
        {children as React.ReactNode}
      </span>
    </motion.button>
  )
}
