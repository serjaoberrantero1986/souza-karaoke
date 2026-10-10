# Validação da Fase 1

Data: 02/10/2026. Ambiente: Windows, Node.js 24.13.1, pnpm 10.18.3.

## Resultado final

| Verificação | Resultado |
| --- | --- |
| `pnpm typecheck` | Aprovado, sem erros TypeScript |
| `pnpm lint` | Aprovado, sem erros ESLint |
| `pnpm build` | Aprovado; renderer em apps/desktop/dist |
| `pnpm test` | 4 testes de sessão aprovados |
| `pnpm test:e2e` | 8 testes aprovados, 17 segundos na execução final |
| `pnpm test:electron` | Build abriu, navegou, carregou preload e preservou isolamento |
| `pnpm dev` | Vite e Electron iniciaram pelo comando único; janela de verificação encerrada após o teste |
| Screenshots | 18 imagens preservadas em docs/screenshots |

## Cobertura

- Busca sem distinguir acentos; seleção e reprodução simulada.
- Tempo avança enquanto overlay de busca está aberto; pedidos com nome entram na fila.
- Tom, reset, pausa, reordenação e reprodução imediata da fila.
- Playlist: criar, adicionar, renomear, recarregar/persistir, remover música e excluir.
- Todas as 13 subseções de configurações abrem; personalização persiste; PIN valida quantidade de dígitos.
- Histórico com 24 registros e filtro; Fotos em estado vazio.
- Intervalo, score e fila vazia acessíveis pelo debug.
- Layout em 1366×768, 1600×900, 1920×1080 e 2560×1440.
- Regras da sessão: fim da música, registro de histórico, score, próxima faixa, duplicatas independentes, pausa, limites de tom e foto simulada.

## Correções encontradas na validação

Data inválida na transição setembro/outubro do mock de estatísticas corrigida com Date.UTC. Escape do modal corrigido para funcionar mesmo quando o botão focado se torna desabilitado. Ajustados tamanho da marca e botão de criar playlist em janelas menores. Acesso alternativo às configurações via Fotos evita perder o acesso ao ocultar o botão da Home.

## Limites do resultado

Não houve execução em Linux nem geração de instalador. As capturas foram examinadas visualmente; não há certificação pixel-perfect. Mídia, QR, câmera, score, microfone e serviços remotos são simulações declaradas. A Fase 2 não foi iniciada.
