from shared import db

class GroupFavorite(db.Model):
    __tablename__ = "group_favorite"

    # attr
    uuid = db.Column(db.BINARY(16), primary_key=True)   # PK

    # rel
    user_uuid = db.Column(db.BINARY(16), db.ForeignKey("user.uuid", onupdate="CASCADE", ondelete="CASCADE"))    # FK

    group_uuid = db.Column(db.BINARY(16), db.ForeignKey("group.uuid", onupdate="CASCADE", ondelete="CASCADE"))  # FK
    group = db.relationship("Group")