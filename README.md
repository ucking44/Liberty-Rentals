# Liberty Rentals API

A REST API for managing users, books, and book rentals. 
Built with Laravel Passport for secure API authentication.

---

## Features

- User registration and login
- API token authentication using Passport
- Admin-only book creation, updating, and deletion
- Users can rent and return books
- Tracks availability of book copies
- Prevents renting the same book multiple times simultaneously

---

## Tech Stack

- PHP 8.x
- Laravel 12.x
- Laravel Passport 13
- MySQL or SQLite (for local testing)

---

### Setup Instructions

1. **Clone the repo:**
```bash
git clone https://github.com/ucking44/Liberty-Rentals.git
cd Liberty-Rentals
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan passport:install
php artisan serve


### Authentication
- `POST /api/register` - Register
- `POST /api/login` - Login
- Use the returned token as `Bearer <token>` in `Authorization` header for all protected routes.

### Books
- `GET /api/books` – List all books
- `GET /api/books/{id}` – Book details
- `POST /api/books` – Create book (admin only)
- `PUT /api/books/{id}` – Update book (admin only)
- `DELETE /api/books/{id}` – Delete book (admin only)

### Rentals
- `GET /api/rentals` - Fetch user rented book(s)
- `POST /api/rentals` – Rent a book
- `POST /api/return/{id}` – Return a book

### Notes
- Admin users must be created manually with the "is_admin" set to 1.

{
  "name": "John Doe",
  "email": "johndoe@johndoe.com",
  "password": "johndoe123",
  "is_admin": 1
}

- All rental logic ensures available copies are updated properly.

### License
MIT

/**
 * End of README.md
 */
 