"""Download licensed benchmark data; never execute remote code."""
import urllib.request,json,csv,io,hashlib
from pathlib import Path
root=Path('benchmarks/data');root.mkdir(exist_ok=True)
base='https://huggingface.co'
info=json.load(urllib.request.urlopen(base+'/api/datasets/nguha/legalbench',timeout=25))
revision=info['sha']
folder='data/contract_nli_confidentiality_of_agreement'
listing=json.load(urllib.request.urlopen(base+'/api/datasets/nguha/legalbench/tree/'+revision+'/'+folder,timeout=25))
print('Files:',[x['path'] for x in listing])
path=next(x['path'] for x in listing if x['path'].endswith('test.tsv'))
url=base+'/datasets/nguha/legalbench/resolve/'+revision+'/'+path
raw=urllib.request.urlopen(url,timeout=30).read()
(root/'legalbench-contract-test.tsv').write_bytes(raw)
rows=list(csv.DictReader(io.StringIO(raw.decode()),delimiter='\t'))
print('Rows',len(rows),'fields',list(rows[0]))
# Deterministic, label-stratified sample: sort by the SHA-256 of source text.
selected=[]
for label in sorted({r['answer'] for r in rows}):
 candidates=[(index,r) for index,r in enumerate(rows) if r['answer']==label]
 candidates.sort(key=lambda item:hashlib.sha256(item[1]['text'].encode()).hexdigest())
 selected.extend({'source_row':i,'text':r['text'],'answer':r['answer']} for i,r in candidates[:6])
selected.sort(key=lambda r:r['source_row'])
(root/'legalbench-sample.json').write_text(json.dumps(selected,indent=2))
manifest={'task':'contract_nli_confidentiality_of_agreement','dataset':'nguha/legalbench','revision':revision,'url':url,'sha256':hashlib.sha256(raw).hexdigest(),'rows':len(rows),'selected_rows':[r['source_row'] for r in selected],'sample_size':len(selected),'selection':'First 6 per label sorted by SHA-256(source text); independent of model responses.','license':'CC BY 4.0','task_page':'https://hazyresearch.stanford.edu/legalbench/tasks/contract_nli_confidentiality_of_agreement.html','attribution':['Guha et al., LegalBench (2023), arXiv:2308.11462','Koreeda and Manning, ContractNLI (2021), arXiv:2110.01799'],'scope':'Document entailment only; not a measure of Indian legal advice correctness.'}
(root/'public-manifest.json').write_text(json.dumps(manifest,indent=2))
print(json.dumps(manifest,indent=2))
