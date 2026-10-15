# Levantamento de origem e modificações

## Base comprovada

| Item | Evidência |
|---|---|
| Aplicação | `VERSION`: `7.2.2-295796a2.docker` |
| Tag oficial | `7.2.2` → `295796a2df0b38a579846c017383835657687a22` |
| Imagem | `ghcr.io/zammad/zammad:7.2.2-0000`; ID no manifesto de integridade |
| Repositório de implantação | `zammad-docker-compose`, HEAD `b51cba16ab6d753efcb6676a30afaf97753b72cb` |
| Licença | AGPLv3 na aplicação e na raiz da implantação; arquivos originais preservados |

O repositório de implantação não é o repositório do código Rails. Comparação da tag: **13.986** arquivos regulares, **9.286** idênticos à instalação, **1** diferente (`VERSION`, sufixo Docker) e **4.699** ausentes. Os mesmos 4.699 também faltam na imagem original: são diferenças de empacotamento, principalmente testes, ferramentas e fontes de build, não remoções próprias. A imagem original foi examinada em contêiner parado, sem rede, removido após a leitura.

Adicionais de build presentes também na imagem original: `app/assets/builds/knowledge_base.css`, `print.css`, `zammad.css`, `db/schema.rb`. A adição própria na árvore Rails é `config/initializers/csmr_portal.rb`, montada do arquivo local abaixo. Não se detectaram mudanças próprias nos arquivos originais presentes. Detalhes e hashes estão em `evidencias/`.

## Inventário próprio por área

Todos os arquivos abaixo são adições/configurações locais em relação à aplicação-base, não commits históricos próprios. As cópias em `source/` não são carregadas pelo serviço.

| Área | Arquivos de origem | Finalidade |
|---|---|---|
| Formulário | `local/forms/csmr_portal.rb` → `config/initializers/csmr_portal.rb` | Validação decimal, categorias, limpeza, título/artigo e atributos de abertura |
| Formulário | `local/theme/csmr-form.js`, `csmr-form.css` | Layout, rótulos condicionais e orientações |
| Painel | `local/theme/csmr-operations.js`, `csmr-operations.css` | Resumo operacional pela API e ocultação de estatísticas padrão |
| Branding/CSS | `local/theme/csmr-theme.css`, `csmr-theme.conf` | Tokens de tema e inclusão de recursos via nginx |
| Branding/ícones | `local/theme/csmr-icon.png`, `csmr-favicon.ico` | Ícones locais montados no nginx |
| Implantação | `docker-compose.override.yml` | Montagens locais; ignorado no Git upstream |
| E-mails | `source/configuracao/confirmacao-abertura.html`, `.json` | Cópia do template público nativo no banco; não é alteração de arquivo upstream |
| Regras nativas | `source/configuracao/formulario-e-regras.json` | Exportação seletiva de 7 atributos e 7 regras CSMR, sem usuários/chamados |
| Outras | `DESIGN.md`, `UX-CONTRACT.md`, `premium-ui.json`, `premium-audit.json` | Documentação e artefatos locais não versionados no estado inicial |

Logo e nome são também configurações nativas: nome visual observado SMART / CSMR - Atendimento; organização visual SMART / CSMR. Não foi exportado cadastro de contas ou organizações. A assinatura do grupo contém contato e não foi copiada; exportação sanitizada: **A CONFIRMAR**. Titularidade dos recursos de marca: SMART, informada pelo responsável (ver `source/theme/MARCA.md`).

## Histórico

Os commits consultados pertencem ao upstream de implantação. Não há commits próprios das extensões ativas. Um histórico antigo de exemplo upstream do override não comprova alterações SMART/CSMR. Datas por arquivo, autores e primeira modificação comprovada: **A CONFIRMAR**. As referências 14 e 15/10/2026 foram autorizadas pelo responsável, identificadas como declaradas no changelog.

## Pesquisa de segredos

Foram examinados **57 arquivos rastreados no HEAD e 1.131 blobs do histórico alcançável**, com padrões conhecidos de chaves privadas, tokens de fornecedores e URLs com credenciais. Nenhuma ocorrência de alta confiança foi detectada. O mesmo exame em arquivos de tema e scripts Ruby locais selecionados também não detectou esses padrões. Limitação: esse resultado não prova ausência de todos os segredos arbitrários; revisão humana permanece necessária.

Existem `.env`, backups de banco e artefatos privados ignorados fora do material publicável. Não foram copiados, exibidos nem adicionados ao Git. As cópias selecionadas não incluem e-mails de clientes. Defaults públicos upstream não foram classificados como credenciais privadas. Ver `evidencias/secret-scan.json` para escopo e limitações.

## Marca: achados relatados, sem correção automática

- `DESIGN.md` contém o identificador `SMART / CSMR Zammad pilot`. Pode ser interpretado como uso do nome da plataforma no nome do projeto. Decisão do responsável: remover Zammad do nome do projeto. O `DESIGN.md` original fica fora desta pasta e deve ser corrigido no projeto.
- O README upstream apresenta o Zammad. A apresentação foi preservada como documentação de origem, não reescrita como identidade comercial do portal.
- Nomes de serviços Docker, caminhos e APIs com `zammad` são técnicos; não foram automaticamente classificados como marca comercial do portal.
- A aplicação original conserva nomes e logos em recursos nativos. Tela de carregamento e avatares podem exibi-los. Não foram alterados; a apresentação externa requer conferência visual: **A CONFIRMAR**.
- O template atual de confirmação não contém a palavra Zammad. Isso não substitui os avisos e a oferta de código na interface.
- O nome visual atual não incorpora Zammad. Não se identificou declaração explícita de afiliação no material próprio examinado. A nova página usa apenas atribuição descritiva e não usa a logo do Zammad.

## Pendências

URL e hash do futuro repositório; acesso efetivo dos usuários; reconstrução em ambiente vazio; revisão sanitizada de assinatura; comprovação histórica de datas e autores: **A CONFIRMAR**. Snapshot, página e patch não constituem certificação jurídica nem oferta ativa. Nenhum commit ou deploy foi realizado. Antes de publicar, revisar o material e atualizar a fonte correspondente a cada mudança.
