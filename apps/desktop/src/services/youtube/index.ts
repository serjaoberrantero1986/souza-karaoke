import type { Track } from '../../types/track';
/** Contrato futuro. Nenhuma chamada externa ou implementação nesta fase. */
export interface YoutubeCatalog { search(query: string, signal?: AbortSignal): Promise<Track[]> }
