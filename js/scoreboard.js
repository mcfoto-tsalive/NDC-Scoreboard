function parseCSV(text){
  const rows=[]; let row=[], cell='', q=false;
  for(let i=0;i<text.length;i++){
    const c=text[i], n=text[i+1];
    if(c==='"') { if(q && n==='"'){cell+='"'; i++;} else q=!q; }
    else if(c===',' && !q){ row.push(cell.trim()); cell=''; }
    else if((c==='\n'||c==='\r') && !q){ if(c==='\r'&&n==='\n') i++; row.push(cell.trim()); rows.push(row); row=[]; cell=''; }
    else cell+=c;
  }
  if(cell.length||row.length){row.push(cell.trim()); rows.push(row)}
  return rows;
}
function clean(v){return (v||'').toString().trim()}
function num(v){ const s=clean(v).replace(/[^0-9.]/g,''); return s ? parseFloat(s) : 0; }
function scoreText(v){ const n=num(v); return n ? n.toFixed(2) : '—'; }
function isName(v){ const s=clean(v); return s && s !== '#N/A' && !/^0(?:\.0+)?$/.test(s); }
function inferMeta(rows){
  const title = clean(rows[0]?.[2]) || CONFIG.eventTitle;
  const date = clean(rows[1]?.[2]);
  const cup = clean(rows[2]?.[2]);
  const round = clean(rows[2]?.[13]) ? `Round ${clean(rows[2][13])}` : '';
  const match = clean(rows[2]?.[23]) ? `Match ${clean(rows[2][23])}` : '';
  const home = clean(rows[3]?.[2]) || CONFIG.homeTeam;
  const away = clean(rows[3]?.[13]) || CONFIG.awayTeam;
  return {title, subtitle: CONFIG.subtitle || [cup, round, match].filter(Boolean).join(' - '), home, away, date};
}
const sections = [
  {key:'open', label:'Open Squad', start:7, count:5, leftTotalRow:12, rightTotalRow:12, type:'open'},
  {key:'composite', label:'Composite Squad', start:17, count:3, leftTotalRow:20, rightTotalRow:20, type:'open'},
  {key:'development', label:'Development Squad', start:25, count:2, leftTotalRow:27, rightTotalRow:27, type:'dev'}
];
function playerFrom(row, side, type){
  const offset = side==='left' ? 0 : 11;
  const name = clean(row[offset+3]);
  if(!isName(name)) return null;
  const grade = clean(row[offset+4]);
  const junior = clean(row[offset+5]).toUpperCase()==='TRUE';
  if(type==='dev'){
    return {name, grade, junior, s1:clean(row[offset+6]), s2:clean(row[offset+7]), s3:'', total:num(row[offset+9])};
  }
  return {name, grade, junior, s1:clean(row[offset+6]), s2:clean(row[offset+7]), s3:clean(row[offset+8]), total:num(row[offset+9])};
}
function readTeam(rows, side, teamName){
  const squads=[]; let grand=0;
  sections.forEach(sec=>{
    const players=[];
    for(let r=sec.start; r<sec.start+sec.count; r++){ const p=playerFrom(rows[r]||[], side, sec.type); if(p) players.push(p); }
    const totalRow = rows[side==='left'?sec.leftTotalRow:sec.rightTotalRow] || [];
    const total = num(totalRow[(side==='left'?9:20)]);
    grand += total;
    const complete = players.filter(p=>p.total>0).length;
    squads.push({...sec, players, total, complete});
  });
  const sheetGrand = num((rows[30]||[])[side==='left'?9:20]);
  return {name:teamName, squads, grand: sheetGrand || grand};
}
function buildData(rows){
  const meta = inferMeta(rows);
  const home = readTeam(rows,'left', meta.home);
  const away = readTeam(rows,'right', meta.away);
  return {meta, teams:[home,away]};
}
function setText(id, val){ const el=document.getElementById(id); if(el) el.textContent=val; }
function renderSummary(data){
  const [a,b]=data.teams; const diff=a.grand-b.grand;
  const leader = diff>0?a.name:diff<0?b.name:'Tied';
  const diffTxt = diff===0?'Level':Math.abs(diff).toFixed(2);
  document.getElementById('matchSummary').innerHTML = `
    <div class="team-total ${diff>0?'leading':''}"><div class="team">${a.name}</div><div class="score">${a.grand.toFixed(3)}</div></div>
    <div class="lead-box"><div class="lead-label">${diff===0?'Match Status':'Leading'}</div><div class="lead-value">${leader}</div><div class="lead-label">${diffTxt}</div></div>
    <div class="team-total ${diff<0?'leading':''}"><div class="team">${b.name}</div><div class="score">${b.grand.toFixed(3)}</div></div>`;
}
function status(sec){ return sec.complete===sec.count ? '✓ Finished' : `${sec.complete} of ${sec.count} complete`; }
function rowHtml(p, type){
  if(type==='dev') return `<tr><td class="name">${p.name}${p.junior?'<span class="junior">J</span>':''}</td><td><span class="grade">${p.grade}</span></td><td class="score-cell hide-mobile">${scoreText(p.s1)}</td><td class="score-cell hide-mobile">${scoreText(p.s2)}</td><td class="score-cell">${p.total?p.total.toFixed(2):'—'}</td></tr>`;
  return `<tr><td class="name">${p.name}${p.junior?'<span class="junior">J</span>':''}</td><td><span class="grade">${p.grade}</span></td><td class="score-cell hide-mobile">${scoreText(p.s1)}</td><td class="score-cell hide-mobile">${scoreText(p.s2)}</td><td class="score-cell hide-mobile">${scoreText(p.s3)}</td><td class="score-cell">${p.total?p.total.toFixed(2):'—'}</td></tr>`;
}
function squadHtml(team, sec, otherSec){
  const cls = sec.total>0 && otherSec.total>0 ? (sec.total>otherSec.total?' winner':sec.total<otherSec.total?' loser':'') : '';
  const heads = sec.type==='dev' ? '<th>Name</th><th>Gr</th><th class="score-cell hide-mobile">1st</th><th class="score-cell hide-mobile">2nd</th><th class="score-cell">Total</th>' : '<th>Name</th><th>Gr</th><th class="score-cell hide-mobile">1x10</th><th class="score-cell hide-mobile">1st 20</th><th class="score-cell hide-mobile">2nd 20</th><th class="score-cell">Total</th>';
  return `<section class="squad${cls}"><div class="squad-title"><span>${sec.label}</span><span class="status">${status(sec)}</span></div><table><thead><tr>${heads}</tr></thead><tbody>${sec.players.map(p=>rowHtml(p,sec.type)).join('')}</tbody></table><div class="squad-total"><span>${sec.label} Total</span><span>${sec.total.toFixed(3)}</span></div></section>`;
}
function teamHtml(team, other){
  return `<article class="team-card"><div class="team-heading"><h2>${team.name}</h2><div class="grand">${team.grand.toFixed(3)}</div></div>${team.squads.map((s,i)=>squadHtml(team,s,other.squads[i])).join('')}</article>`;
}
function render(data){
  setText('eventTitle', CONFIG.eventTitle || data.meta.title);
  setText('subtitle', CONFIG.subtitle || data.meta.subtitle);
  setText('refreshSeconds', Math.round((CONFIG.refreshMs||30000)/1000));
  renderSummary(data);
  document.getElementById('scoreboard').innerHTML = teamHtml(data.teams[0], data.teams[1]) + teamHtml(data.teams[1], data.teams[0]);
  setText('updatedAt', new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', second:'2-digit'}));
  const ml=document.getElementById('mobileLink'); if(ml) ml.textContent = `Mobile: ${CONFIG.mobilePage || 'mobile.html'}`;
}
async function loadScores(){
  try{
    const bust = (CONFIG.csvUrl.includes('?')?'&':'?') + 'cache=' + Date.now();
    const res = await fetch(CONFIG.csvUrl + bust);
    if(!res.ok) throw new Error('Could not load CSV');
    render(buildData(parseCSV(await res.text())));
  }catch(e){
    const sb=document.getElementById('scoreboard');
    if(sb) sb.innerHTML = `<div class="error">Scoreboard could not load. Check the CSV link in js/config.js.<br>${e.message}</div>`;
    setText('updatedAt','CSV error');
  }
}
loadScores();
setInterval(loadScores, CONFIG.refreshMs || 30000);
