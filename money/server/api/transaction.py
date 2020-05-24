from flask import request, Blueprint

from server.api._common import get_db
from server.model import fetch_transactions
from server.sql import require_changed_row, patch_row, Cond, Table, Column, JoinMethod, Join, fetch_all_as_dict
from server.validation import require_json_object_body, v_dict_entry, timestampv, intv, v_list, strv, enumv

transaction_api = Blueprint('transaction_api', __name__)


@transaction_api.route("/transactions", methods=['GET'])
def get_transactions():
    opt = request.args
    dt_from = v_dict_entry(opt, 'from', optional=True, vv=timestampv(parse_from_str=True))
    dt_to = v_dict_entry(opt, 'to', optional=True, vv=timestampv(parse_from_str=True))
    dataset = v_dict_entry(opt, 'dataset', vv=intv(min_val=0, parse_from_str=True), optional=True)
    categories = v_list(opt.getlist('category'), 'categories', vv=intv(min_val=0, parse_from_str=True))
    tags = v_list(opt.getlist('tag'), 'tags', vv=intv(min_val=0, parse_from_str=True))

    cond = Cond('TRUE')
    if dt_from is not None:
        cond += Cond("txn.timestamp >= ?", dt_from)
    if dt_to is not None:
        cond += Cond("txn.timestamp <= ?", dt_to)
    if dataset is not None:
        cond += Cond("txn.dataset = ?", dataset)
    if categories:
        cond += Cond(f"txn_part.category IN ({','.join(map(str, categories))})")
    if tags:
        cond += Cond(f"txn_part.id IN (SELECT txn_part FROM txn_part_tag WHERE tag IN ({','.join(map(str, tags))}))")

    return {
        "transactions": fetch_transactions(get_db().cursor(), cond, group_by="txn_part.txn"),
    }


@transaction_api.route("/transactions/analysis", methods=['GET'])
def get_transactions_analysis():
    opt = request.args
    dt_from = v_dict_entry(opt, 'from', optional=True, vv=timestampv(parse_from_str=True))
    dt_to = v_dict_entry(opt, 'to', optional=True, vv=timestampv(parse_from_str=True))
    split_by = v_dict_entry(opt, 'split_by', vv=enumv(options=['category', 'none']))
    time_unit = v_dict_entry(opt, 'time_unit', vv=enumv(options=['year', 'month', 'day', 'none']))
    categories = v_list(opt.getlist('category'), 'categories', vv=intv(min_val=0, parse_from_str=True))
    tags = v_list(opt.getlist('tag'), 'tags', vv=intv(min_val=0, parse_from_str=True))

    columns = [
        Column('SUM(txn_part.amount)', 'combined_amount'),
    ]
    group_by = []

    if split_by == 'category':
        columns.append(Column('category.name', 'category_name'))
        group_by.append('category.id')

    if time_unit != 'none':
        if time_unit == 'year':
            time_unit_fmt = '%Y'
        elif time_unit == 'month':
            time_unit_fmt = '%Y-%m'
        elif time_unit == 'day':
            time_unit_fmt = '%Y-%m-%d'
        else:
            assert False
        columns.append(Column(f"strftime('{time_unit_fmt}', txn.timestamp)", 'time_unit'))
        group_by.append(f"strftime('{time_unit_fmt}', txn.timestamp)")

    cond = Cond('txn_part.amount > 0')
    if dt_from is not None:
        cond += Cond("txn.timestamp >= ?", dt_from)
    if dt_to is not None:
        cond += Cond("txn.timestamp <= ?", dt_to)
    if categories:
        cond += Cond(f"txn_part.category IN ({','.join(map(str, categories))})")
    if tags:
        cond += Cond(f"txn_part.id IN (SELECT txn_part FROM txn_part_tag WHERE tag IN ({','.join(map(str, tags))}))")

    return {
        "analysis": fetch_all_as_dict(
            c=get_db().cursor(),
            tables=(
                Table('txn_part'),
            ),
            cols=columns,
            joins=(
                Join(JoinMethod.left, Table('txn'), 'txn_part.txn = txn.id'),
                Join(JoinMethod.left, Table('category'), 'txn_part.category = category.id'),
            ),
            where=cond,
            group_by=','.join(group_by),
        ),
    }


@transaction_api.route("/transaction/<transaction>", methods=['PATCH'])
def update_transaction(**args):
    transaction = v_dict_entry(args, 'transaction', vv=intv(min_val=0, parse_from_str=True))
    opt = require_json_object_body()
    comment = v_dict_entry(opt, 'comment', optional=True, vv=strv())
    timestamp = v_dict_entry(opt, 'timestamp', optional=True, vv=timestampv())
    description = v_dict_entry(opt, 'description', optional=True, vv=strv())
    amount = v_dict_entry(opt, 'amount', optional=True, vv=intv())

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
    transaction = v_dict_entry(args, 'transaction', vv=intv(min_val=0, parse_from_str=True))
    c = get_db().cursor()
    c.execute("DELETE FROM txn WHERE id = ?", (transaction,))
    require_changed_row(c.rowcount)
    return {}
