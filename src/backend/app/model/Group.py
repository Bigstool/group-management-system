from shared import db


class Group(db.Model):
    __tablename__ = "group"

    uuid = db.Column("uuid", db.BINARY(16), primary_key=True)   # PK
    creation_time = db.Column("creation_time", db.Integer, nullable=False)
    creator_uuid = db.Column("creator_uuid", db.BINARY(16), db.ForeignKey("user.uuid"), nullable=False) # FK
    name = db.Column("name", db.String(256), nullable=False)
    description = db.Column("description", db.String(4096), nullable=True)
    proposal = db.Column("proposal", db.String(4096), nullable=True)
    group_state = db.Column("state", db.String(256), nullable=False)

    def __repr__(self):
        return f"<Group {self.uuid.hex()}: {self.name}>"