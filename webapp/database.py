from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

engine = create_engine("sqlite:///snappy.sqlite")
Session = sessionmaker(bind=engine)

db = Session()


def init_db():
    Base.metadata.create_all(engine)
