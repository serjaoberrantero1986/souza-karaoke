# Primeira execução local — 24/10/2026

- Música: Bruno e Barreto — Farra Pinga e Foguete (MP3 fornecido pelo usuário).
- Trecho: 45 a 75 segundos.
- Ambiente: Windows, Python 3.12.10, processamento CPU; vídeo integrado AMD.
- Motor: audio-separator 0.47.1, librosa 0.11.0.
- Modelos candidatos: UVR-MDX-NET-Inst_HQ_3.onnx e UVR_MDXNET_KARA_2.onnx.
- Resultado técnico: duas separações concluídas, em 89,84 segundos no total.
- Cinco WAVs contando original e vozes intermediárias: todos estéreo, 44.100 Hz,
  1.323.000 amostras por canal (30 segundos); todas as faixas têm sinal não nulo.
- Picos absolutos: original 1,0; instrumental 0,9; vozes 0,9;
  voz principal candidata 0,8469; coral candidato 0,324.
- Quatro testes automatizados passaram; `pip check` sem dependências quebradas.
- Resultado local: `.studio-data/jobs/42419cc13e4044509ac2e9ad16ed594e/comparar.html`.

Ainda pendente: revisão auditiva pelo usuário. Duração e sinal presentes não provam
qualidade da separação, ausência de vazamento ou isolamento correto da segunda voz.
Não houve validação perceptiva, de alinhamento de fase, da música completa ou de
outros estilos. Não há editor integrado ao app nesta entrega.

Problemas resolvidos durante a preparação: dependência diffq sem pacote Windows
para Python 3.14; ausência de audioread na combinação com librosa 1.0; FFmpeg fora
do PATH; indisponibilidade do domínio raw para catálogos (obtidos pela API GitHub).
O ambiente usado e os comandos estão documentados nesta pasta.

## Quatro instrumentos e mixer — 24/10/2026

- Mesmo MP3 e trecho de 45 a 75 segundos; HTDemucs em CPU.
- Execução concluída em 30,97 segundos, excluindo o download do modelo.
- Voz, bateria, baixo e outros: 1.323.000 amostras por canal em cada faixa,
  estéreo a 44.100 Hz, salvas em WAV float sem normalização individual.
- Mixer em `.studio-data/jobs/724f34319ff94b5f98518276c0b7544e/mixer.html`.
- Inclui os quatro trechos reais do Moises fornecidos pelo usuário e o original.
- Picos acima de 1 em algumas saídas: preservados nos arquivos float; uma
  atenuação comum no mixer limita a soma absoluta a 0,98 com todos os ganhos em 100%.
- Sete testes Python e cinco testes do motor JavaScript passaram.
- Playwright verificou carregamento dos WAVs, reprodução/pausa, posição, busca,
  volume, solo, silenciar, restaurar, troca de conjuntos e layout de 390 px.
- Não houve comparação auditiva conclusiva nem medição de qualidade contra
  fontes originais de estúdio. As saídas do Moises são referência, não ground truth.
- Interface independente do Electron; nenhuma mudança no player ou configurações.
