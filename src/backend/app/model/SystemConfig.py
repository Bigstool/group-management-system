from shared import db


class SystemConfig(db.Model):
    __tablename__ = "system_config"

    id = db.Column("id", db.Integer(), primary_key=True)
    conf = db.Column("conf", db.JSON(), nullable=False)