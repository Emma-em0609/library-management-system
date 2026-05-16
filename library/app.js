const http = require('http');
const fs = require('fs');
const path = require('path');
const {Pool} = require('pg');

const PORT = 3000;


const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'library',
    password: '1111',
    port: 5432,
});


pool.connect((err) => {
    if (err) {
        console.error('❌ Помилка підключення до бази:', err);
    } else {
        console.log('✅ Підключено до PostgreSQL');
    }
});


function getRequestBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            try {
                resolve(body ? JSON.parse(body) : {});
            } catch (e) {
                reject(e);
            }
        });
    });
}


const server = http.createServer(async (req, res) => {

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    res.setHeader('Content-Type', 'application/json');

    try {
        const url = req.url;
        const method = req.method;

        if (url === '/' || url === '/index.html') {
            fs.readFile('index.html', (err, data) => {
                if (err) {
                    res.writeHead(500);
                    res.end('Помилка завантаження файлу');
                } else {
                    res.writeHead(200, {'Content-Type': 'text/html'});
                    res.end(data);
                }
            });
            return;
        }

        if (url === '/index.css') {
            fs.readFile('index.css', (err, data) => {
                if (err) {
                    res.writeHead(500);
                    res.end('Помилка завантаження файлу');
                } else {
                    res.writeHead(200, {'Content-Type': 'text/css'});
                    res.end(data);
                }
            });
            return;
        }

        if (url === '/index.js') {
            fs.readFile('index.js', (err, data) => {
                if (err) {
                    res.writeHead(500);
                    res.end('Помилка завантаження файлу');
                } else {
                    res.writeHead(200, {'Content-Type': 'application/javascript'});
                    res.end(data);
                }
            });
            return;
        }


        if (url === '/api/books' && method === 'GET') {
            const result = await pool.query('SELECT * FROM books ORDER BY id');
            res.writeHead(200);
            res.end(JSON.stringify(result.rows));
        } else if (url.match(/^\/api\/books\/\d+$/) && method === 'GET') {
            const id = url.split('/')[3];
            const result = await pool.query('SELECT * FROM books WHERE id = $1', [id]);
            res.writeHead(200);
            res.end(JSON.stringify(result.rows[0]));
        } else if (url === '/api/books' && method === 'POST') {
            const body = await getRequestBody(req);
            const {title, author, isbn, year, quantity, available} = body;
            const result = await pool.query(
                'INSERT INTO books (title, author, isbn, year, quantity, available) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
                [title, author, isbn, year, quantity, available || quantity]
            );
            res.writeHead(201);
            res.end(JSON.stringify(result.rows[0]));
        } else if (url.match(/^\/api\/books\/\d+$/) && method === 'PUT') {
            const id = url.split('/')[3];
            const body = await getRequestBody(req);
            const {title, author, isbn, year, quantity} = body;
            const result = await pool.query(
                'UPDATE books SET title = $1, author = $2, isbn = $3, year = $4, quantity = $5 WHERE id = $6 RETURNING *',
                [title, author, isbn, year, quantity, id]
            );
            res.writeHead(200);
            res.end(JSON.stringify(result.rows[0]));
        } else if (url.match(/^\/api\/books\/\d+$/) && method === 'DELETE') {
            const id = url.split('/')[3];
            await pool.query('DELETE FROM books WHERE id = $1', [id]);
            res.writeHead(200);
            res.end(JSON.stringify({message: 'Книгу видалено'}));
        } else if (url === '/api/readers' && method === 'GET') {
            const result = await pool.query('SELECT * FROM readers ORDER BY id');
            res.writeHead(200);
            res.end(JSON.stringify(result.rows));
        } else if (url.match(/^\/api\/readers\/\d+$/) && method === 'GET') {
            const id = url.split('/')[3];
            const result = await pool.query('SELECT * FROM readers WHERE id = $1', [id]);
            res.writeHead(200);
            res.end(JSON.stringify(result.rows[0]));
        } else if (url === '/api/readers' && method === 'POST') {
            const body = await getRequestBody(req);
            const {full_name, email, phone} = body;
            const result = await pool.query(
                'INSERT INTO readers (full_name, email, phone) VALUES ($1, $2, $3) RETURNING *',
                [full_name, email, phone]
            );
            res.writeHead(201);
            res.end(JSON.stringify(result.rows[0]));
        } else if (url.match(/^\/api\/readers\/\d+$/) && method === 'PUT') {
            const id = url.split('/')[3];
            const body = await getRequestBody(req);
            const {full_name, email, phone} = body;
            const result = await pool.query(
                'UPDATE readers SET full_name = $1, email = $2, phone = $3 WHERE id = $4 RETURNING *',
                [full_name, email, phone, id]
            );
            res.writeHead(200);
            res.end(JSON.stringify(result.rows[0]));
        } else if (url.match(/^\/api\/readers\/\d+$/) && method === 'DELETE') {
            const id = url.split('/')[3];
            await pool.query('DELETE FROM readers WHERE id = $1', [id]);
            res.writeHead(200);
            res.end(JSON.stringify({message: 'Читача видалено'}));
        } else if (url === '/api/loans' && method === 'GET') {
            const result = await pool.query(`
                SELECT l.*, b.title as book_title, r.full_name as reader_name
                FROM loans l
                         JOIN books b ON l.book_id = b.id
                         JOIN readers r ON l.reader_id = r.id
                ORDER BY l.id DESC
            `);
            res.writeHead(200);
            res.end(JSON.stringify(result.rows));
        } else if (url === '/api/loans' && method === 'POST') {
            const body = await getRequestBody(req);
            const {book_id, reader_id} = body;


            const bookCheck = await pool.query('SELECT available FROM books WHERE id = $1', [book_id]);
            if (bookCheck.rows[0].available < 1) {
                res.writeHead(400);
                res.end(JSON.stringify({error: 'Книга недоступна'}));
                return;
            }


            const result = await pool.query(
                'INSERT INTO loans (book_id, reader_id) VALUES ($1, $2) RETURNING *',
                [book_id, reader_id]
            );


            await pool.query('UPDATE books SET available = available - 1 WHERE id = $1', [book_id]);

            res.writeHead(201);
            res.end(JSON.stringify(result.rows[0]));
        } else if (url.match(/^\/api\/loans\/\d+\/return$/) && method === 'PUT') {
            const id = url.split('/')[3];


            const loanInfo = await pool.query('SELECT book_id FROM loans WHERE id = $1', [id]);
            const book_id = loanInfo.rows[0].book_id;


            const result = await pool.query(
                'UPDATE loans SET returned = true, return_date = CURRENT_DATE WHERE id = $1 RETURNING *',
                [id]
            );


            await pool.query('UPDATE books SET available = available + 1 WHERE id = $1', [book_id]);

            res.writeHead(200);
            res.end(JSON.stringify(result.rows[0]));
        } else if (url.match(/^\/api\/loans\/\d+$/) && method === 'DELETE') {
            const id = url.split('/')[3];


            const loanInfo = await pool.query('SELECT book_id, returned FROM loans WHERE id = $1', [id]);


            if (!loanInfo.rows[0].returned) {
                await pool.query('UPDATE books SET available = available + 1 WHERE id = $1', [loanInfo.rows[0].book_id]);
            }

            await pool.query('DELETE FROM loans WHERE id = $1', [id]);
            res.writeHead(200);
            res.end(JSON.stringify({message: 'Видачу видалено'}));
        } else {
            res.writeHead(404);
            res.end(JSON.stringify({error: 'Маршрут не знайдено'}));
        }

    } catch (error) {
        console.error('Помилка:', error);
        res.writeHead(500);
        res.end(JSON.stringify({error: error.message}));
    }
});

server.listen(PORT, () => {
    console.log(`🚀 Сервер запущено на http://localhost:${PORT}`);
});
