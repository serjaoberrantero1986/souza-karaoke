# Arquitetura do desktop

## Processos e execução

Workspace pnpm preparado para monorepo. Só `apps/desktop` tem código funcional. Vite serve React; `scripts/dev.mjs` inicia uma única BrowserWindow e encerra o servidor junto com ela. Build usa arquivos locais e HashRouter, compatível com `file://`. Electron não expõe Node no renderer; `contextIsolation` e sandbox estão ativos. Preload expõe somente `desktop.quit()`. Navegação externa, novas janelas e permissões de dispositivos estão bloqueadas. Não há IPC genérico, autenticação nem rede de negócio.

## UI e responsividade

`AppShell` mantém marca, QR ilustrativo e ações da Home. `Panel` ocupa aproximadamente 60vw × 90vh na referência 1920×1080. Media queries aumentam largura relativa para 1600 e 1366. Janela mínima 1100×680; nunca há transformação em interface mobile. Listas e subseções têm scroll interno. `styles.css` centraliza cores, bordas, tamanhos e transições. O tema aplica `--accent` na raiz do shell. Ilustrações próprias SVG ficam em `public/assets`; nada em `docs/reference` entra no build.

Componentes reutilizáveis: Button, IconButton, Panel, SearchInput, Select, Toggle, NumberInput, Slider, EmptyState, Modal, ConfirmDialog, BrandLogo, RemoteQrCard, TrackRow, StatusBadge, TrackBrowser, QueueManager, PhotoPreview, SettingsRow/Section e campos de configuração tipados. Modais fecham com Escape, retêm foco e restauram o foco anterior.

## Stores

| Store | Responsabilidade | Persistência |
| --- | --- | --- |
| playerStore | Estado, música atual, tempo, tom, volume, microfone simulado, intervalo e score | Sessão |
| queueStore | Pedidos com IDs próprios, nome, ordem, remoção e consumo | Sessão |
| libraryStore | Playlists e histórico de até 500 reproduções | localStorage v1 |
| settingsStore | Preferências tipadas, PIN ilustrativo, atalhos | localStorage v1 |
| themeStore | AppTheme: cor, logo e fundo | localStorage v1 |
| uiStore | Avisos transitórios | Sessão |

Fila tem uma única fonte de verdade em `queueStore`, evitando duplicação em `playerStore`. IDs dos pedidos permitem a mesma música várias vezes sem remover o pedido errado. Player consome a fila por ações, sem acessar infraestrutura. Histórico é registrado ao terminar uma música; pular interrompe sem registrar reprodução completa. Playlists guardam IDs de tracks; não duplicam o catálogo. Estado de busca, seleção, modais e filtros é local aos componentes.

## Estados do player

`idle → intermission → playing ↔ paused → scoring → photo (opcional) → intermission/idle`.

Timer único em App, limpo no unmount, avança uma unidade por segundo (simulação visual, não relógio de áudio). `play`, `pause`, `resume`, `skip`, `restart`, `seek`, tom limitado a ±12 e volume 0–100. `skip` consome próximo pedido ou volta a idle. Intervalo e exibição de score têm contadores locais. Pontuação é fixa (98), explicitamente ilustrativa e independente de modo/dificuldade. Busca em modal não desmonta Player nem pausa o timer. Nenhuma letra ou mídia real é reproduzida.

## Tipos e mocks

`Track`, `TrackSource`, `Playlist`, `QueueItem`, `PlayerStatus`, `Settings`, `ScoreMode`, `Difficulty`, `AppTheme`, `DailyStats`, `HistoryEntry`, `DemoUser`. Dados separados em `src/mocks/`: 24 músicas, 24 registros históricos, duas playlists, três pedidos, usuários fictícios, configurações e sete dias de estatísticas. Thumbnails são SVGs autorais. Estatísticas agregadas são fixtures independentes do ranking, que deriva do histórico local; a UI explica essa distinção.

## Rotas

`/`, `/karaokes`, `/playlists`, `/history`, `/photos`, `/player`, `/settings/:section?`. Configurações: general, files, scoring, player, remote, operator, monitors, photo, suggestions, theme, statistics, shortcuts, about. HashRouter resulta em `/#/karaokes` no navegador e `index.html#/karaokes` no Electron. `/debug` existe somente em desenvolvimento. Rota desconhecida volta à Home.

## Testes

TypeScript estrito sem `any`, ESLint e build Vite. Vitest verifica transições e invariantes da fila/player. Playwright verifica busca, reprodução com overlay, playlist persistente, configuração e resoluções 1366×768, 1600×900, 1920×1080 e 2560×1440. Screenshots são artefatos, não comparação pixel a pixel. Smoke Electron usa o build real e checa navegação e isolamento/preload. Execução Linux precisa ser verificada em uma máquina Linux; a validação desta entrega ocorre em Windows.

## TODO para fase futura (não iniciado)

- Definir catálogo/licenciamento de conteúdo e estratégia legal/técnica para mídia; implementar serviços reais separadamente da UI.
- Arquivos locais: escolha de pasta via IPC específico, indexação, metadados e armazenamento local.
- Vídeo/áudio: motor de reprodução, clock real, tonalidade, dispositivos e recuperação de erro.
- Contratos de protocolo, backend e controle remoto com validação/autorização; substituir links .invalid e QR ilustrativo.
- Microfone, métodos de pontuação e calibração por dificuldade; câmera, consentimento e armazenamento/download das fotos.
- Segunda BrowserWindow para público, descoberta de monitores e sincronização da sessão. Hoje há somente preferência.
- Persistência com migrações e importação/exportação; políticas de histórico e backup.
- Catálogo de tradução completo; textos críticos comuns já separados, rótulos de apresentação seguem nos componentes.
- Atalhos reais, autostart, instaladores Windows/Linux, licenciamento, pagamentos e atualização automática em fases próprias.
- Identidade visual própria e comparação humana sistemática das referências. Não iniciar Fase 2 automaticamente.
