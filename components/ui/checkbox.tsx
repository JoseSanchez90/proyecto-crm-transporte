"use client"

import { Check } from "lucide-react"

interface CheckboxProps {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}

export function Checkbox({ checked, onCheckedChange }: CheckboxProps) {
  return (
    <button
      type="button"
      onClick={() => onCheckedChange(!checked)}
      className={`flex h-4 w-4 items-center justify-center rounded border transition-colors ${
        checked ? "border-primary bg-primary text-white" : "border-gray-300 bg-white"
      }`}
    >
      {checked && <Check className="h-3 w-3 stroke-[3]" />}
    </button>
  )
}
