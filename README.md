<div align="center">

# 记账本 · Jizhangben

一个**自托管、注重隐私**的个人记账本：用「三池预算」把每天的开销看清楚，Docker 一键部署，手机电脑实时同步。

</div>

---

## 特性

### 三池预算
- **每日使用金**：为每天的刚需开销（吃饭、交通、居家、医疗、教育…）设一笔预算，超支即时可见。
- **每月快乐金**：刚需之外的娱乐 / 自由支配额度（购物、玩乐、社交），独立一池，不挤占刚需。
- **每月总量**：月度总盘，对照整月到底花了多少。
- **放进定期**：把一笔钱转入定期存款，单独累计，不计入日常花销。

### 记账
- **截图识别记账**：上传或粘贴支付截图，**本地 OCR（Tesseract）** 自动识别金额与商家，无需手输；图片不出本机、不上传任何第三方。
- 刚需 / 快乐 / 收入 / 定期多类型快速记录，支持备注、编辑、删除。
- 明细按时间排列，可搜索筛选。

### 统计
- 分类占比环形图、每日与每月趋势折线（ECharts）。

### 个性化
- 多种纯色主题，或上传**自定义图片背景**（可调遮罩浓度）。

### 隐私与部署
- **免登录**：打开网页直接记账，没有账号密码。
- 数据全部保存在你自己的服务器（单个 SQLite 文件）；后端只有一个第三方依赖（Express）。
- 手机电脑同 Wi‑Fi 即可同步，外出可用 Tailscale 私有组网。
- 一键导出 CSV；备份只需复制 `data/` 目录。

---

## 快速开始

### Docker（推荐）

```bash
docker compose up -d --build
```

然后打开 <http://localhost:3000>。

### 直接用 Node

需要 Node.js 22 及以上（使用内置的 `node:sqlite`，无需编译原生模块）。

```bash
npm install --omit=dev
node server.js
```

> 前端图表（ECharts）与 OCR 引擎（tesseract.js）通过 jsDelivr CDN 按需加载，使用时需能访问该 CDN。

---

## 手机 / 多设备访问

**同一 Wi‑Fi / 局域网**：手机连同一 Wi‑Fi，浏览器打开 `http://<这台电脑的局域网IP>:3000`（查 IP：`ipconfig getifaddr en0`）。

**外出远程（Tailscale）**：两端安装 Tailscale，手机打开 `http://<Tailscale IP>:3000`，全程加密、不暴露公网。

> 电脑睡眠会中断服务，可在系统电源设置里关闭自动睡眠，或用 `caffeinate -i node server.js` 运行。

---

## 目录结构

```
.
├── server.js            # Express 服务与 API
├── db.js                # SQLite 建表与本地用户
├── public/index.html    # 前端（原生 HTML/CSS/JS，单页）
├── Dockerfile
├── docker-compose.yml
├── 启动记账本.command     # macOS 双击启动（可选）
└── data/                # SQLite 数据库（运行时生成，已 gitignore）
```

---

## 数据备份

所有数据保存在 `data/jizhangben.db`。复制整个 `data/` 目录即完成备份，换电脑时拷过去即可；也可在「设置 → 数据管理」导出 CSV 留档。

---

## 安全说明

本应用**没有身份认证**，任何能访问该地址的人都能记账和查看：

- 请只在可信的局域网或 Tailscale 私有组网内使用；
- **不要把 3000 端口直接映射或暴露到公网**。

---

## 技术栈

Node.js · Express · node:sqlite（DatabaseSync）· 原生 JavaScript · ECharts · tesseract.js

---

## License

[MIT](LICENSE)
