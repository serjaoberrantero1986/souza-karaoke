# Busca geral, fila visível e chave protegida

## Mudanças

- A busca geral abre por padrão e pesquisa no YouTube após 900 ms sem digitação. Enter/BUSCAR antecipa a consulta e cancela o disparo pendente. O termo karaoke continua sendo acrescentado quando necessário.
- Resultados locais da pasta selecionada aparecem junto dos resultados do YouTube. A pasta aceita MP4, WebM, OGV, OGG, MP3, WAV e M4A; codecs ainda dependem do Chromium. A seleção é válida na sessão e precisa ser refeita após fechar. Não há importação de CDG/MIDI nem alteração de tom para mídia real.
- A fila começa vazia. Dados simulados permanecem apenas no acervo de demonstração e nos cenários de debug. Um botão “Fila de músicas (N)” aparece fora da tela de reprodução; os pedidos do celular geram aviso e podem ser iniciados diretamente nessa fila.
- A chave é salva em `youtube-key.enc`, dentro do perfil do Electron, com `safeStorage` (DPAPI no Windows). É recuperada ao abrir; “Remover chave” remove também o arquivo. Nunca é salva em localStorage nem enviada ao celular. Se a criptografia do sistema estiver indisponível, a gravação é recusada. A prévia web continua com chave somente em memória.
- O QR prioriza interfaces Wi-Fi/WLAN, depois Ethernet, depois interfaces virtuais. A lista mostra nome e IP da interface. O computador tinha Ethernet, Wi-Fi e vEthernet; o IP Wi-Fi observado foi 192.168.100.53. Ele pode mudar por DHCP. Os tokens e links mudam quando uma nova sessão é iniciada.
- O player usa o parâmetro oficial `controls=0`. A barra de transporte fica oculta, enquanto anúncios, identificação, mensagens e demais elementos definidos pelo YouTube permanecem. Os controles do aplicativo usam a IFrame API e ficam fora do vídeo.

## Retestar no celular

Reinicie o aplicativo, salve a chave uma vez e inicie uma nova sessão remota. Na lista de rede, confira “Wi-Fi” e o IP da rede do celular. Leia o QR novo. Um link que abre no próprio computador não comprova conectividade entre os dispositivos. Não houve alteração de firewall ou de perfil da rede. Se a página ainda não abrir, verificar isolamento de clientes no roteador/rede de convidados e se o navegador está tentando HTTPS em um endereço HTTP local.

## Validação

- 18 testes unitários/de servidores e 12 cenários Playwright aprovados.
- Cenário novo com arquivo WAV real: seleção de pasta, busca combinada, pedido na fila externa ao player e carregamento da duração da mídia.
- Smoke Electron: gravação criptografada, encerramento/reabertura e recuperação da chave, pedido remoto visível na fila do desktop, iniciar e pausar pelo operador. API de busca e player substituídos nesse smoke para não consumir cota.
- A conexão de um celular físico ainda precisa ser confirmada pelo usuário após a troca do endereço do QR.

Referências: [safeStorage](https://www.electronjs.org/docs/latest/api/safe-storage), [parâmetros oficiais do player](https://developers.google.com/youtube/player_parameters).
