import type { Track } from '../types/track';
import { YoutubeBrowser } from './YoutubeBrowser';

export function TrackBrowser(props: {
  selected?: string[];
  onSelect?: (track: Track) => void;
  onAdd?: (track: Track) => void;
  initialQuery?: string;
  compact?: boolean;
  addedIds?: string[];
}) {
  return <div className={`track-browser ${props.compact ? 'compact' : ''}`}><YoutubeBrowser {...props}/></div>;
}
