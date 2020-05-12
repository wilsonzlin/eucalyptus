from flask import Blueprint

from server.api._common import get_db
from server.sql import fetch_all_as_dict, Column, Join, JoinMethod, Cond, require_changed_row, patch_row, Table
from server.validation import require_json_object_body, validate_str, validate_int

transaction_part_api = Blueprint('transaction_part_api', __name__)


@transaction_part_api.route("/transaction/<transaction>/parts", methods=['POST'])
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


@transaction_part_api.route("/transaction/<transaction>/parts", methods=['GET'])
def get_transaction_parts(**args):
    transaction = validate_int(args, 'transaction', min_val=0, parse_from_str=True)
    return {
        "parts": fetch_all_as_dict(
            c=get_db().cursor(),
            tables=(
                Table('txn_part'),
            ),
            cols=(
                Column('txn_part.id', 'id'),
                Column('txn_part.comment', 'comment'),
                Column('txn_part.amount', 'amount'),
                Column('category.id', 'category_id'),
                Column('category.name', 'category_name'),
            ),
            joins=(
                Join(JoinMethod.left, Table('category'), 'txn_part.category = category.id'),
            ),
            where=Cond('txn = ?', transaction)
        )
    }


@transaction_part_api.route("/transaction_part/<part>", methods=['PATCH'])
def update_transaction_part(**args):
    part = validate_int(args, 'part', min_val=0, parse_from_str=True)
    opt = require_json_object_body()
    comment = validate_str(opt, 'comment', optional=True)
    amount = validate_int(opt, 'amount', optional=True)
    category = validate_int(opt, 'category', min_val=0, nullable=True, optional=True)

    require_changed_row(patch_row(
        c=get_db().cursor(),
        table='txn_part',
        values=(
            ('comment', comment),
            ('amount', amount),
            ('category', category),
        ),
        cond=Cond('id = ?', part),
    ))
    return {}
