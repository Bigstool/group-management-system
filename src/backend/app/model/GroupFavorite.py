from shared import db

class GroupFavorite(db.Model):
    __tablename__ = "group_favorite"

    # attr
    uuid = db.Column(db.BINARY(16), primary_key=True)   # PK

    # rel
