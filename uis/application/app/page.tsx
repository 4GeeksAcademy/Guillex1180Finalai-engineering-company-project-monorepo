import { redirect } from 'next/navigation';

export default function HomePage() {
  redirect('/backoffice/inventory/products', 'replace');
}
