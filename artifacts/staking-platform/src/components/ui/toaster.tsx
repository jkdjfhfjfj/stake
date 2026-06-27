import { CheckCircle2, XCircle, Info, AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

const variantIcon = {
  default: <Info className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />,
  destructive: <XCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />,
  success: <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0 mt-0.5" />,
  warning: <AlertTriangle className="h-4 w-4 text-yellow-400 shrink-0 mt-0.5" />,
}

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        const icon = variantIcon[(variant as keyof typeof variantIcon) ?? "default"] ?? variantIcon.default
        return (
          <Toast key={id} variant={variant} {...props}>
            {icon}
            <div className="flex-1 min-w-0">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
