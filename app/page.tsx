import Link from 'next/link';

export default function Home() {
  return (
    <main className="shell" style={{padding:'7vw 0 64px'}}>
      <div style={{maxWidth:820}}>
        <div className="muted" style={{fontWeight:800, letterSpacing:'.12em', textTransform:'uppercase'}}>Browser life simulation</div>
        <h1 style={{fontSize:'clamp(48px, 9vw, 108px)', lineHeight:.88, letterSpacing:'-.07em', margin:'18px 0 24px'}}>Small City.<br/>Big Moves.</h1>
        <p className="muted" style={{fontSize:'clamp(18px, 2.5vw, 26px)', lineHeight:1.4, maxWidth:700}}>Walk around Uyo, build relationships, work, eat, rent a home, own businesses, and make your name in a city where reputation travels.</p>
        <div style={{display:'flex', gap:10, marginTop:28, flexWrap:'wrap'}}>
          <Link href="/game" className="btn btn-primary" style={{display:'inline-flex', alignItems:'center', textDecoration:'none'}}>Enter Uyo</Link>
          <Link href="/admin" className="btn btn-secondary" style={{display:'inline-flex', alignItems:'center', textDecoration:'none'}}>Open world admin</Link>
        </div>
      </div>
      <section className="grid" style={{gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))', marginTop:64}}>
        {[
          ['Live city','Day/night, events, jobs and traffic-style movement.'],
          ['Real landmarks','OSM geometry + Google Places live details; our own gameplay data.'],
          ['Persistent life','Money, energy, housing, inventory, jobs, reputation and network.'],
          ['Admin controlled','Publish landmarks, tune the economy and schedule city events.']
        ].map(([title,body]) => <div className="card" style={{padding:20}} key={title}><strong>{title}</strong><p className="muted" style={{lineHeight:1.5}}>{body}</p></div>)}
      </section>
    </main>
  );
}
