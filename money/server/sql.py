from enum import Enum
from sqlite3 import Cursor
from typing import Optional, List, Tuple

from werkzeug.exceptions import NotFound


class Column:
    def __init__(self, expr: str, alias: Optional[str] = None):
        self.expr = expr
        self.alias = alias

    def name(self):
        return self.alias or self.expr


class DateTimeColumn(Column):
    def __init__(self, expr: str, alias: Optional[str] = None):
        super().__init__(f"strftime('%s', {expr})", f'_ts:{alias or expr}')


class JoinMethod(Enum):
    inner = 'INNER'
    left = 'LEFT'
    right = 'RIGHT'


class Join:
    def __init__(self, method: JoinMethod, table: str, on: str, alias: Optional[str] = None):
        self.method = method
        self.table = table
        self.on = on
        self.alias = alias

    def name(self):
        return self.table or self.alias


class Cond:
    def __init__(self, expr: str, *params):
        self.expr = expr
        self.params = params

    def __add__(self, other):
        assert isinstance(other, Cond)
        return Cond(f'({self.expr}) AND ({other.expr})', (*self.params, *other.params))

    def __iadd__(self, other):
        assert isinstance(other, Cond)
        self.expr = f'({self.expr}) AND ({other.expr})'
        self.params += other.params


def fetch_all_as_dict(
        *,
        c: Cursor,
        table: str,
        cols: Tuple[Column, ...],
        joins: Tuple[Join, ...] = (),
        where: Cond,
        group_by: Optional[str] = None,
):
    c.execute(f"""
        SELECT {', '.join((f"({col.expr})" for col in cols))}
        FROM {table}
        {' '.join((f'{j.method.value} JOIN {j.table} AS {j.name()} ON ({j.on})' for j in joins))}
        WHERE {where.expr}
        {'' if not group_by else f'GROUP BY {group_by}'}
    """, where.params)
    return [{cols[i].name(): row[i] for i in range(len(cols))} for row in c.fetchall()]


def require_one(rows: List):
    assert len(rows) <= 1
    try:
        return rows[0]
    except IndexError:
        raise NotFound()


def require_changed_row(rowcount: int):
    if not rowcount:
        raise NotFound()
