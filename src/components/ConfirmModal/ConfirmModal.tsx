import {
  AlertDialog,
  type AlertDialogProps,
  type AlertDialogAction,
} from "../AlertDialog/AlertDialog"

type ConfirmModalType = "confirm" | "delete"

export interface ConfirmModalProps extends Omit<AlertDialogProps, "actions"> {
  type?: ConfirmModalType
  isLoading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

const availableTypes: Record<
  ConfirmModalType,
  Omit<AlertDialogAction, "onClick">
> = {
  confirm: {
    label: "Confirm",
    variant: "default",
  },
  delete: {
    label: "Delete",
    variant: "destructive",
  },
}

export const ConfirmModal = ({
  title = "Are you sure?",
  description = "This action cannot be undone.",
  type = "confirm",
  isLoading = false,
  onConfirm,
  onCancel,
  ...props
}: ConfirmModalProps) => {
  const actions: AlertDialogAction[] = [
    {
      label: "Cancel",
      variant: "outline",
      onClick: () => onCancel?.(),
    },
    {
      ...availableTypes[type],
      isLoading,
      onClick: () => onConfirm?.(),
    },
  ]

  return (
    <AlertDialog
      title={title}
      description={description}
      actions={actions}
      {...props}
    />
  )
}
