# Versão 0.4.0 — personalização, sessão e pontuação

## Comportamento

- Nome visual em Sobre: exige um PIN configurado e correto a cada gravação. O PIN atual também é exigido para trocar/remover o PIN. A restauração do tema preserva o nome. Esta proteção é da interface local; não impede alguém com acesso ao perfil do Windows de editar o armazenamento do aplicativo.
- Nome abaixo do logo, no título do controle remoto e no rodapé com ano corrente. Alterar esse nome não renomeia o executável.
- Fundo da mensagem inicial com cor sólida/degradê, opacidade e cor de texto; prévia imediata. A identidade segue pelo mecanismo existente de versão de tema do controle remoto.
- Histórico da sessão em memória, com cursor de reprodução. Anterior e Próxima percorrem essa sequência antes de consumir novos pedidos. Cada retorno inicia uma apresentação com votos e métricas novos. Fechar o aplicativo encerra essa sequência; músicas concluídas permanecem no histórico persistente separado.
- Participantes podem consultar o histórico, mas o servidor recusa início da fila, anterior, próxima, edição da fila e confirmação de nota manual. Controles de reprodução e de tom têm permissões independentes e só funcionam para convidados durante uma apresentação ativa.
- Nota manual aguarda confirmação explícita no desktop ou celular do administrador. Ausência de votos e áudio insuficiente aparecem como ausência de avaliação, sem classificação de cantor ou oferta de foto por uma nota inventada.
- Busca mantém filtros oficiais de incorporação/sindicação, acrescenta país configurável e verifica restrições regionais. Erros 100/101/150 omitem o vídeo das novas buscas por 15 minutos nesta sessão. Erros de rede, dispositivo e identificação 153 não entram nessa lista. Há botão para buscar outra versão e opção para limpar a lista temporária.

## Validação realizada

- TypeScript e ESLint.
- 24 testes Vitest: inclui média por aparelho, histórico com pedidos independentes, retorno após o fim da fila, reinício bloqueado após conclusão, ausência de áudio/votos, nota manual sem expiração, zero válido, limites aleatórios, restrições regionais, expiração de indisponibilidade e comandos exclusivos do administrador.
- 6 testes Playwright de interface, incluindo recusa de nome sem PIN/PIN incorreto, persistência de nome e fundo em degradê.
- `scripts/smoke-remote.mjs`: Electron e servidor HTTP reais, dois contextos de celular, nome/tema/rodapé, autenticação do administrador, recusa HTTP de comandos privilegiados para participante, histórico/Anterior e confirmação de nota manual pelo celular. YouTube é interceptado nesse teste, portanto ele não prova disponibilidade dos vídeos reais.

## Limitações explícitas

- Pontuação vocal continua sendo uma estimativa de participação; não tem referência melódica e não comprova afinação. Não foi validada nesta versão com cantores reais e microfones físicos.
- A captura isolada e o SoundTouch foram mantidos. Os testes anteriores de captura/frequência e reprodução real estão descritos em `youtube-pitch-analysis.md`; latência física, sincronização percebida e compatibilidade em outros equipamentos ainda exigem validação.
- Filtros não eliminam restrições posteriores do YouTube. Nenhuma identificação falsa como aplicativo nativo foi introduzida.
- O Git não inclui instaladores, dependências, credenciais locais, arquivos de ambiente ou resultados de testes.
