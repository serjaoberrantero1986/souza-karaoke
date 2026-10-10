# PROJETO: PLATAFORMA DE KARAOKÊ — FASE 1

Quero iniciar o desenvolvimento de uma plataforma profissional de karaokê para Windows e Linux.

Nesta primeira fase, NÃO implemente ainda:

- integração real com YouTube;
- login;
- backend;
- WebSocket;
- QR Code funcional;
- microfone;
- pontuação;
- webcam;
- segundo monitor real;
- banco de dados remoto;
- pagamentos;
- licenciamento;
- atualizações automáticas.

O objetivo desta fase é construir:

1. a arquitetura inicial do projeto;
2. o aplicativo desktop;
3. o sistema visual;
4. os principais componentes;
5. a navegação entre telas;
6. estados simulados;
7. componentes reutilizáveis;
8. uma réplica visual extremamente fiel às imagens existentes em `docs/reference/`.

---

# 1. REGRA PRINCIPAL

As imagens existentes em:

`docs/reference/`

são a referência visual principal.

Analise cuidadosamente TODAS as imagens antes de desenvolver a interface.

Não invente layouts.

Não altere gratuitamente:

- posição dos elementos;
- proporções;
- espaçamentos;
- hierarquia;
- tamanho relativo dos componentes;
- estrutura das telas;
- comportamento visual;
- menus;
- cards;
- modais;
- barra inferior;
- disposição dos botões.

Nesta fase queremos reproduzir a experiência existente o mais fielmente possível para posteriormente criarmos uma identidade visual própria.

IMPORTANTE:

Não reutilize marcas, nomes, logotipos ou arquivos proprietários do produto original no código final.

Se houver logotipo VS Karaokê nas imagens de referência, utilize temporariamente um placeholder neutro no aplicativo.

Não tente acessar código-fonte, APIs privadas, executáveis, tráfego de rede ou mecanismos internos do programa original.

O desenvolvimento deve ser uma implementação independente baseada apenas no comportamento e nas interfaces visualmente observáveis.

---

# 2. TECNOLOGIAS

Utilize:

- Electron
- React
- TypeScript
- Vite
- Node.js
- pnpm
- CSS moderno
- React Router se necessário
- Zustand para estado local global

Não adicionar bibliotecas sem necessidade.

Preferir componentes próprios.

Utilize Lucide Icons para ícones genéricos quando necessário.

---

# 3. ARQUITETURA

Prepare o projeto para futuramente virar um monorepo com:

```text
karaoke-platform/

apps/
    desktop/
    remote/
    api/
    website/

packages/
    ui/
    protocol/
    shared/
    scoring/
    database/

docs/
    reference/
    architecture/
    screens/
```

Nesta fase apenas:

`apps/desktop`

precisa ser funcional.

Os demais diretórios podem ser preparados com README explicando sua função futura.

---

# 4. APLICATIVO DESKTOP

Criar:

`apps/desktop`

usando:

Electron + React + TypeScript + Vite.

O aplicativo precisa funcionar no modo desenvolvimento através de um único comando.

Exemplo esperado:

```bash
pnpm dev
```

Também criar scripts para:

```bash
pnpm build
pnpm typecheck
pnpm lint
```

Não configure ainda empacotamento final Windows/Linux.

Isso virá posteriormente.

---

# 5. RESOLUÇÃO DE REFERÊNCIA

Grande parte das imagens de referência utiliza:

1920 x 1080.

A interface deve preservar a aparência nessa resolução, mas também adaptar-se adequadamente a:

1366x768
1600x900
1920x1080
2560x1440

Não simplesmente escale tudo proporcionalmente.

Utilize layout responsivo desktop mantendo:

- painel principal centralizado;
- espaços laterais;
- QR na região superior direita;
- logotipo na região superior esquerda;
- conteúdo principal bem definido;
- controles adequadamente posicionados.

---

# 6. SISTEMA VISUAL

Criar sistema de design através de CSS Variables.

Não espalhar cores hardcoded pelos componentes.

Criar algo semelhante a:

```css
:root {
    --bg-primary: #000000;
    --bg-secondary: #121212;
    --bg-tertiary: #1b1b1b;

    --surface: #171717;
    --surface-hover: #222222;
    --surface-active: #292929;

    --border: rgba(255,255,255,0.08);

    --text-primary: #ffffff;
    --text-secondary: rgba(255,255,255,0.65);
    --text-muted: rgba(255,255,255,0.40);

    --accent: #ff8a00;
    --accent-hover: #ff9d2e;

    --danger: #e5484d;

    --radius-small: 6px;
    --radius-medium: 10px;
    --radius-large: 14px;
}
```

