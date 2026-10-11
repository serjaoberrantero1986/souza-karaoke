import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchYoutube } from '../services/youtube/catalog';
import { useYoutubeStore } from '../stores/youtubeStore';
import { useQueueStore } from '../stores/queueStore';
import { usePlayerStore } from '../stores/playerStore';
import { useLibraryStore } from '../stores/libraryStore';
import type { Track } from '../types/track';
import type { RemoteRequest } from '../stores/remoteStore';
import { useUiStore } from '../stores/uiStore';
import { useRemoteStore } from '../stores/remoteStore';
import { useSettingsStore } from '../stores/settingsStore';
import type { ReactionKind } from '../types/player';
import { useThemeStore } from '../stores/themeStore';
import { singerLevels } from '../lib/singerRating';

export function RemoteBridge() {
  const navigate = useNavigate(); const permanentQr = useSettingsStore(state => state.settings.permanentQr); const savedCatalog = useRef(new Map<string, Track>()); const lastRequest = useRef(new Map<string, number>()); const themeRevision = useRef({ theme: useThemeStore.getState().theme, version: 1 });
  useEffect(() => {
    const catalog = savedCatalog.current;
    async function dispatch(request: RemoteRequest) {
      useRemoteStore.setState({ connectedDevices: request.connectedCount });
      const player = usePlayerStore.getState(); const settings = useSettingsStore.getState().settings; const queueStore = useQueueStore.getState();
      if (request.action === 'theme') return useThemeStore.getState().theme;
      const theme = useThemeStore.getState().theme;
      if (themeRevision.current.theme !== theme) themeRevision.current = { theme, version: themeRevision.current.version + 1 };
      if (request.role === 'operator' && (!settings.operatorEnabled || (settings.operatorPin && request.pin !== settings.operatorPin))) {
        if (request.action === 'state') return { role: request.role, locked: true, pinRequired: !!settings.operatorPin };
        throw new Error(settings.operatorEnabled ? 'PIN do operador incorreto.' : 'Operador remoto desativado.');
      }
      if (request.action === 'state') return {
        themeVersion: themeRevision.current.version,
        role: request.role, current: player.currentTrack?.title, singer: player.requestedBy, status: player.status, score: player.score, scoreNotice: player.scoreNotice, scoreMode: settings.scoreMode, canPrevious: player.currentTrack ? player.sessionIndex > 0 : player.sessionIndex >= 0, sessionTracks: player.sessionTracks.map((item, index) => ({ id: item.id, trackId: item.track.id, title: item.track.title, name: item.requestedBy, position: index === player.sessionIndex && player.currentTrack ? 'Atual' : index <= player.sessionIndex ? 'Anterior' : 'A seguir' })), reactionCount: Object.keys(player.reactions).length, ratingLevels: singerLevels, rating: player.reactions[request.deviceId], pitch: player.pitch, pitchAvailable: !!player.currentTrack?.mediaUrl || (!!window.desktop && settings.youtubePitch && !player.audioFallback && !!player.currentTrack?.youtubeVideoId),
        queue: queueStore.queue.map(item => ({ id: item.id, title: item.track.title, name: item.requestedBy })),
        permissions: { requestName: settings.requestName, allowAdd: settings.allowAdd, allowPlayback: settings.allowPlayback, allowPitch: settings.allowPitch, allowQueue: settings.allowQueue, allowReactions: settings.allowReactions, multipleReactions: settings.multipleReactions },
        photoOffer: settings.photoEnabled && player.status === 'photo' && (!player.requestedByDeviceId || player.requestedByDeviceId === request.deviceId), photoReceived: !!player.photoDataUrl, photoDownload: settings.photoDownload, photoCountdown: settings.photoCountdown, photoFrame: settings.photoFrame,
        photoStamp: { name: settings.photoStampName, song: settings.photoStampSong, date: settings.photoStampDate, score: settings.photoStampScore, logo: settings.photoStampLogo },
      };
      if (request.action === 'search') { if (!request.query.trim()) throw new Error('Digite o nome da música ou artista.'); const key = useYoutubeStore.getState().apiKey; if (!key) throw new Error('Peça ao responsável para configurar a busca no computador.'); const result = await searchYoutube(request.query, key, new AbortController().signal); if (catalog.size > 500) catalog.clear(); result.tracks.forEach(track => catalog.set(track.id, track)); return result; }
      if (request.action === 'add') {
        if (!settings.allowAdd) throw new Error('Novos pedidos estão pausados pelo operador.'); const track = catalog.get(request.trackId) || player.sessionTracks.find(item => item.track.id === request.trackId)?.track; if (!track) throw new Error('Busque a música novamente antes de pedir.'); if (settings.requestName && !request.name) throw new Error('Informe seu nome.'); const requester = request.name || 'Participante'; const ownRequests = queueStore.queue.filter(item => item.requestedByDeviceId === request.deviceId).length; if (settings.maxRequests > 0 && ownRequests >= settings.maxRequests) throw new Error(`Você já tem ${settings.maxRequests} pedido(s) na fila.`); const previous = lastRequest.current.get(request.deviceId) || 0; if (settings.requestInterval > 0 && Date.now() - previous < settings.requestInterval * 1000) throw new Error(`Aguarde ${settings.requestInterval} segundos entre pedidos.`); if (queueStore.queue.length >= 100) throw new Error('A fila está cheia. Aguarde algumas músicas.'); useLibraryStore.getState().rememberTrack(track); queueStore.addToQueue(track, requester, request.deviceId); lastRequest.current.set(request.deviceId, Date.now()); useUiStore.getState().notify(`${requester} pediu: ${track.title}. Veja em Fila de músicas.`); return { ok: true };
      }
      if (request.action === 'react') { if (!settings.allowReactions || !player.currentTrack || !['playing', 'paused'].includes(player.status)) throw new Error('As avaliações não estão disponíveis agora.'); const reaction = Number(request.reaction) as ReactionKind; if (!singerLevels.some(level => level.score === reaction)) throw new Error('Nota inválida.'); if (!settings.multipleReactions && player.reactions[request.deviceId]) throw new Error('Sua avaliação já foi registrada.'); player.react(request.deviceId, reaction); return { ok: true }; }
      if (request.action === 'photo') { if (!settings.photoEnabled || player.status !== 'photo') throw new Error('A captura de foto não está disponível agora.'); if (player.requestedByDeviceId && player.requestedByDeviceId !== request.deviceId && request.role !== 'operator') throw new Error('A foto deve ser enviada pelo celular de quem fez o pedido.'); if (!/^data:image\/(jpeg|png|webp);base64,/.test(request.photoDataUrl) || request.photoDataUrl.length > 5_500_000) throw new Error('Foto inválida ou muito grande.'); player.setPhoto(request.photoDataUrl); if (window.desktop) await window.desktop.savePhoto({ dataUrl: request.photoDataUrl, singer: player.requestedBy, song: player.currentTrack?.title || '', score: player.score }); return { ok: true }; }
      if (request.action === 'queueRemove') { queueStore.removeFromQueue(request.queueId); return { ok: true }; }
      if (request.action === 'queueUp' || request.action === 'queueDown') { queueStore.moveQueueItem(request.queueId, request.action === 'queueUp' ? -1 : 1); return { ok: true }; }
      if (request.role !== 'operator' && (!['playing', 'paused'].includes(player.status) || !((settings.allowPlayback && ['pause', 'resume', 'restart', 'back'].includes(request.action)) || (settings.allowPitch && ['pitchUp', 'pitchDown', 'pitchReset'].includes(request.action))))) throw new Error('Este controle não foi liberado pelo operador.');
      if (request.action === 'previous') player.previous();
      if (request.action === 'confirmScore') { if (request.role !== 'operator' || player.status !== 'scoring' || settings.scoreMode !== 'operator') throw new Error('A nota manual não está disponível agora.'); if (!Number.isInteger(request.score) || request.score < 0 || request.score > 100) throw new Error('Informe uma nota de 0 a 100.'); player.setScore(request.score); player.advance(); return { ok: true }; }
      if (request.action === 'restart') player.restart();
      if (request.action === 'back') player.seek(Math.max(0, player.currentTime - 10));
      if (['pitchUp', 'pitchDown', 'pitchReset'].includes(request.action)) {
        if (!player.currentTrack?.mediaUrl && !(settings.youtubePitch && !player.audioFallback && window.desktop && player.currentTrack?.youtubeVideoId)) throw new Error('Ative o processamento de tom no computador para esta fonte.');
        if (request.action === 'pitchUp') player.increasePitch();
        if (request.action === 'pitchDown') player.decreasePitch();
        if (request.action === 'pitchReset') player.resetPitch();
      }
      if (request.action === 'pause') player.pause(); if (request.action === 'resume') player.resume(); if (request.action === 'skip') player.skip(); if (request.action === 'start') { if (!player.currentTrack) player.skip(); usePlayerStore.getState().startNow(); } if (usePlayerStore.getState().currentTrack) navigate('/player'); return { ok: true };
    }
    const stop = window.desktop?.remoteListen(request => { void dispatch(request).then(result => window.desktop?.remoteReply({ id: request.id, result })).catch(error => window.desktop?.remoteReply({ id: request.id, error: error.message })); });
    if (window.desktop) void window.desktop.remoteConfigure(permanentQr).then(info => useRemoteStore.getState().setInfo(info)).catch(() => useUiStore.getState().notify('O controle pelo celular não pôde ser iniciado. Confira a porta 17844.'));
    return stop;
  }, [navigate, permanentQr]);
  return null;
}
