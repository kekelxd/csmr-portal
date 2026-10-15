# Reconstrução do Portal SMART/CSMR

Base fixa: Zammad 7.2.2, commit `295796a2df0b38a579846c017383835657687a22`, imagem `ghcr.io/zammad/zammad:7.2.2-0000`; infraestrutura `zammad-docker-compose` no commit `b51cba16ab6d753efcb6676a30afaf97753b72cb`. Preserve LICENSE e as licenças de terceiros desses componentes. As dependências completas da aplicação são fornecidas pelo upstream; este repositório contém as extensões correspondentes, não uma cópia integral do Rails.

## 1. Preparar uma instalação nova

Use diretório, projeto Compose, volumes e portas diferentes de qualquer instalação existente. Não copie `.env`, bancos, backups ou uploads do portal. Gere credenciais locais fortes fora do Git, seguindo o README upstream. Não conecte canais de e-mail durante o teste.

```sh
git clone https://github.com/zammad/zammad-docker-compose.git infraestrutura
git -C infraestrutura checkout b51cba16ab6d753efcb6676a30afaf97753b72cb
git clone https://github.com/kekelxd/csmr-portal.git extensoes
git -C extensoes checkout v1.0-7.2.2
```

A segunda URL depende de publicação pelo responsável. Antes disso, use uma cópia local revisada. Na configuração local upstream, fixe `IMAGE_REPO=ghcr.io/zammad/zammad` e `VERSION=7.2.2-0000`. Confira a imagem resolvida com `docker compose config --images`; a aplicação deve resolver exatamente a imagem acima. Nunca salve a configuração expandida com credenciais no repositório.

## 2. Inicializar a base antes do initializer

Primeiro suba somente a infraestrutura upstream, sem o override das extensões: os campos CSMR ainda não existem. Escolha explicitamente um nome de projeto isolado. Leia as configurações de portas, volumes, memória e serviços do README upstream antes de subir. Para um laboratório sem busca, `ELASTICSEARCH_ENABLED=false` reduz o consumo; busca e indexação não foram validadas neste ensaio.

O serviço `zammad-init` deve terminar com sucesso. Complete o assistente administrativo somente no ambiente de destino; nenhuma conta é criada pelo importador. O ensaio registrado usou banco vazio com dados de exemplo nativos do seed e nenhuma informação real.

## 3. Importar configurações seletivas

Copie `forms/`, `theme/`, `configuracao/`, `tools/` e `compliance/` deste repositório para a raiz da infraestrutura, sem copiar `.git` nem sobrescrever LICENSE upstream. Disponibilize essa cópia em `/work` em um contêiner temporário da mesma imagem, mesma rede e mesmas variáveis de banco da instalação nova. Monte-a somente leitura.

```sh
# Dentro do contêiner temporário, em /opt/zammad:
CSMR_GROUP_NAME='CSMR - Atendimento' bundle exec rails runner /work/tools/importar.rb
```

O script procura ou cria o grupo pelo nome e resolve os papéis `Customer` e `Agent` por nome. Recria sete atributos, sete Core Workflows, o template de confirmação no gatilho nativo `auto reply (on new tickets)` e a visão `csmr_open`, usada pelo painel. Repetir é permitido. Migrações pendentes de atributos fora do escopo CSMR bloqueiam a execução. A migração de colunas não é uma operação transacional única: se falhar, corrija a causa antes de repetir.

O gatilho passa a usar o HTML e assunto sanitizados em configuracao/. Isso não cadastra canais nem credenciais. O script não atribui permissões a operadores: atribua-as posteriormente pela administração. SLA e calendário 24/7 devem ser configurados pela interface; este pacote não exporta os registros completos dessa configuração operacional. O painel consulta o prazo nativo calculado pelo SLA e não cria um prazo próprio.

## 4. Revisar a proposta para o grupo

O initializer correspondente ao portal observado ainda tem `group_id=2`, e mantém o estado nativo de ID `1`. O importador não depende do grupo 2. Antes de usar o initializer em outra instalação, revise `propostas/grupo-por-nome.patch` e aplique-o somente à cópia de destino:

