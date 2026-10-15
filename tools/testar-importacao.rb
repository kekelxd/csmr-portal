# Copyright (C) 2026 SLG Comércio de Sistemas de Automação Predial Ltda
# SPDX-License-Identifier: AGPL-3.0-only
# Added 2026-10-15. Test only in an isolated database. WITHOUT ANY WARRANTY.
require 'digest'
raise 'Somente ambiente descartável explicitamente autorizado' unless ENV['CSMR_ISOLATED_TEST'] == 'yes'
def snapshot
  records = [ObjectManager::Attribute.where("name LIKE 'csmr_%'"),
    CoreWorkflow.where("name LIKE 'CSMR - %'"), Trigger.where(name: 'auto reply (on new tickets)'),
    Overview.where(link: 'csmr_open')]
  records.map { |relation| relation.order(:id).map { |r| r.attributes.except('updated_at', 'created_at') } }
end
baseline = [User.count, Organization.count, Ticket.count]
load '/work/tools/importar.rb'
first = snapshot
load '/work/tools/importar.rb'
raise 'Importação não idempotente' unless first == snapshot
raise 'Dados protegidos alterados' unless baseline == [User.count, Organization.count, Ticket.count]
group = Group.find_by!(name: ENV.fetch('CSMR_GROUP_NAME', 'CSMR - Atendimento'))
workflow = CoreWorkflow.find_by!(name: 'CSMR - 02 Categoria obrigatória no portal')
raise 'Grupo incorreto' unless workflow.perform.dig('ticket.group_id', 'set_fixed_to') == [group.id.to_s]
raise 'Papel incorreto' unless workflow.condition_selected.dig('session.role_ids', 'value') == [Role.find_by!(name: 'Customer').id.to_s]
raise 'Teste precisa de grupo diferente do ID original' if group.id == 2
raise 'Atributos ausentes' unless ObjectManager::Attribute.where("name LIKE 'csmr_%'").count == 7
raise 'Regras ausentes' unless CoreWorkflow.where("name LIKE 'CSMR - %'").count == 7
source = File.read('/work/forms/csmr_portal.rb')
source = source.sub('  AVAILABLE_CATEGORIES', "  def self.destination_group_id\n    Group.find_by!(name: ENV.fetch('CSMR_GROUP_NAME', 'CSMR - Atendimento')).id\n  end\n  AVAILABLE_CATEGORIES")
source = source.gsub('self.group_id=2', 'self.group_id=CsmrPortalForm.destination_group_id').gsub('params[:group_id]=2', 'params[:group_id]=CsmrPortalForm.destination_group_id')
# Evaluation is confined to this disposable process; active source remains unchanged.
eval(source, TOPLEVEL_BINDING, 'proposta-grupo-por-nome.rb')
Ticket.include(CsmrPortalForm::TicketRules) unless Ticket < CsmrPortalForm::TicketRules
raise 'Resolução do initializer incorreta' unless CsmrPortalForm.destination_group_id == group.id
ticket = Ticket.new(csmr_categoria: 'temperatura', csmr_tipo_temperatura: 'aquecer', csmr_setpoint: '22,5', csmr_local: 'local de teste')
ticket.csmr_prepare_form
raise 'Normalização incorreta' unless ticket.group_id == group.id && ticket.csmr_setpoint == '22.5'
ticket.csmr_validate_form
raise 'Validação inesperada' if ticket.errors.any?
puts JSON.generate(test: 'PASS', import_runs: 2, idempotent_configuration: true,
  protected_records_unchanged: true, non_original_group_id: true,
  proposed_initializer_resolves_group: true, decimal_normalization: true,
  no_test_ticket_saved: true, full_browser_reconstruction: false)
