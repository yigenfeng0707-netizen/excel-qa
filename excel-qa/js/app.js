const $=id=>document.getElementById(id);
const LS={key:'excel_qa_cfg',load(){try{return JSON.parse(localStorage.getItem(this.key))||{}}catch(e){return{}}},save(c){localStorage.setItem(this.key,JSON.stringify(c))}};
let tableData=null;

const cfg=LS.load();
if(cfg.apiKey)$('apiKey').value=cfg.apiKey;
if(cfg.model)$('model').value=cfg.model;
if(cfg.endpoint)$('endpoint').value=cfg.endpoint;

function saveCfg(){LS.save({apiKey:$('apiKey').value,model:$('model').value,endpoint:$('endpoint').value})}
['apiKey','model','endpoint'].forEach(id=>$(id).addEventListener('change',saveCfg));

const dropZone=$('dropZone'),fileInput=$('fileInput');
dropZone.addEventListener('dragover',e=>{e.preventDefault();dropZone.classList.add('drag')});
dropZone.addEventListener('dragleave',()=>dropZone.classList.remove('drag'));
dropZone.addEventListener('drop',e=>{e.preventDefault();dropZone.classList.remove('drag');if(e.dataTransfer.files[0])handleFile(e.dataTransfer.files[0])});
fileInput.addEventListener('change',e=>{if(e.target.files[0])handleFile(e.target.files[0])});

function handleFile(file){
  const reader=new FileReader();
  reader.onload=e=>{
    try{
      const wb=XLSX.read(e.target.result,{type:'array'});
      const sheet=wb.Sheets[wb.SheetNames[0]];
      const rows=XLSX.utils.sheet_to_json(sheet,{header:1,defval:''});
      if(rows.length<1)throw new Error('表格为空');
      tableData={name:file.name,sheet:wb.SheetNames[0],rows};
      renderPreview();
      $('askBtn').disabled=false;
      buildSuggest();
    }catch(err){alert('解析失败：'+err.message)}
  };
  reader.readAsArrayBuffer(file);
}

function renderPreview(){
  const{rows,name,sheet}=tableData;
  const header=rows[0],body=rows.slice(1,11);
  const info=$('fileInfo');
  info.innerHTML=`<span>📄 ${escapeHtml(name)}</span><span>📋 工作表：${escapeHtml(sheet)}</span><span>🔢 ${rows.length-1} 行 × ${header.length} 列</span>`;
  let html='<table><thead><tr>'+header.map(h=>`<th>${escapeHtml(h??'')}</th>`).join('')+'</tr></thead><tbody>';
  html+=body.map(r=>'<tr>'+header.map((_,i)=>`<td>${escapeHtml(r[i]??'')}</td>`).join('')+'</tr>').join('');
  if(rows.length>11)html+=`<tr><td colspan="${header.length}" style="text-align:center;color:#9ca3af">… 共 ${rows.length-1} 行，仅预览前 10 行</td></tr>`;
  html+='</tbody></table>';
  const wrap=$('previewWrap');
  wrap.innerHTML=html;wrap.style.display='block';
}

function buildSuggest(){
  const header=tableData.rows[0]||[];
  const numCol=header.find((h,i)=>tableData.rows.slice(1,30).some(r=>typeof r[i]==='number'||/^-?\d+(\.\d+)?$/.test(r[i])));
  const items=[];
  if(numCol){items.push(`按${numCol}从高到低排前5`);items.push(`${numCol}的总和是多少`);items.push(`${numCol}的平均值是多少`)}
  items.push(`这张表有哪些字段，分别是什么意思`);
  items.push(`帮我总结这份数据的关键信息`);
  const box=$('suggest');box.innerHTML='';
  items.slice(0,4).forEach(t=>{const b=document.createElement('button');b.textContent=t;b.onclick=()=>{$('question').value=t;ask()};box.appendChild(b)});
}

