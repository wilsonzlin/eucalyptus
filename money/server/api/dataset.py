import csv
import json
from datetime import datetime
from io import StringIO

from flask import request, Blueprint

from server.api._common import get_db
from server.model import fetch_datasets
from server.sql import Cond
from server.validation import validate_int, validate_str, parse_money_amount

dataset_api = Blueprint('dataset_api', __name__)


@dataset_api.route("/dataset_source/<source>/datasets", methods=['POST'])
def create_dataset(**args):
    source = validate_int(args, 'source', min_val=0, parse_from_str=True)
    opt = request.args
    timestamp_column = validate_int(opt, 'timestamp_column', parse_from_str=True)
    timestamp_format = validate_str(opt, 'timestamp_format')
    description_column = validate_int(opt, 'description_column', parse_from_str=True)
    amount_column = validate_int(opt, 'amount_column', parse_from_str=True)

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
            amount = -parse_money_amount(row[amount_column])
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


@dataset_api.route("/datasets", methods=['GET'])
def get_datasets():
    return {
        "datasets": fetch_datasets(get_db().cursor(), Cond('TRUE'))
    }


@dataset_api.route("/dataset/<dataset>", methods=['GET'])
def get_dataset(**opt):
    dataset = validate_int(opt, 'dataset', min_val=0, parse_from_str=True)
    return {
        "datasets": fetch_datasets(get_db().cursor(), Cond('dataset.id = ?', dataset))
    }
