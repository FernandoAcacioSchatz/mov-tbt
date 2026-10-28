function required(name: string, value: string | undefined): string {
  if (!value) throw new Error(`Variável de ambiente ausente: ${name}. Copie .env.example para .env.`);
  return value;
}

export const env = {
  supabaseUrl: required('VITE_SUPABASE_URL', import.meta.env.VITE_SUPABASE_URL),
  supabaseKey: required('VITE_SUPABASE_PUBLISHABLE_KEY', import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY),
  siteUrl: import.meta.env.VITE_SITE_URL ?? 'https://movimentotbt.art',
  publicContactEmail: import.meta.env.VITE_CONTACT_EMAIL_PUBLIC ?? '',
};
