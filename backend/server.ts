import express, { Request, Response } from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import path from 'path';
import rateLimit from 'express-rate-limit';
import { body, validationResult } from 'express-validator';

const app = express();
const PORT = 8000;

// rate limiting - very generous for local use
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later' }
});

// middleware
app.use(limiter);
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' })); // limit JSON payload size

// database connection
const dbPath = path.join(__dirname, 'mieszkanieo.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
  } else {
    console.log('Connected to SQLite database');
    // create tables if they dont exist
    createTables();
  }
});

// create database tables
function createTables() {
  const createPropertiesTable = `
    CREATE TABLE IF NOT EXISTS properties (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      price INTEGER NOT NULL,
      area INTEGER,
      rooms INTEGER,
      level INTEGER,
      address TEXT NOT NULL,
      image TEXT,
      link TEXT NOT NULL UNIQUE,
      site TEXT NOT NULL,
      city TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;
  
  const createScrapingJobsTable = `
    CREATE TABLE IF NOT EXISTS scraping_jobs (
      id TEXT PRIMARY KEY,
      city TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      progress INTEGER DEFAULT 0,
      started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME,
      total_found INTEGER DEFAULT 0,
      error TEXT
    )
  `;

  db.run(createPropertiesTable, (err) => {
    if (err) console.error('Error creating properties table:', err.message);
    else console.log('Properties table ready');
  });

  db.run(createScrapingJobsTable, (err) => {
    if (err) console.error('Error creating scraping_jobs table:', err.message);
    else console.log('Scraping jobs table ready');
  });
}

// routes

// get all properties
app.get('/api/properties', (req, res) => {
  db.all('SELECT * FROM properties ORDER BY id DESC', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// get property by ID
app.get('/api/properties/:id', (req, res) => {
  const { id } = req.params;
  
  db.get('SELECT * FROM properties WHERE id = ?', [id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (!row) {
      res.status(404).json({ error: 'Property not found' });
      return;
    }
    
    res.json(row);
  });
});

// add new property
// create property (single)
app.post('/api/properties', [
  // validation
  body('id').isString().trim().isLength({ min: 1, max: 50 }),
  body('title').isString().trim().isLength({ min: 1, max: 500 }),
  body('price').isInt({ min: 0 }),
  body('area').optional().isInt({ min: 0 }),
  body('rooms').optional().custom((value) => {
    return value === null || value === undefined || Number.isInteger(value);
  }),
  body('level').optional().custom((value) => {
    return value === null || value === undefined || Number.isInteger(value);
  }),
  body('address').isString().trim().isLength({ min: 1, max: 1000 }),
  body('site').isString().trim().isIn(['allegro', 'gethome', 'nieruchomosci', 'olx', 'otodom']),
  body('link').isURL().isLength({ max: 1000 }),
  body('image').optional().isString().trim().isLength({ max: 1000 }),
  body('city').optional().isString().trim().isLength({ min: 1, max: 100 })
], (req: Request, res: Response) => {
  // Check validation results
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ 
      error: 'Invalid input data', 
      details: errors.array() 
    });
    return;
  }

  const { id, title, price, area, rooms, level, address, site, link, image, city } = req.body;
  
  const query = `
    INSERT INTO properties (id, title, price, area, rooms, level, address, site, link, image, city, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `;
  
  db.run(query, [id, title, price, area, rooms, level, address, site, link, image, city], function(err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        res.status(409).json({ error: 'Property with this link already exists' });
      } else {
        res.status(500).json({ error: err.message });
      }
      return;
    }
    
    res.json({ 
      id: id, 
      message: 'Property added successfully' 
    });
  });
});

// create properties (batch)
app.post('/api/properties/batch', [
  body('properties').isArray({ min: 1, max: 100 }), // Limit batch size
  body('properties.*.id').isString().trim().isLength({ min: 1, max: 50 }),
  body('properties.*.title').isString().trim().isLength({ min: 1, max: 500 }),
  body('properties.*.price').isInt({ min: 0 }),
  body('properties.*.area').optional().isInt({ min: 0 }),
  body('properties.*.rooms').optional().custom((value) => {
    return value === null || value === undefined || Number.isInteger(value);
  }),
  body('properties.*.level').optional().custom((value) => {
    return value === null || value === undefined || Number.isInteger(value);
  }),
  body('properties.*.address').isString().trim().isLength({ min: 1, max: 1000 }),
  body('properties.*.site').isString().trim().isIn(['allegro', 'gethome', 'nieruchomosci', 'olx', 'otodom']),
  body('properties.*.link').isURL().isLength({ max: 1000 }),
  body('properties.*.image').optional().isString().trim().isLength({ max: 1000 }),
  body('properties.*.city').optional().isString().trim().isLength({ min: 1, max: 100 })
], (req: Request, res: Response) => {
  // check validation results
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ 
      error: 'Invalid input data', 
      details: errors.array() 
    });
    return;
  }

  const properties = req.body.properties;
  let saved = 0;
  let skipped = 0;
  let errors_count = 0;
  
  const query = `
    INSERT OR IGNORE INTO properties (id, title, price, area, rooms, level, address, site, link, image, city, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `;
  
  // use a transaction (for better performance?)
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    
    const stmt = db.prepare(query);
    
    properties.forEach((property: any) => {
      const { id, title, price, area, rooms, level, address, site, link, image, city } = property;
      
      stmt.run([id, title, price, area, rooms, level, address, site, link, image, city], function(err) {
        if (err) {
          errors_count++;
          console.error('Error inserting property:', err.message);
        } else if (this.changes === 0) {
          skipped++; // property already exists
        } else {
          saved++;
        }
      });
    });
    
    stmt.finalize((err) => {
      if (err) {
        db.run('ROLLBACK');
        res.status(500).json({ error: 'Batch insert failed' });
        return;
      }
      
      db.run('COMMIT', (err) => {
        if (err) {
          res.status(500).json({ error: 'Failed to commit transaction' });
          return;
        }
        
        res.json({ 
          message: 'Batch insert completed',
          total: properties.length,
          saved: saved,
          skipped: skipped,
          errors: errors_count
        });
      });
    });
  });
});

// delete property
app.delete('/api/properties/:id', (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM properties WHERE id = ?', [id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (this.changes === 0) {
      res.status(404).json({ error: 'Property not found' });
      return;
    }
    
    res.json({ message: 'Property deleted successfully' });
  });
});

// delete properties by city
app.delete('/api/properties/city/:city', (req, res) => {
  const { city } = req.params;
  
  db.run('DELETE FROM properties WHERE city = ?', [city], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    res.json({ 
      message: `Deleted ${this.changes} properties from ${city}`,
      deletedCount: this.changes
    });
  });
});

// scraping jobs endpoints

// get all scraping jobs
app.get('/api/scraping-jobs', (req, res) => {
  db.all('SELECT * FROM scraping_jobs ORDER BY started_at DESC', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// get scraping job by ID
app.get('/api/scraping-jobs/:id', (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM scraping_jobs WHERE id = ?', [id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'Scraping job not found' });
      return;
    }
    res.json(row);
  });
});

// create new scraping job
app.post('/api/scraping-jobs', [
  body('id').isString().trim().isLength({ min: 1, max: 50 }),
  body('city').isString().trim().isLength({ min: 1, max: 100 })
], (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ 
      error: 'Invalid input data', 
      details: errors.array() 
    });
    return;
  }

  const { id, city } = req.body;
  
  const query = `
    INSERT INTO scraping_jobs (id, city, status, started_at)
    VALUES (?, ?, 'running', CURRENT_TIMESTAMP)
  `;
  
  db.run(query, [id, city], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    res.json({ 
      id: id, 
      message: 'Scraping job created successfully' 
    });
  });
});

// update scraping job
app.put('/api/scraping-jobs/:id', [
  body('status').optional().isString().trim().isIn(['pending', 'running', 'completed', 'failed']),
  body('progress').optional().isInt({ min: 0, max: 100 }),
  body('total_found').optional().isInt({ min: 0 }),
  body('error').optional().isString().trim()
], (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ 
      error: 'Invalid input data', 
      details: errors.array() 
    });
    return;
  }

  const { id } = req.params;
  const updates = req.body;
  
  // build dynamic update query
  const fields = Object.keys(updates);
  let setClause = fields.map(field => `${field} = ?`).join(', ');
  const values = fields.map(field => updates[field]);
  
  if (updates.status === 'completed') {
    setClause += ', completed_at = CURRENT_TIMESTAMP';
  }
  
  const query = `UPDATE scraping_jobs SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
  values.push(id);
  
  db.run(query, values, function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (this.changes === 0) {
      res.status(404).json({ error: 'Scraping job not found' });
      return;
    }
    
    res.json({ message: 'Scraping job updated successfully' });
  });
});

// health
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// start
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`API endpoint: http://localhost:${PORT}/api/properties`);
});

// shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed');
    }
    process.exit(0);
  });
});
