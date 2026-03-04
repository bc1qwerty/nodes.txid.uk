function escHtml(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
'use strict';

// ── 언어 ──
let lang = localStorage.getItem('lang') || 'ko';
const LABELS = {
  ko: {탐색기:'탐색기', 도구:'도구', 시각화:'시각화', 통계:'통계', 노드:'노드', 지도:'지도', 포트폴리오:'포트폴리오', 전송:'전송', 배우기:'배우기', 앱모음:'앱모음'},
  en: {탐색기:'Explorer', 도구:'Tools', 시각화:'Viz', 통계:'Stats', 노드:'Nodes', 지도:'Map', 포트폴리오:'Portfolio', 전송:'TX', 배우기:'Learn', 앱모음:'Apps'},
  ja: {탐색기:'探索', 도구:'ツール', 시각화:'可視化', 통계:'統計', 노드:'ノード', 지도:'地図', 포트폴리오:'資産', 전송:'送金', 배우기:'学習', 앱모음:'アプリ'},
};
function setLang(l){
  lang=l; localStorage.setItem('lang',lang);
  const btn=document.getElementById('lang-btn');
  if(btn) btn.textContent={ko:'KO',en:'EN',ja:'JA'}[lang]||'KO';
  document.getElementById('lang-menu')?.classList.remove('open');
  document.querySelectorAll('[data-ko]').forEach(el=>{
    const val=el.dataset[lang]||el.dataset.en||el.dataset.ko;
    if(val) el.textContent=val;
  });
}
function toggleLang(){document.getElementById('lang-menu')?.classList.toggle('open');}
document.addEventListener('click',e=>{const m=document.getElementById('lang-menu');if(m&&!e.target.closest('.lang-dropdown'))m.classList.remove('open');});
(function(){setLang(lang);})();

const API='https://mempool.space/api';
(function(){
  const t=localStorage.getItem('theme')||'dark';
  document.documentElement.setAttribute('data-theme',t);
  updateThemeBtn();
})();
function updateThemeBtn(){
  const btn=document.getElementById('theme-btn');if(!btn)return;
  const isDark=document.documentElement.getAttribute('data-theme')!=='light';
  btn.innerHTML=isDark?'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" width="15" height="15"><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="4.22" y1="4.22" x2="6.34" y2="6.34"/><line x1="17.66" y1="17.66" x2="19.78" y2="19.78"/><line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/><line x1="4.22" y1="19.78" x2="6.34" y2="17.66"/><line x1="17.66" y1="6.34" x2="19.78" y2="4.22"/></svg>':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" width="15" height="15"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
  btn.title=isDark?'라이트 모드로 전환':'다크 모드로 전환';
}
function toggleTheme(){
  const h=document.documentElement;
  const n=h.getAttribute('data-theme')==='dark'?'light':'dark';
  h.setAttribute('data-theme',n);localStorage.setItem('theme',n);
  updateThemeBtn();
}

async function init(){
  document.getElementById('global-stats').innerHTML='<div class="empty" style="padding:20px;color:var(--text3)">데이터 로딩 중…</div>';
  document.getElementById('top-nodes').innerHTML='<div class="empty" style="padding:20px;color:var(--text3)">로딩 중…</div>';
  try{
    const[stats,nodes]=await Promise.all([
      fetch(`${API}/v1/lightning/statistics/latest`,{signal:AbortSignal.timeout(10000)}).then(r=>r.json()),
      fetch(`${API}/v1/lightning/nodes/rankings/connectivity`,{signal:AbortSignal.timeout(10000)}).then(r=>r.json()),
    ]);
    const s=stats.latest||stats||{};
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
  }catch(e){document.getElementById('global-stats').innerHTML=`<div class="empty">데이터 로드 실패: ${String(e.message).replace(/</g,'&lt;')}</div>`;}
}

function renderTopNodes(nodes){
  const el=document.getElementById('top-nodes');
  el.innerHTML=(nodes||[]).slice(0, window.innerWidth<600 ? 10 : 20).map((n,i)=>`
    <div class="node-row" onclick="loadNodeDetail('${n.publicKey}')">
      <span class="node-rank">#${i+1}</span>
      <span class="node-alias">${escHtml(n.alias)||n.publicKey.slice(0,16)+'…'}</span>
      <span class="node-cap">${((n.capacity||0)/1e8).toFixed(2)} BTC</span>
      <span class="node-ch">${(n.channels||0).toLocaleString()}ch</span>
    </div>`).join('');
}

async function searchNode(){
  const q=document.getElementById('node-search').value.trim();
  if(!q)return;
  document.getElementById('top-nodes').innerHTML='<div class="empty" style="padding:16px;color:var(--text3)">검색 중…</div>';
  if(/^[0-9a-f]{66}$/.test(q)){await loadNodeDetail(q);return;}
  try{
    const res=await fetch(`${API}/v1/lightning/search?searchText=${encodeURIComponent(q)}&resultAmount=10`).then(r=>r.json());
    const nodes=res.nodes||[];
    if(!nodes.length){document.getElementById('top-nodes').innerHTML='<div class="empty" style="padding:16px;color:var(--text3)">검색 결과가 없습니다.</div>';return;}
    if(nodes.length===1){await loadNodeDetail(nodes[0].publicKey);return;}
    renderTopNodes(nodes);
  }catch(e){document.getElementById('top-nodes').innerHTML=`<div class="empty" style="padding:16px;color:var(--red)">검색 오류: ${escHtml(e.message)}</div>`;}
}

async function loadNodeDetail(pubkey){
  const el=document.getElementById('node-detail');
  el.style.display='block';el.innerHTML='<div class="empty">로딩 중…</div>';
  try{
    const n=await fetch(`${API}/v1/lightning/nodes/${pubkey}`,{signal:AbortSignal.timeout(10000)}).then(r=>r.json());
    el.innerHTML=`
      <div class="nd-title">${escHtml(n.alias)||pubkey.slice(0,20)+'…'}</div>
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
    const d=await fetch(`${API}/v1/lightning/statistics/2y`,{signal:AbortSignal.timeout(15000)}).then(r=>r.json());
    const el=document.getElementById('network-chart');
    if(!Array.isArray(d)||!d.length)return;
    const cur=d[0],old=d[d.length-1];
    const getNodes=x=>(x.clearnet_nodes||0)+(x.tor_nodes||0)+(x.unannounced_nodes||0)+(x.clearnet_tor_nodes||0);
    const chDiff=cur.channel_count-old.channel_count;
    const ndDiff=getNodes(cur)-getNodes(old);
    const capDiff=(cur.total_capacity-old.total_capacity)/1e8;
    const sign=v=>v>0?'+':'';
    el.innerHTML=`
      <div class="bs-row"><span class="bs-key">총 노드 수</span><span class="bs-val">${getNodes(cur).toLocaleString()} <small style="color:${ndDiff>=0?'#3fb950':'#f85149'};font-size:.65rem">${sign(ndDiff)}${ndDiff.toLocaleString()}</small></span></div>
      <div class="bs-row"><span class="bs-key">Clearnet</span><span class="bs-val">${(cur.clearnet_nodes||0).toLocaleString()}</span></div>
      <div class="bs-row"><span class="bs-key">Tor</span><span class="bs-val">${(cur.tor_nodes||0).toLocaleString()}</span></div>
      <div class="bs-row"><span class="bs-key">채널 수</span><span class="bs-val">${cur.channel_count.toLocaleString()} <small style="color:${chDiff>=0?'#3fb950':'#f85149'};font-size:.65rem">${sign(chDiff)}${chDiff.toLocaleString()}</small></span></div>
      <div class="bs-row"><span class="bs-key">총 용량</span><span class="bs-val">${((cur.total_capacity||0)/1e8).toFixed(0)} BTC <small style="color:${capDiff>=0?'#3fb950':'#f85149'};font-size:.65rem">${sign(capDiff)}${capDiff.toFixed(0)}</small></span></div>
      <div class="bs-row"><span class="bs-key">기준</span><span class="bs-val" style="font-size:.65rem">2년 전 대비 변화</span></div>
    `;
  }catch{}
}

document.getElementById('node-search').addEventListener('keydown',e=>{if(e.key==='Enter')searchNode();});
init();
