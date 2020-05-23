from flask import Blueprint

from server.api._common import get_db
from server.sql import fetch_all_as_dict, Column, Join, JoinMethod, Cond, require_changed_row, patch_row, Table
from server.validation import require_json_object_body, v_dict_entry, strv, intv

transaction_part_api = Blueprint('transaction_part_api', __name__)


@transaction_part_api.route("/transaction/<transaction>/parts", methods=['POST'])
def create_transaction_part(**args):
    transaction = v_dict_entry(args, 'transaction', vv=intv(min_val=0, parse_from_str=True))
    opt = require_json_object_body()
    comment = v_dict_entry(opt, 'comment', optional='', vv=strv())
    amount = v_dict_entry(opt, 'amount', vv=intv(min_val=0))
    category = v_dict_entry(opt, 'category', optional=True, vv=intv())

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
    transaction = v_dict_entry(args, 'transaction', vv=intv(min_val=0, parse_from_str=True))
    parts = fetch_all_as_dict(
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
            Column("GROUP_CONCAT(tag.id, '\1')", 'tag_ids'),
            Column("GROUP_CONCAT(tag.name, '\1')", 'tag_names'),
        ),
        joins=(
            Join(JoinMethod.left, Table('category'), 'txn_part.category = category.id'),
            Join(JoinMethod.left, Table('txn_part_tag'), 'txn_part.id = txn_part_tag.txn_part'),
            Join(JoinMethod.left, Table('tag'), 'txn_part_tag.tag = tag.id'),
        ),
        where=Cond('txn = ?', transaction),
        group_by="txn_part.id",
    )
    for t in parts:
        category_id = t.pop('category_id')
        category_name = t.pop('category_name')
        t['category'] = None if category_id is None else {
            "id": category_id,
            "name": category_name,
        }

        raw_tag_ids = t.pop('tag_ids')
        raw_tag_names = t.pop('tag_names')
        if not raw_tag_ids:
            t['tags'] = []
        else:
            t['tags'] = [
                {"id": tid, "name": tname}
                for tid, tname in zip(
                    map(int, raw_tag_ids.split('\1')),
                    raw_tag_names.split('\1'),
                )
            ]
    return {
        "parts": parts,
    }


@transaction_part_api.route("/transaction_part/<part>", methods=['PATCH'])
def update_transaction_part(**args):
    part = v_dict_entry(args, 'part', vv=intv(min_val=0, parse_from_str=True))
    opt = require_json_object_body()
    comment = v_dict_entry(opt, 'comment', optional=True, vv=strv())
    amount = v_dict_entry(opt, 'amount', optional=True, vv=intv())
    category = v_dict_entry(opt, 'category', vv=intv(min_val=0), nullable=True, optional=True)

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
