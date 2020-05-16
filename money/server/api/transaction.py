from flask import request, Blueprint

from server.api._common import get_db
from server.model import fetch_transactions
from server.sql import require_changed_row, patch_row, Cond
from server.validation import validate_int, require_json_object_body, validate_str, validate_timestamp

transaction_api = Blueprint('transaction_api', __name__)


@transaction_api.route("/transactions", methods=['GET'])
def get_transactions():
    opt = request.args
    dt_from = validate_timestamp(opt, 'from', parse_from_str=True, optional=True)
    dt_to = validate_timestamp(opt, 'to', parse_from_str=True, optional=True)
    dataset = validate_int(opt, 'dataset', min_val=0, parse_from_str=True, optional=True)
    category = validate_int(opt, 'category', min_val=0, parse_from_str=True, optional=True)

    cond = Cond('TRUE')
    if dt_from is not None:
        cond += Cond("txn.timestamp >= ?", dt_from)
    if dt_to is not None:
        cond += Cond("txn.timestamp <= ?", dt_to)
    if dataset is not None:
        cond += Cond("txn.dataset = ?", dataset)
    if category is not None:
        cond += Cond("txn_part.category = ?", category)

    return {
        "transactions": fetch_transactions(get_db().cursor(), cond),
    }


@transaction_api.route("/transaction/<transaction>", methods=['PATCH'])
def update_transaction(**args):
    transaction = validate_int(args, 'transaction', min_val=0, parse_from_str=True)
    opt = require_json_object_body()
    comment = validate_str(opt, 'comment', optional=True)
    timestamp = validate_timestamp(opt, 'timestamp', optional=True)
    description = validate_str(opt, 'description', optional=True)
    amount = validate_int(opt, 'amount', optional=True)

    require_changed_row(patch_row(
        c=get_db().cursor(),
        table='txn',
        values=(
            ('malformed', False),
            ('comment', comment),
            ('timestamp', timestamp),
            ('description', description),
            ('amount', amount),
        ),
        cond=Cond('id = ?', transaction),
    ))
    return {}


@transaction_api.route("/transaction/<transaction>", methods=['DELETE'])
def delete_transaction(**args):
    transaction = validate_int(args, 'transaction', min_val=0, parse_from_str=True)
    c = get_db().cursor()
    c.execute("DELETE FROM txn WHERE id = ?", (transaction,))
    require_changed_row(c.rowcount)
    return {}
