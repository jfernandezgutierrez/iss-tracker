from PIL import Image, ImageDraw, ImageFont
import math, os
out='public/games/arcade';os.makedirs(out,exist_ok=True)
for name,accent in [('meteor-ship','#f7bc70'),('docking-ship','#78dfe5')]:
 sheet=Image.new('RGBA',(256,64))
 for frame in range(4):
  im=Image.new('RGBA',(64,64));d=ImageDraw.Draw(im)
  d.polygon([(32,3),(44,25),(57,44),(54,51),(39,45),(32,51),(25,45),(10,51),(7,44),(20,25)],fill='#9aafc0',outline='#283e55',width=2)
  d.polygon([(32,5),(39,29),(37,44),(27,44),(25,29)],fill='#eff4ed')
  d.rounded_rectangle((27,18,37,32),radius=4,fill='#14354c',outline=accent,width=2)
  d.line((15,41,23,34),fill=accent,width=3);d.line((41,34,49,41),fill=accent,width=3)
  for x in [21,39]:
   d.rectangle((x,44,x+4,50),fill='#233a51')
   d.polygon([(x,51),(x+4,51),(x+2,58+frame)],fill='#f87949');d.line((x+2,51,x+2,55+frame),fill='#ffe5a1',width=2)
  sheet.alpha_composite(im,(frame*64,0))
 sheet.save(f'{out}/{name}.png')
rocks=Image.new('RGBA',(256,64))
for i in range(4):
 im=Image.new('RGBA',(64,64));d=ImageDraw.Draw(im)
 points=[(32+int(math.cos(n*math.pi/5)*(24+(n+i)%5)),32+int(math.sin(n*math.pi/5)*(24+(n+i)%5))) for n in range(10)]
 d.polygon(points,fill=['#9d7563','#967a72','#7a777e','#a58b73'][i],outline='#493f4b',width=3)
 d.ellipse((14,15,30,30),fill='#66535a');d.arc((14,15,30,30),150,330,fill='#c3a18a',width=2);d.ellipse((34,32,45,42),fill='#66535a');d.line((18,44,31,48),fill='#c3a18a',width=2)
 rocks.alpha_composite(im,(i*64,0))
rocks.save(f'{out}/meteors.png')
station=Image.new('RGBA',(256,256));d=ImageDraw.Draw(station)
for x in [8,190]:
 for y in [28,145]:
  d.rectangle((x,y,x+58,y+80),fill='#26455b',outline='#75abb9',width=3)
  for row in range(4):d.line((x+4,y+row*20,x+54,y+row*20),fill='#41788c',width=2)
  for col in range(3):d.line((x+col*20,y+4,x+col*20,y+76),fill='#41788c',width=2)
d.rectangle((58,112,198,143),fill='#b4c6c9',outline='#536e7e',width=3)
d.rounded_rectangle((90,74,166,182),radius=14,fill='#d7e0d9',outline='#678495',width=4)
d.ellipse((99,99,157,157),fill='#183b4f',outline='#80e3dd',width=5)
d.ellipse((112,112,144,144),fill='#071825',outline='#468595',width=2)
station.save(f'{out}/station.png')
for name,title,sub,ship,color in [('meteor','METEOR DODGE','ESQUIVA. RESISTE. EXPLORA.','meteor-ship','#f7bc70'),('docking','ISS DOCKING','PRECISIÓN EN ÓRBITA.','docking-ship','#78dfe5')]:
 im=Image.new('RGB',(960,540),'#0a1a2b');d=ImageDraw.Draw(im)
 for i in range(100):
  x=(i*137)%960;y=(i*i*31)%540;d.ellipse((x,y,x+1,y+1),fill='#7a9ba9')
 d.ellipse((490,40,930,480),fill='#153146',outline='#294a5a',width=3)
 if name=='meteor':
  for i,(x,y) in enumerate([(510,90),(790,310),(810,90)]):im.paste(rocks.crop((i*64,0,(i+1)*64,64)).resize((100,100),Image.Resampling.NEAREST),(x,y),rocks.crop((i*64,0,(i+1)*64,64)).resize((100,100),Image.Resampling.NEAREST))
  art=Image.open(f'{out}/{ship}.png').crop((0,0,64,64)).resize((240,240),Image.Resampling.NEAREST)
  im.paste(art,(590,150),art)
 else:
  art=station.resize((360,360),Image.Resampling.NEAREST);im.paste(art,(530,65),art)
 d.text((60,100),title,fill='#eff3eb',font=ImageFont.load_default(size=45));d.text((63,177),sub,fill=color,font=ImageFont.load_default(size=20))
 d.rounded_rectangle((62,288,350,350),radius=16,fill=color);d.text((90,308),'INICIAR MISIÓN',fill='#0a2530',font=ImageFont.load_default(size=23))
 im.save(f'{out}/{name}-cover.png')
print('Generated original ship atlases, meteors, station and catalogue covers.')
