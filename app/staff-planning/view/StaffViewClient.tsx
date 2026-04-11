'use client'

import { use } from 'react'

interface Props {
  params: Promise<{ token: string }>
}

export default function StaffViewClient({ params }: Props) {
  const { token } = use(params)

  return (
    <div>
      <h1>Mitarbeiter-Ansicht</h1>
      <p>Token: {token}</p>
    </div>
  )
}
