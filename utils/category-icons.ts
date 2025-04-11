import {
  Coffee,
  ShoppingBag,
  Car,
  Home,
  Lightbulb,
  Film,
  Heart,
  GraduationCap,
  Plane,
  MoreHorizontal,
  type LucideIcon,
} from "lucide-react"

export function getCategoryIcon(category: string): LucideIcon {
  switch (category.toLowerCase()) {
    case "food":
      return Coffee
    case "shopping":
      return ShoppingBag
    case "transportation":
      return Car
    case "housing":
      return Home
    case "utilities":
      return Lightbulb
    case "entertainment":
      return Film
    case "health":
      return Heart
    case "education":
      return GraduationCap
    case "travel":
      return Plane
    default:
      return MoreHorizontal
  }
}
