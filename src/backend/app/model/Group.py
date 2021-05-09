from shared import db


class Group(db.Model):
    __tablename__ = "group"

    # attr
    uuid = db.Column(db.BINARY(16), primary_key=True)  # PK
    creation_time = db.Column(db.Integer, nullable=False)
    name = db.Column(db.String(256))
    title = db.Column(db.String(256))
    description = db.Column(db.String(4096))
    proposal = db.Column(db.String(4096))
    proposal_update_time = db.Column(db.Integer)
    proposal_state = db.Column(db.String(256), nullable=False)
    proposal_late = db.Column(db.Integer)
    application_enabled = db.Column(db.Boolean(), default=True)

    # rel
    owner_uuid = db.Column(db.BINARY(16), db.ForeignKey("user.uuid", ondelete="CASCADE", onupdate="CASCADE", use_alter=True), nullable=False)   # FK
    owner = db.relationship("User", uselist=False, back_populates="owned_group", foreign_keys=[owner_uuid])

    member = db.relationship("User", back_populates="joined_group", foreign_keys="User.joined_group_uuid")

    application = db.relationship("GroupApplication", uselist=False, back_populates="group")

    comment = db.relationship("GroupComment", uselist=False, back_populates="group")

    def __repr__(self):
        return f"<Group {self.uuid.hex()}: {self.name}>"
