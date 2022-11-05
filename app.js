const express = require("express");
const { open } = require("sqlite");
const path = require("path");
const sqlite3 = require("sqlite3");
const format = require("date-fns");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;
const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server is running on http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error:${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasSearchQProperty = (requestQuery) => {
  return requestQuery.search_q !== undefined;
};

const hasCategoryAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};

const hasCategoryProperty = (requestQuery) => {
  return requestQuery.category !== undefined;
};

const hasCategoryAndPriorityProperties = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};

app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodoQuery = "";
  const { search_q = "", status, priority, category } = request.query;

  switch (true) {
    case hasStatusProperty(request.query):
      getTodoQuery = `
            SELECT * FROM todo WHERE status LIKE '${status}';`;
      break;
    case hasPriorityProperty(request.query):
      getTodoQuery = `
            SELECT * FROM todo WHERE priority LIKE '${priority}';`;
      break;
    case hasPriorityAndStatusProperties(request.query):
      getTodoQuery = `
            SELECT * FROM todo WHERE priority LIKE '${priority}' AND status LIKE '${status}';`;
      break;
    case hasSearchQProperty(request.query):
      getTodoQuery = `
            SELECT * FROM todo WHERE todo LIKE '%${search_q}%';`;
      break;
    case hasCategoryAndStatusProperties(request.query):
      getTodoQuery = `
            SELECT * FROM todo WHERE category LIKE '${category}' AND status LIKE '${status}';`;
      break;
    case hasCategoryProperty(request.query):
      getTodoQuery = `
            SELECT * FROM todo WHERE category LIKE '${category}';`;
      break;
    case hasCategoryAndPriorityProperties(request.query):
      getTodoQuery = `
            SELECT * FROM todo WHERE category LIKE '${category}' AND priority LIKE '${priority}';`;
      break;
  }

  data = await db.all(getTodoQuery);
  response.send(data);
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const todoIdQuery = `
    SELECT * FROM todo WHERE id = ${todoId};`;
  const todoIdResponse = await db.get(todoIdQuery);
  response.send(todoIdResponse);
});

app.get("/agenda/", async (Request, response) => {
  // const { date } = request.query;
  const date = format(new Date(2021, 1, 21), "yyyy-MM-dd");
  const dateQuery = `
    SELECT * FROM todo WHERE due_date ='${date}';`;
  const dateQueryResponse = await db.get(dateQuery);
  response.send(dateQueryResponse);
});

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  const updateQuery = `
    INSERT INTO todo(id, todo, priority, status,category,due_date) 
    VALUES(${id},'${todo}','${priority}','${status}','${category}',${dueDate});`;
  await db.run(updateQuery);
  response.send("Todo Successfully Added");
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const todoDelQuery = `
    DELETE FROM todo WHERE id = ${todoId};`;
  const todoIdResponse = await db.run(todoDelQuery);
  response.send("Todo Deleted");
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updatedColumn = "";
  const requestBody = request.body;
  switch (true) {
    case requestBody.status !== undefined:
      updatedColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updatedColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      updatedColumn = "Todo";
      break;
    case requestBody.category !== undefined:
      updatedColumn = "Category";
      break;
    case requestBody.due_date !== undefined:
      updatedColumn = `Due Date`;
      break;
  }

  const previousTodoQuery = `
    SELECT * FROM todo WHERE id = ${todoId};`;
  const previousTodo = await db.get(previousTodoQuery);

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
    category = previousTodo.category,
    due_date = previousTodo.due_date,
  } = request.body;

  const updateTodoQuery = `
    UPDATE todo SET 
    todo = '${todo}',
    priority = '${priority}',
    status = '${status}',
    category = '${category}',
    due_date = '${due_date}';`;
  await db.run(updateTodoQuery);
  response.send(`${updatedColumn} Updated`);
});

module.exports = app;
