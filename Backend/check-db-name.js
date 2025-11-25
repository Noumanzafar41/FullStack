const hana = require('@sap/hana-client');

const conn = hana.createConnection();
conn.connect({
  serverNode: 'a6ebc2e0-472f-4863-ad41-7952443ae110.hana.prod-us10.hanacloud.ondemand.com:443',
  uid: 'DBADMIN',
  pwd: 'Nouman@1122' // replace with your actual password
}, (err) => {
  if (err) return console.error('Connection error:', err);

  conn.exec('SELECT DATABASE_NAME FROM SYS.M_DATABASES', [], (err, rows) => {
    if (err) console.error('Query error:', err);
    else console.log('Database name:', rows);

    conn.disconnect();
  });
});
