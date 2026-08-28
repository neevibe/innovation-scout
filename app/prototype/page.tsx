// app/prototype/page.tsx — Next.js route that hands off to the static prototype
import { redirect } from 'next/navigation';

export default function ProtoPage() {
  redirect('/prototype/index.html');
}
