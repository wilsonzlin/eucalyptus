from flask import Blueprint, request

from server.api._common import get_db
from server.api.category import category_api
from server.sql import fetch_all_as_dict, Table, Column, Cond, require_one
from server.validation import require_json_object_body, v_dict_entry, strv, intv

tag_api = Blueprint('tag_api', __name__)


@category_api.route("/tags", methods=['POST'])
def create_tag():
    opt = require_json_object_body()
    name = v_dict_entry(opt, 'name', vv=strv())
    comment = v_dict_entry(opt, 'comment', vv=strv())

    c = get_db().cursor()
    c.execute(
        "INSERT INTO tag (name, comment) VALUES (?, ?)",
        (name, comment)
    )
    return {
        "id": c.lastrowid,
    }


@category_api.route("/tags", methods=['GET'])
def get_or_suggest_tags():
    opt = request.args
    query = v_dict_entry(opt, 'query', vv=strv(min_len=1), optional=True)

    if query is not None:
        return {
            "suggestions": fetch_all_as_dict(
                c=get_db().cursor(),
                tables=(
                    Table('tag'),
                ),
                cols=(
                    Column('id'),
                    Column('name', 'label'),
                ),
                where=Cond('name LIKE ?', f'{query}%'),
            ),
        }

    return {
        "tags": fetch_all_as_dict(
            c=get_db().cursor(),
            tables=(
                Table('tag'),
            ),
            cols=(
                Column('id'),
                Column('name'),
                Column('comment'),
            ),
            where=Cond('TRUE'),
        )
    }


@category_api.route("/tag/<tag>/name", methods=['GET'])
def get_tag_name(**args):
    tag = v_dict_entry(args, 'tag', vv=intv(min_val=0, parse_from_str=True))
    return {
        "name": require_one(get_db().cursor().execute("SELECT name FROM tag WHERE id = ?", (tag,)).fetchall())[0],
    }
