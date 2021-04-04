from shared import db


class Notification(db.Model):
    __tablename__ = "notification"

    uuid = db.Column("uuid", db.BINARY(16), primary_key=True)   # PK
    creation_time = db.Column("creation_time", db.Integer, nullable=False)
    user_uuid = db.Column("user_uuid", db.BINARY(16), db.ForeignKey("user.uuid"), nullable=False) # FK
    title = db.Column("title", db.String(256), nullable=True)
    content = db.Column("content", db.String(4096), nullable=True)

    def __repr__(self):
        return f"<Notification {self.uuid.hex()}: {self.title}>"