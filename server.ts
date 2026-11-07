import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

const DATA_DIR = path.resolve(__dirname, 'data');
const DATA_FILE = path.resolve(DATA_DIR, 'notes.json');

const INITIAL_NOTES: Note[] = [
  {
    id: '1',
    title: 'Grocery List',
    content: '- Milk & Eggs\n- Sourdough Bread\n- Fresh Basil & Tomatoes\n- Olive Oil\n- Ground Coffee',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    id: '2',
    title: 'Meeting Notes: Project Kickoff',
    content: 'Discussed project scope, milestones, and tech stack. The frontend will be React with Tailwind, and backend will be Node.js Express.',
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
  {
    id: '3',
    title: 'Book Recommendation',
    content: '"Atomic Habits" by James Clear — focus on systems rather than goals. Small 1% improvements accumulate quickly over time.',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
];

function getNotes(): Note[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify(INITIAL_NOTES, null, 2), 'utf-8');
      return INITIAL_NOTES;
    }
    const data = fs.readFileSync(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : INITIAL_NOTES;
  } catch (err) {
    console.error('Error reading notes storage:', err);
    return INITIAL_NOTES;
  }
}

function saveNotes(notes: Note[]): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(notes, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving notes:', err);
  }
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // CRUD API:

  // 1. READ: Get all notes (optional search)
  app.get('/api/notes', (req: Request, res: Response) => {
    try {
      let notes = getNotes();
      const search = (req.query.search as string || '').toLowerCase().trim();

      if (search) {
        notes = notes.filter(
          (n) =>
            n.title.toLowerCase().includes(search) ||
            n.content.toLowerCase().includes(search)
        );
      }

      // Sort newest first
      notes.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

      res.json(notes);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to retrieve notes' });
    }
  });

  // 2. CREATE: Add new note
  app.post('/api/notes', (req: Request, res: Response) => {
    try {
      const { title, content } = req.body;
      const now = new Date().toISOString();

      const newNote: Note = {
        id: Date.now().toString(),
        title: (title || '').trim() || 'Untitled Note',
        content: (content || '').trim(),
        createdAt: now,
        updatedAt: now,
      };

      const notes = getNotes();
      notes.unshift(newNote);
      saveNotes(notes);

      res.status(201).json(newNote);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to create note' });
    }
  });

  // 3. UPDATE: Edit existing note
  app.put('/api/notes/:id', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { title, content } = req.body;
      const notes = getNotes();
      const index = notes.findIndex((n) => n.id === id);

      if (index === -1) {
        return res.status(404).json({ error: 'Note not found' });
      }

      const updatedNote: Note = {
        ...notes[index],
        title: title !== undefined ? title.trim() || 'Untitled Note' : notes[index].title,
        content: content !== undefined ? content : notes[index].content,
        updatedAt: new Date().toISOString(),
      };

      notes[index] = updatedNote;
      saveNotes(notes);

      res.json(updatedNote);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to update note' });
    }
  });

  // 4. DELETE: Remove note by ID
  app.delete('/api/notes/:id', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const notes = getNotes();
      const index = notes.findIndex((n) => n.id === id);

      if (index === -1) {
        return res.status(404).json({ error: 'Note not found' });
      }

      notes.splice(index, 1);
      saveNotes(notes);

      res.json({ success: true, id });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to delete note' });
    }
  });

  // Vite Integration: dev uses vite middleware; prod serves static dist
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Simple Notes server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Server error:', err);
  process.exit(1);
});
