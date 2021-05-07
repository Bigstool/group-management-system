from shared import db


class Semester(db.Model):
    __tablename__ = "semester"

    uuid = db.Column("uuid", db.BINARY(16), primary_key=True)   # PK
    name = db.Column("name", db.String(256), unique=True, default="CURRENT")
    start_time = db.Column("start_time", db.Integer, nullable=False)
    end_time = db.Column("end_time", db.Integer)
    config = db.Column("config", db.JSON(), nullable=False)

    # change
    semester_group = db.relationship("Group", backref="semester", lazy=True)

    # semester_user = db.relationship("User", backref="semester", lazy=True)