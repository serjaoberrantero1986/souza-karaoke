# Controle pelo celular — uso pessoal

## Testar na rede doméstica

1. Abra o aplicativo Electron com `pnpm dev` na raiz do projeto. A prévia `dev:web` não inicia o serviço remoto.
2. Configure a chave em **Configurações → YouTube**. Ela continua em memória no computador; não é enviada ao celular.
3. Em **Configurações → Controle remoto**, clique em **Iniciar sessão remota**.
4. Coloque o celular e o computador na mesma rede Wi-Fi. Leia o QR ou copie o link. Quando houver várias interfaces de rede, escolha o endereço da rede Wi-Fi na lista.
5. Informe o nome, busque uma música e clique em **Pedir música**. A busca acrescenta `karaoke` quando necessário; isso não garante ausência de voz em todos os resultados.
6. No computador, abra a fila durante a reprodução para conferir os pedidos. A fila inicial ainda inclui exemplos da demonstração; remova-os antes de uma sessão real.
7. Para comandar a reprodução pelo celular, use o QR separado em **Configurações → Operador remoto**. Ele permite iniciar, pausar, continuar e pular. Qualquer pessoa com esse link tem esses comandos.
8. **Encerrar sessão remota** desativa o serviço. Ao iniciar outra sessão, os links mudam.

Se o Windows pedir acesso à rede para o aplicativo, permita em redes privadas. Não é necessário encaminhar portas no roteador. O serviço usa TCP 17844; a rede de convidados, VPN ou isolamento entre dispositivos pode impedir a conexão. Um endereço 127.0.0.1 indica que nenhuma interface IPv4 externa foi encontrada e não funciona no celular.

## Implementação e limites

- HTTP local ativado explicitamente, sem publicação na internet. Use somente em rede doméstica confiável; o tráfego local não é criptografado.
- Tokens aleatórios independentes de 192 bits para participante e operador, renovados por sessão. Os tokens ficam no fragmento do link e seguem no cabeçalho de autorização das chamadas.
- Verificação de Host e Origin, CSP sem scripts externos, comandos permitidos explicitamente, corpo limitado, limite de frequência de buscas/pedidos por IP e fila limitada a 100 itens.
- O celular recebe apenas resultados da busca, fila e estado do player. Chave, configurações e dados administrativos não são expostos pelo serviço.
- O processo Electron encaminha comandos ao aplicativo por IPC isolado. A busca continua saindo da origem local já usada pela chave; não é necessário mudar a restrição da chave para o IP do celular.
- Participantes pedem músicas; o operador gerencia a reprodução. Não há login por pessoa, PIN, reações, limite individual configurável ou sessão permanente nesta entrega. As antigas opções simuladas foram retiradas dessas telas.
- A fila sincroniza aproximadamente a cada 2,5 segundos. O vídeo toca somente no computador e continua sujeito às regras de autoplay do YouTube; pode ser necessário clicar no player no computador.
- O desktop é considerado o dispositivo do responsável. Suas configurações ainda não possuem senha local.

## Verificação

18 testes de lógica/servidores aprovados, incluindo autorização, separação dos papéis, origem externa e limite de frequência. Os 11 cenários existentes de interface foram verificados; o cenário de configurações foi atualizado para substituir o PIN ilustrativo.

`node scripts/smoke-remote.mjs`, executado em `apps/desktop`, valida Electron e HTTP reais com navegador em 390 × 844: pesquisa, pedido com nome, fila sincronizada, acesso do operador, início e pausa. A resposta da API YouTube é interceptada nesse teste; ele não consome uma chave real. O teste não substitui a leitura do QR e a conexão pelo seu celular físico, que dependem da rede e do firewall locais.
