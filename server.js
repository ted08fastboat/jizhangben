/* 记账本同步服务：Express + 内置 SQLite */
const express=require('express');
const path=require('node:path');
const {db,ensureAdmin}=require('./db');

const app=express();
app.use(express.json({limit:'15mb'}));

function dstr(d){const p=n=>String(n).padStart(2,'0');return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate())}

/* ---------- 免登录：固定使用本地用户 id=1 ---------- */
function auth(req,res,next){req.userId=1;next()}

/* ---------- 读取全量状态 ---------- */
app.get('/api/state',auth,(req,res)=>{
  const transactions=db.prepare('SELECT * FROM transactions WHERE user_id=? ORDER BY id').all(req.userId);
  const row=db.prepare('SELECT data FROM settings WHERE user_id=?').get(req.userId);
  let settings=null;
  if(row){try{settings=JSON.parse(row.data)}catch{}}
  res.json({settings,transactions});
});

/* ---------- 交易增改删 ---------- */
function cleanTx(b){
  const type=['expense','income','deposit'].includes(b.type)?b.type:'expense';
  const amount=Math.round((Number(b.amount)||0)*100)/100;
  const category=String(b.category||'other');
  let bucket=(b.bucket==='need'||b.bucket==='fun')?b.bucket:null;
  if(type==='expense'&&!bucket)bucket='need';
  if(type==='deposit')bucket=null;
  const date=/^\d{4}-\d{2}-\d{2}$/.test(b.date)?b.date:dstr(new Date());
  const note=String(b.note||'').slice(0,200);
  return {type,amount,category,bucket,date,note};
}
app.post('/api/transactions',auth,(req,res)=>{
  const t=cleanTx(req.body||{});
  if(!(t.amount>0))return res.status(400).json({error:'金额需大于 0'});
  const now=new Date().toISOString();
  const r=db.prepare(`INSERT INTO transactions(user_id,type,amount,category,bucket,date,note,created_at,updated_at)
    VALUES(?,?,?,?,?,?,?,?,?)`).run(req.userId,t.type,t.amount,t.category,t.bucket,t.date,t.note,now,now);
  res.json(db.prepare('SELECT * FROM transactions WHERE id=?').get(r.lastInsertRowid));
});
app.put('/api/transactions/:id',auth,(req,res)=>{
  const id=Number(req.params.id);
  const ex=db.prepare('SELECT * FROM transactions WHERE id=? AND user_id=?').get(id,req.userId);
  if(!ex)return res.status(404).json({error:'记录不存在'});
  const t=cleanTx(req.body||{});
  db.prepare('UPDATE transactions SET type=?,amount=?,category=?,bucket=?,date=?,note=?,updated_at=? WHERE id=?')
    .run(t.type,t.amount,t.category,t.bucket,t.date,t.note,new Date().toISOString(),id);
  res.json(db.prepare('SELECT * FROM transactions WHERE id=?').get(id));
});
app.delete('/api/transactions/:id',auth,(req,res)=>{
  const r=db.prepare('DELETE FROM transactions WHERE id=? AND user_id=?').run(Number(req.params.id),req.userId);
  if(!r.changes)return res.status(404).json({error:'记录不存在'});
  res.json({ok:true});
});

/* ---------- 设置保存 ---------- */
app.put('/api/settings',auth,(req,res)=>{
  const now=new Date().toISOString();
  db.prepare(`INSERT INTO settings(user_id,data,updated_at) VALUES(?,?,?)
    ON CONFLICT(user_id) DO UPDATE SET data=excluded.data,updated_at=excluded.updated_at`)
    .run(req.userId,JSON.stringify(req.body||{}),now);
  res.json({ok:true});
});

/* ---------- 一次性迁移导入 ---------- */
app.post('/api/migrate',auth,(req,res)=>{
  const body=req.body||{};
  const txs=Array.isArray(body.transactions)?body.transactions:[];
  const now=new Date().toISOString();
  db.exec('BEGIN');
  try{
    if(body.replace)db.prepare('DELETE FROM transactions WHERE user_id=?').run(req.userId);
    const ins=db.prepare(`INSERT INTO transactions(user_id,type,amount,category,bucket,date,note,created_at,updated_at)
      VALUES(?,?,?,?,?,?,?,?,?)`);
    let count=0;
    txs.forEach(x=>{
      const t=cleanTx(x);
      if(!(t.amount>0))return;
      ins.run(req.userId,t.type,t.amount,t.category,t.bucket,t.date,t.note,now,now);count++;
    });
    if(body.settings){
      db.prepare(`INSERT INTO settings(user_id,data,updated_at) VALUES(?,?,?)
        ON CONFLICT(user_id) DO UPDATE SET data=excluded.data,updated_at=excluded.updated_at`)
        .run(req.userId,JSON.stringify(body.settings),now);
    }
    db.exec('COMMIT');
    res.json({imported:count});
  }catch(e){db.exec('ROLLBACK');res.status(400).json({error:'导入失败：'+e.message})}
});

/* ---------- 静态前端 ---------- */
app.use(express.static(path.join(__dirname,'public')));
app.get(/^\/(?!api).*/,(req,res)=>res.sendFile(path.join(__dirname,'public','index.html')));

const PORT=process.env.PORT||3000;
ensureAdmin();
app.listen(PORT,()=>console.log('记账本已启动：http://localhost:'+PORT));
