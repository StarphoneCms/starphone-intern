import StaffViewClient from '../StaffViewClient'

interface Props {
  params: Promise<{ token: string }>
}

export default function StaffViewPage({ params }: Props) {
  return <StaffViewClient params={params} />
}