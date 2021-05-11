from shared import db


class User(db.Model):
    __tablename__ = "user"

    # attr
    uuid: bytes = db.Column(db.BINARY(16), primary_key=True)   # PK
    creation_time: int = db.Column(db.Integer, nullable=False)
    email: str = db.Column(db.String(256))
    alias: str = db.Column(db.String(256))
    bio: str = db.Column(db.Text)
    password_salt: bytes = db.Column(db.BINARY(16), nullable=False)
    password_hash: bytes = db.Column(db.BINARY(20), nullable=False)
    role: str = db.Column(db.String(256), default="USER", nullable=False)

    # rel
    owned_group: 'Group' = db.relationship("Group", uselist=False, back_populates="owner", foreign_keys="Group.owner_uuid")

    joined_group_uuid: bytes = db.Column(db.BINARY(16), db.ForeignKey("group.uuid", ondelete="SET NULL", onupdate="CASCADE", use_alter=True))   # FK
    joined_group: 'Group' = db.relationship("Group", back_populates="member", foreign_keys=[joined_group_uuid])

    application = db.relationship("GroupApplication", uselist=False, back_populates="applicant")

    comment = db.relationship("GroupComment", uselist=False, back_populates="author")

    def __repr__(self):
        return f"<User {self.uuid.hex()}: {self.email}>"
