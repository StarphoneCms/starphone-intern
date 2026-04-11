export interface Employee {
  id: string
  name: string
  role: string
}

export interface Shift {
  id: string
  employee_id: string
  date: string
  start_time: string
  end_time: string
  type: string
}

export interface Vacation {
  id: string
  employee_id: string
  start_date: string
  end_date: string
  status: 'pending' | 'approved' | 'rejected'
}