Esses valores são apenas ponto de partida.

Compare com as imagens e ajuste.

O importante é existir um sistema centralizado.

---

# 7. PERSONALIZAÇÃO FUTURA

Construir o sistema já preparado para permitir alteração dinâmica de:

- cor principal;
- logo;
- imagem de fundo.

Criar estrutura:

```ts
type AppTheme = {
    accentColor: string;
    logoUrl?: string;
    backgroundImageUrl?: string;
};
```

Alterar `accentColor` deve modificar automaticamente todos os componentes que utilizam a cor principal.

Não implementar upload ainda.

Criar apenas estado simulado.

---

# 8. COMPONENTES GERAIS

Criar componentes reutilizáveis.

Exemplos:

```text
AppShell
TopBar
BrandLogo
RemoteQrCard
PageContainer
Panel
SectionHeader
PrimaryButton
SecondaryButton
IconButton
SearchInput
Select
Toggle
Slider
NumberInput
Tabs
Modal
ConfirmDialog
EmptyState
TrackCard
TrackRow
PlaylistCard
QueueItem
SettingsSection
SettingsRow
StatusBadge
KeyboardShortcutInput
```

Evitar duplicação.

Não criar um componente gigantesco para cada página.

---

# 9. SIDEBAR E NAVEGAÇÃO

Observe cuidadosamente nas imagens como a navegação funciona.

Replicar o comportamento percebido.

As páginas principais previstas são:

```text
HOME

KARAOKÊS

PLAYLISTS

HISTÓRICO

FOTOS

CONFIGURAÇÕES
```

Configurações deverá possuir diversas subseções.

Criar navegação interna.

---

# 10. TELA INICIAL

Reproduzir a tela inicial observada nas referências.

Ela deve possuir aproximadamente:

- marca/logotipo no canto superior esquerdo;
- QR Code no canto superior direito;
- mensagem central semelhante a "Vamos cantar?";
- botão principal de Karaokês;
- botão Fotos;
- botão Configurações;
- opção de sair;
- fundo escuro;
- conteúdo central extremamente limpo.

QR Code nesta fase pode ser estático/falso.

Criar componente:

`RemoteQrCard`.

---

# 11. TELA DE KARAOKÊS

Criar a tela principal de pesquisa.

Ela deverá conter:

- campo de busca;
- busca simulada;
- resultados locais;
- resultados simulados do YouTube;
- indicação visual da origem;
- thumbnails;
- título;
- informações secundárias;
- duração;
- seleção;
- adicionar à fila;
- ordenação;
- filtros;
- categorias.

Categorias observadas incluem aproximadamente:

- Sertanejo
- Pagode e Samba
- Forró e Piseiro
- Brega e Romântico
- Rock Nacional
- MPB
- Pop Nacional
- Funk
- Gospel
- Internacional
- Infantil

Criar dados mock.

Não integrar com YouTube.

---

# 12. IDENTIFICAÇÃO DE ORIGEM

Criar:

```ts
type TrackSource = "local" | "youtube";
```

Um track deve possuir estrutura inicial semelhante a:

```ts
type Track = {
    id: string;
    title: string;
    artist?: string;
    duration?: number;
    thumbnail?: string;
    source: TrackSource;
    filePath?: string;
    youtubeVideoId?: string;
};
```

Os resultados do YouTube devem possuir indicação visual "YT" semelhante à referência.

---

# 13. PLAYLISTS

Criar interface completa visualmente para:

- listar playlists;
- criar playlist;
- renomear;
- excluir;
- abrir playlist;
- adicionar músicas;
- remover músicas;
- reorganizar;
- tocar playlist.

Tudo utilizando dados locais simulados nesta fase.

---

# 14. HISTÓRICO

Criar página de histórico contendo:

- campo de pesquisa;
- filtro;
- horário;
- nome da música;
- origem;
- seleção;
- ações compatíveis com a interface de referência.

Criar aproximadamente 20 registros mockados para testar scroll e layout.

---

# 15. PLAYER

Criar uma tela visual de reprodução.

Não reproduzir vídeo real ainda.

Utilizar um placeholder de vídeo.

A interface deverá possuir:

- título da música;
- informação da fila;
- área principal de vídeo;
- barra de progresso;
- tempo atual;
- duração;
- Reiniciar;
- Pausar;
- Pular;
- adicionar música;
- controle de tonalidade;
- botão diminuir tom;
- valor atual;
- botão aumentar tom;
- restaurar tom original;
- nível visual do microfone simulado;
- indicação da próxima música.

Criar estado de player.

