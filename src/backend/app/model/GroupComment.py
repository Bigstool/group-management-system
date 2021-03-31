from shared import db


class GroupComment(db.Model):
    __tablename__ = "group_comment"

    uuid = db.Column("uuid", db.BINARY(16), primary_key=True)  # PK
    creation_time = db.Column("creation_time", db.Integer, nullable=False)
    author_uuid = db.Column("author_uuid", db.BINARY(16), db.ForeignKey("user.uuid"), nullable=False)
    group_uuid = db.Column("group_uuid", db.BINARY(16), db.ForeignKey("group.uuid"), nullable=False)
    content = db.Column("content", db.String(4096), nullable=False)
    r_group = db.relationship("Group", backref="comment", lazy=True, uselist=True)