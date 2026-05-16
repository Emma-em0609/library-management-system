const API_URL = 'http://localhost:3000/api';


function showTab(tabName, event) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    document.getElementById(`${tabName}-tab`).classList.add('active');
    event.target.classList.add('active');

    if (tabName === 'books') loadBooks();
    if (tabName === 'readers') loadReaders();
    if (tabName === 'loans') loadLoans();
}

async function loadBooks() {
    try {
        const response = await fetch(`${API_URL}/books`);
        const books = await response.json();

        const tbody = document.querySelector('#books-table tbody');
        tbody.innerHTML = '';

        books.forEach(book => {
            const row = `
                <tr>
                    <td>${book.id}</td>
                    <td>${book.title}</td>
                    <td>${book.author}</td>
                    <td>${book.isbn || '-'}</td>
                    <td>${book.year || '-'}</td>
                    <td>${book.quantity}</td>
                    <td>${book.available}</td>
                    <td>
                        <button class="btn-edit" onclick="editBook(${book.id})">Редагувати</button>
                        <button class="btn-delete" onclick="deleteBook(${book.id})">Видалити</button>
                    </td>
                </tr>
            `;
            tbody.innerHTML += row;
        });
    } catch (error) {
        console.error('Помилка завантаження книг:', error);
    }
}

document.getElementById('book-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = document.getElementById('book-id').value;
    const book = {
        title: document.getElementById('book-title').value,
        author: document.getElementById('book-author').value,
        isbn: document.getElementById('book-isbn').value,
        year: parseInt(document.getElementById('book-year').value) || null,
        quantity: parseInt(document.getElementById('book-quantity').value),
        available: parseInt(document.getElementById('book-quantity').value)
    };

    try {
        if (id) {
            await fetch(`${API_URL}/books/${id}`, {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(book)
            });
        } else {
            await fetch(`${API_URL}/books`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(book)
            });
        }

        resetBookForm();
        loadBooks();
    } catch (error) {
        console.error('Помилка збереження книги:', error);
    }
});

function editBook(id) {
    fetch(`${API_URL}/books/${id}`)
        .then(res => res.json())
        .then(book => {
            document.getElementById('book-id').value = book.id;
            document.getElementById('book-title').value = book.title;
            document.getElementById('book-author').value = book.author;
            document.getElementById('book-isbn').value = book.isbn || '';
            document.getElementById('book-year').value = book.year || '';
            document.getElementById('book-quantity').value = book.quantity;
        });
}

async function deleteBook(id) {
    if (confirm('Ви впевнені, що хочете видалити цю книгу?')) {
        try {
            await fetch(`${API_URL}/books/${id}`, {method: 'DELETE'});
            loadBooks();
        } catch (error) {
            console.error('Помилка видалення книги:', error);
        }
    }
}

function resetBookForm() {
    document.getElementById('book-form').reset();
    document.getElementById('book-id').value = '';
}


async function loadReaders() {
    try {
        const response = await fetch(`${API_URL}/readers`);
        const readers = await response.json();

        const tbody = document.querySelector('#readers-table tbody');
        tbody.innerHTML = '';

        readers.forEach(reader => {
            const row = `
                <tr>
                    <td>${reader.id}</td>
                    <td>${reader.full_name}</td>
                    <td>${reader.email || '-'}</td>
                    <td>${reader.phone || '-'}</td>
                    <td>${new Date(reader.registration_date).toLocaleDateString('uk-UA')}</td>
                    <td>
                        <button class="btn-edit" onclick="editReader(${reader.id})">Редагувати</button>
                        <button class="btn-delete" onclick="deleteReader(${reader.id})">Видалити</button>
                    </td>
                </tr>
            `;
            tbody.innerHTML += row;
        });
    } catch (error) {
        console.error('Помилка завантаження читачів:', error);
    }
}

document.getElementById('reader-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = document.getElementById('reader-id').value;
    const reader = {
        full_name: document.getElementById('reader-name').value,
        email: document.getElementById('reader-email').value,
        phone: document.getElementById('reader-phone').value
    };

    try {
        if (id) {
            await fetch(`${API_URL}/readers/${id}`, {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(reader)
            });
        } else {
            await fetch(`${API_URL}/readers`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(reader)
            });
        }

        resetReaderForm();
        loadReaders();
    } catch (error) {
        console.error('Помилка збереження читача:', error);
    }
});

