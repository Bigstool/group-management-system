from shared import db

class GroupFavorite(db.Model):
    __tablename__ = "favorite_group"

    uuid = db.Column("uuid", db.BINARY(16), primary_key=True)   # PK
    user_uuid = db.Column("user_uuid", db.BINARY(16), db.ForeignKey("user.uuid"), nullable=False) # FK
    group_uuid = db.Column("group_uuid", db.BINARY(16), db.ForeignKey("group.uuid"), nullable=False) # FK