import { useRemoteStore } from '../stores/remoteStore';
export function RemoteQrCard({ operator = false, compact = false }: { operator?: boolean; compact?: boolean }) {
  const { info, selected } = useRemoteStore(); const link = info?.links[selected];
  return <aside className={`qr-card ${compact ? 'compact' : ''}`} aria-label={operator ? 'QR do operador' : 'QR dos participantes'}><strong>{operator ? 'Operador remoto' : 'Peça sua música'}</strong>{link ? <><img style={{ width: '100%', maxWidth: 230 }} src={operator ? link.operatorQr : link.participantQr} alt="Leia para acessar esta sessão"/><small>Celular e computador no mesmo Wi-Fi</small></> : <p>Iniciando controle pelo celular…</p>}</aside>;
}
