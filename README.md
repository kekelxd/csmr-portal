# Portal SMART/CSMR

Portal de suporte baseado em Zammad 7.2.2, para equipe interna e clientes externos. Código próprio de formulário, painel e tema; configuração nativa exportada seletivamente.

Este portal utiliza o Zammad como plataforma. Não é um produto desenvolvido integralmente pela SMART e não possui afiliação ou endosso oficial da Zammad Foundation ou da Zammad GmbH.

Base: tag `7.2.2`, commit `295796a2df0b38a579846c017383835657687a22`. Imagem `ghcr.io/zammad/zammad:7.2.2-0000`. Infraestrutura upstream: commit `b51cba16ab6d753efcb6676a30afaf97753b72cb` de zammad-docker-compose.

Consulte RECONSTRUCAO.md, NOTICE.md, CHANGELOG-MODIFICACOES.md e theme/MARCA.md. O patch do grupo em propostas/ permanece não aplicado. A integração do rodapé está ativa desde 15/10/2026, por autorização do responsável; compliance/integracao-proposta.patch documenta a diferença em relação à preparação inicial. Este repositório não contém cadastros, credenciais, banco nem assinaturas com contatos.

## Licença e contribuição

Código sob GNU AGPLv3, conforme LICENSE. Preserve os avisos originais e licenças de terceiros em compliance/portal/. A identidade visual tem regras próprias em theme/MARCA.md.

Toda alteração nova deve ser registrada no CHANGELOG-MODIFICACOES.md antes de ir para produção. É proibido versionar dados sensíveis, inclusive chamados, usuários, clientes, senhas, tokens, configurações privadas, bancos e backups. Revise o conteúdo e execute tools/verificar.py antes de publicar.

Publicação planejada: https://github.com/kekelxd/csmr-portal ; tag `v1.0-7.2.2`. Repositório público observado. A tag v1.0-7.2.2 preserva a preparação inicial; o portal atualizado oferece o hash do commit da integração. A confirmação de acesso pelos usuários externos continua pendente.
