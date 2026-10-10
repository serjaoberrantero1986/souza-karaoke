import { Star } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useLibraryStore } from '../stores/libraryStore';
import { usePlayerStore } from '../stores/playerStore';
import { useSettingsStore } from '../stores/settingsStore';

export function YoutubeRating() {
  const location = useLocation(); const enabled = useSettingsStore(state => state.settings.rateYoutube); const track = usePlayerStore(state => state.currentTrack); const rating = useLibraryStore(state => track ? state.youtubeRatings[track.id] || 0 : 0); const rate = useLibraryStore(state => state.rateYoutube);
  if (!enabled || location.pathname !== '/player' || !track?.youtubeVideoId) return null;
  return <div className="youtube-rating" aria-label="Avaliar esta versão do YouTube"><span>Esta versão:</span>{[1, 2, 3, 4, 5].map(value => <button key={value} aria-label={`${value} estrela(s)`} aria-pressed={rating === value} onClick={() => rate(track.id, value)}><Star size={18} fill={value <= rating ? 'currentColor' : 'none'}/></button>)}</div>;
}