```sh
git apply --check propostas/grupo-por-nome.patch
git apply propostas/grupo-por-nome.patch
```

O patch resolve o grupo por `CSMR_GROUP_NAME`, com padrão `CSMR - Atendimento`, sem conceder permissões. Não foi aplicado à instalação ativa nem à fonte correspondente preservada neste repositório. A proposta foi testada somente em processo descartável. Confirme também os estados da instalação de destino: o initializer usa ID 1; o painel filtra IDs 1 e 2 e considera proprietário 1 como sistema. Esses pressupostos coincidem com o seed observado, mas exigem revisão se o destino tiver sido alterado.

## 5. Montagens e identidade

Copie o docker-compose.override.yml deste repositório para a infraestrutura. Ele monta os recursos do tema no nginx e o initializer em Rails, scheduler e websocket, somente leitura. Use os diretórios `theme/` e `forms/` ao lado do arquivo Compose. O arquivo registra as montagens próprias; não contém credenciais. Confira `docker compose config --quiet` antes de qualquer subida.

Os ícones SMART podem ser substituídos mantendo os nomes de arquivo; leia theme/MARCA.md. A autorização para usar a marca não decorre da AGPL. A aparência da assinatura e as configurações nativas de identidade não foram exportadas com contatos; configure-as manualmente sem acrescentar dados pessoais ao Git.

## 6. Oferta de código e rodapé — aplicação futura

Depois de revisar e publicar o commit correspondente, execute `python3 tools/preparar-oferta.py`. O programa resolve o hash de HEAD (ou da referência indicada por --ref) e gera `.build/source-config.json`, fora do Git para evitar autorreferência do hash do próprio commit. Copie esse arquivo para a página **da implantação de destino**, depois de confirmar os indicadores de acesso. Não configure acesso público como verificado sem testar como usuário externo.

A integração atual já inclui a montagem pública de `/sobre-e-licencas/` e o link no HTML servido pelo nginx. O patch registra a alteração aplicada desde 15/10/2026; não o reaplique sobre estes arquivos. Em cada novo destino, valide login, cadastro, formulário do cliente autenticado, painel, edição, navegação por teclado e telas estreitas. Formulário anônimo incorporado a outro site não recebe esse rodapé automaticamente: adicione também um link na página hospedeira. Há validação atual de painel/formulário de operador e página estática; sessão específica de cliente continua sem teste.

## Validação realizada e limites

Foi inicializada uma imagem oficial contra PostgreSQL novo, com Redis e Memcached em rede Docker interna, sem portas publicadas, volumes da produção ou canais de e-mail. A importação foi executada duas vezes; atributos/regras/configurações permaneceram equivalentes e usuários, organizações e chamados não foram modificados. A proposta de resolução do grupo e a normalização decimal foram testadas sem salvar chamado. Veja evidencias/reconstrucao.json.

Não foram validados: toda a pilha Compose com o override aplicado, ciclo real de login/criação/resposta pelo navegador, sessão específica de cliente, SMTP/OAuth, busca Elasticsearch, SLA/calendário e acesso público ao GitHub. Por isso `reconstructionVerified` permanece falso e o modo release mantém bloqueios técnicos além das ações do responsável. Somente o nginx ativo foi recriado na integração posterior autorizada, sem reiniciar Rails, banco, scheduler ou websocket.

## Template nginx integrado

O override monta theme/csmr-nginx.conf em /opt/zammad/contrib/nginx/zammad.conf e theme/csmr-licenses-location.conf em /etc/nginx/csmr-licenses-location.conf. O template deriva do original da versão-base e adiciona somente include dentro do server. Não monte a localização em conf.d: esse diretório é incluído no contexto http, onde location não é permitido. O entrypoint nativo gera o server preservando suas substituições de serviços/portas. A página usa no-store e não recebe os scripts do aplicativo.
