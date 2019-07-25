import sqlalchemy as sa
from webapp.database import Base


class Snap(Base):
    __tablename__ = "snap"

    snap_id = sa.Column(sa.String, primary_key=True)
    build_repo = sa.Column(sa.String, nullable=False)
