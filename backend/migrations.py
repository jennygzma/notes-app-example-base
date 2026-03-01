import sqlite3
from pathlib import Path
from typing import Optional


def run_migrations(db_path: Optional[Path] = None) -> int:
    if db_path is None:
        db_path = Path(__file__).parent / "generated" / "app.db"
    db_path.parent.mkdir(exist_ok=True)
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    with conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS schema_version (
                version INTEGER NOT NULL
            )
            """
        )
        row = conn.execute("SELECT version FROM schema_version LIMIT 1").fetchone()
        if not row:
            conn.execute("INSERT INTO schema_version (version) VALUES (1)")
            return 1
        return int(row["version"])
