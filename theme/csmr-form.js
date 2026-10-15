/*
This file is part of the SMART/CSMR support portal, based on Zammad 7.2.2.
Copyright (C) 2026 SLG Comércio de Sistemas de Automação Predial Ltda
Upstream: https://github.com/zammad/zammad/tree/7.2.2

This program is free software: you can redistribute it and/or modify it
under the terms of the GNU Affero General Public License, version 3,
as published by the Free Software Foundation. See LICENSE.
This program is distributed WITHOUT ANY WARRANTY; without even the implied
warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.

Modification notice: license header added on 2026-10-15.
Earlier modifications dated 2026-10-14 and 2026-10-15 were declared by
 the maintainer; historical Git dates are unconfirmed.
See CHANGELOG-MODIFICACOES.md.
*/
(() => {
  'use strict';
  const names = { temperatura: 'Ajuste de Temperatura', outros: 'Outros' };
  const placeholder = 'Dados da solicitação nos campos CSMR.';
  const states = new WeakMap();
  function decorate(form) {
    const category = form.querySelector('[name="csmr_categoria"]')?.value;
    const fields = {
      csmr_categoria: ['Categoria da solicitação', ''],
      csmr_tipo_temperatura: ['Tipo de ajuste', 'Selecione se deseja aquecer ou resfriar o ambiente.'],
      csmr_setpoint: ['Temperatura desejada (°C)', 'Use vírgula ou ponto. Exemplo: 22,5 °C.'],
      csmr_local: [category === 'outros' ? 'Local' : 'Local/VAV', category === 'outros' ? 'Informe o pavimento, a sala ou o ambiente, se necessário.' : 'Informe o pavimento, a sala ou a identificação da VAV. Exemplo: 12º pavimento — VAV 03.'],
      title: ['Assunto', ''],
      body: [category === 'outros' ? 'Descrição da solicitação' : 'Informações adicionais (opcional)', '']
    };
    for (const [name, [labelText, hint]] of Object.entries(fields)) {
      const group = form.querySelector(`[data-attribute-name="${name}"]`);
      if (!group) continue;
      const label = group.querySelector('label');
      if (label) {
        const text = Array.from(label.childNodes).find(node => node.nodeType === Node.TEXT_NODE);
        if (text && text.textContent.trim() !== labelText) text.textContent = labelText + ' ';
      }
      if (hint) {
        let help = group.querySelector('.csmr-field-help');
        if (!help) {
          help = document.createElement('p');
          help.className = 'csmr-field-help';
          help.id = 'csmr-help-' + (group.querySelector('input, select, textarea')?.id || name);
          group.append(help);
        }
        if (help.textContent !== hint) help.textContent = hint;
        const input = group.querySelector('input, select, textarea');
        if (input && !input.getAttribute('aria-describedby')?.split(' ').includes(help.id)) {
          input.setAttribute('aria-describedby', [input.getAttribute('aria-describedby'), help.id].filter(Boolean).join(' '));
        }
      }
    }
    const local = form.querySelector('[name="csmr_local"]');
    if (local) local.placeholder = category === 'outros' ? 'Ex.: 12º pavimento — Sala de reunião' : 'Ex.: 12º pavimento — VAV 03';
    const numeric = form.querySelector('[name="csmr_setpoint"]');
    if (numeric) { numeric.placeholder = 'Ex.: 22,5'; numeric.inputMode = 'decimal'; }
  }
  function update(form) {
    const user = window.App?.User?.current?.();
    if (!user) return;
    form.classList.add('csmr-ticket-form');
    decorate(form);
    if (user.permission('ticket.agent')) return;
    form.classList.add('csmr-customer-form');
    const category = form.querySelector('[name="csmr_categoria"]')?.value;
    form.classList.toggle('csmr-category-empty', !category);
    if (!category || !names[category]) return;
    const structured = category !== 'outros';
    form.classList.toggle('csmr-structured', structured);
    const title = form.querySelector('[name="title"]');
    const body = form.querySelector('[contenteditable][data-name="body"]');
    const titleGroup = title?.closest('[data-attribute-name]');
    if (titleGroup) titleGroup.hidden = structured;
    const previous = states.get(form) || {};
    if (structured) {
      const direction = form.querySelector('[name="csmr_tipo_temperatura"]')?.value;
      const generated = names[category] + (category === 'temperatura' && direction ? ` — ${direction === 'aquecer' ? 'Aquecer' : 'Resfriar'}` : '');
      if (title && title.value !== generated) title.value = generated;
      if (body?.textContent.trim() === placeholder) body.textContent = '';
      previous.generated = generated;
    } else {
      if (title && previous.generated === title.value) title.value = '';
      if (body?.textContent.trim() === placeholder) body.textContent = '';
    }
    states.set(form, previous);
    const numeric = form.querySelector('[name="csmr_setpoint"]');
    if (numeric) {
      numeric.inputMode = 'decimal';
      numeric.setCustomValidity(category === 'temperatura' && numeric.value.trim() && !/^[+-]?\d+(?:[.,]\d+)?$/.test(numeric.value.trim()) ? 'Informe uma temperatura numérica, como 22,5.' : '');
    }

  }
  let scheduled = false;
  function scan() {
    scheduled = false;
    document.querySelectorAll('form.ticket-create').forEach(update);
  }
  function schedule() { if (!scheduled) { scheduled = true; requestAnimationFrame(scan); } }
  document.addEventListener('change', event => { const form = event.target.closest('form.ticket-create'); if (form) update(form); });
  document.addEventListener('input', event => { const form = event.target.closest('form.ticket-create'); if (form) update(form); });
  function beforeSubmit(event) {
    const form = event.target.closest('form.ticket-create');
    if (!form || (event.type === 'click' && !event.target.closest('button[type="submit"], .js-submit'))) return;
    update(form);
    const numeric = form.querySelector('[name="csmr_setpoint"]');
    if (form.classList.contains('csmr-customer-form') && numeric && !numeric.checkValidity()) {
      event.preventDefault(); event.stopImmediatePropagation(); numeric.reportValidity();
    }
  }
  document.addEventListener('submit', beforeSubmit, true);
  document.addEventListener('click', beforeSubmit, true);
  new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
  window.addEventListener('hashchange', schedule);
  scan();
})();
