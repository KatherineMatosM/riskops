from contextlib import contextmanager
from dataclasses import dataclass
from functools import wraps
from typing import Callable, Iterator, TypeVar

from sqlalchemy.orm import Session


_STATE_KEY = "riskops_unit_of_work"
T = TypeVar("T")


class TransactionRollbackError(RuntimeError):
    """A failed nested operation prevents the enclosing operation from committing."""


@dataclass
class _TransactionState:
    rollback_only: bool = False
    cause: BaseException | None = None


@contextmanager
def unit_of_work(db: Session) -> Iterator[None]:
    """Commit one service operation, including any nested service mutations.

    Authentication may already have opened a transaction through a read. Reuse
    that transaction instead of starting another SQLAlchemy transaction scope.
    """
    state = db.info.get(_STATE_KEY)
    owns_transaction = state is None
    if owns_transaction:
        state = _TransactionState()
        db.info[_STATE_KEY] = state

    try:
        yield
    except BaseException as error:
        state.rollback_only = True
        if state.cause is None:
            state.cause = error
        if owns_transaction:
            db.rollback()
        raise
    else:
        if owns_transaction:
            if state.rollback_only:
                db.rollback()
                raise TransactionRollbackError(
                    "La operación no puede confirmarse porque falló una operación interna."
                ) from state.cause
            try:
                db.commit()
            except BaseException:
                db.rollback()
                raise
    finally:
        if owns_transaction:
            db.info.pop(_STATE_KEY, None)


def atomic(method: Callable[..., T]) -> Callable[..., T]:
    """Give a mutating service method the session's shared transaction boundary."""
    @wraps(method)
    def wrapped(self, *args, **kwargs):
        with unit_of_work(self.db):
            return method(self, *args, **kwargs)

    return wrapped
