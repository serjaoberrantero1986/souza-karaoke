# DoRéMiFode AI Studio — prova de conceito experimental

**Não é o aplicativo final.** Este diretório não altera o player, não adiciona dependências ao workspace pnpm e não modifica arquivos existentes. Execução manual, local e sem serviços pagos.

## O que funciona na arquitetura do protótipo
- CLI independente para chamar o `audio-separator`, gravar resultados em pastas isoladas e criar `manifest.json`.
- Primeira passagem: instrumental + todas as vozes.
- Segunda passagem **opcional**: requer um modelo que **efetivamente exporte saídas explicitamente nomeadas lead e backing**. Não inventa uma faixa de backing caso o modelo só entregue vocal/instrumental.
- Alinhamento de **palavras** em português com Qwen3-ForcedAligner; ainda **não** implementa fronteiras silábicas.
- Erro explícito para arquivos ausentes e saídas inesperadas.

## Ambiente inicial: Windows 11 / AMD RX 590 (8 GB)
Use Python em ambiente virtual **separado**. Antes de instalar bibliotecas pesadas, confira as versões compatíveis de Python, PyTorch e qwen-asr na documentação dos projetos. Exemplo experimental:

```powershell
cd experiments/ai-studio-poc
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install "audio-separator[cpu]"
python studio_poc.py separate --audio "C:\Musicas\teste.wav" --output ".\resultados\teste-cpu"
```

Para DirectML, usar ambiente virtual independente e instalação recomendada pelo projeto:
```powershell
python -m pip install "audio-separator[dml]"
python studio_poc.py separate --audio "C:\Musicas\teste.wav" --output ".\resultados\teste-dml" --directml
```
A instalação de variantes no mesmo ambiente pode causar conflitos: prefira duas venvs. O uso de GPU **não foi validado** na RX 590.

Para o alinhamento, instale a implementação oficial `qwen-asr`, PyTorch de CPU e FFmpeg, observando a compatibilidade atual. O primeiro comando pode baixar modelos grandes:
```powershell
python studio_poc.py align-words --audio ".\resultados\teste-cpu\stage1\ARQUIVO_VOCALS.wav" --lyrics ".\letra.txt" --output ".\resultados\alinhamento.json"
```
Substitua `ARQUIVO_VOCALS.wav` pelo nome real registrado em `manifest.json`.

### Verificações sem IA
```powershell
python -m unittest discover -s tests -v
python studio_poc.py --help
```

## Restrições, riscos e próximos experimentos
1. **Nenhuma música foi processada nem a qualidade acústica avaliada nesta entrega.** É necessário testar com arquivos próprios/licenciados.
2. O separador pode retornar nomes de stems diferentes dos esperados. A POC falha explicitamente em vez de classificar incorretamente.
3. A separação de vocal principal e backing **ainda não está validada**. Não usar modelo genérico de duas saídas como prova de três stems.
4. O alinhamento do Qwen3 é por **palavras** e pode falhar com música cantada. O próximo experimento deve avaliar sílabas usando dados humanos anotados e dois alinhadores independentes.
5. Modelos podem ser baixados automaticamente ao usar estas ferramentas. Sem download automático pela aplicação antes de consentimento do operador.
6. `resultados/`, `.venv/` e arquivos musicais devem permanecer fora do Git. Não fazer commit de mídia ou pesos de modelos.
7. Não foi feita auditoria completa de licença de cada peso de modelo. Verifique antes de distribuir.
8. O código não modifica e não importa nada de `apps/desktop`.

Documentação: https://github.com/nomadkaraoke/python-audio-separator e https://github.com/QwenLM/Qwen3-ASR .
