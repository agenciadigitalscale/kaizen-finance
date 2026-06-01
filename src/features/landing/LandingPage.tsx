import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box, Typography, Button, Chip, Divider,
  Accordion, AccordionSummary, AccordionDetails,
} from '@mui/material'
import { motion } from 'framer-motion'
import ExpandMoreIcon      from '@mui/icons-material/ExpandMore'
import CheckIcon           from '@mui/icons-material/Check'
import ArrowForwardIcon    from '@mui/icons-material/ArrowForward'
import WhatsAppIcon        from '@mui/icons-material/WhatsApp'
import AutoGraphIcon       from '@mui/icons-material/AutoGraph'
import NotificationsIcon   from '@mui/icons-material/Notifications'
import RadarIcon           from '@mui/icons-material/Radar'
import PeopleIcon          from '@mui/icons-material/People'
import SmartToyIcon        from '@mui/icons-material/SmartToy'
import WaterfallChartIcon  from '@mui/icons-material/WaterfallChart'
import EmojiEventsIcon     from '@mui/icons-material/EmojiEvents'
import { KZ, KZ_GRADIENTS } from '@/theme'

// ── Helpers ───────────────────────────────────────────────────────────────────
const FadeUp = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 28 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-60px' }}
    transition={{ duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] }}
  >
    {children}
  </motion.div>
)

// ── Glow blob background ──────────────────────────────────────────────────────
function GlowBlob({ x, y, color, size = 600 }: { x: string; y: string; color: string; size?: number }) {
  return (
    <Box sx={{
      position: 'absolute', left: x, top: y,
      width: size, height: size, borderRadius: '50%',
      background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
      pointerEvents: 'none', transform: 'translate(-50%, -50%)',
    }} />
  )
}

