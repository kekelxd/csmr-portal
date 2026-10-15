# Integração ativa — 15/10/2026

Aplicação autorizada pelo responsável. O backup privado foi realizado antes das mudanças. Somente nginx foi recriado; Rails, banco, scheduler e websocket não foram reiniciados pela integração.

O template original contrib/nginx/zammad.conf é preservado em theme/csmr-nginx.conf, com uma única inclusão de localização estática no server. O entrypoint oficial continua responsável por resolver os serviços e gerar a configuração. A montagem é somente leitura. Reavalie o template contra o upstream ao atualizar a aplicação.

A localização exclusiva /sobre-e-licencas/ serve apenas os arquivos selecionados de compliance/portal. Autoindex desabilitado; cache no-store; as injeções globais do aplicativo são substituídas por filtro identidade nessa página. Rotas de API, websocket e autenticação permanecem nativas. O rodapé abre nova aba para preservar a edição. CSS reserva 40px e posiciona o rodapé no rodapé da viewport móvel.

integracao-proposta.patch é agora registro da diferença aplicada em relação ao commit f457f432. git apply --reverse --check valida a correspondência; não reaplicar esse patch sobre os arquivos já integrados. O patch do grupo em propostas/ permanece separado e não aplicado.

A oferta pública do código usa o commit revisado e publicado, mesmo enquanto a reconstrução completa segue pendente. Indicadores de auditoria não são apresentados como certificação jurídica. userAccessVerified continua falso até confirmação do responsável sobre acesso dos usuários externos.

Conferidos: painel e formulário de operador, página estática em desktop/tela estreita. Sessão específica de cliente e reconstrução integral continuam A CONFIRMAR. Formulários incorporados a sites externos exigem link na página hospedeira.
