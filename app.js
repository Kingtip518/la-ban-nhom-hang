(function(){
'use strict';
var CRITS=[
  {k:'g',name:'Tăng trưởng doanh số',hint:'Nhóm hàng đang lớn nhanh'},
  {k:'v',name:'Nhu cầu thật',hint:'Người mua nhiều hơn, không chỉ do tăng giá'},
  {k:'r',name:'Quy mô thị trường',hint:'Thị trường đủ lớn để chia phần'},
  {k:'c',name:'Cạnh tranh nhẹ',hint:'Ít người bán chen chân'},
  {k:'von',name:'Hợp vốn nhỏ',hint:'Giá nhập thấp, dễ bắt đầu'},
  {k:'mua',name:'Đúng mùa sắp tới',hint:'Bán chạy trong các dịp sắp tới'}
];
var PRESETS=[
  {id:'nho',name:'Hộ nhỏ, vốn ít',w:{g:15,v:20,r:10,c:15,von:25,mua:15}},
  {id:'tet',name:'Đón mùa Tết',w:{g:10,v:15,r:10,c:10,von:15,mua:40}},
  {id:'von',name:'Shop có vốn',w:{g:20,v:15,r:25,c:15,von:5,mua:20}},
  {id:'deu',name:'Cân bằng',w:{g:17,v:17,r:17,c:17,von:16,mua:16}}
];
var TIER=['','Ưu tiên 1 · làm ngay','Ưu tiên 2 · cân nhắc','Ưu tiên 3 · để sau'];
var KEY='labannhomhang.v2';

var latest=null, base=[], data=[], prev=null, ranked=[], openSet={};
var w=Object.assign({},PRESETS[0].w), presetId='nho';
try{var sw=JSON.parse(localStorage.getItem(KEY+'.w')||'null');if(sw&&sw.w){w=sw.w;presetId=sw.p||null}}catch(e){}

function $(id){return document.getElementById(id)}
function has(x){return x!==null&&x!==undefined&&x!==''&&!isNaN(x)}
function clamp(x){return Math.max(0,Math.min(10,x))}
function clone(x){return JSON.parse(JSON.stringify(x))}
function fmtDate(s){var p=s.split('-');return p[2]+'/'+p[1]+'/'+p[0]}

function toItem(n){return {id:n.id,name:n.ten,rev:n.doanhSoQuy,g:n.tangDoanhSo,v:n.tangSanLuong,shop:n.thayDoiGianHang,von:n.hopVonNho,mua:n.dungMua,facts:n.soLieu||[],src:n.nguon||'',todo:n.nenLam||[],note:n.luuY||'',revNote:n.ghiChuDoanhSo||''}}

function scores(d){
  return {
    g: has(d.g)?clamp(d.g/60*10):null,
    v: has(d.v)?clamp((+d.v+25)/65*10):null,
    r: has(d.rev)&&d.rev>0?clamp((Math.log10(d.rev)-2.5)/2.1*10):null,
    c: has(d.shop)?clamp(5-d.shop/4):null,
    von: has(d.von)?clamp(+d.von):null,
    mua: has(d.mua)?clamp(+d.mua):null
  };
}
function total(s){var a=0,b=0;CRITS.forEach(function(c){var wt=+w[c.k]||0;a+=wt*(s[c.k]==null?5:s[c.k]);b+=wt});return b?a/b*10:0}
function tierOf(i){return i<3?1:i<7?2:3}

function saveData(){try{localStorage.setItem(KEY,JSON.stringify({capNhat:latest.capNhat,data:data}))}catch(e){}}
function saveW(){try{localStorage.setItem(KEY+'.w',JSON.stringify({w:w,p:presetId}))}catch(e){}}
function loadLocal(){
  try{var s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&s.capNhat===latest.capNhat&&Array.isArray(s.data)&&s.data.length)return s.data}catch(e){}
  try{localStorage.removeItem(KEY)}catch(e){}
  return clone(base);
}

/* Lịch mùa vụ */
function renderSeason(){
  var now=new Date();now.setHours(0,0,0,0);
  var el=$('season');el.innerHTML='';
  var evs=(latest.lichMuaVu||[]).slice().sort(function(a,b){return a.ngay<b.ngay?-1:1});
  var upcoming=evs.filter(function(e){return new Date(e.ngay+'T00:00:00')>=now});
  var show=upcoming.length?upcoming.slice(0,6):evs.slice(-3);
  show.forEach(function(e){
    var days=Math.round((new Date(e.ngay+'T00:00:00')-now)/864e5);
    var div=document.createElement('div');div.className='ev'+(e.noiBat?' hot':'')+(days<0?' past':'');
    div.innerHTML='<span class="d"></span><span class="n"></span><span class="w"></span>';
    div.querySelector('.d').innerHTML=days<0?'Đã qua':days===0?'Hôm nay':days+' <small>ngày nữa</small>';
    var p=e.ngay.split('-');
    div.querySelector('.n').textContent=e.ten+' · '+p[2]+'/'+p[1];
    div.querySelector('.w').textContent=e.moTa||'';
    el.appendChild(div);
  });
}

/* Trọng số */
function renderPresets(){
  var el=$('presets');el.innerHTML='';
  PRESETS.forEach(function(p){
    var b=document.createElement('button');b.className='chip';b.type='button';b.textContent=p.name;
    b.setAttribute('aria-pressed',String(p.id===presetId));
    b.onclick=function(){w=Object.assign({},p.w);presetId=p.id;saveW();renderPresets();renderWeights();renderList()};
    el.appendChild(b);
  });
}
function renderWeights(){
  var el=$('weights');el.innerHTML='';
  CRITS.forEach(function(c){
    var d=document.createElement('div');d.className='wt';
    d.innerHTML='<label for="w-'+c.k+'"></label><output id="o-'+c.k+'"></output><input type="range" id="w-'+c.k+'" min="0" max="50" step="1"><span class="hint"></span>';
    d.querySelector('label').textContent=c.name;d.querySelector('.hint').textContent=c.hint;
    var r=d.querySelector('input');r.value=w[c.k];
    var o=d.querySelector('output');o.textContent='mức '+w[c.k];
    r.oninput=function(){w[c.k]=+r.value;o.textContent='mức '+r.value;presetId=null;saveW();
      document.querySelectorAll('#presets .chip').forEach(function(x){x.setAttribute('aria-pressed','false')});renderList()};
    el.appendChild(d);
  });
}

/* Hạng lần trước, tính bằng cùng trọng số đang chọn */
function prevRanks(){
  if(!prev)return null;
  var list=Object.keys(prev.nhomHang).map(function(id){var n=prev.nhomHang[id];
    return {id:id,t:total(scores({rev:n.doanhSoQuy,g:n.tangDoanhSo,v:n.tangSanLuong,shop:n.thayDoiGianHang,von:n.hopVonNho,mua:n.dungMua}))}});
  list.sort(function(a,b){return b.t-a.t});
  var m={};list.forEach(function(x,i){m[x.id]=i+1});return m;
}

function reason(s){
  var arr=CRITS.map(function(c){return {n:c.name.toLowerCase(),s:s[c.k],w:+w[c.k]||0}}).filter(function(x){return x.w>0});
  var known=arr.filter(function(x){return x.s!==null});
  var top=known.slice().sort(function(a,b){return b.s*b.w-a.s*a.w}).slice(0,2).filter(function(x){return x.s>=6});
  var low=known.slice().sort(function(a,b){return a.s-b.s})[0];
  var t=top.length?'Mạnh ở '+top.map(function(x){return x.n}).join(', '):'Không có tiêu chí nổi bật';
  if(low&&low.s<4)t+='; yếu ở '+low.n;
  if(arr.filter(function(x){return x.s===null}).length>=3)t+='; thiếu nhiều số liệu';
  return t+'.';
}
function fmtRev(d){return has(d.rev)?Number(d.rev).toLocaleString('vi-VN')+(d.revNote?' tỷ ('+d.revNote+')':' tỷ/quý'):'chưa có'}
function pct(x){return has(x)?(x>0?'+':'')+Number(x).toLocaleString('vi-VN')+'%':'chưa có'}

function renderList(){
  ranked=data.map(function(d){var s=scores(d);return {d:d,s:s,t:total(s)}}).sort(function(a,b){return b.t-a.t});
  var pr=prevRanks();
  var p=PRESETS.filter(function(x){return x.id===presetId})[0];
  $('rank-sub').textContent=(p?'Đang chấm theo kiểu "'+p.name+'". ':'Đang chấm theo mức bạn tự chỉnh. ')+ranked.length+' nhóm hàng, điểm tối đa 100.'+(pr?' So hạng với lần cập nhật '+fmtDate(prev.ngay)+'.':'');
  var el=$('list');el.innerHTML='';
  ranked.forEach(function(x,i){
    var t=tierOf(i);
    var det=document.createElement('details');det.className='item t'+t;det.open=!!openSet[x.d.id];
    det.addEventListener('toggle',function(){openSet[x.d.id]=det.open});
    det.innerHTML='<summary><span class="rk">'+(i+1)+'</span><span class="nm"><b></b><span class="why"></span></span><span class="score"><span class="v">'+Math.round(x.t)+'<small>/100</small></span><span class="pill p'+t+'">'+TIER[t]+'</span></span></summary>'+
      '<div class="body"><div style="display:flex;flex-direction:column;gap:16px;min-width:0"><div class="crit"></div><div class="facts"><dl></dl></div></div>'+
      '<div style="display:flex;flex-direction:column;gap:14px;min-width:0"><div class="facts"><b>Số liệu ghi nhận</b><ul style="margin:0;padding-left:18px" class="fl"></ul><span class="src"></span></div>'+
      '<div class="todo"><b>Nên làm gì</b><ul></ul><span class="note"></span></div>'+
      '<div class="ai"><div class="row"><button class="btn ghost" type="button">Sao chép câu hỏi để nhờ Claude lập kế hoạch</button><span class="toast" aria-live="polite"></span></div></div></div></div>';
    var b=det.querySelector('.nm b');b.textContent=x.d.name;
    if(pr){var old=pr[x.d.id],mv=document.createElement('span');
      if(!old){mv.className='mv new';mv.textContent='mới'}
      else if(old!==i+1){var dlt=old-(i+1);mv.className='mv '+(dlt>0?'up':'down');mv.textContent=(dlt>0?'▲':'▼')+Math.abs(dlt);mv.title=(dlt>0?'Lên ':'Xuống ')+Math.abs(dlt)+' bậc so với lần trước'}
      if(mv.className)b.appendChild(mv)}
    det.querySelector('.why').textContent=reason(x.s);
    var cr=det.querySelector('.crit');
    CRITS.forEach(function(c){var v=x.s[c.k];var r=document.createElement('div');r.className='cr';
      r.innerHTML='<span></span><span class="bar'+(v===null?' na':'')+'"><i style="width:'+((v==null?5:v)*10)+'%"></i></span><span class="s">'+(v===null?'—':v.toFixed(1))+'</span>';
      r.firstChild.textContent=c.name;if(v===null)r.title='Chưa có số liệu, tính điểm trung bình 5';cr.appendChild(r)});
    var dl=det.querySelector('dl');
    [['Doanh số',fmtRev(x.d)],['Tăng doanh số',pct(x.d.g)],['Tăng sản lượng',pct(x.d.v)],['Số gian hàng',pct(x.d.shop)]].forEach(function(a){var dt=document.createElement('dt');dt.textContent=a[0];var dd=document.createElement('dd');dd.className='num';dd.textContent=a[1];dl.appendChild(dt);dl.appendChild(dd)});
    var fl=det.querySelector('.fl');(x.d.facts.length?x.d.facts:['Nhóm do bạn thêm, chấm theo số liệu trong bảng.']).forEach(function(f){var li=document.createElement('li');li.textContent=f;fl.appendChild(li)});
    det.querySelector('.src').textContent=x.d.src?'Nguồn: '+x.d.src:'';
    var tl=det.querySelector('.todo ul');x.d.todo.forEach(function(f){var li=document.createElement('li');li.textContent=f;tl.appendChild(li)});
    if(!x.d.todo.length)det.querySelector('.todo').hidden=true;
    det.querySelector('.note').textContent=x.d.note||'';
    var btn=det.querySelector('.ai .btn'),msg=det.querySelector('.ai .toast');
    btn.onclick=function(){copyText(planPrompt(x,i+1),msg,'Đã sao chép. Dán vào Claude để nhận kế hoạch.')};
    el.appendChild(det);
  });
}

function planPrompt(x,rank){
  var p=PRESETS.filter(function(z){return z.id===presetId})[0];
  var ev=(latest.lichMuaVu||[]).map(function(e){return e.ten+' ('+fmtDate(e.ngay)+')'}).join(', ');
  return 'Hôm nay là '+new Date().toLocaleDateString('vi-VN')+'. Bạn là chuyên gia bán hàng trên sàn thương mại điện tử Việt Nam (Shopee, TikTok Shop) và bán qua nhóm Zalo, Facebook.\n'+
  'Tôi bán hàng theo kiểu: '+(p?p.name:'tự chỉnh tiêu chí')+'.\n'+
  'Nhóm hàng tôi đang cân nhắc: '+x.d.name+' (La Bàn Nhóm Hàng xếp hạng '+rank+'/'+ranked.length+', '+Math.round(x.t)+'/100 điểm).\n'+
  'Số liệu thị trường (cập nhật '+fmtDate(latest.capNhat)+'):\n- '+(x.d.facts.join('\n- ')||'Chưa có')+'\n'+
  '- Doanh số: '+fmtRev(x.d)+'; tăng doanh số '+pct(x.d.g)+'; tăng sản lượng '+pct(x.d.v)+'; số gian hàng '+pct(x.d.shop)+'.\n'+
  'Lưu ý: '+(x.d.note||'không')+'\nCác dịp sắp tới: '+ev+'.\n\n'+
  'Hãy lập kế hoạch nhập và bán hàng ngắn gọn, thực tế, gồm 5 phần: (1) năm sản phẩm cụ thể nên bán kèm khoảng giá bán gợi ý; (2) vốn khởi đầu tối thiểu và cách nhập thử ít để tránh tồn kho; (3) kênh bán phù hợp nhất và lý do; (4) lịch làm việc theo tuần trong 2 tháng tới; (5) ba rủi ro lớn nhất và cách tránh. Viết tiếng Việt, không dùng từ tiếng Anh. Giá gợi ý ghi rõ là ước tính.';
}

function copyText(text,msgEl,ok){
  function done(s){msgEl.textContent=s;setTimeout(function(){msgEl.textContent=''},3000)}
  function fallback(){var ta=document.createElement('textarea');ta.value=text;ta.style.cssText='position:fixed;opacity:0';document.body.appendChild(ta);ta.select();
    try{document.execCommand('copy');done(ok)}catch(e){done('Không sao chép được.')}ta.remove()}
  if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(text).then(function(){done(ok)},fallback);else fallback();
}

/* Bảng số liệu của người xem */
var COLS=[['name','Nhóm hàng','txt'],['rev','Doanh số (tỷ/quý)'],['g','Tăng doanh số %'],['v','Tăng sản lượng %'],['shop','Thay đổi số gian hàng %'],['von','Hợp vốn nhỏ (0–10)'],['mua','Đúng mùa (0–10)']];
function renderTable(){
  var t=$('tbl');
  t.innerHTML='<thead><tr>'+COLS.map(function(c){return '<th>'+c[1]+'</th>'}).join('')+'</tr></thead>';
  var tb=document.createElement('tbody');
  data.forEach(function(d){var tr=document.createElement('tr');
    COLS.forEach(function(c){var k=c[0],ty=c[2];var td=document.createElement('td');var inp=document.createElement('input');
      inp.id='in-'+d.id+'-'+k;inp.setAttribute('aria-label',(d.name||'Nhóm')+' – '+c[1]);
      if(ty==='txt'){inp.className='txt';inp.value=d[k]||''}else{inp.type='number';inp.step='any';inp.value=has(d[k])?d[k]:''}
      inp.onchange=function(){d[k]=ty==='txt'?inp.value:(inp.value===''?null:+inp.value);saveData();renderList();note('Đã lưu trên máy bạn, xếp hạng đã tính lại.')};
      td.appendChild(inp);tr.appendChild(td)});
    tb.appendChild(tr)});
  t.appendChild(tb);
}
function note(s){var m=$('data-msg');m.textContent=s;clearTimeout(note.t);note.t=setTimeout(function(){m.textContent=''},2500)}
$('add').onclick=function(){data.push({id:'moi'+Date.now(),name:'Nhóm hàng mới',rev:null,g:null,v:null,shop:null,von:5,mua:5,facts:[],todo:[],src:'',note:''});saveData();renderTable();renderList();note('Đã thêm một dòng ở cuối bảng.')};
$('reset').onclick=function(){
  var self=this;
  if(self.dataset.arm!=='1'){self.dataset.arm='1';self.textContent='Bấm lần nữa để xác nhận';setTimeout(function(){self.dataset.arm='';self.textContent='Trả về số liệu gốc'},3000);return}
  self.dataset.arm='';self.textContent='Trả về số liệu gốc';data=clone(base);try{localStorage.removeItem(KEY)}catch(e){}renderTable();renderList();note('Đã trả về số liệu gốc.')};

$('copy').onclick=function(){
  var p=PRESETS.filter(function(z){return z.id===presetId})[0];
  var lines=['NHÓM HÀNG NÊN BÁN – cập nhật '+fmtDate(latest.capNhat)+(p?' (kiểu: '+p.name+')':''),''];
  ranked.forEach(function(x,i){lines.push((i+1)+'. '+x.d.name+' – '+Math.round(x.t)+' điểm – '+TIER[tierOf(i)].split(' · ')[0])});
  lines.push('','Xem chi tiết: '+location.href.split('#')[0]);
  copyText(lines.join('\n'),$('copy-msg'),'Đã sao chép.');
};

function renderMeta(hist){
  $('capnhat').textContent=fmtDate(latest.capNhat);
  $('eyebrow').textContent='Sàn thương mại điện tử Việt Nam · số liệu '+(latest.kyDuLieu||'');
  var s=$('sources');s.innerHTML='';
  (latest.nguon||[]).forEach(function(n,i){if(i)s.appendChild(document.createTextNode(' · '));var a=document.createElement('a');a.href=n.url;a.target='_blank';a.rel='noopener';a.textContent=n.ten;s.appendChild(a)});
  var h=$('hist');h.innerHTML='';
  (hist||[]).slice().reverse().forEach(function(x){var sp=document.createElement('span');sp.textContent=fmtDate(x.ngay);h.appendChild(sp)});
}

function start(hist){
  base=(latest.nhomHang||[]).map(toItem);
  data=loadLocal();
  hist=(hist||[]).slice().sort(function(a,b){return a.ngay<b.ngay?-1:1});
  var older=hist.filter(function(x){return x.ngay<latest.capNhat});
  prev=older.length?older[older.length-1]:null;
  renderMeta(hist);renderSeason();renderPresets();renderWeights();renderList();renderTable();
}

var bust='?t='+Date.now();
Promise.all([
  fetch('data/latest.json'+bust).then(function(r){if(!r.ok)throw new Error(r.status);return r.json()}),
  fetch('data/history.json'+bust).then(function(r){return r.ok?r.json():[]}).catch(function(){return []})
]).then(function(res){latest=res[0];start(res[1])}).catch(function(){
  $('list').innerHTML='<div class="state">Không tải được số liệu. Kiểm tra kết nối mạng rồi tải lại trang. Nếu đang mở tệp trực tiếp trên máy, hãy mở qua trang web đã đăng.</div>';
  $('capnhat').textContent='chưa tải được';
});
})();
