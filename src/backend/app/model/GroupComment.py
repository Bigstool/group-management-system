from shared import db


class GroupComment(db.Model):
    __tablename__ = "group_comment"

    # attr
    uuid: bytes = db.Column(db.BINARY(16), primary_key=True)  # PK
    creation_time: int = db.Column(db.Integer, nullable=False)
    content: str = db.Column(db.String(4096))

    # rel
    author_uuid: bytes = db.Column(db.BINARY(16), db.ForeignKey("user.uuid", ondelete="CASCADE", onupdate="CASCADE"))  # FK
    author: 'User' = db.relationship("User")

    group_uuid: bytes = db.Column(db.BINARY(16), db.ForeignKey("group.uuid", ondelete="CASCADE", onupdate="CASCADE"))  # FK
    group: 'Group' = db.relationship("Group", back_populates="comment")