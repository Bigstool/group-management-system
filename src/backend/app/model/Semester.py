from shared import db


class Semester(db.Model):
    __tablename__ = "semester"

    # attr
    uuid: bytes = db.Column(db.BINARY(16), primary_key=True)   # PK
    name: str = db.Column(db.String(256), unique=True, default="CURRENT")
    start_time: int = db.Column(db.Integer, nullable=False)
    end_time: int = db.Column(db.Integer)
    config: dict = db.Column(db.JSON(), nullable=False)

    # rel