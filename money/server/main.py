import csv
import json
import sqlite3
from datetime import datetime
from io import StringIO
from os import getenv
from os.path import dirname, realpath, join, abspath

from flask import Flask, request, g, send_file
from werkzeug.exceptions import BadRequest

from server.db import prepare_database
from server.sql import fetch_all_as_dict, Cond, Column, require_one, require_changed_row, JoiningTable, Join
from server.validation import validate_str, validate_int, validate_timestamp, require_json_object_body, parse_money_amount

DATABASE = getenv('EUCALYPTUS_DB')

PROJ_DIR = realpath(join(dirname(abspath(__file__)), '..'))
DATABASE_SCHEMAS_DIR = join(PROJ_DIR, 'db')
CLIENT_BUILD_DIR = join(PROJ_DIR, 'client', 'build')
CLIENT_BUILD_PAGE = join(CLIENT_BUILD_DIR, 'index.html')

prepare_database(DATABASE, 'money', DATABASE_SCHEMAS_DIR)

server = Flask(
    __name__,
    static_url_path='',
    static_folder=CLIENT_BUILD_DIR,
)


def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect(DATABASE)
    return db


@server.teardown_request
def commit_transaction(exception):
    # TODO Unlock tables
    db = getattr(g, '_database', None)
    if db is not None and not exception:
        db.commit()


@server.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()
    if exception is not None:
        raise exception


@server.route('/', methods=['GET'])
def root():
    return send_file(CLIENT_BUILD_PAGE, cache_timeout=0)


@server.route("/dataset_sources", methods=['POST'])
def create_dataset_source():
    opt = require_json_object_body()
    name = validate_str(opt, 'name', min_len=1)
    comment = validate_str(opt, 'comment', optional='')
    c = get_db().cursor()
    # TODO Handle errors
    c.execute("INSERT INTO dataset_source (name, comment) VALUES (?, ?)", (name, comment))
    return {
        "id": c.lastrowid,
    }


@server.route("/dataset_sources", methods=['GET'])
def get_dataset_sources():
    return {
        "sources": fetch_all_as_dict(
            c=get_db().cursor(),
            table='dataset_source',
            cols=(
                Column('id'),
                Column('name'),
            ),
            where=Cond('TRUE'),
        ),
    }


@server.route("/dataset_source/<source>/datasets", methods=['POST'])
def create_dataset(**args):
    source = validate_int(args, 'source', min_val=0, parse_from_str=True)
    opt = request.args
    timestamp_column = validate_int(opt, 'timestamp', parse_from_str=True)
    timestamp_format = validate_str(opt, 'format')
    description_column = validate_int(opt, 'description', parse_from_str=True)
    amount_column = validate_int(opt, 'amount', parse_from_str=True)

    c = get_db().cursor()
    # TODO Handle errors
    c.execute("INSERT INTO dataset (source, comment, created) VALUES (?, '', DATETIME('now'))", (source,))
    dataset_id = c.lastrowid
    for row in csv.reader(StringIO(request.get_data(as_text=True))):
        raw = json.dumps(row)
        malformed = False

        try:
            # TODO Convert to UTC
            timestamp = datetime.strptime(row[timestamp_column], timestamp_format)
        except (IndexError, ValueError):
            # TODO Convert to UTC
            timestamp = datetime.now()
            malformed = True

        try:
            description = row[description_column]
        except IndexError:
            description = ''
            malformed = True

        try:
            amount = parse_money_amount(row[amount_column])
        except (IndexError, ValueError):
            amount = 0
            malformed = True

        c.execute(
            "INSERT INTO txn (dataset, raw, comment, malformed, timestamp, description, amount) VALUES (?, ?, '', ?, ?, ?, ?)",
            (dataset_id, raw, malformed, timestamp, description, amount)
        )
        transaction_id = c.lastrowid
        if not malformed:
            c.execute(
                "INSERT INTO txn_part (txn, comment, amount, category) VALUES (?, '', ?, NULL)",
                (transaction_id, amount)
            )

    return {
        "id": dataset_id,
    }


@server.route("/datasets", methods=['GET'])
def get_datasets():
    return {
        "datasets": fetch_all_as_dict(
            c=get_db().cursor(),
            table='dataset',
            cols=(
                Column('dataset.id', 'id'),
                Column('dataset.source', 'source_id'),
                Column('dataset_source.name', 'source_name'),
                Column('dataset.comment', 'comment'),
                Column('dataset.created', 'created'),
            ),
            joins=(
                JoiningTable(Join.left, 'dataset_source', "dataset_source.id = dataset.source"),
            ),
            where=Cond('TRUE'),
        )
    }


