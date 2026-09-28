/* 数据库层：Node 内置 SQLite（node:sqlite），免登录单用户 */
const {DatabaseSync}=require('node:sqlite');
const path=require('node:path');
const fs=require('node:fs');

const DB_PATH=process.env.DB_PATH||path.join(__dirname,'data','jizhangben.db');
fs.mkdirSync(path.dirname(DB_PATH),{recursive:true});
const db=new DatabaseSync(DB_PATH);

db.exec(`
PRAGMA journal_mode=WAL;
PRAGMA foreign_keys=ON;

CREATE TABLE IF NOT EXISTS users(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  pass_hash TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions(
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS transactions(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  amount REAL NOT NULL,
  category TEXT NOT NULL,
  bucket TEXT,
  date TEXT NOT NULL,
  note TEXT DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_tx_user_date ON transactions(user_id,date);

CREATE TABLE IF NOT EXISTS settings(
  user_id INTEGER PRIMARY KEY,
  data TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id)
);
`);

/* 确保存在 id=1 的本地用户（免登录，固定使用） */
function ensureAdmin(){
  const n=db.prepare('SELECT COUNT(*) AS n FROM users').get().n;
  if(n>0)return;
  db.prepare('INSERT INTO users(username,pass_hash,created_at) VALUES(?,?,?)')
    .run('local','-',new Date().toISOString());
  console.log('[初始化] 已创建本地用户（免登录）');
}

module.exports={db,ensureAdmin};