// ── Navbar ────────────────────────────────────────────────────────────────────
function Navbar({ onCTA }: { onCTA: () => void }) {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])
  return (
    <Box sx={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      bgcolor: scrolled ? 'rgba(6,10,14,0.92)' : 'transparent',
      backdropFilter: scrolled ? 'blur(20px)' : 'none',
      borderBottom: scrolled ? `1px solid ${KZ.border}` : 'none',
      transition: 'all 0.3s',
      px: { xs: 2, md: 6 }, py: 1.5,
      display: 'flex', alignItems: 'center',
    }}>
      {/* Logo */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
        <Box sx={{ width: 30, height: 30, borderRadius: '9px', background: KZ_GRADIENTS.green, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(16,185,129,0.35)' }}>
          <Typography sx={{ fontSize: '0.85rem' }}>💹</Typography>
        </Box>
        <Typography sx={{ fontWeight: 900, fontSize: '1rem', background: KZ_GRADIENTS.green, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.02em' }}>
          Kaizen Finance
        </Typography>
      </Box>
      {/* Nav links — desktop */}
      <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 3, alignItems: 'center', mr: 4 }}>
        {['Funcionalidades', 'Preços', 'FAQ'].map(l => (
          <Typography key={l} component="a" href={`#${l.toLowerCase()}`}
            sx={{ fontSize: '0.82rem', color: KZ.t2, cursor: 'pointer', textDecoration: 'none', '&:hover': { color: KZ.t1 }, transition: 'color 0.15s' }}>
            {l}
          </Typography>
        ))}
      </Box>
      <Button variant="contained" size="small" onClick={onCTA}
        sx={{ background: KZ_GRADIENTS.green, borderRadius: 2, fontWeight: 700, fontSize: '0.78rem', px: 2 }}>
        Começar grátis
      </Button>
    </Box>
  )
}

// ── Hero ──────────────────────────────────────────────────────────────────────
function Hero({ onCTA }: { onCTA: () => void }) {
  return (
    <Box sx={{
      position: 'relative', overflow: 'hidden',
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      pt: { xs: 12, md: 0 },
    }}>
      <GlowBlob x="15%" y="40%" color="rgba(16,185,129,0.07)" size={800} />
      <GlowBlob x="85%" y="30%" color="rgba(59,130,246,0.05)" size={600} />

      <Box sx={{ maxWidth: 1100, mx: 'auto', px: { xs: 2, md: 6 }, textAlign: 'center', position: 'relative' }}>
        <FadeUp>
          <Chip label="🚀  Novo · Gestão financeira familiar premium" size="small"
            sx={{ mb: 3, bgcolor: 'rgba(16,185,129,0.08)', color: KZ.green, border: `1px solid rgba(16,185,129,0.2)`, fontWeight: 600, fontSize: '0.72rem' }} />
        </FadeUp>

        <FadeUp delay={0.08}>
          <Typography sx={{
            fontSize: { xs: '2.4rem', sm: '3.2rem', md: '4.2rem', lg: '5rem' },
            fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.05,
            color: KZ.t1,
          }}>
            Saiba exatamente{' '}
            <Box component="span" sx={{ background: KZ_GRADIENTS.green, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              onde vai cada real
            </Box>
            {' '}da sua família
          </Typography>
        </FadeUp>

        <FadeUp delay={0.16}>
          <Typography sx={{ fontSize: { xs: '1rem', md: '1.2rem' }, color: KZ.t2, mt: 2.5, mb: 4, maxWidth: 580, mx: 'auto', lineHeight: 1.7 }}>
            O único app que avisa <strong style={{ color: KZ.t1 }}>antes</strong> de você ficar no vermelho.
            Contas a pagar, metas, previsão de caixa e IA financeira — tudo em um só lugar.
          </Typography>
        </FadeUp>

        <FadeUp delay={0.22}>
          <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center', flexWrap: 'wrap', mb: 5 }}>
            <Button variant="contained" size="large" onClick={onCTA} endIcon={<ArrowForwardIcon />}
              sx={{
                background: KZ_GRADIENTS.green, borderRadius: 2.5, fontWeight: 700,
                fontSize: '1rem', px: 4, py: 1.5,
                boxShadow: '0 8px 32px rgba(16,185,129,0.35)',
                '&:hover': { filter: 'brightness(1.1)', transform: 'translateY(-2px)', boxShadow: '0 12px 40px rgba(16,185,129,0.45)' },
              }}>
              Começar 14 dias grátis
            </Button>
            <Button variant="outlined" size="large"
              onClick={() => document.getElementById('funcionalidades')?.scrollIntoView({ behavior: 'smooth' })}
              sx={{ borderColor: KZ.border, color: KZ.t1, borderRadius: 2.5, fontSize: '1rem', px: 3, py: 1.5,
                '&:hover': { borderColor: KZ.green, bgcolor: 'rgba(16,185,129,0.05)' } }}>
              Ver como funciona
            </Button>
          </Box>
        </FadeUp>

        <FadeUp delay={0.28}>
          <Box sx={{ display: 'flex', gap: { xs: 2, md: 4 }, justifyContent: 'center', flexWrap: 'wrap' }}>
            {[
              { value: '14 dias', label: 'grátis sem cartão' },
              { value: 'R$ 0', label: 'para começar' },
              { value: '100%', label: 'seguro e privado' },
            ].map(s => (
              <Box key={s.label} sx={{ textAlign: 'center' }}>
                <Typography sx={{ fontSize: { xs: '1.4rem', md: '1.8rem' }, fontWeight: 900, color: KZ.green, letterSpacing: '-0.03em' }}>{s.value}</Typography>
                <Typography sx={{ fontSize: '0.72rem', color: KZ.t3 }}>{s.label}</Typography>
              </Box>
            ))}
          </Box>
        </FadeUp>

        {/* Dashboard mockup */}
        <FadeUp delay={0.35}>
          <Box sx={{
            mt: 7, borderRadius: 3, overflow: 'hidden',
            border: `1px solid rgba(16,185,129,0.15)`,
            boxShadow: '0 40px 120px rgba(0,0,0,0.7), 0 0 60px rgba(16,185,129,0.08)',
            mx: 'auto', maxWidth: 900,
            position: 'relative',
          }}>
            {/* Mock top bar */}
            <Box sx={{ bgcolor: 'rgba(10,15,20,0.99)', px: 2, py: 1.2, display: 'flex', alignItems: 'center', gap: 1.5, borderBottom: `1px solid ${KZ.border}` }}>
              {['#EF4444','#F59E0B','#10B981'].map(c => (
                <Box key={c} sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: c }} />
              ))}
              <Box sx={{ flex: 1, mx: 2, bgcolor: 'rgba(255,255,255,0.04)', borderRadius: 1, py: 0.5, px: 2, fontSize: '0.65rem', color: KZ.t3, textAlign: 'left' }}>
                app.kaizenfinance.com.br
              </Box>
            </Box>
            {/* Dashboard preview */}
            <Box sx={{ bgcolor: KZ.bg, p: { xs: 2, md: 3 } }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 1.5, mb: 2 }}>
                {[
                  { label: 'Saldo total', value: 'R$ 12.548', color: KZ.green },
                  { label: 'Receitas/mês', value: 'R$ 8.500', color: KZ.green },
                  { label: 'Despesas/mês', value: 'R$ 5.342', color: KZ.red },
                  { label: 'Fluxo do mês', value: 'R$ 3.158', color: KZ.green },
                ].map(kpi => (
                  <Box key={kpi.label} sx={{ bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 2, p: 1.5, border: `1px solid ${KZ.border}` }}>
                    <Typography sx={{ fontSize: '0.55rem', color: KZ.t3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{kpi.label}</Typography>
                    <Typography sx={{ fontSize: { xs: '0.85rem', md: '1.1rem' }, fontWeight: 900, color: kpi.color, mt: 0.5 }}>{kpi.value}</Typography>
                  </Box>
                ))}
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.8fr 1fr' }, gap: 1.5 }}>
                <Box sx={{ bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 2, p: 2, border: `1px solid ${KZ.border}` }}>
                  <Typography sx={{ fontSize: '0.6rem', color: KZ.t2, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', mb: 1.5 }}>Próximas contas</Typography>
                  {[
                    { name: 'Aluguel', val: 'R$ 1.800', days: -2, color: KZ.red },
                    { name: 'Internet', val: 'R$ 119,90', days: 2, color: KZ.gold },
                    { name: 'Cartão Nubank', val: 'R$ 1.250', days: 7, color: KZ.t2 },
                    { name: 'Netflix', val: 'R$ 54,90', days: 12, color: KZ.t2 },
                  ].map(b => (
                    <Box key={b.name} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.7, borderBottom: `1px solid ${KZ.border}`, '&:last-child': { borderBottom: 0 } }}>
                      <Typography sx={{ fontSize: '0.72rem', color: KZ.t1 }}>{b.name}</Typography>
                      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                        <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: KZ.t1 }}>{b.val}</Typography>
                        <Typography sx={{ fontSize: '0.6rem', color: b.color, fontWeight: 700, minWidth: 50, textAlign: 'right' }}>
                          {b.days < 0 ? `${Math.abs(b.days)}d atrasado` : b.days === 0 ? 'Hoje' : `${b.days} dias`}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
                <Box sx={{ bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 2, p: 2, border: `1px solid ${KZ.border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
                  <Typography sx={{ fontSize: '0.6rem', color: KZ.t2, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', alignSelf: 'flex-start' }}>Saúde financeira</Typography>
                  <Box sx={{ position: 'relative', width: 80, height: 80 }}>
                    <svg width="80" height="80" style={{ transform: 'rotate(-90deg)' }}>
                      <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
                      <circle cx="40" cy="40" r="32" fill="none" stroke={KZ.gold} strokeWidth="6"
                        strokeDasharray={`${(72/100)*201} 201`} strokeLinecap="round"
                        style={{ filter: `drop-shadow(0 0 6px ${KZ.gold})` }} />
                    </svg>
                    <Box sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <Typography sx={{ fontSize: '1.3rem', fontWeight: 900, color: KZ.gold, lineHeight: 1 }}>72</Typography>
                      <Typography sx={{ fontSize: '0.45rem', color: KZ.t3 }}>BOM</Typography>
                    </Box>
                  </Box>
                  <Typography sx={{ fontSize: '0.65rem', color: KZ.t2, textAlign: 'center' }}>Score atualizado em tempo real</Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </FadeUp>
      </Box>
    </Box>
  )
}

// ── Social proof ──────────────────────────────────────────────────────────────
function SocialProof() {
  const items = [
    { name: 'Mariana S.', city: 'São Paulo', text: '"Finalmente entendi pra onde ia meu dinheiro. O alerta de previsão de caixa me salvou 3 vezes."', stars: 5 },
    { name: 'Rafael M.', city: 'Belo Horizonte', text: '"Eu e minha esposa usamos juntos. A visão compartilhada do casal mudou nossas finanças."', stars: 5 },
    { name: 'Camila R.', city: 'Curitiba', text: '"O radar de assinaturas descobriu R$ 187 que eu pagava sem usar. Me paguei em 1 mês."', stars: 5 },
    { name: 'Diego F.', city: 'Recife', text: '"Melhor app financeiro do Brasil. Simples, bonito e resolve de verdade."', stars: 5 },
  ]
  return (
    <Box sx={{ py: 10, bgcolor: 'rgba(255,255,255,0.015)', borderTop: `1px solid ${KZ.border}`, borderBottom: `1px solid ${KZ.border}` }}>
      <Box sx={{ maxWidth: 1100, mx: 'auto', px: { xs: 2, md: 6 } }}>
        <FadeUp>
          <Typography sx={{ textAlign: 'center', fontSize: '0.72rem', color: KZ.t3, textTransform: 'uppercase', letterSpacing: '0.1em', mb: 5 }}>
            O que dizem nossos usuários
          </Typography>
        </FadeUp>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2,1fr)', lg: 'repeat(4,1fr)' }, gap: 2 }}>
          {items.map((item, i) => (
            <FadeUp key={item.name} delay={i * 0.07}>
              <Box sx={{
                bgcolor: 'rgba(255,255,255,0.03)', border: `1px solid ${KZ.border}`, borderRadius: 3,
                p: 2.5, height: '100%', display: 'flex', flexDirection: 'column', gap: 1.5,
              }}>
                <Box sx={{ display: 'flex', gap: 0.3 }}>
                  {'★★★★★'.split('').map((s, j) => (
                    <Typography key={j} sx={{ fontSize: '0.9rem', color: KZ.gold }}>{s}</Typography>
                  ))}
                </Box>
                <Typography sx={{ fontSize: '0.82rem', color: KZ.t2, lineHeight: 1.65, flex: 1 }}>{item.text}</Typography>
                <Box>
                  <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: KZ.t1 }}>{item.name}</Typography>
                  <Typography sx={{ fontSize: '0.65rem', color: KZ.t3 }}>{item.city}</Typography>
                </Box>
              </Box>
            </FadeUp>
          ))}
        </Box>
      </Box>
    </Box>
  )
}

// ── Features ──────────────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: <WaterfallChartIcon sx={{ fontSize: 28 }} />,
    color: KZ.green,
    title: 'Previsão de caixa dia a dia',
    desc: 'O Kaizen calcula seu saldo futuro com base em todas as suas contas e receitas agendadas. Avisa exatamente qual dia você vai ficar no vermelho — antes que aconteça.',
  },
  {
    icon: <AutoGraphIcon sx={{ fontSize: 28 }} />,
    color: KZ.gold,
    title: 'Score de saúde financeira',
    desc: 'Nota de 0 a 100 atualizada em tempo real. Baseada em fundo de emergência, proporção de dívidas, disciplina de orçamento e taxa de poupança.',
  },
  {
    icon: <PeopleIcon sx={{ fontSize: 28 }} />,
    color: KZ.blue,
    title: 'Modo parceria (casal)',
    desc: 'Visão individual e visão conjunta da família. Cada um vê suas despesas pessoais e ambos veem o quadro completo da casa.',
  },
  {
    icon: <WhatsAppIcon sx={{ fontSize: 28 }} />,
    color: '#25D366',
    title: 'Alertas no WhatsApp',
    desc: 'Receba notificações de vencimento no seu WhatsApp antes que a conta vire dívida. Nunca mais esqueça um boleto.',
  },
  {
    icon: <RadarIcon sx={{ fontSize: 28 }} />,
    color: '#EC4899',
    title: 'Radar de assinaturas',
    desc: 'Detecta automaticamente cobranças recorrentes nos seus lançamentos. Descobre serviços que você esqueceu de cancelar.',
  },
  {
    icon: <EmojiEventsIcon sx={{ fontSize: 28 }} />,
    color: KZ.gold,
    title: 'Simulador de metas',
    desc: '"Guardando R$ 800/mês, sua viagem para a Europa fica pronta em 14 meses." Metas com simulação em tempo real.',
  },
  {
    icon: <SmartToyIcon sx={{ fontSize: 28 }} />,
    color: KZ.green,
    title: 'IA financeira mensal',
    desc: 'Análise automática do mês feita por inteligência artificial. Receba insights personalizados, alertas e recomendações práticas.',
  },
  {
    icon: <NotificationsIcon sx={{ fontSize: 28 }} />,
    color: KZ.blue,
    title: 'Orçamento inteligente',
    desc: 'Define limites por categoria e recebe alertas quando estiver perto de estourar. Acompanha receitas x despesas em tempo real.',
  },
]

function Features() {
  return (
    <Box id="funcionalidades" sx={{ py: 14, maxWidth: 1100, mx: 'auto', px: { xs: 2, md: 6 } }}>
      <FadeUp>
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Chip label="Funcionalidades" size="small"
            sx={{ mb: 2, bgcolor: 'rgba(16,185,129,0.08)', color: KZ.green, border: `1px solid rgba(16,185,129,0.2)`, fontWeight: 600, fontSize: '0.72rem' }} />
          <Typography sx={{ fontSize: { xs: '1.8rem', md: '2.8rem' }, fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.15 }}>
            Tudo que você precisa para{' '}
            <Box component="span" sx={{ background: KZ_GRADIENTS.green, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              dominar suas finanças
            </Box>
          </Typography>
          <Typography sx={{ fontSize: '1rem', color: KZ.t2, mt: 2, maxWidth: 500, mx: 'auto' }}>
            Recursos exclusivos que você não encontra em nenhum outro app financeiro brasileiro.
          </Typography>
        </Box>
      </FadeUp>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2,1fr)', lg: 'repeat(4,1fr)' }, gap: 2 }}>
        {FEATURES.map((f, i) => (
          <FadeUp key={f.title} delay={i * 0.05}>
            <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.15 }}>
              <Box sx={{
                bgcolor: 'rgba(255,255,255,0.02)', border: `1px solid ${KZ.border}`, borderRadius: 3,
                p: 3, height: '100%', display: 'flex', flexDirection: 'column', gap: 1.5,
                transition: 'border-color 0.2s',
                '&:hover': { borderColor: `${f.color}30`, bgcolor: `${f.color}04` },
              }}>
                <Box sx={{ color: f.color, p: 1, bgcolor: `${f.color}10`, borderRadius: 2, width: 'fit-content' }}>
                  {f.icon}
                </Box>
                <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: KZ.t1 }}>{f.title}</Typography>
                <Typography sx={{ fontSize: '0.8rem', color: KZ.t2, lineHeight: 1.65, flex: 1 }}>{f.desc}</Typography>
              </Box>
            </motion.div>
          </FadeUp>
        ))}
      </Box>
    </Box>
  )
}

// ── Pricing ───────────────────────────────────────────────────────────────────
function Pricing({ onCTA }: { onCTA: () => void }) {
  const [yearly, setYearly] = useState(false)

  const plans = [
    {
      name: 'Plano Família',
      price:   yearly ? 'R$ 20,75' : 'R$ 29,90',
      period:  yearly ? '/mês (cobrado anualmente)' : '/mês',
      sub:     yearly ? 'R$ 249/ano — 2 meses grátis' : 'Cancele quando quiser',
      highlight: true,
      features: [
        'Contas a pagar ilimitadas',
        'Lançamentos ilimitados',
        'Orçamento por categoria',
        'Metas financeiras',
        'Patrimônio líquido',
        'Previsão de caixa',
        'Radar de assinaturas',
        'Score de saúde financeira',
        'Alertas WhatsApp',
        'Modo parceria (casal)',
        'IA financeira mensal',
        'Relatórios completos',
        'Suporte prioritário',
      ],
    },
  ]

  return (
    <Box id="preços" sx={{ py: 14, position: 'relative', overflow: 'hidden' }}>
      <GlowBlob x="50%" y="50%" color="rgba(16,185,129,0.05)" size={900} />
      <Box sx={{ maxWidth: 700, mx: 'auto', px: { xs: 2, md: 6 }, position: 'relative' }}>
        <FadeUp>
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Chip label="Preços" size="small"
              sx={{ mb: 2, bgcolor: 'rgba(16,185,129,0.08)', color: KZ.green, border: `1px solid rgba(16,185,129,0.2)`, fontWeight: 600, fontSize: '0.72rem' }} />
            <Typography sx={{ fontSize: { xs: '1.8rem', md: '2.8rem' }, fontWeight: 900, letterSpacing: '-0.03em' }}>
              Simples e transparente
            </Typography>
            <Typography sx={{ fontSize: '1rem', color: KZ.t2, mt: 2 }}>
              Um plano completo. Sem pegadinhas. Sem features escondidas.
            </Typography>

            {/* Toggle anual/mensal */}
            <Box sx={{ display: 'inline-flex', mt: 3, bgcolor: 'rgba(255,255,255,0.04)', borderRadius: 2.5, p: 0.5, border: `1px solid ${KZ.border}` }}>
              {[false, true].map(isYearly => (
                <Button key={String(isYearly)} size="small" variant={yearly === isYearly ? 'contained' : 'text'}
                  onClick={() => setYearly(isYearly)}
                  sx={{
                    borderRadius: 2, px: 2.5, fontSize: '0.78rem', fontWeight: 600,
                    ...(yearly === isYearly
                      ? { background: KZ_GRADIENTS.green, color: '#000' }
                      : { color: KZ.t2 }
                    ),
                  }}>
                  {isYearly ? 'Anual' : 'Mensal'}
                  {isYearly && <Chip label="−30%" size="small" sx={{ ml: 0.8, height: 16, fontSize: '0.55rem', bgcolor: 'rgba(245,158,11,0.15)', color: KZ.gold }} />}
                </Button>
              ))}
            </Box>
          </Box>
        </FadeUp>

        {plans.map(plan => (
          <FadeUp key={plan.name} delay={0.1}>
            <Box sx={{
              bgcolor: 'rgba(10,15,20,0.98)', border: `2px solid rgba(16,185,129,0.3)`,
              borderRadius: 4, p: { xs: 3, md: 4 }, position: 'relative', overflow: 'hidden',
              boxShadow: '0 0 60px rgba(16,185,129,0.08)',
            }}>
              <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: KZ_GRADIENTS.green }} />
              <Chip label="14 dias grátis" size="small"
                sx={{ mb: 2.5, bgcolor: 'rgba(16,185,129,0.12)', color: KZ.green, border: `1px solid rgba(16,185,129,0.25)`, fontWeight: 700, fontSize: '0.7rem' }} />
              <Typography sx={{ fontSize: '1.3rem', fontWeight: 800, mb: 0.5 }}>{plan.name}</Typography>
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.8, mb: 0.5 }}>
                <Typography sx={{ fontSize: '3rem', fontWeight: 900, color: KZ.green, letterSpacing: '-0.04em' }}>{plan.price}</Typography>
                <Typography sx={{ fontSize: '0.82rem', color: KZ.t3 }}>{plan.period}</Typography>
              </Box>
              <Typography sx={{ fontSize: '0.75rem', color: KZ.t3, mb: 3 }}>{plan.sub}</Typography>

              <Button variant="contained" fullWidth size="large" onClick={onCTA}
                sx={{ background: KZ_GRADIENTS.green, borderRadius: 2.5, fontWeight: 700, fontSize: '1rem', py: 1.5, mb: 3,
                  boxShadow: '0 8px 24px rgba(16,185,129,0.3)',
                  '&:hover': { filter: 'brightness(1.1)', transform: 'translateY(-1px)' } }}>
                Começar 14 dias grátis
              </Button>

              <Divider sx={{ mb: 3 }} />
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.2 }}>
                {plan.features.map(f => (
                  <Box key={f} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckIcon sx={{ fontSize: 15, color: KZ.green, flexShrink: 0 }} />
                    <Typography sx={{ fontSize: '0.8rem', color: KZ.t2 }}>{f}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </FadeUp>
        ))}

        <FadeUp delay={0.2}>
          <Typography sx={{ textAlign: 'center', mt: 3, fontSize: '0.72rem', color: KZ.t3 }}>
            Sem contrato. Cancele a qualquer momento. Dados exportáveis.
          </Typography>
        </FadeUp>
      </Box>
    </Box>
  )
}

// ── FAQ ───────────────────────────────────────────────────────────────────────
const FAQS = [
  { q: 'Precisa de cartão para o trial?', a: 'Não. O trial de 14 dias é 100% gratuito e sem necessidade de cartão de crédito. Você só cadastra o pagamento se quiser continuar após o período.' },
  { q: 'Os dados são seguros?', a: 'Sim. Usamos criptografia PBKDF2 para senhas e JWT para autenticação. Seus dados financeiros ficam em banco isolado por família, no Cloudflare D1.' },
  { q: 'Posso usar com meu cônjuge/parceiro(a)?', a: 'Sim! O modo parceria é nativo no Kaizen. Dois usuários podem compartilhar a mesma casa (household) e ver tanto as despesas individuais quanto o panorama familiar.' },
  { q: 'O app funciona offline?', a: 'Sim. O Kaizen é um PWA instalável no celular. Você pode visualizar dados offline e sincroniza quando voltar a ter internet.' },
  { q: 'Posso cancelar quando quiser?', a: 'Sim, a qualquer momento e sem multa. Ao cancelar, seu acesso continua até o fim do período pago.' },
  { q: 'Como funciona a IA financeira?', a: 'A cada mês, o Kaizen gera uma análise completa dos seus gastos, pontos de atenção e recomendações personalizadas usando Claude (Anthropic AI).' },
]

function FAQ() {
  return (
    <Box id="faq" sx={{ py: 14, maxWidth: 760, mx: 'auto', px: { xs: 2, md: 6 } }}>
      <FadeUp>
        <Box sx={{ textAlign: 'center', mb: 7 }}>
          <Typography sx={{ fontSize: { xs: '1.8rem', md: '2.5rem' }, fontWeight: 900, letterSpacing: '-0.03em' }}>
            Perguntas frequentes
          </Typography>
        </Box>
      </FadeUp>
      {FAQS.map((faq, i) => (
        <FadeUp key={faq.q} delay={i * 0.05}>
          <Accordion sx={{
            bgcolor: 'rgba(255,255,255,0.02)', border: `1px solid ${KZ.border}`, borderRadius: '12px !important',
            mb: 1, '&:before': { display: 'none' },
            '&.Mui-expanded': { borderColor: 'rgba(16,185,129,0.2)' },
          }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: KZ.t2 }} />}>
              <Typography sx={{ fontWeight: 600, fontSize: '0.92rem' }}>{faq.q}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography sx={{ fontSize: '0.85rem', color: KZ.t2, lineHeight: 1.7 }}>{faq.a}</Typography>
            </AccordionDetails>
          </Accordion>
        </FadeUp>
      ))}
    </Box>
  )
}

// ── Final CTA ─────────────────────────────────────────────────────────────────
function FinalCTA({ onCTA }: { onCTA: () => void }) {
  return (
    <Box sx={{ py: 14, px: { xs: 2, md: 6 }, position: 'relative', overflow: 'hidden' }}>
      <GlowBlob x="50%" y="50%" color="rgba(16,185,129,0.08)" size={700} />
      <FadeUp>
        <Box sx={{
          maxWidth: 700, mx: 'auto', textAlign: 'center',
          bgcolor: 'rgba(10,15,20,0.98)', border: `1px solid rgba(16,185,129,0.2)`,
          borderRadius: 4, p: { xs: 4, md: 6 },
          boxShadow: '0 0 80px rgba(16,185,129,0.07)',
          position: 'relative',
        }}>
          <Typography sx={{ fontSize: { xs: '1.8rem', md: '2.5rem' }, fontWeight: 900, letterSpacing: '-0.03em', mb: 2 }}>
            Comece hoje.{' '}
            <Box component="span" sx={{ background: KZ_GRADIENTS.green, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Sem risco.
            </Box>
          </Typography>
          <Typography sx={{ fontSize: '1rem', color: KZ.t2, mb: 4, lineHeight: 1.7 }}>
            14 dias grátis, sem cartão. Você vai saber em menos de 1 semana se o Kaizen vai transformar sua vida financeira.
          </Typography>
          <Button variant="contained" size="large" onClick={onCTA} endIcon={<ArrowForwardIcon />}
            sx={{
              background: KZ_GRADIENTS.green, borderRadius: 2.5, fontWeight: 700,
              fontSize: '1.05rem', px: 5, py: 1.6,
              boxShadow: '0 8px 32px rgba(16,185,129,0.35)',
              '&:hover': { filter: 'brightness(1.1)', transform: 'translateY(-2px)', boxShadow: '0 12px 40px rgba(16,185,129,0.45)' },
            }}>
            Criar conta gratuita
          </Button>
          <Typography sx={{ mt: 2, fontSize: '0.72rem', color: KZ.t3 }}>
            Sem cartão · Cancele quando quiser · Dados 100% privados
          </Typography>
        </Box>
      </FadeUp>
    </Box>
  )
}

// ── Footer ────────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <Box sx={{ borderTop: `1px solid ${KZ.border}`, py: 4, px: { xs: 2, md: 6 } }}>
      <Box sx={{ maxWidth: 1100, mx: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 24, height: 24, borderRadius: '7px', background: KZ_GRADIENTS.green, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography sx={{ fontSize: '0.65rem' }}>💹</Typography>
          </Box>
          <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: KZ.t2 }}>Kaizen Finance</Typography>
        </Box>
        <Typography sx={{ fontSize: '0.72rem', color: KZ.t3 }}>
          © {new Date().getFullYear()} Kaizen Finance · Melhoria contínua das suas finanças
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {['Privacidade', 'Termos'].map(l => (
            <Typography key={l} sx={{ fontSize: '0.72rem', color: KZ.t3, cursor: 'pointer', '&:hover': { color: KZ.t1 } }}>{l}</Typography>
          ))}
        </Box>
      </Box>
    </Box>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const navigate = useNavigate()
  const handleCTA = () => navigate('/login')

  return (
    <Box sx={{ bgcolor: KZ.bg, minHeight: '100vh', overflowX: 'hidden' }}>
      <Navbar onCTA={handleCTA} />
      <Hero onCTA={handleCTA} />
      <SocialProof />
      <Features />
      <Pricing onCTA={handleCTA} />
      <FAQ />
      <FinalCTA onCTA={handleCTA} />
      <Footer />
    </Box>
  )
}
