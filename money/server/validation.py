import re
from datetime import datetime, timezone
from typing import Optional, Dict, Union, TypeVar, Callable, List

from flask import request
from werkzeug import Response
from werkzeug.exceptions import BadRequest


class MalformedInputException(BadRequest):
    def __init__(self, description: str):
        self.description = description
        self.response = Response(description, status=400)


class Null:
    def __eq__(self, other):
        return isinstance(other, Null)


NULL = Null()


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


R = TypeVar('R')


def v_dict_entry(
        body: Dict,
        prop: str,
        *,
        vv: Callable,
        nullable: bool = False,
        optional: Union[bool, R] = False,
) -> Optional[R]:
    if prop not in body:
        if optional == False:
            raise MalformedInputException(f"The {prop} is missing.")
        return None if optional == True else optional
    else:
        val = body[prop]
        if val is None and nullable:
            return NULL
        try:
            val = vv(val)
        except ValueError as e:
            raise MalformedInputException(f"The {prop} {e}.")
        return val


def v_list(
        seq: List,
        name: str,
        *,
        vv: Callable,
) -> List[R]:
    validated = []
    for i, val in enumerate(seq):
        try:
            val = vv(val)
        except ValueError as e:
            raise MalformedInputException(f"Value number {i} of {name} {e}.")
        validated.append(val)
    return validated


def strv(
        *,
        min_len: Optional[int] = None,
        max_len: Optional[int] = None,
):
    def validator(val):
        if not isinstance(val, str):
            raise ValueError("is not a string")
        if min_len is not None and len(val) < min_len:
            raise ValueError(f"is too short")
        if max_len is not None and len(val) > max_len:
            raise ValueError(f"is too long")
        return val

    return validator


def intv(
        *,
        min_val: Optional[int] = None,
        max_val: Optional[int] = None,
        parse_from_str: bool = False,
):
    def validator(val):
        if parse_from_str:
            val = int(val)
        if not isinstance(val, int):
            raise ValueError("is not an integer")
        if min_val is not None and val < min_val:
            raise ValueError(f"is too small.")
        if max_val is not None and val > max_val:
            raise ValueError(f"is too large.")
        return val

    return validator


def boolv(
        *,
        parse_from_str: bool = False,
):
    def validator(val):
        if parse_from_str:
            if val == '0':
                val = False
            elif val == '1':
                val = True
            else:
                raise ValueError("is not a boolean")
        if not isinstance(val, bool):
            raise ValueError("is not a boolean")
        return val

    return validator


def timestampv(
        *,
        parse_from_str: bool = False,
):
    def validator(val):
        if parse_from_str:
            val = int(val)
        if not isinstance(val, int):
            raise ValueError("is not a timestamp")
        try:
            return datetime.fromtimestamp(val, tz=timezone.utc)
        except (OverflowError, OSError):
            raise ValueError("is not a valid time")

    return validator


def enumv(
        *,
        options: List[str],
):
    def validator(val):
        if not isinstance(val, str) or val not in options:
            raise ValueError("is not a valid option")
        return val
    return validator
