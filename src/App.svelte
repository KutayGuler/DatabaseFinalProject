<script>
  // TODO: (TEST) perform union result to other table
  // TODO: (TEST) perform minus result to other table
  // TODO: (TEST) insert data to table
  // TODO: (TEST) delete and alter tables
  // TODO: (TEST) perform selection result to other table
  // TODO: (TEST) perform projection result to other table
  // TODO: (TEST) perform cross product result to other table

  // TODO: implement temporary table concept (check pdf)
  // TODO: create 2 or more tables with desired attributes and tuples

  // @ts-nocheck
  import io from "socket.io-client";

  const socket = io("http://localhost:3000");
  const types = ["int", "varchar(255)"];
  const alterTypes = ["ADD", "DROP COLUMN", "ALTER COLUMN"];
  const saves = ["INSERT INTO", "CREATE TABLE"];
  let currentDatabase = "Products";

  let result = "";
  let db = "";
  let table = {};
  let tableName = "";
  let tableNames = [""];
  let queryMerge = "";
  let _col = "";
  let _type = types[0];
  let _alter = alterTypes[0];
  let _alterColumn = "";
  let _values = "";
  let queryColumns = "*";
  let saveResult = false;
  let resultTable = "";
  let _result = saves[0];

  socket.on("queryResult", (data) => {
    result = JSON.stringify(data);
  });

  function sendQuery() {
    if (tableNames.length > 1) {
      let query = "";
      tableNames.forEach(
        (table) =>
          (query += `SELECT ${queryColumns} FROM [${table}]\n${queryMerge}\n`)
      );
      query = query.slice(0, query.length - 7);
      console.log(query);
      return;
      socket.emit("query", query);
      if (saveResult) {
        socket.emit(`${_result} ${resultTable} ${query}`);
      }
    }
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

  function addTable(q) {
    queryMerge = q;
    tableNames = [...tableNames, ""];
  }

  function alterTable() {
    console.log(`ALTER TABLE ${tableName}\n${_alter} ${_alterColumn};`);
    return;
    socket.emit(
      "query",
      `ALTER TABLE ${tableName}\n${_alter} ${_alterColumn};`
    );
  }
</script>

<main>
  <div>
    <p><b>Current Database: </b>{currentDatabase}</p>
    <p>
      {#each tableNames as table, i}
        {#if i != 0}<p><strong>{queryMerge}</strong></p>{/if}
        SELECT <input type="text" bind:value={queryColumns} /> FROM
        <input type="text" placeholder="Table name" bind:value={table} />
      {/each}
      <button on:click={() => addTable("UNION")}>UNION</button>
      <button on:click={() => addTable("MINUS")}>MINUS</button>
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
      <input type="text" placeholder="Values" bind:value={_values} />
      <button on:click={insertInto}>Submit</button>
      <div class="input-group">
        <input type="text" placeholder="Table name" bind:value={tableName} />
        <select bind:value={_alter}>
          {#each alterTypes as type}
            <option value={type}>
              {type}
            </option>
          {/each}
        </select>
        <input
          type="text"
          placeholder="Column name"
          bind:value={_alterColumn}
        />
        <button on:click={alterTable}>ALTER TABLE</button>
      </div>
      <div class="input-group">
        <input type="text" placeholder="Table name" bind:value={tableName} />
        <button on:click={dropTable}>DROP TABLE</button>
      </div>
    </div>

    <div class="input-group">
      <input type="text" placeholder="Database name" bind:value={db} />
      <button on:click={createDatabase}>CREATE DATABASE</button>
    </div>
    <div class="input-group">
      <input type="text" placeholder="Database name" bind:value={db} />
      <button on:click={dropDatabase}>DROP DATABASE</button>
    </div>
    <h1>Result</h1>
    <label for="">Save Result to Table</label>
    <input style="width: 2vw;" type="checkbox" bind:checked={saveResult} />
    {#if saveResult}
      <select bind:value={_result}>
        {#each saves as save}
          <option value={save}>
            {save}
          </option>
        {/each}
      </select>
      <input type="text" placeholder="Table Name" bind:value={resultTable} />
    {/if}
    <p>{result}</p>
  </div>
</main>

<style>
  main {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  main > div {
    padding-top: 10vh;
    height: 100vh;
    width: 75vw;
  }

  .input-group {
    display: flex;
    flex-direction: row;
    gap: 2%;
  }
</style>
