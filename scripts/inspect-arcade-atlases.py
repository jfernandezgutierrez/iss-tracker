from pathlib import Path
from PIL import Image
import json
packs={
 'meteor':('public/games/arcade/v2/meteor-atlas.png',['ship','rock','crystal','shield']),
 'docking':('public/games/arcade/v2/docking-atlas.png',['station','ship','port','flame'])
}
result={}
for game,(path,names) in packs.items():
 image=Image.open(path);w,h=image.size;cw,ch=w//2,h//2;frames={}
 for i,name in enumerate(names):
  x=(i%2)*cw;y=(i//2)*ch
  alpha=image.getchannel('A').crop((x,y,x+cw,y+ch))
  bounds=alpha.point(lambda value:255 if value>=24 else 0).getbbox()
  if not bounds:raise RuntimeError('Empty frame '+name)
  l,t,r,b=bounds
  frames[name]={'x':x+l,'y':y+t,'width':r-l,'height':b-t}
 result[game]={'image':Path(path).name,'width':w,'height':h,'frames':frames}
Path('public/games/arcade/v2/frames.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(result))
