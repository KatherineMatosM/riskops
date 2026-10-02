import re

EMAIL_REGEX = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def is_valid_email(email: str) -> bool:
    return bool(EMAIL_REGEX.match(email))


def is_valid_scale_value(value: int) -> bool:
    return 1 <= value <= 5


def is_valid_progress(value: int) -> bool:
    return 0 <= value <= 100