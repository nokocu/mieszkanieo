import express, { Request, Response } from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import path from 'path';
import rateLimit from 'express-rate-limit';
import { body, validationResult } from 'express-validator';
import { randomUUID } from 'crypto';

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
      current_status TEXT,
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
  const { 
    sites, 
    sort_by, 
    price_min, 
    price_max, 
    area_min, 
    area_max, 
    rooms_min, 
    rooms_max, 
    level_min, 
    level_max, 
    address, 
    city,
    limit 
  } = req.query;

  let query = 'SELECT * FROM properties WHERE 1=1';
  const params: any[] = [];

  // filter by sites
  if (sites !== undefined) {
    const siteArray = Array.isArray(sites) ? sites : [sites];
    const validSites = siteArray.filter(site => 
      ['allegro', 'gethome', 'nieruchomosci', 'olx', 'otodom'].includes(site as string)
    );
    if (validSites.length > 0) {
      const placeholders = validSites.map(() => '?').join(',');
      query += ` AND site IN (${placeholders})`;
      params.push(...validSites);
    } else {
      // no valid sites selected: return empty
      query += ` AND 1=0`;
    }
  }

  // filter by price range
  if (price_min) {
    query += ' AND price >= ?';
    params.push(parseInt(price_min as string));
  }
  if (price_max) {
    query += ' AND price <= ?';
    params.push(parseInt(price_max as string));
  }

  // filter by area range
  if (area_min) {
    query += ' AND (area >= ? OR area IS NULL)';
    params.push(parseInt(area_min as string));
  }
  if (area_max) {
    query += ' AND (area <= ? OR area IS NULL)';
    params.push(parseInt(area_max as string));
  }

  // filter by rooms range
  if (rooms_min) {
    query += ' AND (rooms >= ? OR rooms IS NULL)';
    params.push(parseInt(rooms_min as string));
  }
  if (rooms_max) {
    query += ' AND (rooms <= ? OR rooms IS NULL)';
    params.push(parseInt(rooms_max as string));
  }

  // filter by level range
  if (level_min) {
    query += ' AND (level >= ? OR level IS NULL)';
    params.push(parseInt(level_min as string));
  }
  if (level_max) {
    query += ' AND (level <= ? OR level IS NULL)';
    params.push(parseInt(level_max as string));
  }

  // filter by address
  if (address) {
    query += ' AND address LIKE ?';
    params.push(`%${address}%`);
  }

  // filter by city
  if (city) {
    query += ' AND city LIKE ?';
    params.push(`%${city}%`);
  }

  // sorting
  if (sort_by === 'price_asc') {
    query += ' ORDER BY price ASC';
  } else if (sort_by === 'price_desc') {
    query += ' ORDER BY price DESC';
  } else if (sort_by === 'area_asc') {
    query += ' ORDER BY area ASC';
  } else if (sort_by === 'area_desc') {
    query += ' ORDER BY area DESC';
  } else {
    query += ' ORDER BY created_at DESC';
  }

  // limit
  if (limit) {
    query += ' LIMIT ?';
    params.push(parseInt(limit as string));
  }

  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('Database error:', err);
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

