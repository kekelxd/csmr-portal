#!/usr/bin/env python3
# Copyright (C) 2026 SLG Comércio de Sistemas de Automação Predial Ltda
# SPDX-License-Identifier: AGPL-3.0-only
# Added 2026-10-15. WITHOUT ANY WARRANTY.
"""Verifica a preparação sem publicar ou alterar a aplicação."""
import argparse, hashlib, json, re, subprocess, sys
from pathlib import Path
parser = argparse.ArgumentParser()
parser.add_argument('--release', action='store_true')
args = parser.parse_args()
root = Path(__file__).resolve().parents[1]
errors, pending = [], []
def git(*args):
    return subprocess.check_output(['git', '-c', 'safe.directory='+str(root), '-C', str(root), *args])
def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()
meta = json.loads((root/'compliance/evidencias/versao-e-integridade.json').read_text())
if sha(root/'LICENSE') != meta['deployment_license_sha256']:
    errors.append('LICENSE original da implantação alterado')
if sha(root/'compliance/portal/AGPL-3.0.txt') != meta['application_license_sha256']:
    errors.append('LICENSE original da aplicação alterado')
for name in ['NOTICE.md', 'CHANGELOG-MODIFICACOES.md', 'README.md', 'RECONSTRUCAO.md', 'theme/MARCA.md', 'tools/importar.rb']:
    if not (root/name).is_file(): errors.append('Ausente: '+name)
for item in json.loads((root/'evidencias/cabecalhos-comentarios.json').read_text())['files']:
    path = root/Path(item['path']).relative_to('local')
    # This evidence describes the earlier comment-only revision, not later deployment changes.
    historical = git('show', 'f457f432e832fd1779410983abbd12d5121a4124:'+str(path.relative_to(root)))
    if hashlib.sha256(historical).hexdigest() != item['after_sha256']: errors.append('Evidência histórica divergente: '+str(path.relative_to(root)))
    if hashlib.sha256(historical[item['header_bytes']:]).hexdigest() != item['before_sha256']:
        errors.append('Alteração além do cabeçalho: '+str(path.relative_to(root)))
deployment = root/'evidencias/integracao-ativa.json'
if deployment.exists():
    for name, digest in json.loads(deployment.read_text()).get('runtime_sources_sha256', {}).items():
        if sha(root/name) != digest: errors.append('Fonte implantada divergente: '+name)
check = subprocess.run(['git', '-c', 'safe.directory='+str(root), '-C', str(root), 'apply', '--check', '--reverse', str(root/'compliance/integracao-proposta.patch')], capture_output=True)
if check.returncode: errors.append('Integração ativa diverge do patch documentado')
check = subprocess.run(['git', '-c', 'safe.directory='+str(root), '-C', str(root), 'apply', '--check', str(root/'propostas/grupo-por-nome.patch')], capture_output=True)
if check.returncode: errors.append('Patch do grupo não aplicável')
config_path = root/'.build/source-config.json'
config = json.loads((config_path if config_path.exists() else root/'compliance/portal/source-config.json').read_text())
ref = config.get('repositoryRef')
if not ref or not re.fullmatch('[a-f0-9]{40}', ref): pending.append('Referência imutável ainda não gerada')
elif git('rev-parse', 'HEAD').decode().strip() != ref: errors.append('Hash diferente do código atualmente revisado')
for flag, message in [('correspondingSourceReviewed', 'Revisão das fontes'), ('reconstructionVerified', 'Reconstrução integral'), ('userAccessVerified', 'Acesso externo ao repositório')]:
    if config.get(flag) is not True: pending.append(message+': A CONFIRMAR')
if config.get('observedRepositoryVisibility') != 'public': pending.append('Repositório público: A CONFIRMAR')
# High-confidence patterns only. Findings never include matching values.
patterns = {
    'private-key': rb'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----',
    'provider-token': rb'(?:ghp_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,}|GOCSPX-[A-Za-z0-9_-]{15,}|AIza[0-9A-Za-z_-]{30,})',
    'credential-url': rb'https?://[^/\s:@]+:[^/@\s]+@'
}
findings = []
for obj in git('rev-list', '--objects', '--all').decode().splitlines():
    oid, _, name = obj.partition(' ')
    if git('cat-file', '-t', oid).strip() != b'blob': continue
    content = git('cat-file', '-p', oid)
    for rule, pattern in patterns.items():
        if re.search(pattern, content): findings.append({'object': oid, 'path': name, 'rule': rule})
for name in git('ls-files').decode().splitlines():
    path = Path(name)
    if path.name.startswith('.env') or path.suffix.lower() in ['.sql', '.dump', '.log'] or any(p in ['backups', 'uploads', 'storage'] for p in path.parts):
        errors.append('Artefato proibido rastreado: '+name)
if findings: errors.append('Possíveis segredos no histórico; não publicar')
result = {'mode': 'release' if args.release else 'review', 'errors': errors, 'pending': pending,
          'release_ready': not errors and not pending, 'secret_findings': findings,
          'scan_scope': 'Todos os blobs alcançáveis por referências Git locais; padrões de alta confiança. Não prova ausência de segredos arbitrários.'}
print(json.dumps(result, ensure_ascii=False, indent=2))
sys.exit(1 if errors or (args.release and pending) else 0)
