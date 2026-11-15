import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const PORT = 3000;
const ROOT_DIR = import.meta.dirname;
const UPLOADS_DIR = path.resolve(ROOT_DIR, 'uploads');
const CONFIG_PATH = path.resolve(ROOT_DIR, 'firebase-applet-config.json');

fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const BOOTSTRAP_ADMIN_EMAIL = 'solankimansukh36@gmail.com';

interface FirebaseConfig {
  apiKey?: string;
  projectId?: string;
  firestoreDatabaseId?: string;
}

function getFirebaseConfig(): FirebaseConfig {
  try {
    const raw = fs.readFileSync(CONFIG_PATH, 'utf8');
    return JSON.parse(raw) as FirebaseConfig;
  } catch {
    return {};
  }
}

async function verifyAdminUser(idToken: string): Promise<{ uid: string; email: string } | null> {
  const cfg = getFirebaseConfig();
  if (!cfg.apiKey || !idToken) return null;

  try {
    const resp = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(cfg.apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      },
    );
    if (!resp.ok) return null;
    const data = (await resp.json()) as {
      users?: Array<{ localId?: string; email?: string; emailVerified?: boolean }>;
    };
    const u = data.users?.[0];
    if (!u?.localId || !u.emailVerified) return null;

    const email = (u.email || '').toLowerCase();
    if (email === BOOTSTRAP_ADMIN_EMAIL) {
      return { uid: u.localId, email };
    }

    if (cfg.projectId && cfg.firestoreDatabaseId) {
      const adminDocResp = await fetch(
        `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(cfg.projectId)}/databases/${encodeURIComponent(cfg.firestoreDatabaseId)}/documents/admins/${encodeURIComponent(u.localId)}`,
        {
          headers: { Authorization: `Bearer ${idToken}` },
        },
      );
      if (adminDocResp.ok) {
        return { uid: u.localId, email };
      }
    }

    return null;
  } catch {
    return null;
  }
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));
  app.use('/uploads', express.static(UPLOADS_DIR));

  app.post('/api/upload', async (req, res) => {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    const verifiedAdmin = await verifyAdminUser(token);

    if (!verifiedAdmin) {
      res.status(401).json({ error: 'Authorized administrator sign-in required to upload images.' });
      return;
    }

    const body = req.body as { dataUrl?: string; filename?: string };
    const dataUrl = body?.dataUrl || '';
    const match = /^data:image\/(png|jpeg|jpg|webp|gif);base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
    if (!match) {
      res.status(400).json({ error: 'Invalid image file. Please upload PNG, JPEG, WEBP, or GIF.' });
      return;
    }

    const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
    const buffer = Buffer.from(match[2], 'base64');
    if (buffer.byteLength > 6 * 1024 * 1024) {
      res.status(400).json({ error: 'Image size must be under 6 MB.' });
      return;
    }

    const filename = `hk_${Date.now()}_${crypto.randomBytes(4).toString('hex')}.${ext}`;
    const targetPath = path.join(UPLOADS_DIR, filename);
    fs.writeFileSync(targetPath, buffer);

    res.json({ url: `/uploads/${filename}` });
  });

  if (process.env.NODE_ENV === 'production') {
    const distDir = path.resolve(ROOT_DIR, 'dist');
    app.use(express.static(distDir));
    app.get('/{*splat}', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Hast Kala server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
