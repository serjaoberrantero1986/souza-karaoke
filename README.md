# Meu Karaokê

Aplicativo desktop para Windows com busca de karaokê no YouTube, reprodução pelo player oficial, arquivos locais opcionais, playlists, histórico, fila e pedidos pelo navegador do celular na mesma rede Wi-Fi.

## Uso

1. Na primeira execução, abra **Configurações → YouTube**, informe uma chave da YouTube Data API v3 e salve. No Windows ela fica protegida por DPAPI e é recuperada nas próximas execuções.
2. A sessão do controle remoto inicia automaticamente. O QR da tela inicial permite pesquisar e pedir músicas; o QR de **Configurações → Operador remoto** permite comandar a reprodução.
3. Em **Escolher música**, digite título ou artista. A busca consulta versões de karaokê no YouTube automaticamente.
4. **Selecionar pasta local** inclui arquivos MP4, WebM, OGV, OGG, MP3, WAV e M4A na busca durante a sessão.
5. A fila, playlists, histórico, estatísticas e personalização usam somente dados reais criados durante o uso.

## Desenvolvimento

Requer Node.js 24 e pnpm 10.

```powershell
pnpm install
pnpm dev
```

Validação:

```powershell
pnpm typecheck
pnpm lint
pnpm test
pnpm test:e2e
pnpm test:electron
```

## Versão Windows

```powershell
pnpm package:win
```

Os artefatos são gerados em `apps/desktop/release`: instalador NSIS e executável portátil. A versão atual não possui assinatura digital; por isso, o Windows SmartScreen pode exibir um aviso ao abrir um pacote recém-gerado.

## Personalização e controle

- Configure o PIN em **Operador remoto** e use-o em **Sobre** para alterar o nome exibido no computador e no celular.
- Em **Personalização**, escolha logo, imagem de fundo, cor principal e fundo sólido/degradê para a mensagem inicial.
- O histórico da sessão fica visível no celular. **Anterior** e **Próxima** são exclusivos do administrador; as permissões dos convidados para reprodução e tom são independentes.
- A nota manual aguarda confirmação no computador ou no controle do administrador. A média do público usa um voto por aparelho (uma nova nota substitui a anterior quando permitido).

## Limites atuais

- Computador e celular precisam estar na mesma rede; a porta TCP 17844 deve ser permitida no firewall privado.
- O QR pode ser mantido entre reinicializações pela opção **Manter os mesmos QR Codes**.
- No Electron, a pasta local é recuperada ao abrir; arquivos removidos ou unidades desconectadas podem ficar indisponíveis. Na prévia web a seleção é temporária.
- O player usa o parâmetro oficial `controls=0`. Anúncios, marca, mensagens e restrições do vídeo continuam sendo controlados pelo YouTube. Os filtros de incorporação, país e falhas recentes reduzem bloqueios, sem garantir disponibilidade.
- **Alterar Tom** no YouTube utiliza captura isolada e processamento SoundTouch. A captura e a alteração de frequência foram verificadas; latência física, qualidade perceptiva e compatibilidade em outros computadores ainda precisam de validação.
- **Participação vocal — estimativa** mede presença e estabilidade do áudio, sem comparar com a melodia. Não é uma medida confiável de afinação. Ruídos e acompanhamento podem interferir; áudio insuficiente não gera nota.
- Fotos pelo celular, galeria e segundo monitor estão disponíveis. O histórico navegável da sessão dura até fechar o aplicativo; o histórico de músicas concluídas fica salvo separadamente.

## Versionamento

Instaladores, dependências, arquivos de ambiente, chaves locais e resultados de testes ficam fora do Git. Após clonar, execute `pnpm install` e `pnpm dev`. A chave do YouTube deve ser configurada novamente em cada computador: ela não é publicada no repositório.

## Recuperar o PIN por e-mail

O código de recuperação é enviado pelo aplicativo desktop e vale por 10 minutos, com cinco tentativas e limite de envio. O endereço e o código temporário ficam criptografados pelo Windows neste computador. O PIN atual nunca é enviado por e-mail.

Para ativar o envio, crie no Resend uma chave com permissão **Sending access** restrita ao seu domínio verificado. Cadastre na conta do Windows estas variáveis de ambiente, sem colocá-las neste repositório ou no instalador:

- `KARAOKE_RESEND_API_KEY`: chave criada no Resend.
- `KARAOKE_RESEND_FROM`: remetente autorizado no formato `Meu Karaokê <karaoke@seu-dominio.com>`.

Defina as variáveis em **Editar as variáveis de ambiente da sua conta** nas Configurações avançadas do Windows, feche o aplicativo e abra-o novamente. Sem esses valores, a recuperação informa que o envio ainda não está ativo. O endereço confirmado fica associado a este computador.
