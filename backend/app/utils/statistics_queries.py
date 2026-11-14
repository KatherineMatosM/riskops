from sqlalchemy import and_, extract, func


def exact_code_equals(expression, value: str, dialect_name: str):
    """Compare ASCII status/level codes stored in VARCHAR like Python strings."""
    if dialect_name == "mssql":
        return and_(
            expression.collate("Latin1_General_100_BIN2") == value,
            func.datalength(expression) == len(value.encode("ascii")),
        )
    return expression == value


def exact_string_group(expression, dialect_name: str):
    """Preserve Python's case- and whitespace-sensitive grouping on SQL Server."""
    if dialect_name == "mssql":
        expression = expression.collate("Latin1_General_100_BIN2")
        # SQL Server pads strings for comparisons, even under a binary collation.
        return expression, (expression, func.datalength(expression))
    return expression, (expression,)


def year_month_columns(expression):
    """SQLAlchemy compiles EXTRACT as DATEPART on SQL Server and strftime on SQLite."""
    return extract("year", expression), extract("month", expression)
