from sqlite3 import Cursor

from server.sql import Cond, fetch_all_as_dict, Column, Join, JoinMethod, DateTimeColumn, Table


def fetch_datasets(c: Cursor, where: Cond):
    return fetch_all_as_dict(
        c=c,
        tables=(
            Table('dataset'),
        ),
        cols=(
            Column('dataset.id', 'id'),
            Column('dataset.source', 'source_id'),
            Column('dataset_source.name', 'source_name'),
            Column('dataset.comment', 'comment'),
            DateTimeColumn('dataset.created', 'created'),
        ),
        joins=(
            Join(JoinMethod.left, Table('dataset_source'), "dataset_source.id = dataset.source"),
        ),
        where=where,
    )


def fetch_transactions(c: Cursor, where: Cond):
    transactions = fetch_all_as_dict(
        c=c,
        tables=(
            Table('txn'),
        ),
        cols=(
            Column('txn.id', 'id'),
            Column('txn.comment', 'comment'),
            Column('txn.malformed', 'malformed'),
            DateTimeColumn('txn.timestamp', 'timestamp'),
            Column('txn.description', 'description'),
            Column('txn.amount', 'transaction_amount'),
            Column('SUM(txn_part.amount)', 'combined_amount'),
            Column("GROUP_CONCAT(category.id, '\1')", 'combined_category_ids'),
            Column("GROUP_CONCAT(category.name, '\1')", 'combined_category_names'),
        ),
        joins=(
            Join(JoinMethod.left, Table('txn_part'), 'txn_part.txn = txn.id'),
            Join(JoinMethod.left, Table('category'), 'txn_part.category = category.id'),
            Join(JoinMethod.left, Table('txn_part_project'), 'txn_part_project.txn_part = txn_part.id'),
            Join(JoinMethod.left, Table('txn_part_entity'), 'txn_part_entity.txn_part = txn_part.id'),
            Join(JoinMethod.left, Table('txn_part_tag'), 'txn_part_tag.txn_part = txn_part.id'),
        ),
        where=where,
        group_by="txn_part.txn"
    )
    for t in transactions:
        raw_category_ids = t.pop('combined_category_ids')
        raw_category_names = t.pop('combined_category_names')
        if not raw_category_ids:
            t['combined_categories'] = []
        else:
            t['combined_categories'] = [
                {"id": cid, "name": cname}
                for cid, cname in zip(
                    (int(id_str) for id_str in raw_category_ids.split('\1')),
                    raw_category_names.split('\1')
                )
            ]

    return transactions
