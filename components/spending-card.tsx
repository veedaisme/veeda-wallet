import { ChevronRight } from "lucide-react"
import { ArrowDown, ArrowUp } from "lucide-react"
import { formatIDR } from "@/utils/currency"

interface SpendingCardProps {
  title: string
  amount: number
  change: number
  previousLabel: string
  previousAmount: number
}

export function SpendingCard({ title, amount, change, previousLabel, previousAmount }: SpendingCardProps) {
  const isPositive = change > 0
  const absChange = Math.abs(change)

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-gray-600 font-medium">{title}</h2>
        <ChevronRight className="h-5 w-5 text-gray-400" />
      </div>

      <div className="flex items-center gap-2 mb-1">
        <span className="text-3xl font-bold">{formatIDR(amount)}</span>
        <div className="flex items-center gap-1 bg-gray-100 rounded-full px-2 py-1">
          {isPositive ? <ArrowUp className="h-4 w-4 text-red-500" /> : <ArrowDown className="h-4 w-4 text-green-500" />}
          <span className={`text-sm ${isPositive ? "text-red-500" : "text-green-500"}`}>{absChange}%</span>
        </div>
      </div>

      <p className="text-gray-500 text-sm">
        {previousLabel} {formatIDR(previousAmount)}
      </p>
    </div>
  )
}
