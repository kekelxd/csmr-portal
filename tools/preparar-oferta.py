#!/usr/bin/env python3
# Copyright (C) 2026 SLG Comércio de Sistemas de Automação Predial Ltda
# SPDX-License-Identifier: AGPL-3.0-only
# Added 2026-10-15. WITHOUT ANY WARRANTY.
"""Gera a referência imutável fora do Git; não publica nem implanta."""
import json, subprocess
from pathlib import Path
root = Path(__file__).resolve().parents[1]
ref = subprocess.check_output(['git', '-c', 'safe.directory='+str(root), '-C', str(root), 'rev-parse', 'v1.0-7.2.2^{commit}'], text=True).strip()
config = json.loads((root/'compliance/portal/source-config.json').read_text())
config.update(repositoryUrl='https://github.com/kekelxd/csmr-portal', repositoryTag='v1.0-7.2.2', repositoryRef=ref)
target = root/'.build/source-config.json'
target.parent.mkdir(exist_ok=True)
target.write_text(json.dumps(config, ensure_ascii=False, indent=2)+'\n')
print(str(target))
