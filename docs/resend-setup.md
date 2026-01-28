# Guia para usar o Resend em todos os emails do Supabase

Este passo a passo configura o Supabase para enviar **todos** os emails (confirmação, recuperação, convites, transacionais) via Resend usando SMTP. Inclui dicas de domínio e variáveis de ambiente.

## 1) Preparar o domínio no Resend
1. Acesse https://resend.com/domains e adicione seu domínio (ex.: `seu-dominio.com`).
2. Adicione os registros DNS que o Resend informar (SPF e DKIM). Aguarde a verificação ficar "Verified" — a propagação pode levar de alguns minutos a algumas                                .
3. Depois de publicar os registros, você pode checar em ferramentas como https://www.whatsmydns.net/ se o SPF/DKIM já propagou globalmente.
4. Escolha um remetente padrão, ex.: `noreply@seu-dominio.com`.

## 2) Variáveis de ambiente
No Supabase (Project Settings → Configuration → Secrets) adicione:
- `RESEND_API_KEY` = sua chave (ex.: `re_xxx`)
- `RESEND_FROM` = `noreply@seu-dominio.com` (mesmo domínio verificado)

No front (arquivo `.env` ou ambiente do build) já existe `VITE_RESEND_API_KEY`; mantenha-o atualizado com a mesma chave.

## 3) Configurar SMTP do Resend no Supabase Auth
1. Vá em Project Settings → Authentication → Email.
2. Em "SMTP Settings", preencha:
   - Host: `smtp.resend.com`
   - Port: `587`
   - User: `resend`
   - Password: sua `RESEND_API_KEY`
   - Sender: `noreply@seu-dominio.com`
3. Salve. A partir daqui, todos os emails de Auth (signup, magic link, reset) sairão pelo Resend.

## 4) Ajustar URLs e templates do Supabase
1. Em Authentication → URL Configuration, defina:
   - `SITE_URL`: URL real da sua app (ex.: `https://app.seu-dominio.com` ou sua hospedagem atual).
   - `REDIRECT_URL`: idem, se usar callback específico.
2. Edite os templates de email (Authentication → Templates) para usar seu branding e conferir que os links apontam para o domínio correto.

## 5) Testar fluxos
1. Criar conta nova → receber email de confirmação.
2. Login com magic link (se usar) → email chega.
3. Recuperar senha → email chega.
4. Verificar que o domínio remetente é o verificado e que os links não dão erro de DNS.

## 6) Uso de Resend fora do Auth (opcional)
Se precisar enviar emails transacionais pelo backend (Node) ou edge functions:
- Use a mesma `RESEND_API_KEY` e `RESEND_FROM`.
- Evite expor a chave no cliente; use apenas em ambientes server-side.

## 7) Observabilidade
- No dashboard do Resend, confira logs e bounces.
- Se houver bloqueios, revise SPF/DKIM e remetente.

## Resumo rápido
- Domínio verificado no Resend + remetente `noreply@seu-dominio.com`.
- Supabase Auth SMTP: host `smtp.resend.com`, porta 587, user `resend`, password = API key.
- `SITE_URL/REDIRECT_URL` apontando para seu domínio real.
- Templates de email ajustados.
- Testar signup/reset para validar entrega.
