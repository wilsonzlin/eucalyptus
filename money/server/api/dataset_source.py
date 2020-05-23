from flask import Blueprint

from server.api._common import get_db
from server.sql import fetch_all_as_dict, Column, Cond, Table
from server.validation import require_json_object_body, v_dict_entry, strv

dataset_source_api = Blueprint('dataset_source_api', __name__)


@dataset_source_api.route("/dataset_sources", methods=['POST'])
def create_dataset_source():
    opt = require_json_object_body()
    name = v_dict_entry(opt, 'name', vv=strv(min_len=1))
    comment = v_dict_entry(opt, 'comment', optional='', vv=strv())
    c = get_db().cursor()
    # TODO Handle errors
    c.execute("INSERT INTO dataset_source (name, comment) VALUES (?, ?)", (name, comment))
    return {
        "id": c.lastrowid,
    }


@dataset_source_api.route("/dataset_sources", methods=['GET'])
def get_dataset_sources():
    return {
        "sources": fetch_all_as_dict(
            c=get_db().cursor(),
            tables=(
                Table('dataset_source'),
            ),
            cols=(
                Column('id'),
                Column('name'),
            ),
            where=Cond('TRUE'),
        ),
    }