// delete all properties
app.delete('/api/properties', (req, res) => {
  db.run('DELETE FROM properties', function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    res.json({ 
      message: `Deleted all ${this.changes} properties from database`,
      deletedCount: this.changes
    });
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
  body('current_status').optional().isString().trim(),
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
  
  const query = `UPDATE scraping_jobs SET ${setClause} WHERE id = ?`;
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

// refresh/scraping endpoint
app.post('/api/refresh', [
  body('city').notEmpty().withMessage('City is required'),
  body('sites').isArray().withMessage('Sites must be an array'),
  body('sites.*').isIn(['allegro', 'gethome', 'nieruchomosci', 'olx', 'otodom']).withMessage('Invalid site'),
], async (req: Request, res: Response) => {
  try {
    // validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { city, sites, sitePages = {} } = req.body;
    
    // create a unique job id
    const jobId = randomUUID();
    
    // insert job into database
    const insertJob = `
      INSERT INTO scraping_jobs (id, city, status, progress, total_found, started_at)
      VALUES (?, ?, 'running', 0, 0, CURRENT_TIMESTAMP)
    `;
    
    db.run(insertJob, [jobId, city], function(err) {
      if (err) {
        console.error('Error creating scraping job:', err.message);
        return res.status(500).json({ 
          success: false, 
          error: 'Failed to create scraping job' 
        });
      }
    });

    // return job id immediately (async processing)
    res.json({ 
      success: true, 
      jobId,
      message: 'Scraping job started',
      sites: sites.length,
      city 
    });

    // run scraping asynchronously
    runScrapingJob(jobId, city, sites, sitePages);

  } catch (error) {
    console.error('Error in refresh endpoint:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// get scraping job status
app.get('/api/refresh/:jobId', (req: Request, res: Response) => {
  const { jobId } = req.params;
  
  const query = 'SELECT * FROM scraping_jobs WHERE id = ?';
  db.get(query, [jobId], (err, row: any) => {
    if (err) {
      console.error('Error fetching job status:', err.message);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch job status' 
      });
    }
    
    if (!row) {
      return res.status(404).json({ 
        success: false, 
        error: 'Job not found' 
      });
    }
    
    res.json({ 
      success: true, 
      job: {
        id: row.id,
        city: row.city,
        status: row.status,
        progress: row.progress,
        totalFound: row.total_found,
        currentStatus: row.current_status,
        startedAt: row.started_at,
        completedAt: row.completed_at,
        error: row.error
      }
    });
  });
});

// helper function to run scraping job
async function runScrapingJob(jobId: string, city: string, sites: string[], sitePages: Record<string, string>) {
  console.log(`Starting scraping job ${jobId} for city: ${city}, sites: ${sites.join(', ')}`);
  
  const { spawn } = require('child_process');
  const path = require('path');
  
  let totalProcessed = 0;
  let totalFound = 0;
  const totalSites = sites.length;
  
  // update job progress function
  const updateProgress = (progress: number, found: number, status: string, currentStatus?: string, error?: string) => {
    const updateQuery = `
      UPDATE scraping_jobs 
      SET progress = ?, total_found = ?, status = ?, current_status = ?, error = ?,
          completed_at = CASE WHEN status = 'completed' OR status = 'failed' THEN CURRENT_TIMESTAMP ELSE completed_at END
      WHERE id = ?
    `;
    db.run(updateQuery, [progress, found, status, currentStatus || null, error || null, jobId], (err) => {
      if (err) console.error('Error updating job progress:', err.message);
    });
  };
  
  // delete all existing properties at the start of the job
  console.log(`Clearing existing data before scraping...`);
  try {
    await new Promise((resolve, reject) => {
      db.run('DELETE FROM properties', (err) => {
        if (err) {
          console.error('Error deleting existing properties:', err.message);
          reject(err);
        } else {
          console.log('Successfully cleared existing properties');
          resolve(undefined);
        }
      });
    });
  } catch (error) {
    console.error('Failed to clear existing data:', error);
    updateProgress(0, 0, 'failed', 'Failed to clear existing data');
    return;
  }

  try {
    for (const site of sites) {
      console.log(`Processing site: ${site} for job ${jobId}`);
      
      // determine config file
      const configFile = path.join(__dirname, 'scraper', 'cfg', `${site}.json`);
      
      // determine max pages
      const maxPages = sitePages[site] && sitePages[site] !== 'all' ? sitePages[site] : 'all';
      
      // prepare python command
      const pythonArgs = [
        path.join(__dirname, 'scraper_entry.py'),
        configFile,
        city.toLowerCase(),
        jobId  // pass job ID for status updates
      ];
      
      if (maxPages !== 'all') {
        pythonArgs.push(maxPages);
      }
      
      // run python scraper
      const pythonPath = path.join(__dirname, '..', '.venv', 'Scripts', 'python.exe');
      const pythonProcess = spawn(pythonPath, ['-u', ...pythonArgs]);
      
      let output = '';
      let errorOutput = '';
      
      pythonProcess.stdout.on('data', (data: Buffer) => {
        const output_line = data.toString().trim();
        output += output_line + '\n';
        console.log(`[${site}] ${output_line}`);
        
        // parse status updates from python
        if (output_line.startsWith('STATUS:')) {
          const statusMessage = output_line.replace('STATUS:', '').trim();
          const currentProgress = Math.round(((totalProcessed / totalSites) + (1 / totalSites) * 0.5) * 100);
          updateProgress(currentProgress, totalFound, 'running', statusMessage);
        }
      });
      
      pythonProcess.stderr.on('data', (data: Buffer) => {
        errorOutput += data.toString();
        console.error(`[${site}] Error: ${data.toString().trim()}`);
      });
      
      // wait for process to complete
      await new Promise((resolve, reject) => {
        pythonProcess.on('close', (code: number) => {
          totalProcessed++;
          const progress = Math.round((totalProcessed / totalSites) * 100);
          
          if (code === 0) {
            // extract found count from output (if available)
            const foundMatch = output.match(/found: (\d+)/);
            const found = foundMatch ? parseInt(foundMatch[1]) : 0;
            totalFound += found;
            
            console.log(`[${site}] Completed successfully. Found: ${found}`);
            updateProgress(progress, totalFound, totalProcessed === totalSites ? 'completed' : 'running');
            resolve(code);
          } else {
            console.error(`[${site}] Failed with exit code: ${code}`);
            const error = `Site ${site} failed: ${errorOutput || 'Unknown error'}`;
            updateProgress(progress, totalFound, 'failed', undefined, error);
            reject(new Error(error));
          }
        });
        
        pythonProcess.on('error', (err: Error) => {
          console.error(`[${site}] Process error:`, err);
          reject(err);
        });
      });
    }
    
    console.log(`Scraping job ${jobId} completed. Total found: ${totalFound}`);
    updateProgress(100, totalFound, 'completed', `Zakończono. Łącznie znaleziono: ${totalFound} ogłoszeń.`);
    
  } catch (error) {
    console.error(`Scraping job ${jobId} failed:`, error);
    updateProgress(100, totalFound, 'failed', undefined, error instanceof Error ? error.message : 'Unknown error');
  }
}

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
