# Todo App

A simple Node.js REST API for managing a to-do list.

## Setup

```bash
npm install
npm start
```

## Endpoints

| Method | URL | Description |
|--------|-----|-------------|
| GET | /todos | List all todos |
| POST | /todos | Add a new todo `{ "task": "..." }` |
| PATCH | /todos/:id/done | Mark a todo as done |
| DELETE | /todos/:id | Delete a todo |
