import sqlite3
from os import getenv

from flask import g

DATABASE = getenv('EUCALYPTUS_DB')


def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect(DATABASE)
    return db
