import { beforeEach, describe, expect, it } from 'vitest';
import { lockStudio, studioAccessGranted, unlockStudio } from '../src/pages/studio/studioAccess';
import { readStudioProject } from '../src/pages/studio/studioProject';

function file(name: string, contents = 'audio', path = name) { const value = new File([contents], name); Object.defineProperty(value, 'webkitRelativePath', { value: `job/${path}` }); return value; }

beforeEach(lockStudio);
describe('proteção administrativa do Studio', () => {
  it('exige PIN configurado e aceita somente o valor correto', () => { expect(unlockStudio('', '')).toBe('pin-not-configured'); expect(unlockStudio('1234', '1111')).toBe('invalid-pin'); expect(studioAccessGranted()).toBe(false); expect(unlockStudio('1234', '1234')).toBe('granted'); expect(studioAccessGranted()).toBe(true); });
  it('bloqueia novamente sem persistir autorização', () => { unlockStudio('1234', '1234'); lockStudio(); expect(studioAccessGranted()).toBe(false); });
});
describe('abertura segura de projetos processados', () => {
  const manifest = JSON.stringify({ status: 'completed', source: 'musica.mp3', instrumentStems: { vocals: 'instrumentos/voz.wav', drums: 'instrumentos/bateria.wav', bass: 'instrumentos/baixo.wav', other: 'instrumentos/outros.wav' } });
  it('resolve as quatro faixas pelo manifesto', async () => { const project = await readStudioProject([file('manifest.json', manifest), file('voz.wav', 'v', 'instrumentos/voz.wav'), file('bateria.wav', 'd', 'instrumentos/bateria.wav'), file('baixo.wav', 'b', 'instrumentos/baixo.wav'), file('outros.wav', 'o', 'instrumentos/outros.wav')]); expect(project.tracks.map(track => track.label)).toEqual(['Voz', 'Bateria', 'Baixo', 'Outros instrumentos']); });
  it('rejeita projeto incompleto sem tentar improvisar uma faixa', async () => { await expect(readStudioProject([file('manifest.json', manifest)])).rejects.toThrow('Voz'); });
});
