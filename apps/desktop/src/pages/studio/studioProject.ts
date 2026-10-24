export const studioStemLabels = { vocals: 'Voz', drums: 'Bateria', bass: 'Baixo', other: 'Outros instrumentos' } as const;
export type StudioStemKey = keyof typeof studioStemLabels;
export type StudioManifest = { status: 'completed'; source: string; durationSeconds?: number; instrumentStems?: Record<StudioStemKey, string>; stems?: Record<string, string> };
export type StudioProjectFiles = { manifest: StudioManifest; tracks: Array<{ key: string; label: string; file: File }> };
export type ProcessedStudioProject = { status: 'completed'; manifest: StudioManifest; tracks: Array<{ key: string; label: string; url: string }> };

function relativePath(file: File) {
  const path = file.webkitRelativePath || file.name;
  return path.includes('/') ? path.slice(path.indexOf('/') + 1).replaceAll('\\', '/') : path.replaceAll('\\', '/');
}

export async function readStudioProject(files: File[]): Promise<StudioProjectFiles> {
  const byPath = new Map(files.map(file => [relativePath(file), file]));
  const manifestFile = byPath.get('manifest.json');
  if (!manifestFile) throw new Error('Escolha a pasta de um projeto processado pelo AI Studio.');
  let manifest: Partial<StudioManifest>;
  try { manifest = JSON.parse(await manifestFile.text()) as Partial<StudioManifest>; }
  catch { throw new Error('O manifesto deste projeto não é válido.'); }
  if (manifest.status !== 'completed' || !manifest.instrumentStems || typeof manifest.source !== 'string') throw new Error('O projeto ainda não possui uma separação de instrumentos concluída.');
  const tracks = (Object.keys(studioStemLabels) as StudioStemKey[]).map(key => {
    const path = manifest.instrumentStems?.[key]?.replaceAll('\\', '/'); const file = path ? byPath.get(path) : undefined;
    if (!file) throw new Error(`A faixa “${studioStemLabels[key]}” não foi encontrada na pasta escolhida.`);
    return { key, label: studioStemLabels[key], file };
  });
  return { manifest: manifest as StudioManifest, tracks };
}
