# Alteração de tom no YouTube — análise de 10/10/2026

## Estado atual

Atualização da versão 0.3.0: o protótipo foi implementado e está disponível em Configurações → Reprodução → Alterar tom no YouTube (experimental), desativado por padrão. Um WebContentsView visível contém somente o player oficial; um BrowserWindow de processamento em outra partição captura esse webContents com eco local desligado. A comunicação usa IPC direcionado, não loopback do Windows. SoundTouch processa o áudio capturado e mantém a reprodução original no vídeo.

Validação executada: captura real de um tom sintético de 440 Hz, saída de aproximadamente 880 Hz com +12 e 220 Hz com −12 semitons; volume zero; encerramento das janelas. Em um vídeo real do YouTube: tempo avançando, parâmetro +1 aplicado, pausa silenciosa, reinício e tom original. Não foram medidas latência física em alto-falantes nem qualidade perceptiva no equipamento final. Essa validação técnica não muda o limite das políticas descrito abaixo.

Arquivos locais usam SoundTouch AudioWorklet e alteração independente de tom e duração. O IFrame Player API não oferece alteração de tom nem fornece o fluxo PCM do vídeo ao aplicativo. `controls=0` é suportado oficialmente e já está aplicado; isso não fornece acesso ao áudio.

## Possibilidade técnica no Electron

`session.setDisplayMediaRequestHandler` pode fornecer áudio de um `WebFrameMain` (na prática, do webContents inteiro), com `enableLocalEcho=false` para silenciar a saída original. Um protótipo poderia manter a reprodução oficial visível em um webContents dedicado, capturar apenas essa janela e passar o MediaStream pelo SoundTouch em outra janela de saída de áudio.

Capturar a janela principal e devolver o áudio processado nela apresenta risco de realimentação: a captura é de todo o webContents, não somente do iframe. Capturar o som geral do Windows também pode incluir notificações, música ambiente e o áudio já processado. Portanto, não habilitar loopback geral como implementação definitiva.

Antes de integrar, verificar na versão de Electron instalada: suporte a captura da janela, silêncio da saída original, ausência de eco, latência, sincronização labial, pausa/busca/reinício, troca de vídeos, dois monitores e encerramento seguro da captura. O protótipo não deve exigir extração de URLs de mídia, download nem contorno de restrições de incorporação.

## Limite de integração oficial

As políticas do YouTube, seção III.D, proíbem separar, isolar ou modificar os componentes de áudio/vídeo entregues pelos serviços de API. Portanto, viabilidade de captura no Electron não equivale a uma integração autorizada pelo YouTube. Para entregar alteração de tom em vídeos do YouTube como recurso oficial, é necessário resolver essa autorização; a alternativa suportada hoje é áudio com origem própria/licenciada e acesso ao fluxo, inclusive catálogo remoto em vez de uma pasta local.

O comportamento do programa de referência não revela sua arquitetura nem suas autorizações. É preciso obter sua documentação técnica ou observar efetivamente seu processamento de áudio antes de atribuir um método a ele.

## Reprodução indisponível

Erros 101/150 indicam que o proprietário não permite incorporação. A busca já pede `videoEmbeddable=true` e `videoSyndicated=true` e descarta `status.embeddable=false`. Esses filtros não garantem disponibilidade futura, em toda região ou sob todas as restrições de conta. Erro 153 é distinto: ausência de identificação do cliente/referência HTTP.

## Fontes

- https://www.electronjs.org/docs/latest/api/session#sessetdisplaymediarequesthandlerhandler-opts
- https://developers.google.com/youtube/iframe_api_reference
- https://developers.google.com/youtube/player_parameters#controls
- https://developers.google.com/youtube/terms/developer-policies
