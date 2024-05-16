import type { FC } from "react"
import { Progress as OriginalProgress } from "../ui/progress"
import { MapPin } from "lucide-react"

interface ProgressProps {
  value: number
  pinValue?: number
  preNumber?: number
  postNumber?: number
  className?: string
}

export const Progress: FC<ProgressProps> = ({
  className,
  value,
  pinValue,
  preNumber,
  postNumber,
  ...props
}) => {
  return (
    <div className="w-full overflow-hidden">
      {pinValue !== undefined && (
        <div className="w-[95%] mx-auto mb-2">
          <MapPin
            className="h-6 w-6 text-primary transition-all"
            style={{
              marginLeft: `calc(${Math.max(Math.min(pinValue || 0, 100), 0)}%)`,
              // translate: "translateX(0.75rem)",
            }}
          />
        </div>
      )}

      <div className="flex flex-row gap-x-3 items-center w-full">
        {preNumber && <span className="font-semibold">{preNumber}</span>}
        <OriginalProgress value={value} {...props} />
        {postNumber && <span className="font-semibold">{postNumber}</span>}
      </div>
    </div>
  )
}
