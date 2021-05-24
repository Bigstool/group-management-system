from shared import db


class GroupFavorite(db.Model):
    __tablename__ = "group_favorite"

    # attr
    uuid: bytes = db.Column(db.BINARY(16), primary_key=True)  # PK

    # rel
    user_uuid: bytes = db.Column(db.BINARY(16),
                                 db.ForeignKey("user.uuid", onupdate="CASCADE", ondelete="CASCADE"))  # FK

    group_uuid: bytes = db.Column(db.BINARY(16),
                                  db.ForeignKey("group.uuid", onupdate="CASCADE", ondelete="CASCADE"))  # FK
    group: 'Group' = db.relationship("Group")

    def __repr__(self):
        return f"<GroupFavorite {self.uuid.hex()}>"
