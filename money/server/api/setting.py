from flask import Blueprint

from server.api._common import get_db
from server.validation import require_json_object_body, strv, v_dict_entry

setting_api = Blueprint('setting_api', __name__)


@setting_api.route("/setting/name", methods=['GET'])
def get_name():
    return {
        "name": get_db().cursor().execute("SELECT value FROM setting WHERE name = 'name'").fetchone()[0]
    }


@setting_api.route("/setting/name", methods=['PUT'])
def set_name():
    opt = require_json_object_body()
    name = v_dict_entry(opt, 'name', vv=strv())
    get_db().cursor().execute("UPDATE setting SET value = ? WHERE name = 'name'", (name,))
    return {}
