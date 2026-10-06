'use client';
import { useEffect, useRef } from 'react';
import type { Landmark } from '@/lib/types';

type Props={landmarks:Landmark[]; onSelect:(landmark:Landmark)=>void};

export default function GameCanvas({landmarks,onSelect}:Props){
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
        player!:any; cursors!:any; keys:any; joystick={x:0,y:0};
        preload(){}
        create(){
          this.cameras.main.setBackgroundColor('#b9d69f');
          const worldW=1900, worldH=1250;
          this.physics.world.setBounds(0,0,worldW,worldH);
          this.cameras.main.setBounds(0,0,worldW,worldH);
          const g=this.add.graphics();
          g.fillStyle(0x9fc787,1).fillRect(0,0,worldW,worldH);
          g.fillStyle(0xd8ccb2,1);
          [[0,690,1900,90],[900,0,100,1250],[260,240,1500,58],[430,1030,1300,54],[1180,350,58,850]].forEach(r=>g.fillRect(r[0],r[1],r[2],r[3]));
          for(let y=70;y<1180;y+=150){ for(let x=90;x<1820;x+=175){ if(Math.random()>.28){ g.fillStyle(0xf4ead6,1); g.fillRoundedRect(x,y,90,58,8); g.lineStyle(2,0x7c7466,.35); g.strokeRoundedRect(x,y,90,58,8); } } }
          landmarks.filter(l=>l.enabled).forEach(l=>{
            const marker=this.add.container(l.gameX,l.gameY);
            const base=this.add.rectangle(0,0,104,70,0xffffff,.95).setStrokeStyle(3,0x171714,.35);
            const icon=this.add.text(0,-9, iconFor(l.category),{fontSize:'24px'}).setOrigin(.5);
            const label=this.add.text(0,21,l.name,{fontFamily:'Arial',fontSize:'11px',color:'#171714',align:'center',wordWrap:{width:96}}).setOrigin(.5,0);
            marker.add([base,icon,label]); marker.setSize(110,80); marker.setInteractive(new Phaser.Geom.Rectangle(-55,-40,110,80),Phaser.Geom.Rectangle.Contains);
            marker.on('pointerdown',()=>callback.current(l));
          });
          this.player=this.add.circle(950,850,18,0x171714).setStrokeStyle(5,0xffffff,1);
          this.physics.add.existing(this.player); this.player.body.setCollideWorldBounds(true);
          this.cameras.main.startFollow(this.player,true,.08,.08);
          this.cameras.main.setZoom(1);
          this.cursors=this.input.keyboard?.createCursorKeys();
          this.keys=this.input.keyboard?.addKeys('W,A,S,D');
          this.createTouchControls();
        }
        createTouchControls(){
          const size=52, y=this.scale.height-70;
          const make=(x:number,txt:string,dx:number,dy:number)=>{
            const b=this.add.circle(x,y,size/2,0x171714,.76).setScrollFactor(0).setInteractive();
            const t=this.add.text(x,y,txt,{fontSize:'18px',color:'#ffffff'}).setOrigin(.5).setScrollFactor(0);
            const down=()=>{this.joystick={x:dx,y:dy}}; const up=()=>{this.joystick={x:0,y:0}};
            b.on('pointerdown',down); b.on('pointerup',up); b.on('pointerout',up);
            return [b,t];
          };
          make(42,'←',-1,0); make(100,'↑',0,-1); make(158,'→',1,0); make(100,'↓',0,1);
        }
        update(){
          const body=this.player.body; const speed=215; let vx=0,vy=0;
          if(this.cursors?.left.isDown||this.keys?.A.isDown) vx=-1;
          if(this.cursors?.right.isDown||this.keys?.D.isDown) vx=1;
          if(this.cursors?.up.isDown||this.keys?.W.isDown) vy=-1;
          if(this.cursors?.down.isDown||this.keys?.S.isDown) vy=1;
          if(this.joystick.x||this.joystick.y){vx=this.joystick.x;vy=this.joystick.y}
          const len=Math.hypot(vx,vy)||1; body.setVelocity(vx/len*speed,vy/len*speed);
        }
      }
      function iconFor(cat:string){return ({civic:'🏛️',sports:'🏟️',entertainment:'🎬',education:'🎓',government:'🏢',events:'🎉',district:'🏘️'} as Record<string,string>)[cat]||'📍'}
      game=new Phaser.Game({type:Phaser.AUTO,parent:host.current,width:900,height:620,backgroundColor:'#b9d69f',physics:{default:'arcade'},scene:[UyoScene],scale:{mode:Phaser.Scale.RESIZE,autoCenter:Phaser.Scale.CENTER_BOTH}});
    })();
    return()=>{cancelled=true;if(game)game.destroy(true)};
  },[landmarks]);

  return <div className="card" style={{overflow:'hidden', minHeight:480, position:'relative'}}><div ref={host} style={{width:'100%',height:'min(68vh,680px)',minHeight:480}}/><div style={{position:'absolute',top:12,left:12,background:'rgba(255,253,247,.92)',border:'1px solid var(--line)',borderRadius:999,padding:'8px 11px',fontSize:12,fontWeight:800}}>WASD / arrows · touch controls on mobile</div></div>;
}