@server.route("/categories", methods=['POST'])
def create_category():
    opt = require_json_object_body()
    name = validate_str(opt, 'name')
    target = validate_int(opt, 'target', min_val=0, optional=True)
    mode = validate_str(opt, 'mode')

    # TODO Lock table
    c = get_db().cursor()

    if target is None:
        if mode != 'root':
            raise BadRequest('Target is missing')
        if c.execute("SELECT COUNT(*) FROM category").fetchone()[0] != 0:
            raise BadRequest('Root already exists')
        target_start = -1
        mode = 'first'
    else:
        c.execute("SELECT set_start, set_end FROM category WHERE id = ?", (target,))
        target_start, target_end = require_one(c.fetchall())

    if mode == 'after':
        shift_greater_than = target_end
    elif mode == 'before':
        shift_greater_than = target_start - 1
    elif mode == 'first':
        shift_greater_than = target_start
    else:
        raise BadRequest('Invalid mode')

    c.execute("UPDATE category SET set_start = set_start + 2 WHERE set_start > ?", (shift_greater_than,))
    c.execute("UPDATE category SET set_end = set_end + 2 WHERE set_end > ?", (shift_greater_than,))
    # TODO Handle unique
    c.execute(
        "INSERT INTO category (name, comment, set_start, set_end) VALUES (?, '', ?, ?)",
        (name, shift_greater_than + 1, shift_greater_than + 2)
    )

    category_id = c.lastrowid
    # TODO Unlock table
    return {
        "id": category_id,
    }


@server.route("/transactions", methods=['GET'])
def get_transactions():
    opt = request.args
    year = validate_int(opt, 'year', min_val=0, max_val=9999, parse_from_str=True, optional=True)
    month = validate_int(opt, 'month', min_val=1, max_val=12, parse_from_str=True, optional=True)
    dataset = validate_int(opt, 'dataset', min_val=0, parse_from_str=True, optional=True)

    cond = Cond('TRUE')
    if month is not None:
        cond += Cond("strftime(%m, txn.timestamp) = ?", f'{month:02}')
    if year is not None:
        cond += Cond("strftime(%Y, txn.timestamp) = ?", f'{year:04}')
    if dataset is not None:
        cond += Cond("txn.dataset = ?", dataset)

    transactions = fetch_all_as_dict(
        c=get_db().cursor(),
        table='txn',
        cols=(
            Column('txn.id', 'id'),
            Column('txn.comment', 'comment'),
            Column('txn.malformed', 'malformed'),
            Column('txn.timestamp', 'timestamp'),
            Column('txn.description', 'description'),
            Column('txn.amount', 'transaction_amount'),
            Column('SUM(txn_part.amount)', 'combined_amount'),
            Column("GROUP_CONCAT(txn_part.category, ',')", 'combined_categories'),
        ),
        joins=(
            JoiningTable(Join.left, 'txn_part', 'txn_part.txn = txn.id'),
        ),
        where=cond,
        group_by="txn_part.txn"
    )
    for t in transactions:
        raw_combined_categories = t['combined_categories']
        t['combined_categories'] = [] if not raw_combined_categories else [int(c) for c in raw_combined_categories.split(',')]

    return {
        "transactions": transactions,
    }


@server.route("/transaction/<transaction>", methods=['PATCH'])
def update_transaction(**args):
    transaction = validate_int(args, 'transaction', min_val=0, parse_from_str=True)
    opt = require_json_object_body()
    comment = validate_str(opt, 'comment', optional=True)
    timestamp = validate_timestamp(opt, 'timestamp', optional=True)
    description = validate_str(opt, 'description', optional=True)
    amount = validate_int(opt, 'amount', optional=True)
    updates = [(col, val) for col, val in (
        ('comment', comment),
        ('timestamp', timestamp),
        ('description', description),
        ('amount', amount),
    ) if val is not None]
    c = get_db().cursor()
    c.execute(
        f"UPDATE txn SET malformed = FALSE, {','.join((f'{col} = ?' for (col, _) in updates))} WHERE id = ?",
        (*(val for (_, val) in updates), transaction)
    )
    require_changed_row(c.rowcount)
    return {}


@server.route("/transaction/<transaction>", methods=['DELETE'])
def delete_transaction(**args):
    transaction = validate_int(args, 'transaction', min_val=0, parse_from_str=True)
    c = get_db().cursor()
    c.execute("DELETE FROM txn WHERE id = ?", (transaction,))
    require_changed_row(c.rowcount)
    return {}


@server.route("/transaction/<transaction>/part", methods=['POST'])
def create_transaction_part(**args):
    transaction = validate_int(args, 'transaction', min_val=0, parse_from_str=True)
    opt = require_json_object_body()
    comment = validate_str(opt, 'comment', optional='')
    amount = validate_int(opt, 'amount', min_val=0)
    category = validate_int(opt, 'category', optional=True)

    c = get_db().cursor()
    c.execute(
        "INSERT INTO txn_part (txn, comment, amount, category) VALUES (?, ?, ?, ?)",
        (transaction, comment, amount, category)
    )
    return {
        "id": c.lastrowid,
    }
