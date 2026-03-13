function escHtml(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
async function fetchRetry(url,timeout,retries){for(let i=0,m=retries||2;i<=m;i++){try{return await fetch(url,{signal:AbortSignal.timeout(timeout||10000)});}catch(e){if(i>=m)throw e;await new Promise(r=>setTimeout(r,1000<<i));}}}
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
function toggleLang(){const m=document.getElementById('lang-menu');m?.classList.toggle('open');document.getElementById('lang-btn')?.setAttribute('aria-expanded',m?.classList.contains('open')||false);}
document.addEventListener('click',e=>{const m=document.getElementById('lang-menu');if(m&&!e.target.closest('.lang-dropdown')){m.classList.remove('open');document.getElementById('lang-btn')?.setAttribute('aria-expanded','false');}});
(function(){setLang(lang);})();

const T = {
  loading: { ko:'로딩 중…', en:'Loading...', ja:'読み込み中…' },
  dataLoading: { ko:'데이터 로딩 중…', en:'Loading data...', ja:'データ読み込み中…' },
  searching: { ko:'검색 중…', en:'Searching...', ja:'検索中…' },
  noResults: { ko:'검색 결과가 없습니다.', en:'No results found.', ja:'検索結果がありません。' },
  searchError: { ko:'검색 중 오류가 발생했습니다.', en:'Search error occurred.', ja:'検索中にエラーが発生しました。' },
  unknown: { ko:'알 수 없음', en:'Unknown', ja:'不明' },
  totalNodes: { ko:'총 노드', en:'Total Nodes', ja:'総ノード' },
  channels: { ko:'채널 수', en:'Channels', ja:'チャネル数' },
  totalCapBtc: { ko:'총 용량 (BTC)', en:'Total Capacity (BTC)', ja:'総容量 (BTC)' },
  avgChannelSize: { ko:'평균 채널 크기', en:'Avg Channel Size', ja:'平均チャネルサイズ' },
  avgChannelsPerNode: { ko:'노드당 평균 채널', en:'Avg Channels/Node', ja:'ノード当たり平均チャネル' },
  medianCapSat: { ko:'중앙값 용량(sat)', en:'Median Capacity (sat)', ja:'中央値容量(sat)' },
  dataLoadFailed: { ko:'데이터를 불러올 수 없습니다.', en:'Failed to load data.', ja:'データを読み込めませんでした。' },
  retry: { ko:'재시도', en:'Retry', ja:'再試行' },
  totalCapacity: { ko:'총 용량', en:'Total Capacity', ja:'総容量' },
  active: { ko:'활성', en:'active', ja:'アクティブ' },
  country: { ko:'국가', en:'Country', ja:'国' },
  firstSeen: { ko:'첫 등장', en:'First Seen', ja:'初出現' },
  lastUpdate: { ko:'마지막 업데이트', en:'Last Updated', ja:'最終更新' },
  nodeLoadFailed: { ko:'노드 정보 로드 실패', en:'Failed to load node info', ja:'ノード情報の読み込みに失敗しました' },
  totalNodeCount: { ko:'총 노드 수', en:'Total Nodes', ja:'総ノード数' },
  channelCount: { ko:'채널 수', en:'Channels', ja:'チャネル数' },
  totalCapacityLabel: { ko:'총 용량', en:'Total Capacity', ja:'総容量' },
  reference: { ko:'기준', en:'Reference', ja:'基準' },
  change2y: { ko:'2년 전 대비 변화', en:'Change over 2 years', ja:'2年前からの変化' },
  lightMode: { ko:'라이트 모드로 전환', en:'Switch to light mode', ja:'ライトモードに切替' },
  darkMode: { ko:'다크 모드로 전환', en:'Switch to dark mode', ja:'ダークモードに切替' },
};
function t(key){ return (T[key]&&T[key][lang]) || (T[key]&&T[key].en) || key; }

const API='https://mempool.space/api';
(function(){
  const th=localStorage.getItem('theme')||'dark';
  document.documentElement.setAttribute('data-theme',th);
  updateThemeBtn();
})();
function updateThemeBtn(){
  const btn=document.getElementById('theme-btn');if(!btn)return;
  const isDark=document.documentElement.getAttribute('data-theme')!=='light';
  btn.innerHTML=isDark?'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" width="15" height="15"><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="4.22" y1="4.22" x2="6.34" y2="6.34"/><line x1="17.66" y1="17.66" x2="19.78" y2="19.78"/><line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/><line x1="4.22" y1="19.78" x2="6.34" y2="17.66"/><line x1="17.66" y1="6.34" x2="19.78" y2="4.22"/></svg>':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" width="15" height="15"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
  btn.title=isDark?t('lightMode'):t('darkMode');
}
function toggleTheme(){
  const h=document.documentElement;
  const n=h.getAttribute('data-theme')==='dark'?'light':'dark';
  h.setAttribute('data-theme',n);localStorage.setItem('theme',n);
  updateThemeBtn();
}

async function init(){
  document.getElementById('global-stats').innerHTML='<div class="empty empty-loading">'+t('dataLoading')+'</div>';
  document.getElementById('top-nodes').innerHTML='<div class="empty empty-loading">'+t('loading')+'</div>';
  try{
    const[stats,nodes]=await Promise.all([
      fetchRetry(`${API}/v1/lightning/statistics/latest`,10000).then(r=>r.json()),
      fetchRetry(`${API}/v1/lightning/nodes/rankings/connectivity`,10000).then(r=>r.json()),
    ]);
    const s=stats.latest||stats||{};
    document.getElementById('global-stats').innerHTML=`
      <div class="stat-card"><div class="stat-val">${(s.node_count||0).toLocaleString()}</div><div class="stat-lbl">${t('totalNodes')}</div></div>
      <div class="stat-card"><div class="stat-val">${(s.channel_count||0).toLocaleString()}</div><div class="stat-lbl">${t('channels')}</div></div>
      <div class="stat-card"><div class="stat-val">${((s.total_capacity||0)/1e8).toFixed(0)}</div><div class="stat-lbl">${t('totalCapBtc')}</div></div>
      <div class="stat-card"><div class="stat-val">${((s.avg_capacity||0)/1e8).toFixed(4)}</div><div class="stat-lbl">${t('avgChannelSize')}</div></div>
      <div class="stat-card"><div class="stat-val">${(s.avg_channels_per_node||0).toFixed(1)}</div><div class="stat-lbl">${t('avgChannelsPerNode')}</div></div>
      <div class="stat-card"><div class="stat-val">${(s.med_capacity||0).toLocaleString()}</div><div class="stat-lbl">${t('medianCapSat')}</div></div>
    `;
    renderTopNodes(nodes);
    loadHistory();
  }catch(e){console.error('init error:', e); document.getElementById('global-stats').innerHTML=`<div class="empty">${t('dataLoadFailed')} <button class="retry-btn" id="retry-init">${t('retry')}</button></div>`; document.getElementById('retry-init')?.addEventListener('click',init);}
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
  document.getElementById('top-nodes').innerHTML='<div class="empty empty-search">'+t('searching')+'</div>';
  if(/^[0-9a-f]{66}$/.test(q)){await loadNodeDetail(q);return;}
  try{
    const res=await fetchRetry(`${API}/v1/lightning/search?searchText=${encodeURIComponent(q)}&resultAmount=10`,10000).then(r=>r.json());
    const nodes=res.nodes||[];
    if(!nodes.length){document.getElementById('top-nodes').innerHTML='<div class="empty empty-search">'+t('noResults')+'</div>';return;}
    if(nodes.length===1){await loadNodeDetail(nodes[0].publicKey);return;}
    renderTopNodes(nodes);
  }catch(e){console.error('searchNode error:', e); document.getElementById('top-nodes').innerHTML=`<div class="empty empty-error">${t('searchError')}</div>`;}
}

async function loadNodeDetail(pubkey){
  const el=document.getElementById('node-detail');
  el.classList.remove('hidden');el.innerHTML='<div class="empty">'+t('loading')+'</div>';
  try{
    const n=await fetchRetry(`${API}/v1/lightning/nodes/${pubkey}`,10000).then(r=>r.json());
    el.innerHTML=`
      <div class="nd-title">${escHtml(n.alias)||pubkey.slice(0,20)+'…'}</div>
      <div class="nd-grid">
        <div class="nd-item"><div class="nd-key">Public Key</div><div class="nd-val nd-pubkey">${pubkey}</div></div>
        <div class="nd-item"><div class="nd-key">${t('totalCapacity')}</div><div class="nd-val">${((n.capacity||0)/1e8).toFixed(4)} BTC</div></div>
        <div class="nd-item"><div class="nd-key">${t('channels')}</div><div class="nd-val">${(n.channels||0).toLocaleString()} ${t('active')}</div></div>
        <div class="nd-item"><div class="nd-key">${t('country')}</div><div class="nd-val">${n.country?.en||n.city?.en||n.country?.de||t('unknown')}</div></div>
        <div class="nd-item"><div class="nd-key">${t('firstSeen')}</div><div class="nd-val">${n.firstSeen?new Date(n.firstSeen*1000).toLocaleDateString(lang==='ja'?'ja-JP':lang==='en'?'en-US':'ko-KR'):'—'}</div></div>
        <div class="nd-item"><div class="nd-key">${t('lastUpdate')}</div><div class="nd-val">${n.updatedAt?new Date(n.updatedAt*1000).toLocaleDateString(lang==='ja'?'ja-JP':lang==='en'?'en-US':'ko-KR'):'—'}</div></div>
      </div>`;
    el.scrollIntoView({behavior:'smooth'});
  }catch(e){el.innerHTML=`<div class="empty">${t('nodeLoadFailed')}</div>`;}
}

async function loadHistory(){
  try{
    const d=await fetchRetry(`${API}/v1/lightning/statistics/2y`,15000).then(r=>r.json());
    const el=document.getElementById('network-chart');
    if(!Array.isArray(d)||!d.length)return;
    const cur=d[0],old=d[d.length-1];
    const getNodes=x=>(x.clearnet_nodes||0)+(x.tor_nodes||0)+(x.unannounced_nodes||0)+(x.clearnet_tor_nodes||0);
    const chDiff=cur.channel_count-old.channel_count;
    const ndDiff=getNodes(cur)-getNodes(old);
    const capDiff=(cur.total_capacity-old.total_capacity)/1e8;
    const sign=v=>v>0?'+':'';
    el.innerHTML=`
      <div class="bs-row"><span class="bs-key">${t('totalNodeCount')}</span><span class="bs-val">${getNodes(cur).toLocaleString()} <small class="${ndDiff>=0?'diff-positive':'diff-negative'}">${sign(ndDiff)}${ndDiff.toLocaleString()}</small></span></div>
      <div class="bs-row"><span class="bs-key">Clearnet</span><span class="bs-val">${(cur.clearnet_nodes||0).toLocaleString()}</span></div>
      <div class="bs-row"><span class="bs-key">Tor</span><span class="bs-val">${(cur.tor_nodes||0).toLocaleString()}</span></div>
      <div class="bs-row"><span class="bs-key">${t('channelCount')}</span><span class="bs-val">${cur.channel_count.toLocaleString()} <small class="${chDiff>=0?'diff-positive':'diff-negative'}">${sign(chDiff)}${chDiff.toLocaleString()}</small></span></div>
      <div class="bs-row"><span class="bs-key">${t('totalCapacityLabel')}</span><span class="bs-val">${((cur.total_capacity||0)/1e8).toFixed(0)} BTC <small class="${capDiff>=0?'diff-positive':'diff-negative'}">${sign(capDiff)}${capDiff.toFixed(0)}</small></span></div>
      <div class="bs-row"><span class="bs-key">${t('reference')}</span><span class="bs-val bs-val-small">${t('change2y')}</span></div>
    `;
  }catch(e){console.error('loadHistory error:', e);}
}

document.getElementById('node-search').addEventListener('keydown',e=>{if(e.key==='Enter')searchNode();});

// Event listeners (moved from inline handlers)
document.getElementById('lang-btn')?.addEventListener('click', toggleLang);
document.querySelectorAll('#lang-menu button').forEach(function(btn) {
  var lang = btn.textContent === '한국어' ? 'ko' : btn.textContent === 'English' ? 'en' : 'ja';
  btn.addEventListener('click', function() { setLang(lang); });
});
document.getElementById('theme-btn')?.addEventListener('click', toggleTheme);
document.getElementById('search-btn')?.addEventListener('click', searchNode);

init();
