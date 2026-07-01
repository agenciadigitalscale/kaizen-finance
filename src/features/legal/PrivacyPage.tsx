import { useNavigate } from 'react-router-dom'
import { Box, Typography, Button } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { KZ } from '@/theme'
import KaizenEmblem from '@/shared/components/KaizenEmblem'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Box sx={{ mb: 2.5 }}>
      <Typography sx={{ fontSize: '0.95rem', fontWeight: 800, mb: 0.8, color: KZ.t1 }}>{title}</Typography>
      <Typography component="div" sx={{ fontSize: '0.85rem', color: KZ.t2, lineHeight: 1.7 }}>{children}</Typography>
    </Box>
  )
}

export default function PrivacyPage() {
  const navigate = useNavigate()
  return (
    <Box sx={{ minHeight: '100dvh', bgcolor: KZ.bg, py: 4, px: 2 }}>
      <Box sx={{ maxWidth: 720, mx: 'auto' }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ color: KZ.t2, mb: 2, fontSize: '0.8rem' }}>
          Voltar
        </Button>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <KaizenEmblem size={40} />
          <Typography sx={{ fontSize: '1.6rem', fontWeight: 900, letterSpacing: '-0.03em' }}>Política de Privacidade</Typography>
        </Box>
        <Typography sx={{ fontSize: '0.72rem', color: KZ.t3, mb: 3 }}>
          Kaizen Finance · Última atualização: junho de 2026 · em conformidade com a LGPD (Lei 13.709/2018)
        </Typography>

        <Section title="1. Quais dados coletamos">
          Coletamos os dados que você fornece para usar o app: nome, e-mail, senha (armazenada de forma criptografada,
          nunca em texto puro) e as informações financeiras que você cadastra — contas, lançamentos, metas, orçamentos e patrimônio.
        </Section>
        <Section title="2. Como usamos seus dados">
          Usamos seus dados exclusivamente para fornecer o serviço: exibir seu painel, calcular previsões, gerar alertas e análises.
          Não vendemos nem compartilhamos seus dados financeiros com terceiros para fins de marketing.
        </Section>
        <Section title="3. Segurança">
          Senhas são protegidas com PBKDF2 e a autenticação usa tokens JWT. Os dados de cada família ficam isolados em banco
          na infraestrutura da Cloudflare. Recursos de IA processam apenas os dados necessários para gerar a análise solicitada por você.
        </Section>
        <Section title="4. Seus direitos (LGPD)">
          Você pode, a qualquer momento: <strong>acessar</strong> seus dados no app, <strong>exportá-los</strong> em CSV
          (Configurações → Seus dados) e <strong>excluir</strong> sua conta e todos os dados de forma permanente
          (Configurações → Excluir conta).
        </Section>
        <Section title="5. Retenção e exclusão">
          Mantemos seus dados enquanto sua conta existir. Ao excluir a conta, todos os dados associados são apagados
          de forma permanente e irreversível dos nossos sistemas.
        </Section>
        <Section title="6. Contato / Encarregado de dados">
          Dúvidas sobre privacidade ou seus direitos? Fale com a gente em{' '}
          <Typography component="span" sx={{ color: KZ.green }}>suporte@kaizenfinance.com.br</Typography>.
        </Section>

        <Typography sx={{ fontSize: '0.68rem', color: KZ.t3, mt: 4 }}>
          Este documento pode ser atualizado. Avisaremos sobre mudanças relevantes.
        </Typography>
      </Box>
    </Box>
  )
}
