import re
from datetime import datetime
from typing import Optional, Dict, Union, TypeVar, Type, Callable

from flask import request
from werkzeug import Response
from werkzeug.exceptions import BadRequest


class MalformedInputException(BadRequest):
    def __init__(self, description: str):
        self.description = description
        self.response = Response(description, status=400)


T = TypeVar('T')


def _get_or_default(
        *,
        body: Dict,
        prop: str,
        parse_from_str: Optional[Callable[[str], T]],
        typ: Type,
        optional: Union[bool, T],
) -> Optional[T]:
    if prop not in body:
        if optional == False:
            raise MalformedInputException(f"The {prop} is missing.")
        return None if optional == True else optional
    else:
        val = body[prop]
        if type(val) != typ:
            if type(val) == str and parse_from_str:
                try:
                    return parse_from_str(val)
                except ValueError:
                    pass
            raise MalformedInputException(f"The {prop} is missing or incorrect.")
        return val


def require_json_object_body():
    body = request.json
    if type(body) != dict:
        raise MalformedInputException("Expected a JSON object body.")
    return body


MONEY_AMOUNT_REGEX = re.compile(r'^\s*\$?\s*(-)?\s*([0-9]+)\.([0-9]{2})\s*$')


def parse_bool(raw: str):
    if raw == '0':
        return False
    if raw == '1':
        return True
    raise ValueError('Boolean string is not "0" or "1".')


def parse_money_amount(raw: str):
    try:
        negative, integer, decimal = MONEY_AMOUNT_REGEX.search(raw).groups()
        return (int(integer) * 100 + int(decimal)) * (-1 if negative else 1)
    except (AttributeError, ValueError):
        raise ValueError("Invalid money amount string.")


def validate_str(
        body: Dict,
        prop: str,
        *,
        min_len: Optional[int] = None,
        max_len: Optional[int] = None,
        optional: Union[bool, str] = False,
) -> Optional[str]:
    val = _get_or_default(
        body=body,
        prop=prop,
        parse_from_str=None,
        typ=str,
        optional=optional,
    )
    if val is None:
        return val

    if min_len is not None and len(val) < min_len:
        raise MalformedInputException(f"The {prop} is too short.")

    if max_len is not None and len(val) > max_len:
        raise MalformedInputException(f"The {prop} is too long.")

    return val


def validate_int(
        body: Dict,
        prop: str,
        *,
        parse_from_str: bool = False,
        min_val: Optional[int] = None,
        max_val: Optional[int] = None,
        optional: Union[bool, int] = False,
) -> Optional[int]:
    val = _get_or_default(
        body=body,
        prop=prop,
        parse_from_str=None if not parse_from_str else int,
        typ=int,
        optional=optional,
    )
    if val is None:
        return val

    if min_val is not None and val < min_val:
        raise MalformedInputException(f"The {prop} is too small.")

    if max_val is not None and val > max_val:
        raise MalformedInputException(f"The {prop} is too large.")

    return val


def validate_bool(
        body: Dict,
        prop: str,
        *,
        parse_from_str: bool = False,
        optional: Union[bool, bool] = False,
) -> Optional[int]:
    val = _get_or_default(
        body=body,
        prop=prop,
        parse_from_str=None if not parse_from_str else parse_bool,
        typ=bool,
        optional=optional,
    )
    if val is None:
        return val

    return val


def validate_timestamp(
        body: Dict,
        prop: str,
        *,
        parse_from_str: bool = False,
        optional: Union[bool, datetime] = False,
) -> Optional[datetime]:
    unix_ts = _get_or_default(
        body=body,
        prop=prop,
        parse_from_str=int if parse_from_str else None,
        typ=int,
        optional=optional,
    )
    if unix_ts is None:
        return None
    val = datetime.utcfromtimestamp(unix_ts)

    return val
