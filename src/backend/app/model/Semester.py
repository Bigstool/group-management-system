from shared import db


class Semester(db.Model):
    __tablename__ = "semester"

    # attr
    uuid = db.Column(db.BINARY(16), primary_key=True)   # PK
    name = db.Column(db.String(256), unique=True, default="CURRENT")
    start_time = db.Column(db.Integer, nullable=False)
    end_time = db.Column(db.Integer)
    config = db.Column(db.JSON(), nullable=False)

    # rel