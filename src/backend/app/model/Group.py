from shared import db


class Group(db.Model):
    __tablename__ = "group"

    uuid = db.Column("uuid", db.BINARY(16), primary_key=True)   # PK
    creation_time = db.Column("creation_time", db.Integer, nullable=False)

    name = db.Column("name", db.String(256), nullable=False)
    description = db.Column("description", db.String(4096), nullable=True)
    proposal = db.Column("proposal", db.String(4096), nullable=True)
    proposal_state = db.Column("proposal_state", db.String(256), nullable=False) # PENDING/SUBMITTED/SUBMITTED_LATE
    application_enabled = db.Column("application_enabled", db.Boolean(), default=True)

    #change
    owner_uuid = db.Column("owner_uuid", db.BINARY(16), nullable=False)  # FK
    member_num = db.Column('member_num', db.Integer, nullable=False, default=1)

    def __repr__(self):
        return f"<Group {self.uuid.hex()}: {self.name}>"