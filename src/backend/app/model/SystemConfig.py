from shared import db


class SystemConfig(db.Model):
    __tablename__ = "system_config"

    uuid = db.Column("uuid", db.BINARY(16), primary_key=True)   # PK
    semester_id = db.Column("semester_id", db.String(256), unique=True, nullable=False)
    semester_start_time = db.Column("semester_start_time", db.Integer, nullable=False)
    semester_end_time = db.Column("semester_end_time", db.Integer)
    config = db.Column("config", db.JSON(), nullable=False)