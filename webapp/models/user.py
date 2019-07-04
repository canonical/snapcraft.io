import sqlalchemy as sa
from webapp.database import Base


class User(Base):
    __tablename__ = "user"

    email = sa.Column(sa.String, primary_key=True)
    github_name = sa.Column(sa.String, nullable=True)
    github_username = sa.Column(sa.String, nullable=True)
    github_token = sa.Column(sa.String, nullable=True)
