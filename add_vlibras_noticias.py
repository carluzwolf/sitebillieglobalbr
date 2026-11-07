# Rode na raiz do repo: python add_vlibras_noticias.py
import glob
tag='<script src="/vlibras.js" defer></script>'
n=0
for f in glob.glob('**/*.html',recursive=True):
    t=open(f,encoding='utf-8').read()
    if 'vlibras.js' in t: continue
    i=t.rfind('</body>')
    if i<0: continue
    open(f,'w',encoding='utf-8').write(t[:i]+tag+t[i:]); n+=1
print(n,'arquivos atualizados')
