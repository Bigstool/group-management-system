from shared import db


class Notification(db.Model):
    __tablename__ = "notification"

    # attr
    uuid: bytes = db.Column(db.BINARY(16), primary_key=True)   # PK
    creation_time: int = db.Column(db.Integer, nullable=False)
    title: str = db.Column(db.String(256))
    content: str = db.Column(db.String(4096))

    # rel
    user_uuid: bytes = db.Column(db.BINARY(16), db.ForeignKey("user.uuid", ondelete="CASCADE", onupdate="CASCADE"))


    def __repr__(self):
        return f"<Notification {self.uuid.hex()}: {self.title}>"