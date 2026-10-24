# Studio: validação de separação

Entrada: MP3 local. Esta etapa prepara faixas para revisão antes do editor de letras,
sincronização silábica, extração de notas e avaliação vocal por referência.
Não altera o player nem acrescenta opções nas configurações.

Para continuar em outro computador pelo Codex Cloud, consulte [CLOUD.md](CLOUD.md).

## Executar no Windows

```powershell
py -3.12 -m venv .studio-venv312
.\.studio-venv312\Scripts\python.exe -m pip install -r tools/studio/requirements.txt
.\.studio-venv312\Scripts\python.exe tools/studio/prepare_metadata.py
.\.studio-venv312\Scripts\python.exe tools/studio/separate.py "musicas\Bruno e Barreto - Farra Pinga e Foguete.mp3"
```

Os modelos são baixados no primeiro processamento. O arquivo original não é alterado.
`requirements-windows.lock.txt` registra as versões instaladas na validação em Windows/Python 3.12.
O preparo de metadados usa a API oficial do GitHub; evita depender do domínio raw,
que apresentou falha de conexão neste computador. O FFmpeg fica na pasta local do Studio.
Para validar somente um trecho, acrescente `--start 45 --duration 30` ao comando.
Cada execução cria uma pasta exclusiva em `.studio-data/jobs`, com manifesto,
faixas WAV e `comparar.html`. Modelos, músicas e resultados ficam fora do Git.
Ctrl+C cancela e mantém diagnóstico e arquivos parciais na pasta da execução.

## Critério da etapa

O primeiro modelo separa vozes e instrumental. O segundo recebe somente as vozes
e tenta separar solista de coral. Os nomes destas duas últimas faixas são hipóteses
a conferir por escuta; não constituem garantia de isolamento.
Os modelos podem ser substituídos pelos argumentos `--vocal-model` e `--choir-model`.
A qualidade desta combinação ainda precisa ser aprovada com músicas reais.

Comparar voz residual, perda de instrumentos, integridade do coral, reverberação,
artefatos e alinhamento. A checagem automática de duração não mede qualidade musical
nem garante alinhamento de fase. Não somar as faixas sem revisar ganhos e clipping.
As saídas do separador podem sofrer normalização independente.

Próximas etapas: editor de faixas; letra revisável e tempos silábicos; notas de
referência editáveis; pacote interativo para o Karaokê; calibração do microfone e
pontuação comparada à melodia. Não confundir atividade do microfone com afinação.

## Verificação

```powershell
python -m unittest discover -s tools/studio -p "test_*.py"
```

Esses testes verificam contratos de saída e duração, não fazem inferência de IA.

Referência: https://github.com/nomadkaraoke/python-audio-separator
Revisar licenças dos pesos separadamente antes de distribuição.

## Quatro instrumentos e mixer

```powershell
.\.studio-venv312\Scripts\python.exe tools/studio/separate.py "musicas\Bruno e Barreto - Farra Pinga e Foguete.mp3" --start 45 --duration 30 --instruments --references musicas
```

O modo de instrumentos usa HTDemucs, com pesos oficiais e verificação do checksum
publicado no nome do arquivo. Produz voz, bateria, baixo e outros instrumentos.
Não separa coral nesta passagem; a separação vocal anterior continua disponível.
As quatro faixas são salvas em WAV float com ganhos relativos preservados. A CPU
é usada nesta etapa. A qualidade exige revisão auditiva.

O comando informa a pasta do projeto. Para abrir o resultado já validado:

```powershell
.\.studio-venv312\Scripts\python.exe tools/studio/serve_mixer.py .studio-data/jobs/724f34319ff94b5f98518276c0b7544e
```

Abra `http://127.0.0.1:17845/mixer.html`. O servidor atende apenas neste computador
e serve somente a pasta do projeto escolhido; Ctrl+C encerra. Esta tela ainda é
independente do Electron. Não há nova opção nas configurações do karaokê.

O mixer tem reprodução/pausa, reiniciar, busca, volume geral e individual, silenciar,
ouvir só e restaurar controles. As faixas compartilham um AudioContext e o mesmo
instante de início. Trocar entre Studio, Moises e original pausa e volta ao início.
Há atenuação comum para evitar clipping, preservando o equilíbrio entre faixas.
Não exporta mixagens nem persiste ajustes de volume nesta etapa.

Para reconstruir só a tela de um projeto existente:

```powershell
.\.studio-venv312\Scripts\python.exe tools/studio/build_mixer.py .studio-data/jobs/724f34319ff94b5f98518276c0b7544e --references musicas
```

Testes adicionais (o teste de navegador requer o servidor ativo):

```powershell
.\.studio-venv312\Scripts\python.exe -m unittest discover -s tools/studio -p "test_*.py"
node --test --test-isolation=none tools/studio/test-mixer.mjs
node tools/studio/check-mixer.cjs
```

Modelo: https://github.com/facebookresearch/demucs
