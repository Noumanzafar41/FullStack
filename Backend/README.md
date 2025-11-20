# Backend Setup (SQL Server)

1. Duplicate `env.example` → `.env` and update:
   - `SQL_SERVER`: host name or IP (e.g. `DESKTOP-LRGKKJQ`)
   - `SQL_INSTANCE`: named instance (e.g. `SQLEXPRESS`, blank if default)
   - `SQL_PORT`: explicit port if SQL Browser is disabled (optional, e.g. `1433`)
   - `SQL_DATABASE`: database that holds `Users`
   - `SQL_USER` / `SQL_PASSWORD`: SQL authentication login that has `db_owner` or `db_datareader/db_datawriter` on the database
   - `SQL_ENCRYPT` / `SQL_TRUST_CERT`: set `true` when using Azure or trusted certificates
   - `PORT`: API port (default `3000`)

   > Tip: create a dedicated login for the app  
   > ```sql
   > CREATE LOGIN app_user WITH PASSWORD = 'ChangeThisPassword!';
   > CREATE USER app_user FOR LOGIN app_user;
   > EXEC sp_addrolemember 'db_owner', 'app_user';
   > ```

2. Install dependencies (run inside `Backend`):
   ```bash
   npm install
   ```

3. Ensure SQL Server is reachable and the configured login can create tables.
   The app bootstraps the schema automatically; it will create `dbo.Users` when missing.

4. Start the API:
   ```bash
   npm run start
   ```

## Users Table

```sql
CREATE TABLE dbo.Users (
  Id INT IDENTITY(1,1) PRIMARY KEY,
  Name NVARCHAR(150) NOT NULL,
  Email NVARCHAR(255) NOT NULL UNIQUE,
  PasswordHash NVARCHAR(255) NOT NULL,
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
```

Passwords are hashed with `bcrypt`. Use the Angular frontend to register/login against these endpoints.

