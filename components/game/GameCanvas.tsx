'use client';
import { useEffect, useRef } from 'react';
import type { Landmark, WorldFeature, WorldPayload } from '@/lib/types';

type Props={landmarks:Landmark[]; world:WorldPayload|null; onSelect:(landmark:Landmark)=>void};

function roadWidth(highway?:string){
  if(['motorway','trunk','primary'].includes(highway||'')) return 10;
  if(highway==='secondary') return 8;
  if(['tertiary','unclassified'].includes(highway||'')) return 6;
  if(['residential','living_street'].includes(highway||'')) return 4;
  return 2.5;
}

export default function GameCanvas({landmarks,world,onSelect}:Props){
  const host=useRef<HTMLDivElement|null>(null);
  const callback=useRef(onSelect); callback.current=onSelect;

  useEffect(()=>{
    if(!host.current) return;
    let game:any;
    let cancelled=false;

    (async()=>{
      const Phaser=(await import('phaser')).default;
      if(cancelled || !host.current) return;

      class UyoScene extends Phaser.Scene{
        player!:any;
        cursors!:any;
        keys:any;
        joystick={x:0,y:0};
        walkTarget:{x:number;y:number}|null=null;
        collisions:any;

        create(){
          const worldW=world?.world.width??1900;
          const worldH=world?.world.height??1250;
          this.physics.world.setBounds(0,0,worldW,worldH);
          this.cameras.main.setBounds(0,0,worldW,worldH);
          this.cameras.main.setBackgroundColor('#b6d49a');

          if(world) this.drawWorld(world.features,worldW,worldH);
          else this.drawFallback(worldW,worldH);

          const plaza=landmarks.find(l=>l.id==='ibom-plaza'&&l.enabled);
          const spawn={x:plaza?.gameX??worldW/2,y:(plaza?.gameY??worldH/2)+80};
          this.createPlayer(spawn.x,spawn.y);
          this.createLandmarks();
          this.createControls();
          this.createCameraControls();
        }

        drawFallback(worldW:number,worldH:number){
          const g=this.add.graphics();
          g.fillStyle(0x9fc787,1).fillRect(0,0,worldW,worldH);
          g.fillStyle(0xd8ccb2,1);
          [[0,690,1900,90],[900,0,100,1250],[260,240,1500,58],[430,1030,1300,54],[1180,350,58,850]].forEach(r=>g.fillRect(r[0],r[1],r[2],r[3]));
        }

        drawWorld(features:WorldFeature[],worldW:number,worldH:number){
          const ground=this.add.graphics();
          ground.fillStyle(0xb8d69c,1).fillRect(0,0,worldW,worldH);

          const land=this.add.graphics();
          const roads=this.add.graphics();

          const polygon=(feature:WorldFeature,fill:number,alpha=1)=>{
            if(feature.points.length<3) return;
            land.fillStyle(fill,alpha);
            land.fillPoints(feature.points.map(p=>new Phaser.Geom.Point(p[0],p[1])),true);
          };

          for(const f of features){
            if(f.kind==='water') polygon(f,0x8fc5df,.95);
            else if(f.kind==='park') polygon(f,0x83bd77,.82);
            else if(f.kind==='building') {
              polygon(f,0xe8dfcf,1);
              if(f.points.length>2){
                land.lineStyle(1.2,0x9f978a,.42);
                land.strokePoints(f.points.map(p=>new Phaser.Geom.Point(p[0],p[1])),true);
              }
            }
          }

          for(const f of features){
            if(f.kind!=='road'||f.points.length<2) continue;
            roads.lineStyle(roadWidth(f.highway)+3,0xd3c7b2,1);
            roads.beginPath();
            roads.moveTo(f.points[0][0],f.points[0][1]);
            for(let i=1;i<f.points.length;i++) roads.lineTo(f.points[i][0],f.points[i][1]);
            roads.strokePath();
            roads.lineStyle(Math.max(1.5,roadWidth(f.highway)-1.5),0xf5efe5,1);
            roads.beginPath();
            roads.moveTo(f.points[0][0],f.points[0][1]);
            for(let i=1;i<f.points.length;i++) roads.lineTo(f.points[i][0],f.points[i][1]);
            roads.strokePath();
          }

          this.collisions=this.physics.add.staticGroup();
          const spawnRef=landmarks.find(l=>l.id==='ibom-plaza')||{gameX:worldW/2,gameY:worldH/2};
          const nearby=features
            .filter(f=>f.kind==='building'&&f.points.length>2)
            .map(f=>({f,d:distanceToFeature(f,spawnRef.gameX,spawnRef.gameY)}))
            .sort((a,b)=>a.d-b.d)
            .slice(0,420);
          for(const {f} of nearby){
            const xs=f.points.map(p=>p[0]), ys=f.points.map(p=>p[1]);
            const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
            const w=maxX-minX,h=maxY-minY;
            if(w<10||h<10||w>260||h>260) continue;
            const block=this.add.rectangle((minX+maxX)/2,(minY+maxY)/2,w,h,0x000000,0);
            this.physics.add.existing(block,true);
            this.collisions.add(block);
          }
        }

        createPlayer(x:number,y:number){
          const g=this.add.graphics();
          g.fillStyle(0x241f1b,1).fillCircle(17,11,8);
          g.fillStyle(0xd36a35,1).fillRoundedRect(8,19,18,23,7);
          g.fillStyle(0x2f4f73,1).fillRoundedRect(8,39,7,13,3).fillRoundedRect(19,39,7,13,3);
          g.generateTexture('uyo-player',34,54);
          g.destroy();

          this.player=this.physics.add.sprite(x,y,'uyo-player');
          this.player.setDepth(10000);
          this.player.setCollideWorldBounds(true);
          this.player.body.setSize(18,34).setOffset(8,18);
          if(this.collisions) this.physics.add.collider(this.player,this.collisions);
          this.cameras.main.startFollow(this.player,true,.085,.085);
          this.cameras.main.setZoom(.95);
        }

        createLandmarks(){
          landmarks.filter(l=>l.enabled).forEach(l=>{
            const marker=this.add.container(l.gameX,l.gameY).setDepth(9000);
            const pin=this.add.circle(0,0,20,0x171714,.92).setStrokeStyle(4,0xffffff,1);
            const icon=this.add.text(0,-1,iconFor(l.category),{fontSize:'19px'}).setOrigin(.5);
            const label=this.add.text(0,27,l.name,{fontFamily:'Arial',fontSize:'12px',fontStyle:'bold',color:'#171714',backgroundColor:'rgba(255,253,247,.9)',padding:{x:5,y:3},align:'center',wordWrap:{width:130}}).setOrigin(.5,0);
            marker.add([pin,icon,label]);
            marker.setSize(44,44);
            marker.setInteractive(new Phaser.Geom.Circle(0,0,28),Phaser.Geom.Circle.Contains);
            marker.on('pointerdown',(_p:any,_x:any,_y:any,event:any)=>{
              event?.stopPropagation?.();
              callback.current(l);
              this.walkTarget={x:l.gameX,y:l.gameY+48};
            });
          });
        }

        createControls(){
          this.cursors=this.input.keyboard?.createCursorKeys();
          this.keys=this.input.keyboard?.addKeys('W,A,S,D');

          this.input.on('pointerdown',(pointer:any,objects:any[])=>{
            if(objects?.length) return;
            const worldPoint=pointer.positionToCamera(this.cameras.main) as any;
            this.walkTarget={x:worldPoint.x,y:worldPoint.y};
          });

          const size=50;
          const make=(x:number,y:number,txt:string,dx:number,dy:number)=>{
            const b=this.add.circle(x,y,size/2,0x171714,.76).setScrollFactor(0).setDepth(20000).setInteractive();
            this.add.text(x,y,txt,{fontSize:'18px',color:'#ffffff'}).setOrigin(.5).setScrollFactor(0).setDepth(20001);
            const down=()=>{this.walkTarget=null;this.joystick={x:dx,y:dy}};
            const up=()=>{this.joystick={x:0,y:0}};
            b.on('pointerdown',down); b.on('pointerup',up); b.on('pointerout',up);
          };
          const y=this.scale.height-62;
          make(42,y,'←',-1,0); make(100,y-42,'↑',0,-1); make(158,y,'→',1,0); make(100,y,'↓',0,1);
        }

        createCameraControls(){
          const makeZoom=(x:number,label:string,delta:number)=>{
            const b=this.add.circle(x,38,20,0xffffff,.9).setStrokeStyle(2,0x171714,.25).setScrollFactor(0).setDepth(20000).setInteractive();
            this.add.text(x,38,label,{fontSize:'19px',fontStyle:'bold',color:'#171714'}).setOrigin(.5).setScrollFactor(0).setDepth(20001);
            b.on('pointerdown',()=>this.cameras.main.setZoom(Phaser.Math.Clamp(this.cameras.main.zoom+delta,.55,1.75)));
          };
          makeZoom(this.scale.width-78,'−',-.12);
          makeZoom(this.scale.width-30,'+',.12);
          this.input.on('wheel',(_p:any,_go:any,_dx:number,dy:number)=>{
            this.cameras.main.setZoom(Phaser.Math.Clamp(this.cameras.main.zoom+(dy>0?-.08:.08),.55,1.75));
          });
        }

        update(){
          const body=this.player.body;
          const speed=230;
          let vx=0,vy=0;
          if(this.cursors?.left.isDown||this.keys?.A.isDown) vx=-1;
          if(this.cursors?.right.isDown||this.keys?.D.isDown) vx=1;
          if(this.cursors?.up.isDown||this.keys?.W.isDown) vy=-1;
          if(this.cursors?.down.isDown||this.keys?.S.isDown) vy=1;

          const manual=Boolean(vx||vy||this.joystick.x||this.joystick.y);
          if(this.joystick.x||this.joystick.y){vx=this.joystick.x;vy=this.joystick.y}
          if(manual) this.walkTarget=null;

          if(!manual&&this.walkTarget){
            const dx=this.walkTarget.x-this.player.x,dy=this.walkTarget.y-this.player.y;
            const d=Math.hypot(dx,dy);
            if(d<10){this.walkTarget=null;body.setVelocity(0,0);return;}
            vx=dx/d;vy=dy/d;
          }

          if(!vx&&!vy){body.setVelocity(0,0);return;}
          const len=Math.hypot(vx,vy)||1;
          body.setVelocity(vx/len*speed,vy/len*speed);
          if(vx!==0) this.player.setFlipX(vx<0);
        }
      }

      function iconFor(cat:string){
        return ({civic:'🏛️',sports:'🏟️',entertainment:'🎬',education:'🎓',government:'🏢',events:'🎉',district:'🏘️',restaurant:'🍲',hospital:'🏥',school:'🏫'} as Record<string,string>)[cat]||'📍';
      }

      function distanceToFeature(f:WorldFeature,x:number,y:number){
        let best=Infinity;
        for(const p of f.points){const d=(p[0]-x)**2+(p[1]-y)**2;if(d<best)best=d;}
        return best;
      }

      game=new Phaser.Game({
        type:Phaser.AUTO,
        parent:host.current,
        width:900,
        height:620,
        backgroundColor:'#b6d49a',
        physics:{default:'arcade'},
        scene:[UyoScene],
        scale:{mode:Phaser.Scale.RESIZE,autoCenter:Phaser.Scale.CENTER_BOTH}
      });
    })();

    return()=>{cancelled=true;if(game)game.destroy(true)};
  },[landmarks,world]);

  return <div className="card" style={{overflow:'hidden',minHeight:480,position:'relative'}}>
    <div ref={host} style={{width:'100%',height:'min(72vh,720px)',minHeight:480}}/>
    <div style={{position:'absolute',top:12,left:12,background:'rgba(255,253,247,.92)',border:'1px solid var(--line)',borderRadius:999,padding:'8px 11px',fontSize:12,fontWeight:800}}>Click to walk · WASD/arrows · mobile pad · zoom ±</div>
  </div>;
}
