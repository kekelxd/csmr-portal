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
/* CSMR operations summary: read-only native Zammad overviews and permissions. */
(() => {
  'use strict';
  const view = 'csmr_open';
  let rows = [], filter = 'waiting', inFlight = false, controller, mounted, timer, lastUpdated = null;
  const labels = {open:'Abertos',waiting:'Aguardando resposta',unassigned:'Sem responsável',overdue:'SLA vencido'};
  function agent() { try { return Boolean(window.App?.User?.current()?.permission('ticket.agent')); } catch (_) { return false; } }
  function time(value) { const n = Date.parse(value || ''); return Number.isFinite(n) ? n : 0; }
  function waiting(t) { return time(t.last_contact_customer_at) > time(t.last_contact_agent_at); }
  function matches(t, key) {
    if (key === 'open') return [1,2].includes(Number(t.state_id));
    if (key === 'waiting') return waiting(t);
    if (key === 'unassigned') return !t.owner_id || Number(t.owner_id) === 1;
    return Boolean(time(t.escalation_at) && time(t.escalation_at) <= Date.now());
  }
  function el(tag, className, text) { const n=document.createElement(tag); if(className)n.className=className; if(text!==undefined)n.textContent=text; return n; }
  function host() {
    if (!agent() || !location.hash.startsWith('#dashboard')) return null;
    return document.querySelector('#content_permanent_Dashboard .dashboard') || document.querySelector('.dashboard.main');
  }
  function status(text, bad=false) {
    const n = mounted?.querySelector('.csmr-ops-status'); if(!n)return;
    n.textContent=text; n.classList.toggle('csmr-ops-error',bad);
  }
  function render() {
    if (!mounted?.isConnected) return;
    mounted.querySelectorAll('[data-csmr-filter]').forEach(button=>{
      const key=button.dataset.csmrFilter;
      button.querySelector('.csmr-ops-count').textContent=lastUpdated ? String(rows.filter(t=>matches(t,key)).length) : '—';
      button.setAttribute('aria-pressed',String(key===filter));
    });
    const title=mounted.querySelector('.csmr-ops-list-title');
    title.textContent=labels[filter];
    const list=mounted.querySelector('.csmr-ops-list'); list.replaceChildren();
    if(!lastUpdated){list.append(el('p','csmr-ops-empty','Buscando chamados da CSMR…'));return;}
    const selected=rows.filter(t=>matches(t,filter)).sort((a,b)=>{
      const ta=time(a.last_contact_customer_at)||time(a.created_at),tb=time(b.last_contact_customer_at)||time(b.created_at);return ta-tb;
    });
    if(!selected.length){list.append(el('p','csmr-ops-empty','Nenhum chamado nesta situação.'));return;}
    for(const t of selected.slice(0,12)){
      const link=el('a','csmr-ops-row'); link.href='#ticket/zoom/'+encodeURIComponent(t.id);
      const details=el('span','csmr-ops-row-text');
      details.append(el('strong','','#'+t.number+' · '+t.title));
      const pending=time(t.last_contact_customer_at);
      const age=pending ? Math.max(0,Math.floor((Date.now()-pending)/60000)) : null;
      const info=waiting(t) && age!==null ? 'Contato do cliente aguardando há '+age+' min' : (Number(t.owner_id)>1 ? 'Com responsável' : 'Sem responsável');
      details.append(el('small','',info)); link.append(details);
      link.append(el('span',matches(t,'overdue')?'csmr-ops-pill overdue':'csmr-ops-pill',matches(t,'overdue')?'Prazo vencido':'Abrir chamado'));
      list.append(link);
    }
    if(selected.length>12)list.append(el('p','csmr-ops-empty','Exibindo 12 de '+selected.length+' chamados. Use Visões gerais para a lista completa.'));
  }
  async function refresh() {
    if(!host() || inFlight || document.hidden)return;
    inFlight=true; controller=new AbortController(); const timeout=setTimeout(()=>controller.abort(),10000);
    const button=mounted?.querySelector('.csmr-ops-refresh'); if(button)button.disabled=true;
    try {
      const r=await fetch('/api/v1/ticket_overviews?view='+encodeURIComponent(view),{credentials:'same-origin',signal:controller.signal,headers:{Accept:'application/json'}});
      if(!r.ok)throw new Error('fetch');
      const data=await r.json();const index=data.index;
      if(!index?.overview) {mounted?.remove();mounted=null;return;}
      const meta=index.tickets||[], assets=data.assets?.Ticket||{};
      if(index.count>meta.length)throw new Error('partial');
      rows=meta.map(item=>assets[item.id]).filter(Boolean);
      if(rows.length!==meta.length)throw new Error('partial');
      lastUpdated=new Date();render();
      status('Atualizado às '+lastUpdated.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})+' · atualização automática');
    } catch(error){
      status(error.message==='partial'?'Lista parcial: use Visões gerais para consultar os totais completos.':'Não foi possível atualizar. Clique em Atualizar resumo para tentar novamente.',true);
    } finally {clearTimeout(timeout);inFlight=false;if(button)button.disabled=false;}
  }
  function mount() {
    const parent=host(); if(!parent)return;
    if(mounted?.isConnected)return;
    mounted=el('section','csmr-ops');mounted.setAttribute('aria-label','Resumo operacional CSMR');
    const heading=el('div','csmr-ops-heading'),title=el('div');
    title.append(el('h2','','Resumo de atendimento'));
    heading.append(title);
    const refreshButton=el('button','csmr-ops-refresh','Atualizar resumo');refreshButton.type='button';refreshButton.addEventListener('click',refresh);heading.append(refreshButton);mounted.append(heading);
    const cards=el('div','csmr-ops-cards');
    Object.keys(labels).forEach(key=>{
      const button=el('button','csmr-ops-card '+key);button.type='button';button.dataset.csmrFilter=key;
      button.append(el('span','csmr-ops-card-label',labels[key]),el('strong','csmr-ops-count','—'));
      button.addEventListener('click',()=>{filter=key;render();});cards.append(button);
    });
    mounted.append(cards);
    const note=el('p','csmr-ops-note','Aguardando resposta: contato público do cliente sem retorno de atendimento da equipe. Anotações não contam como resposta.');mounted.append(note);
    mounted.append(el('h3','csmr-ops-list-title',labels[filter]),el('div','csmr-ops-list'));
    const s=el('p','csmr-ops-status','Buscando dados…');s.setAttribute('role','status');s.setAttribute('aria-live','polite');mounted.append(s);
    parent.prepend(mounted);render();refresh();
  }
  function clear() {controller?.abort();rows=[];lastUpdated=null;mounted?.remove();mounted=null;}
  function init() {
    if(!window.App?.Event || !App.OverviewIndexCollection) {setTimeout(init,400);return;}
    App.Event.bind('ticket_overview_list',data=>{if(data?.overview?.view===view && host())schedule();});
    App.Event.bind('auth:logout',clear);
    window.addEventListener('hashchange',()=>{if(!host())controller?.abort();mount();});
    document.addEventListener('visibilitychange',()=>{if(!document.hidden){mount();refresh();}});
    const observer=new MutationObserver(()=>{if(host() && !mounted?.isConnected)mount();});
    observer.observe(document.getElementById('content')||document.body,{childList:true,subtree:true});
    setInterval(()=>{mount();refresh();},30000);
    mount();
  }
  function schedule(){clearTimeout(timer);timer=setTimeout(refresh,500);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
