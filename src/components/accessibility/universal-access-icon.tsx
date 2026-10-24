import * as React from "react"

export interface UniversalAccessIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string
}

export function UniversalAccessIcon({
  size = 18,
  className = "",
  ...props
}: UniversalAccessIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <circle cx="12" cy="12" r="9.75" strokeWidth="1.5" />
      <circle cx="12" cy="7.25" r="1.4" fill="currentColor" stroke="none" />
      <path d="M6.5 10.75C8.2 10.3 10 10.1 12 10.1C14 10.1 15.8 10.3 17.5 10.75" />
      <path d="M12 10.1V15.2" />
      <path d="M9.5 18.5L12 15.2L14.5 18.5" />
    </svg>
  )
}