---

# 16. ESTADO GLOBAL DO PLAYER

Criar Zustand store.

Exemplo conceitual:

```ts
type PlayerStatus =
    | "idle"
    | "intermission"
    | "playing"
    | "paused"
    | "scoring"
    | "photo";
```

Criar store com:

```text
status
currentTrack
queue
currentTime
duration
pitch
volume
microphoneLevel
```

E ações:

```text
play
pause
resume
skip
restart
addToQueue
removeFromQueue
moveQueueItem
clearQueue
increasePitch
decreasePitch
resetPitch
```

Tudo pode ser simulado nesta fase.

---

# 17. FILA

Criar queue manager.

A fila precisa possuir:

- música;
- thumbnail;
- título;
- origem;
- pessoa que pediu;
- posição;
- remover;
- reorganizar;
- tocar imediatamente.

Adicionar dados fictícios.

O comportamento deve ser funcional localmente.

---

# 18. BUSCA DURANTE A REPRODUÇÃO

Esta interação é importante.

Enquanto a tela de reprodução estiver ativa, clicar no botão de adicionar música deve abrir uma interface sobre o player.

Não navegar para outra página.

Criar modal ou overlay semelhante ao observado nas imagens.

A música simulada deve continuar visualmente em reprodução ao fundo.

O overlay deve permitir:

- buscar;
- selecionar música;
- adicionar à fila;
- fechar.

---

# 19. INTERVALO ENTRE MÚSICAS

Criar tela/estado visual para intervalo.

Possuir:

- próxima música;
- nome;
- cantor/pessoa;
- contagem regressiva;
- opção para iniciar imediatamente.

Criar contador simulado.

---

# 20. PONTUAÇÃO

Criar apenas a INTERFACE nesta fase.

Não implementar algoritmo real.

Mostrar:

- pontuação;
- feedback visual;
- indicador de tendência;
- próxima ação.

Preparar o sistema para três modos futuros:

```text
random
microphone
audience
```

Criar:

```ts
type ScoreMode =
    | "random"
    | "microphone"
    | "audience";
```

Dificuldades:

```text
easy
normal
hard
```

---

# 21. CONFIGURAÇÕES

Esta parte deverá ser cuidadosamente reproduzida.

Criar página de configurações com navegação por seções.

Estruturar aproximadamente:

```text
Geral

Arquivos

Pontuação

Controle remoto

Operador remoto

Dois monitores

Modo Foto

Sugestões

Personalização

Estatísticas

Atalhos

Sobre
```

Compare com as imagens para nomes e agrupamentos exatos.

---

# 22. CONFIGURAÇÃO DE PONTUAÇÃO

Criar interface contendo:

Modo:

- Aleatória
- Microfone
- Reações da plateia

Dificuldade:

- Fácil
- Normal
- Difícil

Adicionar descrições semelhantes à referência.

Ainda sem algoritmo real.

---

# 23. CONTROLE REMOTO

Criar tela de configuração visual contendo:

- QR Code;
- link;
- copiar link;
- abrir controle remoto;
- exportar QR;
- opção de QR permanente;
- solicitar nome;
- permitir adicionar música;
- máximo de músicas simultâneas;
- intervalo entre pedidos;
- permitir controlar reprodução;
- permitir controlar fila;
- permitir reações;
- permitir múltiplas reações.

Tudo usando estado local.

---

# 24. OPERADOR REMOTO

Criar subseção independente.

Possuir:

- habilitar operador remoto;
- PIN;
- campo de 4 a 8 números;
- gerar novo PIN;
- QR Code exclusivo;
- link;
- copiar;
- abrir.

Não implemente autenticação ainda.

---

# 25. DOIS MONITORES

Criar apenas tela de configuração nesta fase.

Toggle semelhante a:

"Usar 2 monitores"

Descrição explicando que:

- monitor principal = operador;
- segundo monitor = público.

Ainda não criar segunda BrowserWindow.

Deixar TODO documentado para fase futura.

---

# 26. MODO FOTO

Criar configuração contendo:

- habilitar;
- câmera;
- pasta;
- contagem regressiva;
- pontuação mínima;
- permitir download;
- moldura.

Molduras:

```text
Nenhuma
Carimbos
Faixa inferior com carimbos
Polaroid
Imagem personalizada
```

Criar preview visual.

Não acessar webcam ainda.

---

# 27. SUGESTÕES

Criar opções:

```text
Populares + mais tocadas aqui

Só populares

Só as mais tocadas aqui
```

Tudo simulado.

---

# 28. PERSONALIZAÇÃO

Criar configurações:

- imagem de fundo;
- logo;
- cor principal.

Criar preview.

Permitir alterar `accentColor` localmente através de color picker.

Essa alteração deve realmente modificar a interface inteira em tempo real.

Para logo e background podem ser usados assets mockados.

---

# 29. ESTATÍSTICAS

Criar dashboard utilizando dados mock.

Exibir exemplos de:

- músicas tocadas;
- dias de uso;
- média diária;
- dia mais movimentado;
- horário de pico;
- Local x YouTube;
- Operador x Celular;
- ranking de músicas;
- músicas estreantes;
- horários;
- dias da semana;
- resumo diário.

Evitar adicionar biblioteca pesada de gráficos se não for necessária.

Pode utilizar CSS/SVG simples.

---

# 30. ATALHOS

Criar página com atalhos configuráveis.

Atalhos iniciais:

```text
P = Pausar / continuar
S = Pular
R = Reiniciar

Q = Aumentar tom
W = Diminuir tom

F1 = Configurações

Espaço = Minimizar

F12 = Fechar
```

Nesta fase apenas criar interface de edição.

Não registre global shortcuts do Electron ainda.

---

# 31. SOBRE / LICENÇA

Criar tela visual contendo placeholders para:

- versão;
- usuário;
- e-mail;
- chave de ativação;
- ID da máquina.

Criar lista visual de recursos habilitados.

Exemplo:

```text
Personalização
Dois monitores
Estatísticas
Sugestões
Modo Foto
Controle Remoto
```

Não implementar servidor de licença.

---

# 32. DADOS MOCK

Criar pasta:

```text
apps/desktop/src/mocks/
```

Possuindo arquivos separados:

```text
tracks.ts
playlists.ts
history.ts
queue.ts
statistics.ts
users.ts
settings.ts
```

Não espalhar mocks diretamente nos componentes.

---

# 33. STORES

Criar:

```text
src/stores/
```

Com pelo menos:

```text
playerStore.ts
queueStore.ts
settingsStore.ts
themeStore.ts
uiStore.ts
```

Evitar estado global quando estado local for suficiente.

---

# 34. TIPOS

Criar:

```text
src/types/
```

Com:

```text
track.ts
playlist.ts
player.ts
queue.ts
settings.ts
statistics.ts
session.ts
```

---

# 35. SERVIÇOS FUTUROS

Criar apenas interfaces/abstrações.

Por exemplo:

```text
src/services/
```

```text
youtube/
remote/
microphone/
scoring/
photos/
licensing/
```

Ainda sem implementação externa.

Adicionar README ou comentários explicando a responsabilidade futura.

Não usar APIs falsas como se fossem reais.

---

# 36. NÃO IMPLEMENTAR BACKEND AGORA

Não instalar:

- Supabase;
- Redis;
- PostgreSQL;
- Socket.IO;
- autenticação;
- pagamentos.

Esses recursos entrarão posteriormente.

---

# 37. QUALIDADE

Todo código precisa:

- compilar;
- possuir tipos adequados;
- evitar `any`;
- evitar arquivos gigantes;
- evitar duplicação;
- ter nomes claros;
- separar UI de lógica;
- separar mocks de código real.

Ao terminar cada etapa:

```bash
pnpm typecheck
pnpm lint
pnpm build
```

Corrigir todos os erros antes de continuar.

---

# 38. COMPONENTES NÃO DEVEM CONHECER INFRAESTRUTURA

Por exemplo:

`TrackCard`

não deve saber se no futuro os dados vêm do YouTube, SQLite ou servidor.

Ele recebe:

```ts
<TrackCard track={track} />
```

E renderiza.

Isso será importante quando substituirmos mocks por serviços reais.

---

# 39. PREPARAÇÃO PARA INTERNACIONALIZAÇÃO

Todos os textos da aplicação devem ficar preparados para futuramente serem traduzidos.

Nesta primeira fase a interface será em:

Português do Brasil.

Não precisamos instalar biblioteca de tradução ainda.

Mas evite espalhar strings críticas pela lógica do sistema.

---

# 40. TRANSIÇÕES

Utilizar transições discretas.

Evitar animações exageradas.

Objetivo:

- fluidez;
- resposta instantânea;
- aparência de aplicativo profissional.

Preferir:

100ms–200ms.

---

# 41. PERFORMANCE

Evitar:

- re-renderizações desnecessárias;
- imagens gigantes sem necessidade;
- efeitos pesados;
- sombras excessivas;
- blur exagerado;
- animações contínuas.

O aplicativo deverá futuramente reproduzir vídeo enquanto controla áudio, microfone e WebSocket.