function editReader(id) {
    fetch(`${API_URL}/readers/${id}`)
        .then(res => res.json())
        .then(reader => {
            document.getElementById('reader-id').value = reader.id;
            document.getElementById('reader-name').value = reader.full_name;
            document.getElementById('reader-email').value = reader.email || '';
            document.getElementById('reader-phone').value = reader.phone || '';
        });
}

async function deleteReader(id) {
    if (confirm('Ви впевнені, що хочете видалити цього читача?')) {
        try {
            await fetch(`${API_URL}/readers/${id}`, {method: 'DELETE'});
            loadReaders();
        } catch (error) {
            console.error('Помилка видалення читача:', error);
        }
    }
}

function resetReaderForm() {
    document.getElementById('reader-form').reset();
    document.getElementById('reader-id').value = '';
}


async function loadLoans() {
    try {
        const response = await fetch(`${API_URL}/loans`);
        const loans = await response.json();

        const tbody = document.querySelector('#loans-table tbody');
        tbody.innerHTML = '';

        loans.forEach(loan => {
            const statusClass = loan.returned ? 'status-returned' : 'status-active';
            const statusText = loan.returned ? 'Повернуто' : 'Активна';
            const returnDate = loan.return_date ? new Date(loan.return_date).toLocaleDateString('uk-UA') : '-';

            const row = `
                <tr>
                    <td>${loan.id}</td>
                    <td>${loan.book_title}</td>
                    <td>${loan.reader_name}</td>
                    <td>${new Date(loan.loan_date).toLocaleDateString('uk-UA')}</td>
                    <td>${returnDate}</td>
                    <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                    <td>
                        ${!loan.returned ? `<button class="btn-return" onclick="returnBook(${loan.id})">Повернути</button>` : ''}
                        <button class="btn-delete" onclick="deleteLoan(${loan.id})">Видалити</button>
                    </td>
                </tr>
            `;
            tbody.innerHTML += row;
        });


        loadBooksForLoan();
        loadReadersForLoan();
    } catch (error) {
        console.error('Помилка завантаження видач:', error);
    }
}

async function loadBooksForLoan() {
    const response = await fetch(`${API_URL}/books`);
    const books = await response.json();

    const select = document.getElementById('loan-book');
    select.innerHTML = '<option value="">Оберіть книгу</option>';

    books.filter(b => b.available > 0).forEach(book => {
        select.innerHTML += `<option value="${book.id}">${book.title} (доступно: ${book.available})</option>`;
    });
}

async function loadReadersForLoan() {
    const response = await fetch(`${API_URL}/readers`);
    const readers = await response.json();

    const select = document.getElementById('loan-reader');
    select.innerHTML = '<option value="">Оберіть читача</option>';

    readers.forEach(reader => {
        select.innerHTML += `<option value="${reader.id}">${reader.full_name}</option>`;
    });
}

document.getElementById('loan-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const loan = {
        book_id: parseInt(document.getElementById('loan-book').value),
        reader_id: parseInt(document.getElementById('loan-reader').value)
    };

    try {
        await fetch(`${API_URL}/loans`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(loan)
        });

        document.getElementById('loan-form').reset();
        loadLoans();
    } catch (error) {
        console.error('Помилка видачі книги:', error);
    }
});

async function returnBook(id) {
    try {
        await fetch(`${API_URL}/loans/${id}/return`, {method: 'PUT'});
        loadLoans();
    } catch (error) {
        console.error('Помилка повернення книги:', error);
    }
}

async function deleteLoan(id) {
    if (confirm('Ви впевнені, що хочете видалити цю видачу?')) {
        try {
            await fetch(`${API_URL}/loans/${id}`, {method: 'DELETE'});
            loadLoans();
        } catch (error) {
            console.error('Помилка видалення видачі:', error);
        }
    }
}


loadBooks();