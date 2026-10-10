# Análise das referências — Etapa A

Foram extraídos e examinados os 46 PNGs do ZIP original, preservado em `docs/`. Os seis contact sheets em `docs/reference-sheet-*.jpg` permitem consultar o inventário visual completo. As imagens originais ficam somente na documentação, nunca nos assets distribuídos.

## Inventário por arquivo (Captura de tela 2026-10-01)

| Sufixo | Tela / observação |
| --- | --- |
| 152131 | Vídeo do público, letras em tela cheia; conteúdo audiovisual não será reutilizado |
| 152221 | Home preta, marca superior esquerda, QR superior direito, mensagem central e ações inferiores |
| 152237, 152312 | Karaokês: busca, ordenação, categorias, sugestões, seleção e rodapé fixo |
| 152340 | Seleção nativa de pasta; nesta fase será simulada |
| 152405 | Playlists vazias, coluna esquerda estreita |
| 152441 | Playlist selecionada vazia |
| 152450 | Modal de busca para adicionar à playlist |
| 152507, 152522 | Resultados e indicação de música adicionada |
| 152532 | Playlist preenchida, reprodução e remoção |
| 152542 | Intervalo, contador circular e próxima música |
| 152556 | Player integral, título superior, microfone à direita, controles inferiores |
| 152609 | Busca sobreposta ao player, sem sair da reprodução |
| 152643, 152659 | Histórico, horários, origem, seleção e filtros |
| 152721, 152747 | Geral, pasta, checkboxes, microfone, ordenação e música de fundo |
| 152756, 152803, 152811 | Pontuação, modos, dificuldade e duração |
| 152825 | Player: tom, fila, continuidade e intervalo |
| 152854, 152920, 153252 | Controle remoto e operador/PIN na área inferior |
| 153231 | Modo 2 Monitores |
| 153310, 153341, 153348, 153401 | Modo Foto, opções, molduras e carimbos |
| 153411 | Preview da foto com moldura, mensagem e ação de pular |
| 153438 | Sugestões Inteligentes, opções de fonte |
| 153452, 153756 | Personalização, cores, logo e fundo |
| 153710 | Home personalizada; não copiar foto nem logotipo |
| 153725 | Fotos, estado vazio |
| 153806, 153818 | Estatísticas, cartões compactos, barras e rankings |
| 153826 | Atalhos editáveis |
| 153847 | Sobre e licença; usar dados fictícios |

Os seis arquivos `screencapture-*` mostram site institucional, acesso, loja, conta, pedido e produto. Foram examinados para delimitar o escopo, mas não serão reproduzidos no desktop. Dados pessoais, credenciais e marcas dessas imagens não serão transcritos.

## Geometria e componentes recorrentes

- Referência desktop 1920×1080. Painel central aproximadamente x=384, y=54, largura=1152, altura=972 (60vw × 90vh). Margens laterais deixam marca e QR visíveis, escurecidos quando há painel.
- Home sem sidebar. Ações centralizadas no rodapé, mensagem no centro. Painéis têm cabeçalho ~70px, botão Voltar, título e ações à direita.
- Superfícies #111, cabeçalhos #1f1f1f, controles #2c2c2c, bordas discretas, fonte sans-serif, destaque laranja. Sem cartões decorativos de dashboard fora das estatísticas.
- Configurações: coluna interna de ~224px, item ativo laranja, conteúdo de ~672px centralizado e scroll próprio. Checkboxes quadrados, não switches arredondados.
- Listas: thumbnail 64×40, checkbox, título, descrição menor, badge YT no extremo direito. Rodapé de seleção separado do scroll.
- Playlists: coluna própria, lista à direita, busca em modal estreito sobre overlay escuro.
- Player: plano preto com placeholder independente, controles embaixo; nenhuma imagem/vídeo/logotipo do fornecedor no produto.
- Elementos compartilhados: painel, cabeçalho, botões, checkbox, select, campo de busca, linha de música, modal, confirmação, QR ilustrativo, controles de tom, estado vazio e linha de configuração.

## Adaptação e diferenças deliberadas

Em 1366×768 os painéis ganham largura relativa e margens menores; não há escala global nem layout mobile. Janela mínima 1100×680. QR é um desenho ilustrativo marcado como demonstração, sem codificar os links das referências. Arquivos e Operador remoto têm subseções próprias conforme o brief. Fila e pontuação usam os padrões visuais observados, sem inventar integração real.
