# Refinamento da Fase 1 — 04/10/2026

Rodada de acabamento e usabilidade, preservando o escopo local e simulado.

- Busca tolera espaços extras e termos de artista/título em qualquer ordem, mantendo comparação sem acentos.
- Ordenação por nome, artista ou duração também funciona na seleção inicial de sugestões.
- Mais tocadas considera a frequência do histórico; recentes usa a data, independentemente da ordem de armazenamento. O modo combinado intercala catálogo popular de demonstração e mais tocadas, sem duplicatas. A seleção resultante respeita a ordenação escolhida pelo usuário.
- Desligar sugestões deixa de limitar o catálogo, mesmo com a fonte “Só as mais tocadas aqui” salva. O filtro de origem mantém as preferências de exibição.
- Modais focam o primeiro campo editável, e retornam o foco ao botão anterior ao fechar.
- Nomes longos de playlist usam reticências e tooltip, mantendo ações visíveis. O total de músicas acompanha a cor do texto do item selecionado.
- Categorias e playlists expõem sua seleção à navegação assistiva.

Verificação: TypeScript, lint, build, 8 testes de lógica e 9 testes Playwright aprovados. Capturas desta rodada em `docs/screenshots/refinamento-2026-10-04/`. Validada visualmente a playlist com nome longo em 1366×768. Não houve mudança no processo principal ou preload do Electron; esta rodada validou o renderer em Chromium.
