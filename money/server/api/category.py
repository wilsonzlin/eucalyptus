from flask import request, Blueprint
from werkzeug.exceptions import BadRequest

from server.api._common import get_db
from server.sql import require_one, fetch_all_as_dict, Column, Cond, Table
from server.validation import require_json_object_body, v_dict_entry, strv, intv

category_api = Blueprint('category_api', __name__)


@category_api.route("/categories", methods=['POST'])
def create_category():
    opt = require_json_object_body()
    name = v_dict_entry(opt, 'name', vv=strv())
    target = v_dict_entry(opt, 'target', vv=intv(min_val=0), optional=True)
    mode = v_dict_entry(opt, 'mode', vv=strv())

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


@category_api.route("/categories", methods=['GET'])
def get_or_suggest_categories():
    opt = request.args
    query = v_dict_entry(opt, 'query', vv=strv(min_len=1), optional=True)

    if query is not None:
        return {
            "suggestions": fetch_all_as_dict(
                c=get_db().cursor(),
                tables=(
                    Table('category'),
                ),
                cols=(
                    Column('id'),
                    Column('name', 'label'),
                ),
                where=Cond('name LIKE ?', f'{query}%'),
            ),
        }

    return {
        "categories": fetch_all_as_dict(
            c=get_db().cursor(),
            tables=(
                Table('category', 'node'),
                Table('category', 'parent'),
            ),
            cols=(
                Column('node.id', 'id'),
                Column('node.name', 'name'),
                Column('node.comment', 'comment'),
                Column('COUNT(parent.id) - 1', 'depth'),
            ),
            where=Cond('node.set_start BETWEEN parent.set_start AND parent.set_end'),
            group_by='node.id',
            order_by='node.set_start',
        )
    }


@category_api.route("/category/<category>/name", methods=['GET'])
def get_category_name(**args):
    category = v_dict_entry(args, 'category', vv=intv(min_val=0, parse_from_str=True))
    return {
        "name": require_one(get_db().cursor().execute("SELECT name FROM category WHERE id = ?", (category,)).fetchall())[0],
    }
