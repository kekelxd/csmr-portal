#!/usr/bin/env python3
"""Verificação de revisão; não publica, altera arquivos nem reinicia serviços."""
from pathlib import Path
import argparse,hashlib,json,re,sys,subprocess
from urllib.parse import urlparse
parser=argparse.ArgumentParser();parser.add_argument('--release',action='store_true');args=parser.parse_args()
root=Path(__file__).resolve().parents[2];c=root/'compliance';errors=[];pending=[]
meta=json.loads((c/'evidencias/versao-e-integridade.json').read_text())
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
if sha(root/'LICENSE')!=meta['deployment_license_sha256']:errors.append('LICENSE da implantação foi alterado')
if sha(c/'portal/AGPL-3.0.txt')!=meta['application_license_sha256']:errors.append('Licença copiada da aplicação foi alterada')
for n,value in meta['active_customization_sha256'].items():
 if (root/n).exists() and sha(root/n)!=value:errors.append('Arquivo ativo diverge da revisão: '+n)
required=['NOTICE.md','CHANGELOG-MODIFICACOES.md','README.md','compliance/portal/index.html','compliance/integracao-proposta.patch']
for n in required:
 if not (root/n).exists():errors.append('Arquivo obrigatório ausente: '+n)
if '## Licença e contribuição' not in (root/'README.md').read_text():errors.append('Seção do README ausente')
phrase='Este portal utiliza o Zammad como plataforma. Não é um produto desenvolvido integralmente pela SMART e não possui afiliação ou endosso oficial da Zammad Foundation ou da Zammad GmbH.'
for n in ['NOTICE.md','compliance/portal/index.html']:
 if phrase not in (root/n).read_text():errors.append('Atribuição incompleta: '+n)
cfg=json.loads((c/'portal/source-config.json').read_text());url=cfg.get('repositoryUrl');ref=cfg.get('repositoryRef')
if not url:pending.append('URL do repositório: A CONFIRMAR')
if not ref:pending.append('Referência imutável do repositório: A CONFIRMAR')
if url and ref:
 p=urlparse(url)
 if p.scheme!='https' or not p.hostname or p.username or p.password:errors.append('URL deve ser HTTPS e não conter credenciais')
 if not re.fullmatch(r'[a-fA-F0-9]{40,64}',ref):errors.append('Referência deve ser o hash imutável do commit')
if cfg.get('correspondingSourceReviewed') is not True:pending.append('Conteúdo correspondente do repositório: A CONFIRMAR')
if cfg.get('reconstructionVerified') is not True:pending.append('Reconstrução e instruções da versão oferecida: A CONFIRMAR')
if cfg.get('repositoryVisibility') == 'private' and cfg.get('userAccessVerified') is not True:pending.append('Acesso efetivo dos usuários ao repositório privado: A CONFIRMAR')
if cfg.get('repositoryVisibility') == 'private' and cfg.get('observedRepositoryVisibility') != 'private':pending.append('Privacidade solicitada ainda não confirmada no GitHub')
# Patterns only report paths/rules, never secret values.
patterns={'chave privada':rb'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----','token fornecedor':rb'(?:ghp_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,}|GOCSPX-[A-Za-z0-9_-]{15,}|AIza[0-9A-Za-z_-]{30,})','URL com credencial':rb'https?://[^/\s:@]+:[^/@\s]+@'}
for f in c.rglob('*'):
 if not f.is_file() or f.suffix.lower() in ['.png','.ico','.zip']:continue
 if f==Path(__file__).resolve():continue
 b=f.read_bytes()
 for name,pat in patterns.items():
  if re.search(pat,b):errors.append(name+' em '+str(f.relative_to(root)))
for bad in ['.env','database.sql','pre-form.sql']:
 if any(f.name==bad for f in c.rglob('*')):errors.append('Artefato privado indevido em compliance: '+bad)
# The patch must remain unapplied and must match the observed active files.
res=subprocess.run(['git','-c','safe.directory='+str(root),'-C',str(root),'apply','--check',str(c/'integracao-proposta.patch')],capture_output=True,text=True)
if res.returncode:errors.append('Patch não passou em git apply --check; revisar integração')
print(json.dumps({'errors':errors,'pending':pending,'release_ready':not errors and not pending,'mode':'release' if args.release else 'review'},ensure_ascii=False,indent=2))
sys.exit(1 if errors or (args.release and pending) else 0)
