import os
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from psycopg2 import OperationalError


def get_env(name: str, default: str = "") -> str:
    v = os.getenv(name)
    return v if v is not None and v != "" else default


def load_dotenv_file(path: str = ".env") -> None:
    if not os.path.exists(path):
        return

    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            s = line.strip()
            if not s or s.startswith("#"):
                continue
            if "=" not in s:
                continue
            k, v = s.split("=", 1)
            k = k.strip()
            v = v.strip().strip('"').strip("'")
            if k and os.getenv(k) in (None, ""):
                os.environ[k] = v


def ensure_database_exists(host: str, user: str, password: str, port: int, db_name: str) -> None:
    # Connect to default postgres database to create target DB if missing
    try:
        conn = psycopg2.connect(
            host=host,
            user=user,
            password=password,
            port=port,
            dbname="postgres",
        )
    except OperationalError:
        if host == "localhost":
            conn = psycopg2.connect(
                host="127.0.0.1",
                user=user,
                password=password,
                port=port,
                dbname="postgres",
            )
        else:
            raise
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cur = conn.cursor()

    cur.execute("select 1 from pg_database where datname = %s", (db_name,))
    exists = cur.fetchone() is not None
    if not exists:
        cur.execute(f'create database "{db_name}"')

    cur.close()
    conn.close()


def init_schema(host: str, user: str, password: str, port: int, db_name: str) -> None:
    try:
        conn = psycopg2.connect(
            host=host,
            user=user,
            password=password,
            port=port,
            dbname=db_name,
        )
    except OperationalError:
        if host == "localhost":
            conn = psycopg2.connect(
                host="127.0.0.1",
                user=user,
                password=password,
                port=port,
                dbname=db_name,
            )
        else:
            raise
    cur = conn.cursor()

    cur.execute(
        """
        create table if not exists exchange_rates (
            country text primary key,
            currency text not null,
            cash_rate numeric not null,
            bank_rate numeric not null,
            usdt_rate numeric null,
            account_info text null,
            terms text null,
            updated_at timestamptz not null default now()
        );
        """
    )

    cur.execute(
        """
        create table if not exists customer_reviews (
            id bigserial primary key,
            name text null,
            rating int not null check (rating between 1 and 5),
            text text not null,
            approved boolean not null default true,
            created_at timestamptz not null default now()
        );
        """
    )

    conn.commit()
    cur.close()
    conn.close()


if __name__ == "__main__":
    load_dotenv_file()
    host = get_env("DB_HOST", "localhost")
    user = get_env("DB_USER", "postgres")
    password = get_env("DB_PASSWORD", "")
    port = int(get_env("DB_PORT", "5432"))
    db_name = get_env("DB_NAME", "atls_db")

    ensure_database_exists(host, user, password, port, db_name)
    init_schema(host, user, password, port, db_name)
    print("OK: database and tables are ready")
