export interface Transaction {
  id: string
  amount: number
  category: string
  note: string
  date: string
}

// Sample transaction data
export const sampleTransactions: Transaction[] = [
  {
    id: "t1",
    amount: 35000,
    category: "Food",
    note: "Lunch at Warung Padang",
    date: "2023-04-11T12:30:00Z",
  },
  {
    id: "t2",
    amount: 150000,
    category: "Transportation",
    note: "Grab ride to office",
    date: "2023-04-11T08:15:00Z",
  },
  {
    id: "t3",
    amount: 500000,
    category: "Housing",
    note: "Electricity bill",
    date: "2023-04-10T15:45:00Z",
  },
  {
    id: "t4",
    amount: 75000,
    category: "Entertainment",
    note: "Movie tickets",
    date: "2023-04-09T19:20:00Z",
  },
  {
    id: "t5",
    amount: 250000,
    category: "Shopping",
    note: "New t-shirt",
    date: "2023-04-08T14:10:00Z",
  },
  {
    id: "t6",
    amount: 45000,
    category: "Food",
    note: "Coffee and snacks",
    date: "2023-04-08T10:30:00Z",
  },
  {
    id: "t7",
    amount: 1200000,
    category: "Housing",
    note: "Monthly rent",
    date: "2023-04-05T09:00:00Z",
  },
  {
    id: "t8",
    amount: 350000,
    category: "Utilities",
    note: "Internet bill",
    date: "2023-04-04T16:45:00Z",
  },
  {
    id: "t9",
    amount: 120000,
    category: "Health",
    note: "Vitamins",
    date: "2023-04-03T11:20:00Z",
  },
  {
    id: "t10",
    amount: 85000,
    category: "Food",
    note: "Dinner with friends",
    date: "2023-04-02T20:15:00Z",
  },
]
