from pathlib import Path
import zipfile,hashlib,json
root=Path(__file__).resolve().parent.parent
out=root/'releases';out.mkdir(exist_ok=True)
roots=['api','lib','public','scripts','tests','docs']
files=[root/n for n in ['package.json','package-lock.json','README.md','server.mjs','tsconfig.json','vercel.json','.env.example','.gitignore']]
for folder in roots:
    files += [p for p in (root/folder).rglob('*') if p.is_file() and not p.is_symlink() and '__pycache__' not in p.parts]
files=sorted(set(files))
for p in files:
    assert root in p.resolve().parents
    assert not (p.name.startswith('.env') and p.name!='.env.example')
releases=[]
for name in ['rwa-lens-full-project.zip','rwa-lens-vercel.zip']:
    selected=files
    if 'vercel' in name:
        selected=[p for p in files if p.relative_to(root).as_posix() not in ['scripts/create-worker-host.mjs','scripts/adapt-sites.mjs','scripts/package-release.py','scripts/verify-hosted.mjs']]
    with zipfile.ZipFile(out/name,'w',zipfile.ZIP_DEFLATED) as z:
        for p in selected:z.write(p,p.relative_to(root).as_posix())
    with zipfile.ZipFile(out/name) as z:
        assert z.testzip() is None
        names=z.namelist()
        for required in ['package.json','package-lock.json','public/index.html','public/future.js','api/portfolio.mjs','api/activity.mjs','api/resolve.mjs','docs/DEPLOYMENT-GUIDE.md','server.mjs','vercel.json']:assert required in names,required
        assert not any(n.startswith(('node_modules/','.git/','temporary-host/','temporary-worker-host/')) for n in names)
    releases.append({'file':name,'files':len(selected),'bytes':(out/name).stat().st_size,'sha256':hashlib.sha256((out/name).read_bytes()).hexdigest()})
(out/'release-manifest.json').write_text(json.dumps(releases,indent=2)+'\n')
print(json.dumps(releases,indent=2))
