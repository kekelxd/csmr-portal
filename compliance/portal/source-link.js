/* SPDX-License-Identifier: AGPL-3.0-only */
(() => {
  'use strict';
  const status=document.getElementById('source-status'), action=document.getElementById('source-action');
  const link=document.getElementById('source-link'), reference=document.getElementById('source-ref');
  const controller=new AbortController(), timer=setTimeout(()=>controller.abort(),5000);
  fetch('./source-config.json',{credentials:'omit',signal:controller.signal})
    .then(response=>{if(!response.ok) throw new Error('Configuração indisponível');return response.json();})
    .then(config=>{
      if(!config.repositoryUrl || !config.repositoryRef) return;
      const url=new URL(config.repositoryUrl);
      if(url.protocol!=='https:' || url.username || url.password || !/^[a-f0-9]{40,64}$/i.test(config.repositoryRef)) return;
      if(config.correspondingSourceReviewed !== true) {
        status.textContent='A referência do código-fonte aguarda revisão.';
        return;
      }
      link.href=url.href.replace(/\/$/,'')+'/tree/'+config.repositoryRef; reference.textContent='Referência desta versão: '+config.repositoryRef;
      action.hidden=false; status.hidden=true;
    })
    .catch(()=>{status.textContent='Não foi possível consultar a versão do código-fonte. Recarregue esta página para tentar novamente.';})
    .finally(()=>clearTimeout(timer));
})();
