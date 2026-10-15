# Copyright (C) 2026 SLG Comércio de Sistemas de Automação Predial Ltda
# SPDX-License-Identifier: AGPL-3.0-only
# Based on Zammad 7.2.2. Added 2026-10-15. WITHOUT ANY WARRANTY.
require 'json'
root = File.expand_path('..', __dir__)
data = JSON.parse(File.read(File.join(root, 'configuracao/formulario-e-regras.json')))
raise 'Exportação inesperada' unless data.fetch('attributes').size == 7 && data.fetch('core_workflows').size == 7
names = data.fetch('attributes').map { |a| a.fetch('name') }
raise 'Atributos fora do escopo' unless names.all? { |n| n.start_with?('csmr_') }
customer = Role.find_by!(name: 'Customer')
agent = Role.find_by!(name: 'Agent')
system_user = User.find_by!(login: '-')
UserInfo.current_user_id = system_user.id
before = [User.count, Organization.count, Ticket.count]
pending = ObjectManager::Attribute.where(to_create: true).or(ObjectManager::Attribute.where(to_migrate: true)).or(ObjectManager::Attribute.where(to_delete: true))
raise 'Há migrações de atributos fora do escopo CSMR; revise antes' if pending.where.not(name: names).exists?
group_name = ENV.fetch('CSMR_GROUP_NAME', 'CSMR - Atendimento')
group = Group.find_or_initialize_by(name: group_name)
if group.new_record?
  group.assign_attributes(active: true, created_by_id: system_user.id, updated_by_id: system_user.id)
  group.save!
end
data.fetch('attributes').each do |attribute|
  ObjectManager::Attribute.add(attribute.deep_symbolize_keys.merge(object: 'Ticket', created_by_id: system_user.id, updated_by_id: system_user.id))
end
ObjectManager::Attribute.migration_execute(false)
ActiveRecord::Base.transaction do
  data.fetch('core_workflows').each do |workflow|
    workflow = Marshal.load(Marshal.dump(workflow))
    selected = workflow.fetch('condition_selected')
    selected['session.role_ids']['value'] = [customer.id.to_s] if selected.key?('session.role_ids')
    assignment = workflow.fetch('perform')['ticket.group_id']
    assignment['set_fixed_to'] = [group.id.to_s] if assignment
    record = CoreWorkflow.find_or_initialize_by(name: workflow.fetch('name'))
    record.assign_attributes(workflow)
    record.created_by_id ||= system_user.id
    record.updated_by_id = system_user.id
    record.save! if record.changed?
  end
  template = JSON.parse(File.read(File.join(root, 'configuracao/confirmacao-abertura.json')))
  trigger = Trigger.find_or_initialize_by(name: 'auto reply (on new tickets)')
  trigger.assign_attributes(
    condition: {
      'ticket.action' => { 'operator' => 'is', 'value' => 'create' },
      'ticket.state_id' => { 'operator' => 'is not', 'value' => Ticket::State.by_category(:closed).first.id },
      'article.type_id' => { 'operator' => 'is', 'value' => %w[email phone web].map { |n| Ticket::Article::Type.find_by!(name: n).id } },
      'article.sender_id' => { 'operator' => 'is', 'value' => Ticket::Article::Sender.find_by!(name: 'Customer').id }
    },
    perform: { 'notification.email' => {
      'body' => File.read(File.join(root, 'configuracao/confirmacao-abertura.html')),
      'subject' => template.fetch('subject'), 'recipient' => template.fetch('recipient').first
    } },
    activator: 'action', execution_condition_mode: 'selective', active: true,
    updated_by_id: system_user.id
  )
  trigger.created_by_id ||= system_user.id
  trigger.save! if trigger.changed?
  overview = Overview.find_or_initialize_by(link: 'csmr_open')
  overview.assign_attributes(name: 'CSMR - Abertos', prio: 900, role_ids: [agent.id],
    condition: {
      'ticket.group_id' => { operator: 'is', value: [group.id.to_s] },
      'ticket.state_id' => { operator: 'is', value: Ticket::State.by_category_ids(:open).map(&:to_s) }
    }, order: { by: 'created_at', direction: 'ASC' },
    view: { d: %w[title customer group created_at], s: %w[title customer group created_at],
      m: %w[number title customer group created_at], view_mode_default: 's' })
  overview.save! if overview.changed?
end
raise 'Contagens de dados protegidos alteradas' unless before == [User.count, Organization.count, Ticket.count]
puts JSON.generate(result: 'ok', attributes: names.size, workflows: data.fetch('core_workflows').size,
  group_resolved_by_name: true, customer_role_resolved_by_name: true,
  protected_record_counts_unchanged: true)