function toMarkdown(){
  const{rows}=tableData;
  const header=rows[0],body=rows.slice(1);
  const md=[`| ${header.join(' | ')} |`,`| ${header.map(()=>'---').join(' | ')} |`];
  const limit=body.length>25?body.slice(0,25):body;
  limit.forEach(r=>md.push(`| ${header.map((_,i)=>String(r[i]??'').replace(/\|/g,'\\|')).join(' | ')} |`));
  if(body.length>25)md.push(`\n（注：表格共 ${body.length} 行，为节省篇幅仅展示前 25 行样例，请基于这些样例和字段语义回答）`);
  return md.join('\n');
}

async function ask(){
  const q=$('question').value.trim();
  if(!q)return;
  const apiKey=$('apiKey').value.trim();
  if(!apiKey){alert('请先在下方「设置」里填写 API Key');return}
  if(!tableData){alert('请先上传 Excel 文件');return}
  saveCfg();
  const btn=$('askBtn'),ans=$('answer');
  btn.disabled=true;btn.innerHTML='<span class="spin"></span>思考中';
  ans.style.display='block';ans.className='answer';ans.textContent='';
  const sys=`你是一名数据分析助手。用户会给你一份表格数据（Markdown 格式）和一个问题。
规则：
1. 只能基于提供的表格数据回答，不要编造数据。
2. 如果数据不足以回答，明确说"根据现有数据无法回答"并说明缺什么。
3. 回答简洁、直接，先给结论，必要时附具体数值。
4. 涉及排序/统计时，列出具体结果。
5. 如果只展示了部分样例行，基于样例作答并说明"基于展示的样例数据"。`;
  const userMsg=`表格数据：\n${toMarkdown()}\n\n问题：${q}`;
  try{
    const endpoint=$('endpoint').value.trim().replace(/\/$/,'');
    const res=await fetch(endpoint+'/chat/completions',{
      method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+apiKey},
      body:JSON.stringify({model:$('model').value.trim(),messages:[{role:'system',content:sys},{role:'user',content:userMsg}],temperature:0.3})
    });
    if(!res.ok){const t=await res.text();throw new Error(`HTTP ${res.status}：${t.slice(0,300)}`)}
    const data=await res.json();
    const reply=data.choices?.[0]?.message?.content||'(空回复)';
    ans.innerHTML=`<div class="meta">问：${escapeHtml(q)}</div>${escapeHtml(reply)}`;
    addHistory(q,reply);
  }catch(err){
    ans.className='answer err';
    ans.innerHTML=`<div class="meta">问：${escapeHtml(q)}</div>❌ 请求失败：${escapeHtml(err.message)}\n\n常见原因：① API Key 错误 ② 本地代理未启动：请在 excel-qa 目录运行 npm start（若是直连模式则检查跨域/代理配置） ③ 模型名不对（试试 qwen-max / qwen-plus / qwen3-max）`;
  }finally{btn.disabled=false;btn.textContent='提问'}
}

function addHistory(q,a){
  const h=$('history');
  const item=document.createElement('div');item.className='item';
  item.innerHTML=`<div class="q">Q：${escapeHtml(q)}</div><div class="a">${escapeHtml(a)}</div>`;
  h.prepend(item);
}
function exportHistory(){
  const items=[...document.querySelectorAll('#history .item')].map(el=>{
    const q=el.querySelector('.q').textContent.replace(/^Q：/,'');
    const a=el.querySelector('.a').textContent;
    return `## 问：${q}\n\n${a}`;
  });
  if(!items.length){alert('暂无问答记录，先完成一次提问吧');return}
  const md=`# Excel 问答记录\n\n> 文件：${tableData?tableData.name:''} · 导出时间：${new Date().toLocaleString()}\n\n${items.join('\n\n---\n\n')}`;
  const blob=new Blob([md],{type:'text/markdown;charset=utf-8'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download='excel-qa-history.md';
  a.click();
  URL.revokeObjectURL(a.href);
}
function escapeHtml(s){return String(s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))}

$('exportBtn').addEventListener('click',exportHistory);
$('askBtn').addEventListener('click',ask);
$('question').addEventListener('keydown',e=>{if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)){e.preventDefault();ask()}});
