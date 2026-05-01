import { Router } from "express";
import { db } from "@workspace/db";
import { accessKeysTable, serverConfigTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  ADMIN_COOKIE,
  generateSessionToken,
  isAuthenticated,
  requireAdmin,
  verifyCredentials,
} from "../lib/adminAuth.js";
import { logger } from "../lib/logger.js";

const router = Router();

const ADMIN_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Akshu Mod Admin</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Segoe UI',sans-serif;background:#0d0d14;color:#e0e0e0;min-height:100vh}
  .login-wrap{display:flex;align-items:center;justify-content:center;min-height:100vh;padding:20px}
  .login-card{background:#1a1a2e;border:1px solid #2453e0;border-radius:12px;padding:40px;width:100%;max-width:380px}
  .login-card h1{text-align:center;color:#2453e0;font-size:22px;margin-bottom:6px}
  .login-card p{text-align:center;color:#888;font-size:13px;margin-bottom:28px}
  .form-group{margin-bottom:16px}
  label{display:block;font-size:12px;color:#aaa;margin-bottom:6px;text-transform:uppercase;letter-spacing:.5px}
  input[type=text],input[type=password],textarea{width:100%;padding:10px 14px;background:#0d0d14;border:1px solid #333;border-radius:8px;color:#e0e0e0;font-size:14px;outline:none;transition:border .2s}
  input:focus,textarea:focus{border-color:#2453e0}
  textarea{resize:vertical;min-height:200px;font-family:monospace;font-size:12px}
  .btn{width:100%;padding:12px;border:none;border-radius:8px;cursor:pointer;font-size:14px;font-weight:600;transition:opacity .2s}
  .btn:hover{opacity:.85}
  .btn-primary{background:#2453e0;color:#fff}
  .btn-danger{background:#ff4444;color:#fff}
  .btn-success{background:#24a822;color:#fff;width:auto;padding:8px 18px}
  .btn-sm{width:auto;padding:7px 14px;font-size:13px}
  .err{color:#ff5252;font-size:13px;margin-top:12px;text-align:center}
  header{background:#1a1a2e;border-bottom:1px solid #222;padding:14px 28px;display:flex;align-items:center;justify-content:space-between}
  header h1{color:#2453e0;font-size:18px}
  header a{color:#888;font-size:13px;text-decoration:none}
  header a:hover{color:#fff}
  .container{max-width:900px;margin:0 auto;padding:28px 20px}
  .card{background:#1a1a2e;border:1px solid #222;border-radius:12px;padding:24px;margin-bottom:24px}
  .card h2{font-size:16px;color:#aaa;margin-bottom:18px;text-transform:uppercase;letter-spacing:.5px}
  .key-list{list-style:none}
  .key-item{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:#0d0d14;border:1px solid #222;border-radius:8px;margin-bottom:8px}
  .key-val{font-family:monospace;font-size:13px;color:#4ade80}
  .key-note{font-size:12px;color:#666;margin-left:10px}
  .key-date{font-size:11px;color:#444;margin-left:auto;margin-right:14px}
  .add-key-row{display:flex;gap:10px;margin-top:14px}
  .add-key-row input{flex:1}
  .tag{display:inline-block;padding:2px 8px;border-radius:4px;font-size:11px;background:#2453e020;color:#2453e0;border:1px solid #2453e040}
  .status{font-size:12px;padding:6px 12px;border-radius:6px;margin-top:10px;display:none}
  .status.ok{background:#24a82220;color:#24a822;display:block}
  .status.err{background:#ff525220;color:#ff5252;display:block}
  .row2{display:grid;grid-template-columns:1fr 1fr;gap:16px}
  @media(max-width:600px){.row2{grid-template-columns:1fr}}
</style>
</head>
<body>
<div id="app"></div>
<script>
const app = document.getElementById('app');

async function api(url, method='GET', body) {
  const opts = { method, headers: {'Content-Type':'application/json'} };
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch(url, opts);
  return r.json();
}

function showStatus(el, msg, isErr) {
  el.className = 'status ' + (isErr ? 'err' : 'ok');
  el.textContent = msg;
  setTimeout(() => el.className='status', 3000);
}

async function renderLogin(errMsg) {
  app.innerHTML = \`
  <div class="login-wrap">
    <div class="login-card">
      <h1>🔐 Akshu Mod</h1>
      <p>Admin Panel — Authorized Access Only</p>
      <form id="lf">
        <div class="form-group">
          <label>Username</label>
          <input type="text" id="un" autocomplete="username" required/>
        </div>
        <div class="form-group">
          <label>Password</label>
          <input type="password" id="pw" autocomplete="current-password" required/>
        </div>
        <button type="submit" class="btn btn-primary">Login</button>
        \${errMsg ? '<p class="err">'+errMsg+'</p>' : ''}
      </form>
    </div>
  </div>\`;
  document.getElementById('lf').onsubmit = async e => {
    e.preventDefault();
    const r = await api('/admin/login','POST',{username:document.getElementById('un').value, password:document.getElementById('pw').value});
    if (r.ok) renderDashboard(); else renderLogin('❌ Invalid credentials');
  };
}

async function renderDashboard() {
  const [keys, cfg] = await Promise.all([
    api('/admin/keys'),
    api('/admin/config')
  ]);

  const keyRows = (keys.keys||[]).map(k=>\`
    <li class="key-item">
      <span class="key-val">\${k.keyValue}</span>
      \${k.note ? '<span class="key-note">'+k.note+'</span>' : ''}
      <span class="key-date">\${k.createdAt ? new Date(k.createdAt).toLocaleDateString() : ''}</span>
      <button class="btn btn-danger btn-sm" onclick="deleteKey(\${k.id})">Delete</button>
    </li>
  \`).join('');

  app.innerHTML = \`
  <header>
    <h1>🎮 Akshu Mod — Admin Panel</h1>
    <a href="#" onclick="logout()">Logout</a>
  </header>
  <div class="container">

    <div class="card">
      <h2>🔑 Access Keys <span class="tag">\${(keys.keys||[]).length} keys</span></h2>
      <ul class="key-list" id="key-list">\${keyRows || '<li style="color:#555;padding:10px 0">No keys yet. Add one below.</li>'}</ul>
      <div class="add-key-row">
        <input type="text" id="new-key" placeholder="Enter key value..."/>
        <input type="text" id="new-note" placeholder="Note (optional)" style="max-width:200px"/>
        <button class="btn btn-success" onclick="addKey()">+ Add Key</button>
      </div>
      <div class="status" id="key-status"></div>
    </div>

    <div class="row2">
      <div class="card">
        <h2>📜 Lua Script</h2>
        <div class="form-group">
          <label>Script Content (stored on server, never in files)</label>
          <textarea id="lua-script">\${escHtml(cfg.luaScript||'')}</textarea>
        </div>
        <button class="btn btn-primary" style="width:auto;padding:10px 24px" onclick="saveScript()">Save Script</button>
        <div class="status" id="script-status"></div>
      </div>

      <div class="card">
        <h2>💬 Alert Message (/nfo)</h2>
        <div class="form-group">
          <label>Message shown to users on login</label>
          <input type="text" id="alert-msg" value="\${escHtml(cfg.alertMessage||'')}"/>
        </div>
        <button class="btn btn-primary" style="width:auto;padding:10px 24px;margin-top:12px" onclick="saveAlert()">Save Alert</button>
        <div class="status" id="alert-status"></div>

        <div style="margin-top:24px;padding-top:20px;border-top:1px solid #222">
          <h2 style="margin-bottom:14px">ℹ️ Server Info</h2>
          <p style="font-size:12px;color:#666;line-height:1.7">
            POST /Access.php → Key verification endpoint<br/>
            GET /nfo → Alert message endpoint<br/>
            XOR key configured via XOR_KEY env var<br/>
            Admin: ADMIN_USERNAME / ADMIN_PASSWORD env vars
          </p>
        </div>
      </div>
    </div>

  </div>\`;
}

function escHtml(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}

async function addKey() {
  const kv = document.getElementById('new-key').value.trim();
  const note = document.getElementById('new-note').value.trim();
  if (!kv) return;
  const r = await api('/admin/keys','POST',{keyValue:kv, note});
  showStatus(document.getElementById('key-status'), r.ok ? '✅ Key added!' : '❌ '+r.error, !r.ok);
  if (r.ok) renderDashboard();
}

async function deleteKey(id) {
  if (!confirm('Delete this key?')) return;
  await api('/admin/keys/'+id,'DELETE');
  renderDashboard();
}

async function saveScript() {
  const s = document.getElementById('lua-script').value;
  const r = await api('/admin/config','POST',{luaScript:s});
  showStatus(document.getElementById('script-status'), r.ok ? '✅ Script saved!' : '❌ Error', !r.ok);
}

async function saveAlert() {
  const m = document.getElementById('alert-msg').value;
  const r = await api('/admin/config','POST',{alertMessage:m});
  showStatus(document.getElementById('alert-status'), r.ok ? '✅ Alert saved!' : '❌ Error', !r.ok);
}

async function logout() {
  await api('/admin/logout','POST');
  renderLogin();
}

(async () => {
  const r = await api('/admin/check');
  if (r.ok) renderDashboard(); else renderLogin();
})();
</script>
</body>
</html>`;

router.get("/admin", (_req, res) => {
  res.set("Content-Type", "text/html");
  res.send(ADMIN_HTML);
});

router.get("/admin/check", (req, res) => {
  res.json({ ok: isAuthenticated(req) });
});

router.post("/admin/login", (req, res) => {
  const { username, password } = req.body;
  if (!verifyCredentials(username, password)) {
    res.json({ ok: false, error: "Invalid credentials" });
    return;
  }
  const token = generateSessionToken();
  res.cookie(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env["NODE_ENV"] === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  res.json({ ok: true });
});

router.post("/admin/logout", (_req, res) => {
  res.clearCookie(ADMIN_COOKIE);
  res.json({ ok: true });
});

router.get("/admin/keys", requireAdmin, async (_req, res) => {
  try {
    const keys = await db.select().from(accessKeysTable).orderBy(accessKeysTable.createdAt);
    res.json({ keys });
  } catch (err) {
    logger.error({ err }, "Error fetching keys");
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/admin/keys", requireAdmin, async (req, res) => {
  try {
    const { keyValue, note } = req.body;
    if (!keyValue || typeof keyValue !== "string" || keyValue.trim() === "") {
      res.status(400).json({ ok: false, error: "Key value required" });
      return;
    }
    const inserted = await db
      .insert(accessKeysTable)
      .values({ keyValue: keyValue.trim(), note: note ?? "" })
      .returning();
    res.json({ ok: true, key: inserted[0] });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("unique") || msg.includes("duplicate")) {
      res.status(400).json({ ok: false, error: "Key already exists" });
    } else {
      logger.error({ err }, "Error adding key");
      res.status(500).json({ ok: false, error: "Server error" });
    }
  }
});

router.delete("/admin/keys/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    await db.delete(accessKeysTable).where(eq(accessKeysTable.id, id));
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "Error deleting key");
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

router.get("/admin/config", requireAdmin, async (_req, res) => {
  try {
    const rows = await db.select().from(serverConfigTable).limit(1);
    if (rows.length === 0) {
      res.json({ luaScript: "", alertMessage: "Akshu Mod Server Active!" });
      return;
    }
    res.json({ luaScript: rows[0].luaScript, alertMessage: rows[0].alertMessage });
  } catch (err) {
    logger.error({ err }, "Error fetching config");
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/admin/config", requireAdmin, async (req, res) => {
  try {
    const { luaScript, alertMessage } = req.body;
    const rows = await db.select().from(serverConfigTable).limit(1);

    const updates: Record<string, unknown> = {};
    if (typeof luaScript === "string") updates.luaScript = luaScript;
    if (typeof alertMessage === "string") updates.alertMessage = alertMessage;
    updates.updatedAt = new Date();

    if (rows.length === 0) {
      await db.insert(serverConfigTable).values({
        luaScript: luaScript ?? "",
        alertMessage: alertMessage ?? "Akshu Mod Server Active!",
      });
    } else {
      await db
        .update(serverConfigTable)
        .set(updates)
        .where(eq(serverConfigTable.id, rows[0].id));
    }
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "Error updating config");
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

export default router;
