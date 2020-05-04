import sqlite3
from os import listdir
from os.path import join


def prepare_database(path: str, app: str, schemas_dir: str):
    versions = sorted(int(v) for v in listdir(schemas_dir))

    db = sqlite3.connect(path)
    c = db.cursor()

    c.execute("SELECT COUNT(*) FROM sqlite_master WHERE name = 'eucalyptus' AND type = 'table'")
    if c.fetchone()[0] == 0:
        # Apply latest version
        print(f"New database detected, applying version {versions[-1]}...")
        with open(join(schemas_dir, str(versions[-1]), 'create.sql')) as schema:
            c.executescript(schema.read())
    else:
        c.execute("SELECT version FROM eucalyptus WHERE app = ?", (app,))
        cur = c.fetchone()[0]
        if cur < versions[-1]:
            # Migrate to latest version
            for v in versions[versions.index(cur) + 1:]:
                with open(join(schemas_dir, str(v), 'up.sql')) as schema:
                    print(f"Migrating to version {v}...")
                    c.executescript(schema.read())

    db.commit()
