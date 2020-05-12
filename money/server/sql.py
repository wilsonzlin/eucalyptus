from enum import Enum
from sqlite3 import Cursor
from typing import Optional, List, Tuple, Any, Iterable

from werkzeug.exceptions import NotFound

from server.validation import NULL


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


class Table:
    def __init__(self, table: str, alias: Optional[str] = None):
        self.table = table
        self.alias = alias

    def name(self):
        return self.alias or self.table


class Join:
    def __init__(self, method: JoinMethod, table: Table, on: str):
        self.method = method
        self.table = table
        self.on = on


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
        tables: Tuple[Table, ...],
        cols: Tuple[Column, ...],
        joins: Tuple[Join, ...] = (),
        where: Cond,
        group_by: Optional[str] = None,
        order_by: Optional[str] = None,
):
    if type(tables) == str:
        tables = (tables,)

    c.execute(f"""
        SELECT {', '.join((f"({col.expr})" for col in cols))}
        FROM {','.join(f'{t.table} AS {t.name()}' for t in tables)}
        {' '.join(f'{j.method.value} JOIN {j.table.table} AS {j.table.name()} ON ({j.on})' for j in joins)}
        WHERE {where.expr}
        {'' if not group_by else f'GROUP BY {group_by}'}
        {'' if not order_by else f'ORDER BY {order_by}'}
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


def patch_row(
        *,
        c: Cursor,
        table: str,
        values: Iterable[Tuple[str, Optional[Any]]],
        cond: Cond,
):
    updates = [(col, val) for col, val in values if val is not None]
    c.execute(
        f"UPDATE {table} SET {','.join((f'{col} = ?' for col, _ in updates))} WHERE {cond.expr}",
        # Generators don't seem to be supported.
        tuple(None if val is NULL else val for val in (*(val for _, val in updates), *cond.params))
    )
    return c.rowcount
