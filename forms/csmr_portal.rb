# This file is part of the SMART/CSMR support portal, based on Zammad 7.2.2.
# Copyright (C) 2026 SLG Comércio de Sistemas de Automação Predial Ltda
# Upstream: https://github.com/zammad/zammad/tree/7.2.2
# 
# This program is free software: you can redistribute it and/or modify it
# under the terms of the GNU Affero General Public License, version 3,
# as published by the Free Software Foundation. See LICENSE.
# This program is distributed WITHOUT ANY WARRANTY; without even the implied
# warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
# 
# Modification notice: license header added on 2026-10-15.
# Earlier modifications dated 2026-10-14 and 2026-10-15 were declared by
#  the maintainer; historical Git dates are unconfirmed.
# See CHANGELOG-MODIFICACOES.md.
# CSMR pilot extension. Native Object Manager, authorization, attachments and ticket persistence remain canonical.
require 'bigdecimal'
module CsmrPortalForm
  CATEGORIES = {'temperatura'=>'Ajuste de Temperatura','iluminacao'=>'Ajuste de Iluminação','programacao'=>'Programação Horária','outros'=>'Outros'}.freeze
  AVAILABLE_CATEGORIES = %w[temperatura outros].freeze
  EXCLUSIVE = %w[csmr_tipo_temperatura csmr_setpoint csmr_descricao_iluminacao csmr_descricao_programacao].freeze
  VISIBLE = {'temperatura'=>%w[csmr_tipo_temperatura csmr_setpoint], 'iluminacao'=>%w[csmr_descricao_iluminacao], 'programacao'=>%w[csmr_descricao_programacao], 'outros'=>[]}.freeze
  module TicketRules
    extend ActiveSupport::Concern
    included do
      before_validation :csmr_prepare_form
      validate :csmr_validate_form
    end
    def csmr_prepare_form
      return if csmr_categoria.blank? || !CATEGORIES.key?(csmr_categoria)
      (EXCLUSIVE - VISIBLE.fetch(csmr_categoria)).each{|name| self[name]=nil}
      self.csmr_observacoes=nil if csmr_categoria=='outros'
      if csmr_categoria=='temperatura' && csmr_setpoint.present?
        value=csmr_setpoint.strip.tr(',','.')
        self.csmr_setpoint=BigDecimal(value).to_s('F') if value.match?(/\A[+-]?\d+(?:\.\d+)?\z/)
      end
      return unless new_record?
      self.group_id=2
      self.state_id=1
      actor=UserInfo.current_user
      self.organization_id=actor.organization_id if actor && !actor.permissions?('ticket.agent') && actor.id==customer_id
      return if csmr_categoria=='outros'
      self.title=CATEGORIES[csmr_categoria]
      self.title += " — #{csmr_tipo_temperatura=='aquecer' ? 'Aquecer' : 'Resfriar'}" if csmr_categoria=='temperatura' && %w[aquecer resfriar].include?(csmr_tipo_temperatura)
    end
    def csmr_validate_form
      return if csmr_categoria.blank?
      if new_record? && !AVAILABLE_CATEGORIES.include?(csmr_categoria)
        errors.add(:csmr_categoria,'Selecione Ajuste de Temperatura ou Outros.')
        return
      end
      unless CATEGORIES.key?(csmr_categoria)
        errors.add(:csmr_categoria,'Selecione uma categoria válida.')
        return
      end
      required=VISIBLE.fetch(csmr_categoria).dup
      required << 'csmr_local' unless csmr_categoria=='outros'
      required.each{|name| errors.add(name,'Preencha este campo.') if self[name].blank?}
      if csmr_categoria=='temperatura'
        errors.add(:csmr_tipo_temperatura,'Selecione Aquecer ou Resfriar.') unless %w[aquecer resfriar].include?(csmr_tipo_temperatura)
        errors.add(:csmr_setpoint,'Informe uma temperatura numérica, como 22,5.') unless csmr_setpoint.to_s.match?(/\A[+-]?\d+(?:[.,]\d+)?\z/)
      end
    end
  end
  module ControllerRules
    extend ActiveSupport::Concern
    included do
      before_action :csmr_prepare_request, only: :create
    end
    def csmr_prepare_request
      return unless current_user
      category=params[:csmr_categoria].to_s
      customer=!current_user.permissions?('ticket.agent')
      if (customer || category.present?) && !AVAILABLE_CATEGORIES.include?(category)
        render json:{error:'Selecione Ajuste de Temperatura ou Outros.'},status: :unprocessable_content
        return
      end
      return unless CATEGORIES.key?(category)
      params[:group_id]=2
      params[:state_id]=1
      params[:organization_id]=current_user.organization_id if customer
      return if category=='outros'
      params[:title]=CATEGORIES.fetch(category)
      if category=='temperatura' && %w[aquecer resfriar].include?(params[:csmr_tipo_temperatura])
        params[:title] += " — #{params[:csmr_tipo_temperatura]=='aquecer' ? 'Aquecer' : 'Resfriar'}"
      end
      lines=[CATEGORIES.fetch(category)]
      fields=VISIBLE.fetch(category)+%w[csmr_local csmr_observacoes]
      labels={'csmr_tipo_temperatura'=>'Tipo de ajuste','csmr_setpoint'=>'Temperatura desejada (°C)','csmr_local'=>(category=='temperatura' ? 'Local/VAV' : 'Local'),'csmr_observacoes'=>'Observações adicionais','csmr_descricao_iluminacao'=>'Descrição do ajuste','csmr_descricao_programacao'=>'Descrição da programação'}
      fields.each{|name| lines << "#{labels.fetch(name)}: #{params[name]}" if params[name].present?}
      params[:article] ||= ActionController::Parameters.new
      previous=params[:article][:body].to_s.strip
      lines << "Informações adicionais: #{previous}" if previous.present? && previous!='Dados da solicitação nos campos CSMR.'
      params[:article][:body]=lines.join("\n")
      params[:article][:content_type]='text/plain'
    end
  end
end
Rails.application.config.to_prepare do
  Ticket.include(CsmrPortalForm::TicketRules) unless Ticket < CsmrPortalForm::TicketRules
  TicketsController.include(CsmrPortalForm::ControllerRules) unless TicketsController < CsmrPortalForm::ControllerRules
end
