from shared import db


class GroupComment(db.Model):
    __tablename__ = "group_comment"

    # attr
    uuid = db.Column(db.BINARY(16), primary_key=True)  # PK
    creation_time = db.Column(db.Integer, nullable=False)
    content = db.Column(db.String(4096))

    # rel
    author_uuid = db.Column(db.BINARY(16), db.ForeignKey("user.uuid", ondelete="CASCADE", onupdate="CASCADE"))  # FK
    author = db.relationship("User")

    group_uuid = db.Column(db.BINARY(16), db.ForeignKey("group.uuid", ondelete="CASCADE", onupdate="CASCADE"))  # FK
    group = db.relationship("Group", back_populates="comment")