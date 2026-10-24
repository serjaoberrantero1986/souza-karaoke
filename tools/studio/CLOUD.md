# DoRéMiFode AI Studio — continuidade no Codex Cloud

O código do Studio está em `tools/studio/`. É uma etapa separada de preparação
de músicas MP3, com separação de faixas e mixer de comparação. Não está integrado
ao aplicativo Electron e não inclui ainda letras silábicas ou pontuação por melodia.

## Estado verificado

- Windows, Python 3.12.10, CPU: separação real de um trecho de 30 segundos.
- Voz, bateria, baixo e outros instrumentos; mixer sincronizado com volume,
  silenciar, solo, busca e comparação com arquivos de referência do Moises.
- Separação de voz principal/coral disponível em fluxo separado, com qualidade
  ainda sujeita à avaliação auditiva.
- Resultados e testes registrados em `VALIDATION.md`.
- A configuração Linux abaixo é uma proposta para validar no ambiente remoto;
  não foi executada a partir desta sessão Windows.

## Preparar o ambiente Linux

Use a branch `main` atualizada do repositório `serjaoberrantero1986/souza-karaoke`.
Preserve a configuração Node.js 24/pnpm 10.18.3 já preparada para a aplicação web.
Acrescente Python 3.12 com suporte a `venv`. Na raiz do repositório:

```bash
python3.12 -m venv .studio-venv312
.studio-venv312/bin/python -m pip install --upgrade pip
# Pré-instala a distribuição CPU para evitar baixar dependências CUDA desnecessárias.
.studio-venv312/bin/python -m pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu
.studio-venv312/bin/python -m pip install -r tools/studio/requirements.txt
.studio-venv312/bin/python -m pip check
.studio-venv312/bin/python -m unittest discover -s tools/studio -p 'test_*.py'
node --test --test-isolation=none tools/studio/test-mixer.mjs
```

Não instalar o `requirements-windows.lock.txt` no Linux: ele registra o ambiente
Windows validado, não um conjunto de dependências multiplataforma.
Os testes acima não precisam de músicas nem baixam modelos. Após instalar,
verifique também importação e FFmpeg no ambiente real:

```bash
.studio-venv312/bin/python -c "import torch, soundfile, librosa; from audio_separator.separator import Separator; print('Motor de áudio importado; CPU disponível.')"
.studio-venv312/bin/python -c "import sys; sys.path.insert(0, 'tools/studio'); from separate import prepare_ffmpeg, run; run([prepare_ffmpeg(), '-version'])"
```

Para preparar antecipadamente os modelos de quatro faixas:

```bash
.studio-venv312/bin/python tools/studio/instruments.py
```

O fluxo adicional de voz principal/coral também utiliza:

```bash
.studio-venv312/bin/python tools/studio/prepare_metadata.py
```

Se houver restrição de rede, permitir os gerenciadores de pacotes e os destinos
necessários aos downloads: `download.pytorch.org`, `download-r2.pytorch.org`,
`api.github.com`, `github.com`, `release-assets.githubusercontent.com`,
`raw.githubusercontent.com` e `dl.fbaipublicfiles.com`. Conferir os redirecionamentos
reais caso um download seja bloqueado. Este processamento local não exige chave
da API OpenAI ou do YouTube.

## Música e resultados

`musicas/`, `.studio-data/`, `.studio-venv*/` e o APK analisado não fazem parte
da entrega do Studio no Git. O servidor local e os arquivos do computador não
são transferidos automaticamente ao ambiente da nuvem.

Envie um MP3 autorizado ao ambiente remoto antes de testar inferência. Para as
referências do Moises, envie também as quatro exportações, preservando os sufixos
`_vocals_mixed.mp3`, `_drums_mixed.mp3`, `_bass_mixed.mp3` e `_other_mixed.mp3`.

```bash
.studio-venv312/bin/python tools/studio/separate.py "musicas/ARQUIVO.mp3" --start 45 --duration 30 --instruments
# Acrescente --references musicas somente se as quatro referências estiverem lá.
```

O comando informa uma nova pasta `.studio-data/jobs/IDENTIFICADOR`. Use esse
identificador real; os caminhos registrados na validação Windows não existem
automaticamente na nuvem.

```bash
.studio-venv312/bin/python tools/studio/serve_mixer.py .studio-data/jobs/IDENTIFICADOR
```

O servidor escuta em `127.0.0.1:17845`. Esse endereço pertence à máquina de execução.
Para visualização pelo usuário na nuvem, usar a prévia/encaminhamento disponível
no ambiente e validar o acesso; iniciar o servidor não cria um endereço público.
O teste de navegador requer o servidor ativo, dependências JS instaladas e
Chromium do Playwright disponível:

```bash
node tools/studio/check-mixer.cjs
```

## Publicação do ambiente e continuidade

Na configuração do Codex Cloud, revisar a pendência indicada em “Requer atenção”,
salvar as instruções de instalação e inicialização testadas e publicar/republicar
o ambiente. Iniciar uma tarefa nova para verificar o ambiente publicado. Não
declarar a preparação Linux concluída apenas porque os testes Windows passaram.

Mensagem sugerida para a conversa de configuração:

> Atualize o ambiente souza-karaoke com a main atual do GitHub e siga
> tools/studio/CLOUD.md para acrescentar Python 3.12 e o motor CPU do Studio.
> Preserve o setup Node/pnpm existente. Execute os testes e registre limitações;
> não altere o player ou menus. Verifique a pendência “Requer atenção” e deixe a
> configuração pronta para salvar e publicar. Não presuma que músicas e modelos
> locais já estão disponíveis na nuvem.

Referência oficial: https://learn.chatgpt.com/docs/environments/cloud-environments

## Reversão

Esta entrega acrescenta ferramentas isoladas e regras de exclusão do Git; não
migra dados do player. Se for necessário desfazer o código publicado, criar um
commit de reversão específico, após revisão, sem apagar músicas, resultados ou
modelos locais e sem reescrever o histórico remoto.
