<script>
  // TODO: insert data to table
  // TODO: delete and alter tables
  // TODO: implement temporary table concept (check pdf)
  // TODO: style with Tailwind

  // @ts-nocheck
  import io from "socket.io-client";

  const socket = io("http://localhost:3000");
  const types = ["int", "varchar(255)"];
  let currentDatabase = "Products";

  let result = "";
  let db = "";
  let table = {};
  let tableName = "";
  let _col = "";
  let _type = "";
  let _values = "";
  let queryColumns = "*";

  socket.on("queryResult", (data) => {
    result = JSON.stringify(data);
  });

  function sendQuery() {
    socket.emit("query", `SELECT ${queryColumns} FROM [${tableName}]; `);
    [queryColumns, tableName] = ["*", ""];
  }

  function createDatabase() {
    if (db == "") return;
    socket.emit("query", `CREATE DATABASE ${db}`);
    db = "";
  }

  function dropDatabase() {
    if (db == "") return;
    socket.emit("query", `DROP DATABASE ${db}`);
    db = "";
  }

  function createTable() {
    if (table == "") return;
    let columns = "";
    Object.keys(table).forEach((key) => (columns += `${key} ${table[key]},`));
    socket.emit("query", `CREATE TABLE ${tableName} (${columns});`);
    [tableName, table] = ["", {}];
  }

  function dropTable() {
    if (table == "") return;
    socket.emit("query", `DROP TABLE ${tableName};`);
    tableName = "";
  }

  function insertInto() {
    if (tableName == "" || _values == "") return;
    socket.emit("query", `INSERT INTO ${tableName} VALUES (${_values});`);
    [tableName, _values] = ["", ""];
  }

  function addColumn() {
    if (_type == "" || _col == "") return;
    table[_col] = _type;
    [_type, _col] = ["", ""];
  }

  function deleteColumn(key) {
    delete table[key];
    table = table;
  }
</script>

<p><b>Current Database: </b>{currentDatabase}</p>
<p>
  SELECT <input type="text" bind:value={queryColumns} /> FROM
  <input type="text" placeholder="Table name" bind:value={tableName} />
  <button on:click={sendQuery}>EXECUTE</button>
</p>

<div>
  <input type="text" placeholder="Table" bind:value={tableName} />
  {#each Object.entries(table) as [key, val]}
    <div style="display: flex; flex-direction: row;">
      <p><b>{key}</b> {val}</p>
      <button on:click={() => deleteColumn(key)}>X</button>
    </div>
  {/each}
  <div>
    <form action="" on:submit|preventDefault={addColumn}>
      <input type="text" placeholder="Column" bind:value={_col} />
      <select bind:value={_type}>
        {#each types as type}
          <option value={type}>
            {type}
          </option>
        {/each}
      </select>
      <button>Add Column</button>
    </form>
  </div>
  {#if Object.keys(table) != 0}
    <button on:click={createTable}>Create Table</button>
  {/if}
  <p>
    Insert Into <input
      type="text"
      placeholder="Table name"
      bind:value={tableName}
    />
  </p>
  <p>Values <input type="text" placeholder="Values" bind:value={_values} /></p>
  <button on:click={insertInto}>Submit</button>
  <p>
    <input type="text" placeholder="Table name" bind:value={tableName} />
    <button on:click={dropTable}>DROP TABLE</button>
  </p>
</div>

<p>
  <input type="text" placeholder="Database name" bind:value={db} />
  <button on:click={createDatabase}>CREATE DATABASE</button>
</p>
<p>
  <input type="text" placeholder="Database name" bind:value={db} />
  <button on:click={dropDatabase}>DROP DATABASE</button>
</p>
<h1>Result</h1>
<p>{result}</p>

<style>
</style>
