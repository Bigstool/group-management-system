from shared import db


class Notification(db.Model):
    __tablename__ = "notification"

    # attr
    uuid = db.Column(db.BINARY(16), primary_key=True)   # PK
    creation_time = db.Column(db.Integer, nullable=False)
    title = db.Column(db.String(256))
    content = db.Column(db.String(4096))

    # rel
    user_uuid = db.Column(db.BINARY(16), db.ForeignKey("user.uuid"))


    def __repr__(self):
        return f"<Notification {self.uuid.hex()}: {self.title}>"