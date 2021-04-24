from shared import db


class Semester(db.Model):
    __tablename__ = "semester"

    uuid = db.Column("uuid", db.BINARY(16), primary_key=True)   # PK
    name = db.Column("name", db.String(256), unique=True, nullable=False)
    start_time = db.Column("start_time", db.Integer, nullable=False)
    end_time = db.Column("end_time", db.Integer)
    config = db.Column("config", db.JSON(), nullable=False)