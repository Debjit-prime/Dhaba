import { redirect } from 'next/navigation';

export default function CustomerRedirectPage() {
  redirect('/menu?table=12');
}
