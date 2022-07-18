<script>
  // test: Temporary table (#)
  // test: truncate
  // test: delete
  // TODO: Cross join

  // @ts-nocheck
  import io from "socket.io-client";

  const socket = io("http://localhost:3000");
  const types = ["int", "varchar(255)"];
  const alterTypes = ["ADD", "DROP COLUMN", "ALTER COLUMN"];
  const saves = ["INSERT INTO", "CREATE TABLE"];
  let currentDatabase = "Products";

  let result = "";
  let rowsAffected = "";
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

  let cross = false;
  let crossTable = "";

  socket.on("queryResult", (data) => {
    result = JSON.stringify(data?.recordset);
    rowsAffected = JSON.stringify(data?.rowsAffected);
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
      socket.emit("query", query);
      if (saveResult) {
        socket.emit(`${_result} ${resultTable} ${query}`);
      }
    }
    if (cross) {
      socket.emit(
        "query",
        `SELECT ${queryColumns} FROM ${tableNames[0]} CROSS JOIN ${crossTable};`
      );
    } else {
      socket.emit("query", `SELECT ${queryColumns} FROM ${tableNames[0]};`);
    }
    [queryColumns, tableNames[0]] = ["*", ""];
  }

  function createDatabase() {
    if (db == "") return;
    console.log("create");
    socket.emit("query", `CREATE DATABASE ${db}`);
    console.log(`CREATE DATABASE ${db}`);
    // TODO: Fix
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

  let condition = "";

  function deleteRow() {
    if (table == "") return;
    socket.emit("query", `DELETE FROM ${tableName} WHERE ${condition};`);
  }

  function dropTable() {
    if (table == "") return;
    socket.emit("query", `DROP TABLE ${tableName};`);
    tableName = "";
  }

  function truncateTable() {
    if (table == "") return;
    socket.emit("query", `TRUNCATE TABLE ${tableName};`);
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

  function crossJoin() {
    cross = true;
  }

  function alterTable() {
    console.log(`ALTER TABLE ${tableName}\n${_alter} ${_alterColumn};`);
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
      {#each tableNames as _, i}
        {#if i != 0}<p><strong>{queryMerge}</strong></p>{/if}
        SELECT <input type="text" bind:value={queryColumns} /> FROM
        <input
          type="text"
          placeholder="Table name"
          bind:value={tableNames[i]}
        />
      {/each}
      {#if cross}
        <p>CROSS JOIN</p>
        <input type="text" bind:value={crossTable} />
      {/if}
      <button on:click={() => addTable("UNION")}>UNION</button>
      <button on:click={() => addTable("EXCEPT")}>EXCEPT</button>
      <button on:click={crossJoin}>CROSS JOIN</button>
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
          placeholder="Column_name datatype"
          bind:value={_alterColumn}
        />
        <button on:click={alterTable}>ALTER TABLE</button>
      </div>
      <div class="input-group">
        <input type="text" placeholder="Table name" bind:value={tableName} />
        WHERE
        <input type="text" placeholder="condition" bind:value={condition} />
        <button on:click={deleteRow}>DELETE ROW</button>
      </div>
      <div class="input-group">
        <input type="text" placeholder="Table name" bind:value={tableName} />
        <button on:click={dropTable}>DROP TABLE</button>
      </div>
      <div class="input-group">
        <input type="text" placeholder="Table name" bind:value={tableName} />
        <button on:click={truncateTable}>TRUNCATE TABLE</button>
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
    <p>Rows Affected: {rowsAffected}</p>
    <p>{result}</p>
  </div>
</main>

<style>
  main {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding-bottom: 20vh;
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