Portanto a interface deve ser leve desde agora.

---

# 42. SCROLL

Observe as referências.

As áreas de listagem devem possuir scroll interno quando apropriado.

Não permitir que o layout inteiro fique pulando ou mudando de tamanho devido ao conteúdo.

---

# 43. RESPONSIVIDADE DO DESKTOP

Este NÃO é o controle mobile.

O desktop deve continuar sendo uma interface para computador.

Não transformar tudo em layout mobile quando a janela ficar pequena.

Definir dimensões mínimas adequadas.

---

# 44. DOCUMENTAÇÃO

Criar:

```text
docs/architecture/desktop.md
```

Documentar:

- estrutura;
- stores;
- tipos;
- componentes;
- rotas;
- estados do player.

Criar:

```text
docs/screens/
```

com:

```text
home.md
karaokes.md
player.md
playlists.md
history.md
settings.md
```

Descrever a função de cada tela.

---

# 45. SCREENSHOT TESTS

Instalar Playwright.

Criar testes básicos de screenshot para:

1920x1080.

No mínimo:

```text
home
karaokes
player
settings
```

Os screenshots deverão ser salvos em uma pasta de resultados.

O objetivo é posteriormente comparar visualmente nossa implementação com as referências existentes em `docs/reference`.

Não tente calcular automaticamente pixel-perfect nesta primeira etapa.

Apenas deixe a infraestrutura pronta.

---

# 46. DADOS DE DEMONSTRAÇÃO

Ao iniciar a aplicação pela primeira vez, quero conseguir navegar por todas as telas sem configurar absolutamente nada.

Portanto criar dados mock suficientes para testar:

- pesquisas;
- listas longas;
- playlists;
- fila;
- histórico;
- estatísticas;
- player;
- configurações.

---

# 47. ROTA DE DEBUG

Durante desenvolvimento disponibilizar rota/tela interna:

`/debug`

Nela permitir acessar diretamente estados importantes:

```text
Home

Busca vazia

Busca com resultados

Player

Player pausado

Fila vazia

Fila cheia

Intervalo

Pontuação

Configurações

Estatísticas
```

Isso facilitará testes visuais.

Não incluir esta área na versão final futuramente.

---

# 48. ORGANIZAÇÃO DO TRABALHO

Não tente construir tudo em uma alteração enorme.

Trabalhe em etapas.

Ordem:

### ETAPA A
Inspecionar referências e documentar telas.

### ETAPA B
Criar projeto Electron/React/TypeScript.

### ETAPA C
Criar Design System.

### ETAPA D
Criar AppShell.

### ETAPA E
Criar Home.

### ETAPA F
Criar Karaokês.

### ETAPA G
Criar Player e fila.

### ETAPA H
Criar Playlists.

### ETAPA I
Criar Histórico.

### ETAPA J
Criar Configurações.

### ETAPA K
Criar Estatísticas.

### ETAPA L
Criar testes Playwright.

Após cada etapa executar:

```bash
pnpm typecheck
pnpm lint
pnpm build
```

---

# 49. MUITO IMPORTANTE

Antes de escrever código:

1. liste os arquivos existentes em `docs/reference`;
2. examine as imagens;
3. identifique todas as telas;
4. identifique elementos que aparecem repetidamente;
5. documente esses elementos;
6. só depois inicie a implementação.

Não invente uma nova identidade visual.

Não transforme o projeto em um template genérico de dashboard.

Não utilize sidebar administrativa padrão caso isso não apareça nas referências.

Não crie cards modernos aleatórios.

Não utilize gradientes que não aparecem nas referências.

Não tente "melhorar" o design ainda.

Primeiro queremos compreender e reproduzir.

A personalização virá posteriormente.

---

# 50. DEFINIÇÃO DE PRONTO DA FASE 1

Considerar esta fase concluída somente quando:

- aplicativo iniciar pelo Electron;
- todas as principais páginas existirem;
- navegação funcionar;
- player simulado funcionar;
- fila funcionar localmente;
- playlists funcionarem localmente;
- histórico aparecer;
- configurações alterarem estado local;
- personalização de cor funcionar;
- dados mock estiverem separados;
- arquitetura estiver documentada;
- screenshots Playwright forem gerados;
- TypeScript estiver sem erros;
- lint estiver sem erros;
- build terminar corretamente.

Ao finalizar, apresente:

1. resumo do que foi implementado;
2. árvore relevante do projeto;
3. comandos para executar;
4. screenshots produzidos;
5. limitações atuais;
6. TODO da próxima fase.

Não comece a Fase 2 automaticamente.

Pare após concluir a Fase 1.