import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

function IconActionButton({
  className,
  icon: Icon,
  size = 40,
  style,
  title,
  children,
  ...props
}) {
  const squareSize = typeof size === 'number' ? `${size}px` : size

  return (
    <Button
      size="icon"
      className={cn(className)}
      style={{ width: squareSize, height: squareSize, ...style }}
      title={title}
      aria-label={title}
      {...props}
    >
      {Icon ? <Icon /> : children}
    </Button>
  )
}

export default IconActionButton
