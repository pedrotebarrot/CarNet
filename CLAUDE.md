# AutosDigital — Contexto do Projeto

SaaS B2B para revendas de veículos brasileiras. Next.js 15 (App Router), Firebase (Firestore + Storage + Auth), Vercel, Tailwind, Gemini AI. Deploy em produção: `autosdigital.vercel.app`.

## Pessoas

- **Pedro** (dono/fundador) — e-mail admin: `pedrotebarrot08@gmail.com`. WhatsApp de suporte: `5511967329111`.
- Vende porta a porta em revendas de bairro (30-40 carros), sem site próprio hoje.

## Preços (fonte de verdade em `src/lib/billing/plans.ts`)

| Plano | Preço | Observação |
|---|---|---|
| Tabela mensal | R$ 449/mês | Visível no site |
| Tabela anual | R$ 360/mês (R$ 4.320 à vista) | Visível no site |
| Founding mensal | R$ 279/mês | Oculto — só oferecido porta a porta, 15 vagas |
| Founding anual | R$ 197/mês (R$ 2.364 à vista) | Oculto — 15 vagas |
| **Fidelidade founding** | **R$ 247/mês para sempre** após 12 meses | Nunca sobe pro preço de tabela — é a promessa feita na venda |

Garantia de 7 dias (dinheiro de volta), **não** "trial grátis" — decisão deliberada pra evitar curiosos e fortalecer o fechamento no balcão. Nunca usar a palavra "grátis"/"trial" em UI voltada ao cliente.

## Integrações de marketplace

### Mercado Livre — ✅ funcionando 100%
- OAuth com refresh_token (precisa do flow "Refresh Token" habilitado no painel ML)
- Webhooks: Messages, Items, Questions, **VIS Leads** (produto específico pra veículos — dá nome/telefone/e-mail completos do comprador)
- Callback: `/api/mercadolivre/callback`, webhook: `/api/mercadolivre/webhooks/notifications`
- Resposta a perguntas direto no dashboard (`/dashboard/leads`)

### OLX — ⏳ aguardando ativação da conta
- Contato: Jeniffer Gomes, integração@olx (suporteintegrador@olxbr.com / central de ajuda)
- Client ID: `8a6986b60a51c2923693b80ea2d2f5b29d17a66c`
- Conta de teste conectada: `pedrotebarrot08@gmail.com`
- **Bloqueio atual**: `PUT https://apps.olx.com.br/autoupload/import` retorna `statusCode: -6 "Without permission"` — conta aguarda habilitação de autoupload pela OLX
- **Descobertas técnicas importantes** (não documentadas publicamente):
  - Host correto é `apps.olx.com.br`, **não** `api.olx.com.br` (esse retorna 543 sempre)
  - O WAF da OLX bloqueia requests sem `User-Agent` de navegador — é obrigatório em toda chamada
  - `access_token` vai **dentro do body JSON**, não como header `Authorization: Bearer`
  - Schema completo de categoria 2020 (carros) recuperado do fork `dasioneto/ad_integration` no GitHub (repo oficial `olxbr/ad_integration` saiu do ar)
  - OLX não emite refresh_token — token dura ~1h, reconectar manualmente quando expirar
- Webhooks AD_STATUS e LEAD já registrados via API e confirmados funcionando
- Enquanto não ativar: vender ML como carro-chefe, dizer que OLX "está em homologação, ativa sozinho quando a OLX liberar"

## Decisões de arquitetura relevantes

- `useCollection`/`useDoc` do Firestore **exigem** `useMemoFirebase` (não `useMemo` do React) — o hook lança erro em runtime se a query não tiver a flag `__memo`
- Firestore rules: `subscription` é imutável do cliente, só Admin SDK escreve (webhooks/admin actions)
- `/admin/dealerships` — painel só do Pedro (whitelist por `ADMIN_EMAILS` env var), pra marcar Pix recebido e ativar planos manualmente
- Cron diário `/api/cron/olx-renewals` renova anúncios OLX (gated por `CRON_SECRET`)

## Preferências de trabalho já validadas nesta sessão

- Pedro prefere que eu aja direto (deploy, commit, testar) em vez de só sugerir — mas sempre reportando o que fiz
- Sempre rodar `npx tsc --noEmit` antes de commitar
- Preview local roda na porta 9000 (`npm run dev` → `next dev -p 9000`), não 3000 — configurar `.claude/launch.json` de acordo
- Validar mudanças de UI via `curl` no HTML renderizado quando o preview MCP não conseguir conectar na porta certa
