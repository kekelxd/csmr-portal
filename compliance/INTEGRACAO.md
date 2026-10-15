# Integração proposta, não aplicada

O patch foi regenerado contra os arquivos atuais, com cabeçalhos de licença e caminhos da publicação. Propõe montar compliance/portal somente leitura em /sobre-e-licencas/ e incluir rodapé no HTML servido pelo nginx. Não muda autenticação ou permissões. git apply --check valida somente a aplicabilidade textual.

A mesma substituição HTML pode atingir login, cadastro, formulário nativo de cliente e painel; cobertura visual e interação nas telas reais ainda A CONFIRMAR. O CSS anterior reserva espaço no layout e tem tratamento móvel; não há prova de ausência de regressões em todas as telas. Formulário público anônimo incorporado a outro site exige link na página hospedeira e não é coberto automaticamente.

Não aplique sem validar o fluxo completo em cópia descartável, inclusive teclado e tela estreita. A página estática teve validação isolada anterior, insuficiente para declarar cobertura integrada. reconstructionVerified permanece falso.

URL planejada: https://github.com/kekelxd/csmr-portal ; tag v1.0-7.2.2. tools/preparar-oferta.py gera o hash imutável após a tag, fora do Git. Configuração da instalação real deve corresponder ao código efetivamente implantado; não anunciar a nova tag antes da revisão e implantação correspondente.
