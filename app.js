'use strict';
const API='https://mempool.space/api';
(function(){const t=localStorage.getItem('theme')||(matchMedia('(prefers-color-scheme:light)').matches?'light':'dark');document.documentElement.setAttribute('data-theme',t);document.getElementById('theme-btn').textContent=t==='dark'?'🌙':'☀️';})();
function toggleTheme(){const h=document.documentElement;const n=h.getAttribute('data-theme')==='dark'?'light':'dark';h.setAttribute('data-theme',n);localStorage.setItem('theme',n);document.getElementById('theme-btn').textContent=n==='dark'?'🌙':'☀️';}

async function init(){
  try{
    const[stats,nodes]=await Promise.all([
      fetch(`${API}/v1/lightning/statistics/latest`).then(r=>r.json()),
      fetch(`${API}/v1/lightning/nodes/rankings/connectivity`).then(r=>r.json()),
    ]);
    const s=stats.latest||stats;
    document.getElementById('global-stats').innerHTML=`
      <div class="stat-card"><div class="stat-val">${(s.node_count||0).toLocaleString()}</div><div class="stat-lbl">총 노드</div></div>
      <div class="stat-card"><div class="stat-val">${(s.channel_count||0).toLocaleString()}</div><div class="stat-lbl">채널 수</div></div>
      <div class="stat-card"><div class="stat-val">${((s.total_capacity||0)/1e8).toFixed(0)}</div><div class="stat-lbl">총 용량 (BTC)</div></div>
      <div class="stat-card"><div class="stat-val">${((s.avg_capacity||0)/1e8).toFixed(4)}</div><div class="stat-lbl">평균 채널 크기</div></div>
      <div class="stat-card"><div class="stat-val">${(s.avg_channels_per_node||0).toFixed(1)}</div><div class="stat-lbl">노드당 평균 채널</div></div>
      <div class="stat-card"><div class="stat-val">${(s.med_capacity||0).toLocaleString()}</div><div class="stat-lbl">중앙값 용량(sat)</div></div>
    `;
    renderTopNodes(nodes);
    loadHistory();
  }catch(e){document.getElementById('global-stats').innerHTML=`<div class="empty">데이터 로드 실패: ${e.message}</div>`;}
}

function renderTopNodes(nodes){
  const el=document.getElementById('top-nodes');
  el.innerHTML=(nodes||[]).slice(0,20).map((n,i)=>`
    <div class="node-row" onclick="loadNodeDetail('${n.publicKey}')">
      <span class="node-rank">#${i+1}</span>
      <span class="node-alias">${n.alias||n.publicKey.slice(0,16)+'…'}</span>
      <span class="node-cap">${((n.capacity||0)/1e8).toFixed(2)} BTC</span>
      <span class="node-ch">${(n.channels||0).toLocaleString()}ch</span>
    </div>`).join('');
}

async function searchNode(){
  const q=document.getElementById('node-search').value.trim();
  if(!q)return;
  if(/^[0-9a-f]{66}$/.test(q)){await loadNodeDetail(q);return;}
  try{
    const res=await fetch(`${API}/v1/lightning/search?searchText=${encodeURIComponent(q)}&resultAmount=10`).then(r=>r.json());
    const nodes=res.nodes||[];
    if(!nodes.length){alert('노드를 찾을 수 없습니다.');return;}
    if(nodes.length===1){await loadNodeDetail(nodes[0].publicKey);return;}
    renderTopNodes(nodes);
  }catch(e){alert('검색 실패: '+e.message);}
}

async function loadNodeDetail(pubkey){
  const el=document.getElementById('node-detail');
  el.style.display='block';el.innerHTML='<div class="empty">로딩 중…</div>';
  try{
    const n=await fetch(`${API}/v1/lightning/nodes/${pubkey}`).then(r=>r.json());
    el.innerHTML=`
      <div class="nd-title">⚡ ${n.alias||pubkey.slice(0,20)+'…'}</div>
      <div class="nd-grid">
        <div class="nd-item"><div class="nd-key">Public Key</div><div class="nd-val" style="font-size:.62rem;word-break:break-all">${pubkey}</div></div>
        <div class="nd-item"><div class="nd-key">총 용량</div><div class="nd-val">${((n.capacity||0)/1e8).toFixed(4)} BTC</div></div>
        <div class="nd-item"><div class="nd-key">채널 수</div><div class="nd-val">${(n.channels||0).toLocaleString()} 활성</div></div>
        <div class="nd-item"><div class="nd-key">국가</div><div class="nd-val">${n.country?.en||n.city?.en||n.country?.de||'알 수 없음'||'알 수 없음'}</div></div>
        <div class="nd-item"><div class="nd-key">첫 등장</div><div class="nd-val">${n.firstSeen?new Date(n.firstSeen*1000).toLocaleDateString('ko-KR'):'—'}</div></div>
        <div class="nd-item"><div class="nd-key">마지막 업데이트</div><div class="nd-val">${n.updatedAt?new Date(n.updatedAt*1000).toLocaleDateString('ko-KR'):'—'}</div></div>
      </div>`;
    el.scrollIntoView({behavior:'smooth'});
  }catch(e){el.innerHTML=`<div class="empty">노드 정보 로드 실패</div>`;}
}

async function loadHistory(){
  try{
    const hist=await fetch(`${API}/v1/lightning/statistics/2y`).then(r=>r.json());
    const canvas=document.getElementById('network-chart');
    const ctx=canvas.getContext('2d');
    const W=canvas.offsetWidth||400;const H=200;
    canvas.width=W*2;canvas.height=H*2;ctx.scale(2,2);
    const isDark=document.documentElement.getAttribute('data-theme')!=='light';
    ctx.fillStyle=isDark?'#161b22':'#fff';ctx.fillRect(0,0,W,H);
    const data=hist.slice(-52);// 1년
    const maxNodes=Math.max(...data.map(d=>d.node_count||0));
    ctx.strokeStyle='#f7931a';ctx.lineWidth=1.5;ctx.beginPath();
    data.forEach((d,i)=>{
      const x=20+i*(W-40)/data.length;const y=H-20-(d.node_count/maxNodes)*(H-30);
      i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
    });
    ctx.stroke();
    ctx.fillStyle=isDark?'#8b949e':'#656d76';ctx.font='9px monospace';
    ctx.textAlign='left';ctx.fillText('노드 수 (1년)', 22, 14);
    ctx.textAlign='right';ctx.fillText(maxNodes.toLocaleString(), W-4, 14);
  }catch{}
}

document.getElementById('node-search').addEventListener('keydown',e=>{if(e.key==='Enter')searchNode();});
init();
