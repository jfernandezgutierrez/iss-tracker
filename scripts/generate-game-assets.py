from PIL import Image, ImageDraw
import json, math, os
OUT = 'public/games/runner'
os.makedirs(OUT, exist_ok=True)
animations = {'idle':4, 'run':8, 'jump':2, 'fall':2, 'hurt':3, 'die':6, 'celebrate':4}
sheet = Image.new('RGBA',(32*29,32))
frames = {}; index = 0
for name, count in animations.items():
    start = index
    for frame in range(count):
        tile = Image.new('RGBA',(32,32)); d = ImageDraw.Draw(tile)
        bob = -1 if name == 'idle' and frame > 1 else 0
        if name == 'celebrate': bob = -frame%2
        suit = '#ff8d7a' if name == 'hurt' and frame%2==0 else '#d7eaff'
        d.rectangle((7,13+bob,11,24+bob),fill='#587ba6')
        d.rectangle((11,13+bob,23,25+bob),fill=suit)
        d.rectangle((13,16+bob,21,20+bob),fill='#4da3ff')
        d.rectangle((16,17+bob,18,18+bob),fill='#6ef2d8')
        d.rectangle((11,3+bob,24,14+bob),fill=suit)
        d.rectangle((14,5+bob,25,11+bob),fill='#101e39')
        d.rectangle((16,6+bob,23,7+bob),fill='#6ef2d8')
        stride = int(math.sin(frame/count*math.tau)*3) if name=='run' else 0
        for x, shift in [(12,stride),(20,-stride)]:
            y = 24 + bob
            d.rectangle((x,y,x+3,y+5-abs(shift)),fill=suit)
            d.rectangle((x+shift-1,y+4-abs(shift),x+shift+4,y+6-abs(shift)),fill='#587ba6')
        arm_y = 10 if name in ('jump','celebrate') else 16 + stride
        d.rectangle((24,arm_y+bob,27,arm_y+7+bob),fill=suit)
        if name=='die': tile = tile.rotate(-frame*15, resample=Image.Resampling.NEAREST)
        sheet.alpha_composite(tile,(index*32,0)); index += 1
    frames[name] = {'start':start,'end':index-1,'frameRate':10 if name=='run' else 6,'repeat':0 if name in ('die','hurt') else -1}
sheet.save(f'{OUT}/astronaut.png')
with open(f'{OUT}/astronaut.animations.json','w') as f: json.dump({'frameWidth':32,'frameHeight':32,'animations':frames},f,indent=2); f.write('\n')
# Four frames for each original obstacle type.
hazards = Image.new('RGBA',(32*4,32*6))
for kind in range(6):
    for frame in range(4):
        tile = Image.new('RGBA',(32,32)); d=ImageDraw.Draw(tile)
        if kind in (0,1):
            d.polygon([(5,10),(14,3),(25,7),(29,20),(20,29),(7,25),(2,17)],fill='#997867' if kind==0 else '#b68a71')
            d.rectangle((10,10,15,15),fill='#594b51'); d.rectangle((19,19,23,23),fill='#594b51')
        elif kind in (2,3):
            d.rectangle((7,11,25,25),fill='#587ba6'); d.rectangle((11,14,22,18),fill='#ff6b6b')
            d.rectangle((1,8+frame%2,6,12+frame%2),fill='#6ef2d8'); d.rectangle((26,8+frame%2,31,12+frame%2),fill='#6ef2d8')
        elif kind==4:
            d.rectangle((1,10,9,24),fill='#4da3ff');d.rectangle((23,10,31,24),fill='#4da3ff');d.rectangle((11,14,21,22),fill='#bbcde8')
        else:
            d.rectangle((2,24,30,29),fill='#587ba6');d.line([(5,24),(10+frame,5),(16,24),(23-frame,4),(28,24)],fill='#ffc857',width=3)
        hazards.alpha_composite(tile,(frame*32,kind*32))
hazards.save(f'{OUT}/hazards.png')
objects = Image.new('RGBA',(16*8,16))
for i,color in enumerate(['#ffc857','#6ef2d8','#4da3ff','#ff8b62','#ffc857','#6ef2d8','#eaf2ff','#ff6b6b']):
    d=ImageDraw.Draw(objects); x=i*16
    if i==0: d.ellipse((x+3,2,x+13,14),fill=color,outline='#98651d',width=2);d.line((x+8,5,x+8,11),fill='#fff0b5',width=2)
    elif i==1: d.rounded_rectangle((x+4,2,x+12,14),radius=2,fill=color);d.rectangle((x+6,0,x+10,3),fill='#eaf2ff');d.line((x+6,7,x+10,7),fill='#101826',width=2)
    elif i==2: d.polygon([(x+2,2),(x+13,2),(x+12,10),(x+8,15),(x+3,10)],fill=color)
    else: d.rectangle((x+4,4,x+11,11),fill=color)
objects.save(f'{OUT}/objects.png')
# Five parallax backgrounds: stars, distant terrain and foreground silhouettes.
palettes=[('#0b1731','#153c65','#26618b'),('#171426','#443342','#79554e'),('#10182b','#455373','#7f8ca8'),('#231328','#70404a','#b4614a'),('#0d1e2b','#20505d','#337e88')]
for biome,colors in enumerate(palettes):
    for layer in range(3):
        img=Image.new('RGBA',(960,540), colors[0] if layer==0 else (0,0,0,0));d=ImageDraw.Draw(img)
        if layer==0:
            for n in range(80):
                x=(n*137+biome*71)%960;y=(n*n*13+biome*29)%470
                d.rectangle((x,y,x+1,y+1),fill='#9fb1cc')
            d.ellipse((650,60,810,220), fill=colors[1]); d.arc((645,55,815,225),0,280,fill=colors[2],width=3)
        else:
            top=365 if layer==1 else 465
            points=[(0,540),(0,top)]+[(x,top-int(25+math.sin(x/80+biome)*25)) for x in range(0,961,40)]+[(960,540)]
            d.polygon(points,fill=colors[layer])
        img.save(f'{OUT}/biome-{biome}-{layer}.png')
