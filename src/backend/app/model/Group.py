from shared import db


class Group(db.Model):
    __tablename__ = "group"

    # attr
    uuid: bytes = db.Column(db.BINARY(16), primary_key=True)  # PK
    creation_time: int = db.Column(db.Integer, nullable=False)
    name: str = db.Column(db.String(256))
    title: str = db.Column(db.String(256))
    description: str = db.Column(db.String(4096))
    proposal: str = db.Column(db.String(4096))
    proposal_update_time: int = db.Column(db.Integer)
    proposal_state: str = db.Column(db.String(256), nullable=False)
    proposal_late: int = db.Column(db.Integer)
    application_enabled: bool = db.Column(db.Boolean(), default=True)

    # rel
    owner_uuid: bytes = db.Column(db.BINARY(16),
                                  db.ForeignKey("user.uuid", ondelete="CASCADE", onupdate="CASCADE", use_alter=True),
                                  nullable=False)  # FK
    owner: 'User' = db.relationship("User", back_populates="owned_group", uselist=False, foreign_keys=[owner_uuid])

    member: list['User'] = db.relationship("User", back_populates="joined_group", uselist=True,
                                           foreign_keys="User.joined_group_uuid")

    application = db.relationship("GroupApplication", back_populates="group", uselist=True)

    comment: list['GroupComment'] = db.relationship("GroupComment", back_populates="group", uselist=True)

    favorite = db.relationship("GroupFavorite", back_populates="group", uselist=True)

    def __repr__(self):
        return f"<Group {self.uuid.hex()}: {self.name}>"
