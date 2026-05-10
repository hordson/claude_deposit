const express = require('express');
const app = express();
const PORT = 3000;

app.use(express.json());

let todos = [];
let nextId = 1;

app.get('/todos', (req, res) => {
  res.json(todos);
});

app.post('/todos', (req, res) => {
  const { task } = req.body;
  if (!task) return res.status(400).json({ error: 'Task is required' });
  const todo = { id: nextId++, task, done: false };
  todos.push(todo);
  res.status(201).json(todo);
});

app.patch('/todos/:id/done', (req, res) => {
  const todo = todos.find(t => t.id === parseInt(req.params.id));
  if (!todo) return res.status(404).json({ error: 'Todo not found' });
  todo.done = true;
  res.json(todo);
});

app.delete('/todos/:id', (req, res) => {
  const index = todos.findIndex(t => t.id === parseInt(req.params.id));
  if (index === -1) return res.status(404).json({ error: 'Todo not found' });
  todos.splice(index, 1);
  res.json({ message: 'Deleted' });
});

app.listen(PORT, () => {
  console.log(`Todo app running at http://localhost:${PORT}`);
});
