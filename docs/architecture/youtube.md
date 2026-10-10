# YouTube — primeira entrega da Fase 2

## Como usar

1. Execute `pnpm dev` e abra **Karaokês → YouTube**.
2. Cole um link `youtube.com/watch?v=…`, `youtu.be/…`, Shorts ou live. A importação também aceita o identificador de 11 caracteres.
3. Clique em **Selecionar pelo link → Tocar selecionada(s) → Iniciar agora**. Se o navegador bloquear o início automático, clique no player ou em Continuar.
4. Para pesquisar por nome, abra **Configurações → YouTube**, informe sua própria chave da **YouTube Data API v3** e clique em **Usar chave nesta sessão**. A chave fica somente em memória e deve ser informada novamente após reiniciar/recarregar.
5. A mesma área YouTube está disponível ao adicionar músicas à playlist ou à fila durante uma apresentação.

Não é preciso fornecer uma chave para reprodução por link. O título de links sem metadados aparece inicialmente como “Vídeo do YouTube (ID)”. Resultados da busca trazem título, canal e duração fornecidos pela API. Não há download de vídeo ou extração de áudio.

## Chave da API

No Google Cloud, crie/selecione seu projeto, habilite YouTube Data API v3 e crie uma chave em APIs e serviços → Credenciais. Restrinja a chave à YouTube Data API v3. Para restrições de site, considere as origens locais usadas nesta entrega: `http://127.0.0.1:5173/*` em desenvolvimento e `http://127.0.0.1:17843/*` no build Electron. Não publique chaves em código, screenshots ou no repositório.

Busca exige envio explícito do formulário para evitar consumir cota a cada tecla. `search.list` usa `type=video`, `videoEmbeddable=true`, `videoSyndicated=true`, 15 resultados e paginação. `videos.list` obtém metadados e duração. A chave segue no cabeçalho `X-Goog-Api-Key`, nunca em URLs ou localStorage. Requisições antigas são canceladas e há timeout de 15 segundos. Mensagens de erro são controladas pelo aplicativo e não imprimem respostas que possam conter credenciais.

## Player

`YoutubePlayer` carrega a IFrame Player API oficial sob demanda. Tempo e duração vêm do player a cada 500 ms. Pause/resume, volume, seek, reinício e fim de vídeo usam a API, sem depender do relógio simulado. Cada nova reprodução recria a instância, inclusive para dois pedidos do mesmo vídeo. O fim registra o histórico e segue a regra de avanço da sessão. Vídeos reais não recebem pontuação fictícia.

A busca/fila abre em painel lateral durante vídeos reais, mantendo o vídeo descoberto. Controles e identificação nativos do YouTube permanecem visíveis. Tom e microfone simulado não aparecem para vídeo real. Vídeos privados, removidos, não incorporáveis, falhas de rede e bloqueio de autoplay recebem mensagens específicas. Falhas não pulam silenciosamente a fila; o operador pode repetir ou pular.

## Catálogo e persistência

O catálogo demonstrativo segue na aba Demonstração. `libraryStore.youtubeTracks` guarda metadados dos vídeos selecionados; playlists continuam guardando IDs, e resolvem tanto vídeos salvos quanto mocks. O campo novo é compatível com o estado persistido v1 existente. A fila continua pertencendo somente à sessão.

## Origem no Electron

O build deixa de reproduzir em `file://` e usa um servidor estático restrito ao loopback `127.0.0.1:17843`, com origem estável para persistência e Referer automático do Chromium. Somente GET/HEAD, tipos de assets permitidos e caminhos dentro de dist são servidos. Não existem endpoints de negócio, acesso remoto ou credenciais no servidor. A porta ocupada gera erro explicativo; nenhuma aplicação alheia é encerrada.

Antes da mudança de origem, o Electron lê as três chaves de armazenamento da Fase 1 a partir do antigo index.html. Importa somente chaves ausentes na nova origem, sem sobrescrever nem apagar dados antigos. Mantidos sandbox, isolamento do contexto e ausência de Node no renderer. Nenhum cabeçalho é falsificado para se passar pelo site do YouTube.

## Testes e limites

Validação em 04/10/2026: TypeScript, ESLint e build aprovados; 13 testes de lógica/API mais 2 testes do servidor estático; 11 testes Playwright; smoke do Electron aprovado. O teste externo reproduziu de fato o vídeo público `M7lc1UVf-VE`, com tempo `0:01` e duração recebida do YouTube, usando a origem `http://127.0.0.1:17843`. Captura em [reprodução real](../screenshots/youtube/reproducao-real-electron.png). A busca ao vivo não foi executada por falta de uma chave válida; seu contrato foi testado com respostas interceptadas.

Testes de parser, API, cota e clock são isolados. Playwright usa um substituto da IFrame API e respostas interceptadas para validar a ligação UI/player, pausa, reinício, progresso, fim, painel lateral, persistência e chave em memória. Isso não certifica disponibilidade de vídeos no serviço real. `scripts/smoke-youtube.mjs` tenta reprodução pública no Electron em perfil temporário, com volume zero, e salva `youtube-live-electron.png`.

A reprodução depende da rede, das permissões do vídeo e das políticas do YouTube. Não há garantia de ausência de anúncios ou possibilidade de alterar tonalidade. A busca ao vivo precisa de uma chave válida do usuário. Antes de distribuição pública: revisar metadados armazenados/atualização conforme política da API, credenciais, identidade do aplicativo instalado e testar Linux.

## Referências oficiais consultadas

- [IFrame Player API](https://developers.google.com/youtube/iframe_api_reference): eventos e controles do player.
- [Requisitos do player incorporado](https://developers.google.com/youtube/terms/required-minimum-functionality): identificação, Referer e exibição sem sobreposição.
- [Busca da YouTube Data API](https://developers.google.com/youtube/v3/docs/search/list): filtros e paginação.
- [Parâmetros do Google Cloud](https://docs.cloud.google.com/apis/docs/system-parameters): cabeçalho de chave da API.