print('Generated astronaut: 29 frames; hazards: 24 frames; objects: 8; parallax: 15 layers.')

# Mobile flight sprites: original 48px artwork, separate from classic atlas.
flight_sheet = Image.new('RGBA',(48*16,48))
for frame in range(16):
    tile=Image.new('RGBA',(48,48)); d=ImageDraw.Draw(tile)
    boost=frame>=8; bob=int(math.sin(frame*math.pi/4))
    d.rounded_rectangle((5,19+bob,15,36+bob),radius=3,fill='#162b48',outline='#86a9c2',width=2)
    d.rectangle((6,22+bob,9,30+bob),fill='#4de6df')
    d.rounded_rectangle((13,21+bob,32,36+bob),radius=5,fill='#d8e5ed',outline='#7c96b0',width=2)
    d.rectangle((18,24+bob,28,30+bob),fill='#243e59');d.rectangle((20,25+bob,25,27+bob),fill='#5cf6cc')
    d.rounded_rectangle((12,3+bob,37,24+bob),radius=8,fill='#f0f3ee',outline='#94b0c4',width=2)
    d.rounded_rectangle((19,7+bob,38,19+bob),radius=5,fill='#0b1f38',outline='#36c5e3',width=2)
    d.rectangle((23,9+bob,33,11+bob),fill='#8eeefe');d.rectangle((33,12+bob,35,14+bob),fill='#3888ba')
    d.rectangle((14,10+bob,17,16+bob),fill='#fbad53')
    d.rounded_rectangle((28,25+bob,38,31+bob),radius=3,fill='#d8e5ed',outline='#7c96b0');d.rectangle((35,26+bob,40,29+bob),fill='#fbad53')
    d.polygon([(15,35+bob),(21,35+bob),(23,41),(17,44),(12,43)],fill='#708aa5')
    d.polygon([(26,35+bob),(31,35+bob),(35,40),(31,44),(25,40)],fill='#a4bbce')
    d.rectangle((12,42,20,45),fill='#1c344e');d.rectangle((29,42,37,45),fill='#1c344e')
    if boost:
        flame=43+(frame%3)*2
        d.polygon([(5,35+bob),(14,35+bob),(10,flame),(8,flame-3)],fill='#fb703f')
        d.polygon([(7,35+bob),(12,35+bob),(9,flame-2)],fill='#ffe08a')
    flight_sheet.alpha_composite(tile,(frame*48,0))
flight_sheet.save(f'{OUT}/flight-pilot.png')
flight_sheet.crop((8*48,0,9*48,48)).resize((192,192),Image.Resampling.NEAREST).save(f'{OUT}/flight-pilot-preview.png')
flight_hazards=Image.new('RGBA',(48*4,48*3))
for kind in range(3):
    for frame in range(4):
        tile=Image.new('RGBA',(48,48));d=ImageDraw.Draw(tile)
        color=['#51e4e4','#ff9e55','#e878e5'][kind]
        d.rounded_rectangle((9,9,39,39),radius=7,fill='#162d48',outline='#768da7',width=3)
        d.rounded_rectangle((14,14,34,34),radius=5,fill=color)
        d.rectangle((19,18,29,30),fill='#0a192d')
        d.rectangle((3,17,9,31),fill='#56748e');d.rectangle((39,17,45,31),fill='#56748e')
        if frame%2:d.line((7,6,41,42),fill=color,width=2)
        flight_hazards.alpha_composite(tile,(frame*48,kind*48))
flight_hazards.save(f'{OUT}/flight-hazards.png')
print('Generated mobile flight pilot and animated energy emitters (48px).')

# Landscape catalogue artwork derived from this project's own mobile sprites.
from PIL import ImageFont
cover=Image.new('RGBA',(960,540),'#0b1c2c');d=ImageDraw.Draw(cover)
for x in range(0,960,60):d.line((x,0,x,540),fill='#102739')
for y in range(0,540,60):d.line((0,y,960,y),fill='#102739')
d.rounded_rectangle((490,40,900,500),radius=80,fill='#112d3d',outline='#3b6a72',width=3)
d.ellipse((505,50,905,450),outline='#285764',width=3);d.ellipse((535,80,875,420),outline='#204552',width=2)
pilot=Image.open(f'{OUT}/flight-pilot-preview.png').resize((320,320),Image.Resampling.NEAREST)
cover.alpha_composite(pilot,(535,105))
d.text((65,90),'ISS RUNNER',fill='#eaf2e9',font=ImageFont.load_default(size=54))
d.text((68,165),'ORBITAL RUSH',fill='#78e0cb',font=ImageFont.load_default(size=28))
d.rounded_rectangle((68,285,363,350),radius=18,fill='#78e0cb')
d.text((100,304),'UN DEDO. A VOLAR.',fill='#0a292d',font=ImageFont.load_default(size=22))
cover.convert('RGB').save(f'{OUT}/flight-cover.png')
